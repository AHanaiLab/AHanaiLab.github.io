import boto3
import os
import mimetypes

STACK_NAME = "activity-pacing-app"
REGION = "ap-northeast-1"
FRONTEND_DIR = "frontend"

def get_stack_resource(logical_id):
    cf = boto3.client('cloudformation', region_name=REGION)
    try:
        res = cf.describe_stack_resource(StackName=STACK_NAME, LogicalResourceId=logical_id)
        return res['StackResourceDetail']['PhysicalResourceId']
    except Exception as e:
        print(f"Error getting resource {logical_id}: {e}")
        return None

def upload_directory(bucket_name, path):
    s3 = boto3.client('s3', region_name=REGION)
    for root, dirs, files in os.walk(path):
        for file in files:
            full_path = os.path.join(root, file)
            relative_path = os.path.relpath(full_path, path)
            # Replace backslashes with slashes for S3 keys
            s3_key = relative_path.replace("\\", "/")
            
            content_type, _ = mimetypes.guess_type(full_path)
            if not content_type:
                content_type = "application/octet-stream"
            
            print(f"Uploading {s3_key} ({content_type})...")
            try:
                with open(full_path, 'rb') as data:
                    s3.put_object(Bucket=bucket_name, Key=s3_key, Body=data, ContentType=content_type)
            except Exception as e:
                print(f"Failed to upload {s3_key}: {e}")

def invalidate_cloudfront(distribution_id):
    cf = boto3.client('cloudfront', region_name=REGION)
    print(f"Invalidating CloudFront Distribution {distribution_id}...")
    try:
        cf.create_invalidation(
            DistributionId=distribution_id,
            InvalidationBatch={
                'Paths': {
                    'Quantity': 1,
                    'Items': ['/*']
                },
                'CallerReference': str(os.time.time())
            }
        )
        print("Invalidation created.")
    except Exception as e:
        # CallerReference requires uniqueness, simple time might be enough or import time
        import time
        try:
             cf.create_invalidation(
                DistributionId=distribution_id,
                InvalidationBatch={
                    'Paths': {
                        'Quantity': 1,
                        'Items': ['/*']
                    },
                    'CallerReference': str(time.time())
                }
            )
             print("Invalidation created (retry).")
        except Exception as e2:
            print(f"Failed to invalidate: {e2}")

def main():
    print(f"Deploying frontend to stack: {STACK_NAME}")
    
    # 1. Get Bucket
    bucket_name = get_stack_resource("FrontendBucket")
    if not bucket_name:
        print("Could not find FrontendBucket.")
        return

    print(f"Target Bucket: {bucket_name}")
    
    # 2. Upload
    upload_directory(bucket_name, FRONTEND_DIR)
    
    # 3. Invalidate CF
    dist_id = get_stack_resource("FrontendDistribution")
    if dist_id:
        print(f"Target Distribution: {dist_id}")
        invalidate_cloudfront(dist_id)
    else:
        print("FrontendDistribution not found. Skipping invalidation.")

    # 4. Get URL
    cf_client = boto3.client('cloudformation', region_name=REGION)
    try:
        stacks = cf_client.describe_stacks(StackName=STACK_NAME)
        outputs = stacks['Stacks'][0].get('Outputs', [])
        for out in outputs:
            if out['OutputKey'] == 'CloudFrontUrl':
                print(f"Frontend URL: https://{out['OutputValue']}")
    except:
        pass

if __name__ == "__main__":
    main()

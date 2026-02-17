import boto3
import json

def get_latest_logs():
    cf = boto3.client('cloudformation', region_name='ap-northeast-1')
    try:
        res = cf.describe_stack_resource(StackName='activity-pacing-app', LogicalResourceId='BackendFunction')
        function_name = res['StackResourceDetail']['PhysicalResourceId']
    except Exception as e:
        print(f"Error finding function: {e}")
        return

    print(f"Function Name: {function_name}")
    log_group = f"/aws/lambda/{function_name}"
    cwl = boto3.client('logs', region_name='ap-northeast-1')
    
    try:
        streams = cwl.describe_log_streams(logGroupName=log_group, orderBy='LastEventTime', descending=True, limit=1)
        if not streams['logStreams']:
            print("No log streams found.")
            return
        
        stream_name = streams['logStreams'][0]['logStreamName']
        print(f"Stream: {stream_name}")
        
        events = cwl.get_log_events(logGroupName=log_group, logStreamName=stream_name, limit=100)
        for event in events['events']:
            msg = event['message'].strip()
            if "RequestId" in msg or "Error" in msg or "Exception" in msg or "Traceback" in msg:
                print(f"- {msg}")
            elif msg.startswith("[AI Addon]") or msg.startswith("Received event"):
                print(f"- {msg[:200]}...") 
    except Exception as e:
        print(f"Error fetching logs: {e}")

if __name__ == "__main__":
    get_latest_logs()

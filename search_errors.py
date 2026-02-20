import boto3
import time

def filter_logs():
    cf = boto3.client('cloudformation', region_name='ap-northeast-1')
    res = cf.describe_stack_resource(StackName='activity-pacing-app', LogicalResourceId='BackendFunction')
    function_name = res['StackResourceDetail']['PhysicalResourceId']
    log_group = f"/aws/lambda/{function_name}"
    
    cwl = boto3.client('logs', region_name='ap-northeast-1')
    start_time = int((time.time() - 600) * 1000) # Last 10 mins
    
    print(f"Searching logs for {function_name}...")
    response = cwl.filter_log_events(
        logGroupName=log_group,
        startTime=start_time,
        filterPattern="?Error ?Exception ?Traceback"
    )
    
    for event in response.get('events', []):
        print(f"--- {event['timestamp']} ---")
        print(event['message'])

if __name__ == "__main__":
    filter_logs()

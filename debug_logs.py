import boto3
import time

def get_recent_all_logs():
    cf = boto3.client('cloudformation', region_name='ap-northeast-1')
    res = cf.describe_stack_resource(StackName='activity-pacing-app', LogicalResourceId='BackendFunction')
    function_name = res['StackResourceDetail']['PhysicalResourceId']
    log_group = f"/aws/lambda/{function_name}"
    
    cwl = boto3.client('logs', region_name='ap-northeast-1')
    start_time = int((time.time() - 300) * 1000) # Last 5 mins
    
    print(f"Fetching all logs for {function_name} from the last 5 mins...")
    response = cwl.filter_log_events(
        logGroupName=log_group,
        startTime=start_time
    )
    
    events = response.get('events', [])
    for event in events:
        msg = event['message'].strip()
        # Skip standard noisy lines unless they contain error indicators
        if any(x in msg for x in ["Error", "Exception", "Traceback", "failed"]):
             print(f"!!! {msg}")
        else:
             print(f"    {msg[:300]}")

if __name__ == "__main__":
    get_recent_all_logs()

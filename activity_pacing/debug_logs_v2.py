import boto3
import time

def get_recent_all_logs():
    cf = boto3.client('cloudformation', region_name='ap-northeast-1')
    res = cf.describe_stack_resource(StackName='activity-pacing-app', LogicalResourceId='BackendFunction')
    function_name = res['StackResourceDetail']['PhysicalResourceId']
    log_group = f"/aws/lambda/{function_name}"
    
    cwl = boto3.client('logs', region_name='ap-northeast-1')
    
    print(f"Fetching latest events for {function_name}...")
    
    streams = cwl.describe_log_streams(logGroupName=log_group, orderBy='LastEventTime', descending=True, limit=3)
    for stream in streams['logStreams']:
        print(f"--- Stream: {stream['logStreamName']} ---")
        events = cwl.get_log_events(logGroupName=log_group, logStreamName=stream['logStreamName'], limit=100)
        for event in events['events']:
            msg = event['message'].strip()
            if any(x in msg for x in ["Error", "Exception", "Traceback", "failed", "NameError", "AttributeError", "TypeError"]):
                print(f"!!! {msg}")
            else:
                print(f"    {msg[:200]}")

if __name__ == "__main__":
    get_recent_all_logs()

import boto3

def get_raw_logs():
    cf = boto3.client('cloudformation', region_name='ap-northeast-1')
    res = cf.describe_stack_resource(StackName='activity-pacing-app', LogicalResourceId='BackendFunction')
    function_name = res['StackResourceDetail']['PhysicalResourceId']
    log_group = f"/aws/lambda/{function_name}"
    cwl = boto3.client('logs', region_name='ap-northeast-1')
    streams = cwl.describe_log_streams(logGroupName=log_group, orderBy='LastEventTime', descending=True, limit=1)
    if not streams['logStreams']: return
    stream_name = streams['logStreams'][0]['logStreamName']
    events = cwl.get_log_events(logGroupName=log_group, logStreamName=stream_name, limit=50)
    for event in events['events']:
        print(event['message'].strip())

if __name__ == "__main__":
    get_raw_logs()

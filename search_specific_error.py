import boto3

def search_addon_errors():
    cf = boto3.client('cloudformation', region_name='ap-northeast-1')
    res = cf.describe_stack_resource(StackName='activity-pacing-app', LogicalResourceId='BackendFunction')
    fn = res['StackResourceDetail']['PhysicalResourceId']
    lg = f'/aws/lambda/{fn}'
    cwl = boto3.client('logs', region_name='ap-northeast-1')
    
    streams = cwl.describe_log_streams(logGroupName=lg, orderBy='LastEventTime', descending=True, limit=5)
    for s in streams['logStreams']:
        stream_name = s['logStreamName']
        events = cwl.get_log_events(logGroupName=lg, logStreamName=stream_name)['events']
        for i, e in enumerate(events):
            msg = e['message'].strip()
            if 'Addon proposal error:' in msg:
                print(f"!!! {msg}")
                # Print next 5 lines if they are traceback
                for j in range(i+1, min(i+10, len(events))):
                    print(f"    {events[j]['message'].strip()}")

if __name__ == "__main__":
    search_addon_errors()

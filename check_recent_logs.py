
import boto3
from boto3.dynamodb.conditions import Key
import datetime

REGION = "ap-northeast-1"
TABLE_LOGS = "ActivityPacing_Logs"

def check_logs():
    dynamodb = boto3.resource('dynamodb', region_name=REGION)
    table = dynamodb.Table(TABLE_LOGS)
    
    print(f"Checking logs for Subject ID: 1")
    
    try:
        # Query logs for subjectId = 1
        # Since timestamps are ISO strings, sorting desc is easy if we scan or reverse query?
        # Query is sorted by SortKey (timestamp) asc by default. ScanIndexForward=False for DESC.
        response = table.query(
            KeyConditionExpression=Key('subjectId').eq("1"),
            ScanIndexForward=False, # Newest first
            Limit=5
        )
        
        items = response.get('Items', [])
        print(f"Found {len(items)} recent logs.")
        for i in items:
            print(f"Time: {i.get('timestamp')}, Type: {i.get('type')}, LogData: {i.get('log_data')}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_logs()

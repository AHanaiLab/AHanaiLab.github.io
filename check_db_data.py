import boto3
import json
from decimal import Decimal

def decimal_default(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError

def check_data():
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('ActivityPacingMainTable')
    
    # Check Main Table
    print("--- Checking ActivityPacingMainTable (UI Data) ---")
    try:
        response = table.get_item(Key={'param': 'SUBJECT#1'})
        item = response.get('Item')
        if item:
            print("Item found for SUBJECT#1")
            data = item.get('data', {})
            logs = data.get('logs', [])
            print(f"Log count in 'data.logs': {len(logs)}")
            if len(logs) > 0:
                print("First log entry:")
                print(json.dumps(logs[0], default=decimal_default, indent=2, ensure_ascii=False))
                print("Last log entry:")
                print(json.dumps(logs[-1], default=decimal_default, indent=2, ensure_ascii=False))
        else:
            print("No Item found for SUBJECT#1")
            
    except Exception as e:
        print(f"Error querying MainTable: {e}")

    # Check Logs Table
    print("\n--- Checking ActivityPacingLogsTable (Analysis Data) ---")
    table_logs = dynamodb.Table('ActivityPacingLogsTable')
    try:
        # Query logs for subject 1
        response = table_logs.query(
            KeyConditionExpression=boto3.dynamodb.conditions.Key('subjectId').eq('1'),
            Limit=5
        )
        items = response.get('Items', [])
        print(f"Found {len(items)} entries in LogsTable (showing first 5)")
        for i in items:
            print(json.dumps(i, default=decimal_default, indent=2, ensure_ascii=False))
            
    except Exception as e:
        print(f"Error querying LogsTable: {e}")

if __name__ == "__main__":
    check_data()


import boto3
import json
from decimal import Decimal

# Helper to convert Decimal to float/int
class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            if o % 1 > 0:
                return float(o)
            return int(o)
        return super(DecimalEncoder, self).default(o)

REGION = "ap-northeast-1"
TABLE_MAIN = "ActivityPacing_Main"

def check_main_logs():
    dynamodb = boto3.resource('dynamodb', region_name=REGION)
    table = dynamodb.Table(TABLE_MAIN)
    
    subject_id = "1"
    print(f"Checking Main table for SUBJECT#{subject_id} logs...")
    
    try:
        response = table.get_item(Key={'param': f'SUBJECT#{subject_id}'})
        item = response.get('Item', {})
        
        if not item:
            print("Subject not found in Main table.")
            return

        data = item.get('data', {})
        logs = data.get('logs', [])
        
        print(f"Total logs in Main table: {len(logs)}")
        
        # Check for vo2max logs
        vo2_logs = [l for l in logs if l.get('type') == 'vo2max']
        print(f"VO2max logs found: {len(vo2_logs)}")
        for l in vo2_logs[-3:]:
             print(f"- {l.get('date') or l.get('timestamp')}: {l.get('value')}")
             
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_main_logs()

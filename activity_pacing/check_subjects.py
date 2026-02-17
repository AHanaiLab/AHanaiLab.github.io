import boto3
import json
from decimal import Decimal

class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            return str(o)
        return super(DecimalEncoder, self).default(o)

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('ActivityPacing_Main')

ids = ['1', 'demo_pt']
for item_id in ids:
    response = table.get_item(Key={'param': f'SUBJECT#{item_id}'})
    if 'Item' in response:
        print(f"Found user {item_id}:")
        print(json.dumps(response['Item'], indent=2, ensure_ascii=False, cls=DecimalEncoder))
    else:
        print(f"User {item_id} not found.")

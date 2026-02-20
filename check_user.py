import boto3
import json

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('ActivityPacing_Main')

uid = 'Ub8fbc4be1b65aeab49cf3837cd66f8ed'
response = table.get_item(Key={'param': f'SUBJECT#{uid}'})

if 'Item' in response:
    print("Found user:")
    print(json.dumps(response['Item'], indent=2, ensure_ascii=False))
else:
    print("User not found.")

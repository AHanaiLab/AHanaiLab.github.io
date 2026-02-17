import boto3
import time

# Configuration
REGION = "ap-northeast-1"
TABLE_MAIN = "ActivityPacing_Main"
TABLE_LOGS = "ActivityPacing_Logs"

def create_tables():
    dynamodb = boto3.resource('dynamodb', region_name=REGION)
    
    # 1. Main Table
    try:
        table = dynamodb.create_table(
            TableName=TABLE_MAIN,
            KeySchema=[{'AttributeName': 'param', 'KeyType': 'HASH'}],
            AttributeDefinitions=[{'AttributeName': 'param', 'AttributeType': 'S'}],
            ProvisionedThroughput={'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
        )
        print(f"Creating {TABLE_MAIN}...")
        table.wait_until_exists()
        print(f"{TABLE_MAIN} created.")
    except Exception as e:
        print(f"Table {TABLE_MAIN} might already exist or error: {e}")

    # 2. Logs Table
    try:
        table = dynamodb.create_table(
            TableName=TABLE_LOGS,
            KeySchema=[
                {'AttributeName': 'subjectId', 'KeyType': 'HASH'},
                {'AttributeName': 'timestamp', 'KeyType': 'RANGE'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'subjectId', 'AttributeType': 'S'},
                {'AttributeName': 'timestamp', 'AttributeType': 'S'}
            ],
            ProvisionedThroughput={'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
        )
        print(f"Creating {TABLE_LOGS}...")
        table.wait_until_exists()
        print(f"{TABLE_LOGS} created.")
    except Exception as e:
        print(f"Table {TABLE_LOGS} might already exist or error: {e}")

def seed_data():
    dynamodb = boto3.resource('dynamodb', region_name=REGION)
    table = dynamodb.Table(TABLE_MAIN)
    
    # Initial Data (Migrated from admin.html/js)
    initial_data = [
        # Exercises
        {'param': 'EXERCISE#1', 'data': {'id': 1, 'category': '乳がんサバイバー', 'title': '動画（１）', 'note': 'Step1用動画: 基礎的なストレッチ', 'file': 'mov1.mp4'}},
        {'param': 'EXERCISE#2', 'data': {'id': 2, 'category': '乳がんサバイバー', 'title': '動画（２）', 'note': 'Step2用動画: 軽い筋トレ', 'file': 'mov2.mp4'}},
        {'param': 'EXERCISE#3', 'data': {'id': 3, 'category': '乳がんサバイバー', 'title': '動画（３）', 'note': '中強度: スクワット', 'file': 'mov3.mp4'}},
        # Projects
        {'param': 'PROJECT#1', 'data': {'id': 1, 'name': 'プロジェクトA', 'category': '乳がんサバイバー', 'facility': '病院A', 'program': [{'startDay': 1, 'endDay': 7, 'exerciseId': 1, 'freq': 3}]}},
        # Categories
        {'param': 'CATEGORY#1', 'data': {'id': 1, 'name': '乳がんサバイバー'}},
        # Subjects
        {'param': 'SUBJECT#1', 'data': {'id': 1, 'name': '山田 花子', 'email': 'test@example.com', 'projectId': 1, 'startDate': '2025-01-01'}}
    ]
    
    with table.batch_writer() as batch:
        for item in initial_data:
            batch.put_item(Item=item)
    print("Seed data inserted.")

if __name__ == "__main__":
    print("Setting up AWS resources...")
    # Uncomment to run real AWS calls
    create_tables()
    seed_data()
    print("Setup script executed. Tables ready and data seeded.")

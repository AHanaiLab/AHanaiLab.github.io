import sys
from unittest.mock import MagicMock

# Mock
sys.modules['boto3'] = MagicMock()
sys.modules['boto3.dynamodb'] = MagicMock()
sys.modules['boto3.dynamodb.conditions'] = MagicMock()
sys.modules['botocore'] = MagicMock()
sys.modules['botocore.exceptions'] = MagicMock()
sys.modules['pandas'] = MagicMock()

import lambda_function

print("Start Test")
try:
    # Manual Setup
    mock_table = MagicMock()
    mock_table.scan.return_value = {
        'Items': [
            {'param': 'EXERCISE#1', 'data': {'id': 1, 'title': 'Test'}}
        ]
    }
    lambda_function.table_main = mock_table
    
    event = {'path': '/exercises', 'httpMethod': 'GET'}
    print("Calling handler...")
    resp = lambda_function.lambda_handler(event, None)
    print("Response:", resp)
except Exception as e:
    print("EXCEPTION CAUGHT:")
    import traceback
    traceback.print_exc()
print("End Test")

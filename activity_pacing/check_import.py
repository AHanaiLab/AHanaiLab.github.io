import sys
from unittest.mock import MagicMock

# MOCK EVERYTHING
sys.modules['boto3'] = MagicMock()
sys.modules['boto3.dynamodb'] = MagicMock()
sys.modules['boto3.dynamodb.conditions'] = MagicMock()
sys.modules['botocore'] = MagicMock()
sys.modules['botocore.exceptions'] = MagicMock()
sys.modules['pandas'] = MagicMock()

try:
    import lambda_function
    print("IMPORT SUCCESS")
except Exception as e:
    print(f"IMPORT FAILED: {e}")
    import traceback
    traceback.print_exc()

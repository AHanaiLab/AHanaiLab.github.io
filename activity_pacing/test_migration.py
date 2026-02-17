import unittest
from unittest.mock import MagicMock, patch
import json
import sys
import os

# Add current directory to path so we can import lambda_function
sys.path.append(os.getcwd())

# Mock boto3 BEFORE importing lambda_function
sys.modules['boto3'] = MagicMock()
sys.modules['botocore'] = MagicMock()
sys.modules['botocore.exceptions'] = MagicMock()

# Mock submodules used in imports
mock_dynamodb = MagicMock()
sys.modules['boto3.dynamodb'] = mock_dynamodb
mock_conditions = MagicMock()
sys.modules['boto3.dynamodb.conditions'] = mock_conditions

# Mock pandas
sys.modules['pandas'] = MagicMock()

import lambda_function

class TestLambdaMigration(unittest.TestCase):

    def setUp(self):
        # Mock DynamoDB Tables
        self.mock_dynamo_resource = lambda_function.boto3.resource.return_value
        self.mock_table_main = self.mock_dynamo_resource.Table.return_value
        
        self.mock_table_main = MagicMock()
        self.mock_table_logs = MagicMock()
        lambda_function.table_main = self.mock_table_main
        lambda_function.table_logs = self.mock_table_logs
        
        # Mock Bedrock Helper
        self.mock_bedrock = lambda_function.bedrock
        
        # Mock SES Helper
        self.mock_ses = lambda_function.ses
        
        # Ensure Attr mock works for scan filter
        # lambda_function.py uses: Attr('param').begins_with(...)
        # We need mock_conditions.Attr('param').begins_with to return a valid Condition object (or Mock)
        self.mock_attr = lambda_function.Attr
        # Or if import was: from boto3.dynamodb.conditions import Attr
        # Then lambda_function.Attr is the mock we injected?
        # Let's verify in the test logic if needed.

    def tearDown(self):
        patch.stopall()

    def test_admin_list_exercises(self):
        """Test GET /exercises"""
        # Setup Mock Response
        self.mock_table_main.scan.return_value = {
            'Items': [
                {'param': 'EXERCISE#1', 'data': {'id': 1, 'title': 'Test Ex'}}
            ]
        }
        
        event = {
            'path': '/exercises',
            'httpMethod': 'GET'
        }
        response = lambda_function.lambda_handler(event, None)
        
        self.assertEqual(response['statusCode'], 200)
        body = json.loads(response['body'])
        self.assertEqual(len(body), 1)
        self.assertEqual(body[0]['title'], 'Test Ex')

    def test_proposal_generation(self):
        """Test POST /proposal with Bedrock Mock"""
        # Setup Bedrock Mock
        mock_response_body = json.dumps({
            'content': [{'text': 'AI Generated Advice'}]
        }).encode('utf-8')
        
        mock_stream = MagicMock()
        mock_stream.read.return_value = mock_response_body
        self.mock_bedrock.invoke_model.return_value = {'body': mock_stream}
        
        # Setup Dynamo Logs Mock (for history analysis)
        self.mock_table_logs.query.return_value = {'Items': []} # No logs
        self.mock_table_main.get_item.return_value = {'Item': {'data': {'name': 'User'}}}

        event = {
            'path': '/proposal',
            'httpMethod': 'POST',
            'body': json.dumps({
                'subjectId': '1',
                'currentCondition': {'fatigue': 5, 'pain': 0, 'mood': 'mid'}
            })
        }
        
        response = lambda_function.lambda_handler(event, None)
        
        self.assertEqual(response['statusCode'], 200)
        body = json.loads(response['body'])
        self.assertEqual(body['mode'], 'Normal') # Logic result
        self.assertEqual(body['message'], 'AI Generated Advice')
        
        # Verify Bedrock called
        self.mock_bedrock.invoke_model.assert_called_once()

    def test_ses_notification(self):
        """Test POST /notify with SES Mock"""
        # Setup User Email Mock
        self.mock_table_main.get_item.return_value = {
            'Item': {'data': {'email': 'test@example.com'}}
        }
        
        event = {
            'path': '/notify',
            'httpMethod': 'POST',
            'body': json.dumps({
                'subjectId': '1',
                'message': 'Hello!'
            })
        }
        
        response = lambda_function.lambda_handler(event, None)
        self.assertEqual(response['statusCode'], 200)
        
        # Verify SES called
        self.mock_ses.send_email.assert_called_once()
        args, kwargs = self.mock_ses.send_email.call_args
        self.assertEqual(kwargs['Destination']['ToAddresses'][0], 'test@example.com')

if __name__ == '__main__':
    unittest.main()

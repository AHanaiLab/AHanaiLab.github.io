import sys
from unittest.mock import MagicMock
import traceback
import unittest

# MOCK EVERYTHING BEFORE IMPORT
sys.modules['boto3'] = MagicMock()
sys.modules['boto3.dynamodb'] = MagicMock()
sys.modules['boto3.dynamodb.conditions'] = MagicMock()
sys.modules['botocore'] = MagicMock()
sys.modules['botocore.exceptions'] = MagicMock()
sys.modules['pandas'] = MagicMock()

try:
    import test_migration
    # Run tests manually
    suite = unittest.TestLoader().loadTestsFromModule(test_migration)
    runner = unittest.TextTestRunner(stream=sys.stdout, verbosity=2)
    result = runner.run(suite)
    if not result.wasSuccessful():
        sys.exit(1)
except Exception:
    traceback.print_exc()
    sys.exit(1)

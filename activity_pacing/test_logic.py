import unittest
import pandas as pd
import sys
import os

# Mock modules before importing main
from unittest.mock import MagicMock
sys.modules["firebase_admin"] = MagicMock()
sys.modules["firebase_admin.firestore"] = MagicMock()
sys.modules["functions_framework"] = MagicMock()
sys.modules["vertexai"] = MagicMock()
sys.modules["vertexai.generative_models"] = MagicMock()

# Now import main
sys.path.append(os.path.abspath("functions"))
from main import determine_mode

class TestModeDetermination(unittest.TestCase):
    
    def test_warning_mode_failure_pattern(self):
        # Case: Past failure (Pain spiked on same day)
        logs = [
            {'date': pd.Timestamp.now() - pd.Timedelta(days=2), 'type': 'condition', 'fatigue': 5, 'pain': 0},
            {'date': pd.Timestamp.now() - pd.Timedelta(days=2), 'type': 'condition', 'fatigue': 5, 'pain': 3} # Spiked
        ]
        df = pd.DataFrame(logs)
        curr = {'fatigue': 5, 'pain': 0, 'mood': 'mid', 'hrv': 'normal'}
        
        mode, reason = determine_mode(df, curr)
        self.assertEqual(mode, "Warning")
        self.assertIn("失敗パターン", reason)

    def test_warning_mode_high_pain(self):
        # Case: Current pain high
        df = pd.DataFrame()
        curr = {'fatigue': 5, 'pain': 3, 'mood': 'mid', 'hrv': 'normal'}
        
        mode, reason = determine_mode(df, curr)
        self.assertEqual(mode, "Warning")
        self.assertIn("痛みレベル", reason)

    def test_challenge_mode(self):
        # Case: All good
        logs = []
        df = pd.DataFrame(logs)
        curr = {'fatigue': 1, 'pain': 0, 'mood': 'high', 'hrv': 'high', 'sleep': 'good'}
        
        mode, reason = determine_mode(df, curr)
        self.assertEqual(mode, "Challenge")
        self.assertIn("良好", reason)

    def test_normal_mode(self):
        # Case: Moderate fatigue, no risks
        logs = []
        df = pd.DataFrame(logs)
        curr = {'fatigue': 5, 'pain': 0, 'mood': 'mid', 'hrv': 'normal'}
        
        mode, reason = determine_mode(df, curr)
        self.assertEqual(mode, "Normal")

if __name__ == '__main__':
    unittest.main()

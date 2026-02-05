import os
import sys
from typing import Dict, Any

# Ensure we can import from the current directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from psych_model_picker import PsychModelPicker

def example_psych_model_selection():
    """
    Demonstrates how to use the PsychModelPicker to select an ML model
    for a user based on their current psychological state.
    """
    print("--- Starting Psych Model Picker Demo ---")
    
    # Initialize the picker (would normally use env var for API key)
    picker = PsychModelPicker(api_key="demo-key")
    
    # Mock user profiles to test different scenarios
    test_profiles = [
        {
            "name": "Tilt User",
            "profile": {"tilt_level": 85, "confidence_score": 50, "recent_streak": -3}
        },
        {
            "name": "Low Confidence User",
            "profile": {"tilt_level": 20, "confidence_score": 15, "recent_streak": -5}
        },
        {
            "name": "Stable User",
            "profile": {"tilt_level": 10, "confidence_score": 75, "recent_streak": 2}
        }
    ]
    
    for test in test_profiles:
        print(f"\nAnalyzing profile for: {test['name']}")
        result = picker.select_model_for_user(test['profile'])
        
        print(f"Selected Model: {result.get('model_id')}")
        print(f"Reasoning: {result.get('reasoning')}")
        if 'params' in result:
             print(f"Nudge Type: {result['params'].get('nudge_type')}")
             print(f"Max Stake: {result['params'].get('max_stake_multiplier')}x")

    print("\n--- Demo Complete ---")

if __name__ == "__main__":
    example_psych_model_selection()

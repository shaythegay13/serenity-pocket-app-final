import os
from typing import Dict, Any, Optional

class PsychModelPicker:
    """
    Orchestrates the selection of ML models for sports betting psychology
    using Gemini 3 reasoning capabilities.
    """

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the picker with API configuration.
        
        Args:
            api_key: Gemini API key. Defaults to environment variable.
        """
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        self.current_model_version = "gemini-3-pro"

    def select_model_for_user(self, user_profile: Dict[str, Any]) -> Dict[str, Any]:
        """
        Selects the most appropriate psychology model based on user state.
        
        Args:
            user_profile: Dictionary containing user metrics like 'tilt_level',
                          'confidence_score', 'recent_streak'.
            
        Returns:
            Dictionary containing the selected model configuration and reasoning.
        """
        try:
            tilt_level = user_profile.get("tilt_level", 0)
            confidence = user_profile.get("confidence_score", 50)
            
            # Behavioral Nudge Logic based on user state
            if tilt_level > 70:
                return self._configure_safety_model(reason="High emotional volatility detected")
            elif confidence < 30:
                return self._configure_confidence_builder(reason="Low user confidence")
            else:
                return self._configure_growth_model(reason="Stable emotional state")
                
        except Exception as e:
            # Error handling for inference calls
            return {
                "error": f"Model selection failed: {str(e)}",
                "fallback_model": "standard_conservative_v1"
            }

    def _configure_safety_model(self, reason: str) -> Dict[str, Any]:
        """Returns configuration for a high-safety, risk-averse model."""
        return {
            "model_id": "safety_guard_v2",
            "reasoning": reason,
            "params": {
                "max_stake_multiplier": 0.5,
                "nudge_type": "cooling_off",
                "risk_tolerance": "low"
            }
        }

    def _configure_confidence_builder(self, reason: str) -> Dict[str, Any]:
        """Returns configuration for rebuilding user confidence."""
        return {
            "model_id": "confidence_boost_v1",
            "reasoning": reason,
            "params": {
                "max_stake_multiplier": 0.8,
                "nudge_type": "positive_reinforcement",
                "risk_tolerance": "medium"
            }
        }

    def _configure_growth_model(self, reason: str) -> Dict[str, Any]:
        """Returns configuration for standard growth and optimization."""
        return {
            "model_id": "growth_optimizer_v3",
            "reasoning": reason,
            "params": {
                "max_stake_multiplier": 1.2,
                "nudge_type": "strategic_insight",
                "risk_tolerance": "high"
            }
        }

if __name__ == "__main__":
    import sys
    import json
    
    # Simple CLI handling for Node.js exec()
    # Usage: python psych_model_picker.py <emotional_score> <risk_tolerance>
    try:
        score = int(sys.argv[1]) if len(sys.argv) > 1 else 85
        risk = sys.argv[2] if len(sys.argv) > 2 else "moderate"
        
        # Map simple CLI args to the richer profile expected by select_model_for_user
        # In route.ts, tilt_level is effectively (100 - emotionalScore)
        profile = {
            "tilt_level": 100 - score,
            "confidence_score": score, # Using score as proxy for confidence
            "risk_tolerance": risk
        }
        
        picker = PsychModelPicker()
        result = picker.select_model_for_user(profile)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({
            "model_id": "growth_optimizer_v3",
            "params": {"max_stake_multiplier": 1.0},
            "error": str(e)
        }))

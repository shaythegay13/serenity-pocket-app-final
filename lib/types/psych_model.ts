/**
 * Interface representing the response from the PsychModelPicker service.
 * Corresponds to the dictionary returned by PsychModelPicker.select_model_for_user
 */
export interface PsychModelResponse {
    model_id?: string;
    reasoning?: string;
    params?: PsychModelParams;
    error?: string;
    fallback_model?: string;
}

/**
 * Configuration parameters for the selected psychology model.
 */
export interface PsychModelParams {
    max_stake_multiplier: number;
    nudge_type: 'cooling_off' | 'positive_reinforcement' | 'strategic_insight' | 'standard';
    risk_tolerance: 'low' | 'medium' | 'high';
}

/**
 * Input profile data required for model selection.
 */
export interface UserPsychProfile {
    tilt_level: number; // 0-100
    confidence_score: number; // 0-100
    recent_streak: number; // Positive for win streak, negative for loss streak
}

/**
 * Extended Gemini reasoning output for debugging and auditing.
 */
export interface GeminiReasoningOutput {
    model_version: string;
    inference_latency_ms: number;
    tokens_used: number;
}

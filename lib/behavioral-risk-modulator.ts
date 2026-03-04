/**
 * Behavioral Risk Modulator
 *
 * Sits between the Statistical Engine and the Decision Layer.
 * Takes raw statistical output + Behavioral Risk Score and produces
 * a Risk-Adjusted Recommendation.
 *
 * DESIGN PRINCIPLES:
 * - Raw probabilities are NEVER modified
 * - Only risk posture and recommendation thresholds are adjusted
 * - Emotional state modulates exposure control, not predictive power
 * - All decisions are deterministic and auditable
 */

// ============================================================================
// Interfaces
// ============================================================================

/** Input from the Statistical Engine — these values are never modified */
export interface StatisticalOutput {
    rawProbability: number;       // 0–1, from true probability engine
    expectedValue: number;        // EV in dollars
    evPercent: number;            // EV as percentage of stake
    baseConfidence: number;       // 0–1, model confidence
}

/** Input from the Behavioral Risk Engine */
export interface BehavioralRiskInput {
    behavioralRiskScore: number;  // 0–100, from anchored risk engine
    stabilityScore: number;       // 0–100, emotional stability score
}

/** Instrumentation data for future correlation analysis */
export interface InstrumentationData {
    stabilityScore: number;
    behavioralRiskScore: number;
    rawEv: number;
    adjustedRecommendation: string;
    timestamp: string;
}

/** Complete risk-adjusted recommendation output */
export interface RiskAdjustedRecommendation {
    // Raw statistical outputs (NEVER modified by this module)
    rawProbability: number;
    expectedValue: number;
    baseConfidence: number;

    // Risk-adjusted outputs
    adjustedConfidence: number;
    riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
    recommendation: "PROCEED" | "CAUTION" | "SKIP" | "TAKE_BREAK";
    suggestedBetMultiplier: number; // 0.0–1.0 stake scaling factor

    // Threshold adjustments applied
    minimumEvThreshold: number;     // Minimum EV% required to recommend a bet
    restrictHighVariance: boolean;  // Whether to restrict high-variance plays

    // Instrumentation data for future logging and correlation charts
    instrumentationData: InstrumentationData;
}

// ============================================================================
// Risk Tier Configuration
// ============================================================================

/** Deterministic, rule-based risk tier thresholds */
interface RiskTierConfig {
    minRiskScore: number;
    riskLevel: RiskAdjustedRecommendation['riskLevel'];
    recommendation: RiskAdjustedRecommendation['recommendation'];
    betMultiplier: number;
    evThresholdIncrease: number;   // Percentage points added to minimum EV requirement
    restrictHighVariance: boolean;
    confidenceDiscount: number;    // Multiplier applied to base confidence (0–1)
}

/**
 * Risk tiers ordered from highest to lowest risk.
 * Evaluated in order — first match wins.
 *
 * Calibration rationale:
 * - CRITICAL (80+): Severe behavioral risk — recommend abstention entirely
 * - HIGH (60–79): Elevated risk — only allow strong +EV with reduced sizing
 * - MODERATE (40–59): Mild risk — tighten thresholds, reduce bet size modestly
 * - LOW (<40): Normal operating conditions — full sizing, standard thresholds
 */
const RISK_TIERS: RiskTierConfig[] = [
    {
        minRiskScore: 80,
        riskLevel: "CRITICAL",
        recommendation: "TAKE_BREAK",
        betMultiplier: 0.0,
        evThresholdIncrease: 8.0,
        restrictHighVariance: true,
        confidenceDiscount: 0.5,
    },
    {
        minRiskScore: 60,
        riskLevel: "HIGH",
        recommendation: "SKIP",
        betMultiplier: 0.25,
        evThresholdIncrease: 5.0,
        restrictHighVariance: true,
        confidenceDiscount: 0.7,
    },
    {
        minRiskScore: 40,
        riskLevel: "MODERATE",
        recommendation: "CAUTION",
        betMultiplier: 0.5,
        evThresholdIncrease: 2.0,
        restrictHighVariance: false,
        confidenceDiscount: 0.85,
    },
    {
        minRiskScore: 0,
        riskLevel: "LOW",
        recommendation: "PROCEED",
        betMultiplier: 1.0,
        evThresholdIncrease: 0.0,
        restrictHighVariance: false,
        confidenceDiscount: 1.0,
    },
];

// ============================================================================
// Core Modulation Function
// ============================================================================

/**
 * Resolve the appropriate risk tier for a given behavioral risk score.
 * Tiers are evaluated in descending order of severity.
 */
function resolveRiskTier(behavioralRiskScore: number): RiskTierConfig {
    const clampedScore = Math.max(0, Math.min(100, behavioralRiskScore));
    for (const tier of RISK_TIERS) {
        if (clampedScore >= tier.minRiskScore) {
            return tier;
        }
    }
    // Fallback — should never reach here due to minRiskScore: 0 tier
    return RISK_TIERS[RISK_TIERS.length - 1];
}

/**
 * Primary modulation function.
 *
 * Takes raw Statistical Output + Behavioral Risk Score and produces
 * a Risk-Adjusted Recommendation.
 *
 * CRITICAL INVARIANT: rawProbability and expectedValue are passed through
 * unchanged. This module NEVER modifies statistical output.
 *
 * @param statistical - Raw output from the Statistical Engine
 * @param risk - Behavioral risk inputs (risk score + stability score)
 * @returns Risk-adjusted recommendation with instrumentation data
 *
 * @example
 * // Low risk user — full capacity
 * modulateRisk(
 *   { rawProbability: 0.55, expectedValue: 4.50, evPercent: 4.5, baseConfidence: 0.75 },
 *   { behavioralRiskScore: 20, stabilityScore: 80 }
 * )
 * // → { recommendation: "PROCEED", suggestedBetMultiplier: 1.0, ... }
 *
 * @example
 * // High risk user — reduced exposure
 * modulateRisk(
 *   { rawProbability: 0.55, expectedValue: 4.50, evPercent: 4.5, baseConfidence: 0.75 },
 *   { behavioralRiskScore: 70, stabilityScore: 30 }
 * )
 * // → { recommendation: "SKIP", suggestedBetMultiplier: 0.25, ... }
 */
export function modulateRisk(
    statistical: StatisticalOutput,
    risk: BehavioralRiskInput
): RiskAdjustedRecommendation {
    const tier = resolveRiskTier(risk.behavioralRiskScore);

    // Adjusted confidence: base confidence discounted by risk tier
    // This reflects reduced certainty in the USER's ability to execute rationally,
    // NOT reduced certainty in the statistical model itself.
    const adjustedConfidence = Math.max(
        0.01,
        Math.min(1, statistical.baseConfidence * tier.confidenceDiscount)
    );

    // Minimum EV threshold: increases with risk to filter marginal bets
    const minimumEvThreshold = tier.evThresholdIncrease;

    // Build instrumentation data for future logging and correlation analysis
    const instrumentationData: InstrumentationData = {
        stabilityScore: risk.stabilityScore,
        behavioralRiskScore: risk.behavioralRiskScore,
        rawEv: statistical.expectedValue,
        adjustedRecommendation: tier.recommendation,
        timestamp: new Date().toISOString(),
    };

    return {
        // Pass-through: raw statistical outputs are NEVER modified
        rawProbability: statistical.rawProbability,
        expectedValue: statistical.expectedValue,
        baseConfidence: statistical.baseConfidence,

        // Risk-adjusted outputs
        adjustedConfidence,
        riskLevel: tier.riskLevel,
        recommendation: tier.recommendation,
        suggestedBetMultiplier: tier.betMultiplier,

        // Threshold adjustments
        minimumEvThreshold,
        restrictHighVariance: tier.restrictHighVariance,

        // Instrumentation
        instrumentationData,
    };
}

/**
 * Batch modulation for multiple picks.
 * Applies the same risk context to all picks in a set.
 *
 * @param picks - Array of statistical outputs (one per pick)
 * @param risk - Shared behavioral risk context for the current user/session
 * @returns Array of risk-adjusted recommendations
 */
export function modulateRiskBatch(
    picks: StatisticalOutput[],
    risk: BehavioralRiskInput
): RiskAdjustedRecommendation[] {
    return picks.map(pick => modulateRisk(pick, risk));
}

/**
 * Check if a pick meets the risk-adjusted EV threshold.
 * Use this to filter out marginal picks when risk is elevated.
 *
 * @param evPercent - The EV percentage of the pick
 * @param riskAdjusted - The risk-adjusted recommendation
 * @returns true if the pick's EV meets or exceeds the risk-adjusted minimum
 */
export function meetsMinimumEvThreshold(
    evPercent: number,
    riskAdjusted: RiskAdjustedRecommendation
): boolean {
    return evPercent >= riskAdjusted.minimumEvThreshold;
}

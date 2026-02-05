/**
 * lib/true-probability-engine.ts
 *
 * Abstraction for deriving a 'True Probability' from multiple signals:
 * - Market Consensus (Wisdom of Crowds)
 * - Internal Models (Machine Learning)
 * - Contextual Signals (LLM/Embeddings)
 */

export interface TrueProbabilityEngineInputs {
    marketImpliedProb: number;
    fairMarketProb?: number;
    modelWinProb?: number;

    // Numerical signals derived from embeddings / LLM, 0-centered adjustments or priors
    // e.g. [0.02, -0.01] representing positive/negative nudges
    contextualSignals?: number[];
}

export interface TrueProbabilityResult {
    trueWinProb: number;
    confidenceScore: number; // 0–1
    metadata?: Record<string, unknown>;
}

export interface TrueProbabilityEngine {
    compute(inputs: TrueProbabilityEngineInputs): TrueProbabilityResult;
}

/**
 * default blending engine.
 * Blends market and model probabilities, and applies simple additive adjustments from contextual signals.
 */
export class BasicBlendingTrueProbabilityEngine implements TrueProbabilityEngine {
    // Lowered from 0.5 to 0.35 to allow AI signals to express meaningful edges
    // This helps surface positive EV opportunities by trusting contextual analysis more
    private static readonly ALPHA_MARKET = 0.35;

    compute(inputs: TrueProbabilityEngineInputs): TrueProbabilityResult {
        const {
            marketImpliedProb,
            fairMarketProb,
            modelWinProb,
            contextualSignals
        } = inputs;

        // 1. Establish Base Probability
        // Prefer the fair (no-vig) market probability, fallback to implied (vig-inclusive)
        const baseProb = fairMarketProb ?? marketImpliedProb;

        // 2. Blend with Model (if available)
        let blendedProb: number;

        if (typeof modelWinProb === 'number') {
            blendedProb = (BasicBlendingTrueProbabilityEngine.ALPHA_MARKET * baseProb) +
                ((1 - BasicBlendingTrueProbabilityEngine.ALPHA_MARKET) * modelWinProb);
        } else {
            blendedProb = baseProb;
        }

        // 3. Apply Contextual Signals
        // Simple additive logic: sum signals and clamp to reasonable bounds
        let signalAdjustment = 0;
        if (contextualSignals && contextualSignals.length > 0) {
            signalAdjustment = contextualSignals.reduce((sum, sig) => sum + sig, 0);
        }

        let finalProb = blendedProb + signalAdjustment;

        // 4. Calculate Confidence Score
        let confidence = 0.5; // Baseline

        if (fairMarketProb !== undefined) confidence += 0.1; // Better market data
        if (modelWinProb !== undefined) confidence += 0.15; // Have model confirmation
        if (contextualSignals && contextualSignals.length > 0) confidence += 0.05; // Have extra context

        // Cap confidence
        confidence = Math.min(0.95, confidence);

        // 5. Final Safety Clamps
        // Never return 0 or 1 completely, leave room for black swans
        finalProb = Math.max(0.01, Math.min(0.99, finalProb));

        return {
            trueWinProb: finalProb,
            confidenceScore: confidence,
            metadata: {
                baseProb,
                blendedProb,
                signalAdjustment,
                usedModel: modelWinProb !== undefined,
                alpha: BasicBlendingTrueProbabilityEngine.ALPHA_MARKET
            }
        };
    }
}

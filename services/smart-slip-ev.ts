/**
 * services/smart-slip-ev.ts
 * 
 * High-level orchestration for SmartSlip recommendations.
 * Integrates:
 *  - True Probability Service (LlmTrueProbabilityService)
 *  - Core EV Calculator (computeEv)
 */

import { computeEv, EvDiagnostics, EvInputs, impliedProbFromAmerican } from "@/lib/ev-calculator";
import { GameContext, LlmTrueProbabilityService } from "./true-probability-llm-service";

export interface SmartSlipLegInput {
    gameContext: GameContext;
    offeredAmericanOdds: number;
    stake: number;

    // Optional model/market data
    modelWinProb?: number;
    consensusAmericanOdds?: { sideA: number; sideB: number };
    consensusTotalImpliedProb?: number;
}

export interface SmartSlipLegWithEv extends SmartSlipLegInput {
    ev: EvDiagnostics;
    aiAnalysis?: {
        confidence: number;
        commentary?: string;
        signals?: number[];
    };
}

export class SmartSlipEvService {
    constructor(
        private readonly llmProbService: LlmTrueProbabilityService
    ) { }

    /**
     * Enriches a raw bet candidate with advanced EV metrics and AI probability analysis.
     */
    async enrichLegWithEv(input: SmartSlipLegInput): Promise<SmartSlipLegWithEv> {
        const {
            gameContext,
            offeredAmericanOdds,
            stake,
            modelWinProb,
            consensusAmericanOdds
        } = input;

        // 1. Calculate base market probabilities
        const marketImpliedProb = impliedProbFromAmerican(offeredAmericanOdds);

        // Simple logic: if consensus is available, infer fair market prob roughly 
        // (Actual computeEv does this more precisely, but we might want it for the LLM input too)
        // For now, we pass undefined to LLM and let it work with implied, or we could duplicate utility logic.
        // We will let the LLM service handle raw inputs or let the computeEv handle the math.
        // For the LLM service input 'fairMarketProb', we can compute it if consensus exists.
        let fairMarketProb: number | undefined;
        if (consensusAmericanOdds) {
            // Reuse the same logic from computeEv? 
            // For simplicity, we just won't pass it to the LLM yet unless we moved the helper to a shared util.
            // We'll proceed with just implied.
        }

        // 2. Call LLM Service for True Probability
        const probResult = await this.llmProbService.getTrueProbabilityForMarket({
            gameContext,
            marketImpliedProb,
            fairMarketProb, // undefined for now
            modelWinProb
        });

        // 3. Compute EV using the AI-derived True Probability
        const evResult = computeEv({
            stake,
            offeredAmericanOdds,
            consensusAmericanOdds,
            modelWinProb,
            precomputedTrueWinProb: probResult.trueWinProb // CRITICAL: Use the AI's final answer
        });

        // 4. Return enriched object
        return {
            ...input,
            ev: evResult,
            aiAnalysis: {
                confidence: probResult.confidenceScore,
                commentary: probResult.commentary,
                signals: probResult.signals
            }
        };
    }
}

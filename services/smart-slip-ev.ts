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

        // Compute no-vig fair market probability from consensus odds
        // This is CRITICAL for the engine to have a proper baseline (without vig)
        let fairMarketProb: number | undefined;
        if (consensusAmericanOdds) {
            const impliedA = impliedProbFromAmerican(consensusAmericanOdds.sideA);
            const impliedB = impliedProbFromAmerican(consensusAmericanOdds.sideB);
            const sumImplied = impliedA + impliedB;
            if (sumImplied > 0) {
                const fairA = impliedA / sumImplied;
                const fairB = impliedB / sumImplied;
                // Match offered odds to the correct side
                if (Math.sign(consensusAmericanOdds.sideA) === Math.sign(offeredAmericanOdds)) {
                    fairMarketProb = fairA;
                } else if (Math.sign(consensusAmericanOdds.sideB) === Math.sign(offeredAmericanOdds)) {
                    fairMarketProb = fairB;
                } else {
                    // Fallback: use distance heuristic
                    const distA = Math.abs(consensusAmericanOdds.sideA - offeredAmericanOdds);
                    const distB = Math.abs(consensusAmericanOdds.sideB - offeredAmericanOdds);
                    fairMarketProb = distA < distB ? fairA : fairB;
                }
            }
        }

        // 2. Call LLM Service for True Probability
        const probResult = await this.llmProbService.getTrueProbabilityForMarket({
            gameContext,
            marketImpliedProb,
            fairMarketProb, // no-vig fair probability from consensus
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

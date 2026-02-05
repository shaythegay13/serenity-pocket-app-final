/**
 * services/true-probability-llm-service.ts
 * 
 * Orchestrates:
 * 1. Vector Search for Similar Games (Embeddings)
 * 2. LLM Reasoning for Contextual Signals (Gemini)
 * 3. True Probability Calculation (via Engine)
 */

import { TrueProbabilityEngine, TrueProbabilityResult } from "@/lib/true-probability-engine";

export interface GameContext {
    gameId: string;
    sport: string;
    league?: string;
    teams: { home: string; away: string };
    marketType: 'spread' | 'moneyline' | 'total' | 'prop';
    marketSide: 'home' | 'away' | 'over' | 'under' | 'other';
    startTime: string; // ISO
    notes?: string;    // injuries, narratives, etc.
}

export interface EmbeddingClient {
    embed(text: string): Promise<number[]>;
    searchSimilar(
        vector: number[],
        options: { topK: number }
    ): Promise<Array<{ id: string; score: number; metadata?: Record<string, unknown> }>>;
}

export interface LlmClient {
    generateContextualSignals(input: {
        gameContext: GameContext;
        marketImpliedProb: number;
        fairMarketProb?: number;
        modelWinProb?: number;
        similarGames: Array<{
            id: string;
            outcome: 'win' | 'loss' | 'push';
            closingMarketProb: number;
            modelProb?: number;
        }>;
    }): Promise<{
        // e.g. numeric features like “historically similar games move this probability by +0.03”
        signals: number[];
        commentary?: string; // optional natural language for auditability
    }>;
}

export interface LlmTrueProbabilityServiceDeps {
    embeddingClient: EmbeddingClient;
    llmClient: LlmClient;
    probabilityEngine: TrueProbabilityEngine;
}

export class LlmTrueProbabilityService {
    constructor(private readonly deps: LlmTrueProbabilityServiceDeps) { }

    /**
     * Main entrypoint: Retrieves context, similar history, and LLM opinion to form a True Probability.
     */
    async getTrueProbabilityForMarket(args: {
        gameContext: GameContext;
        marketImpliedProb: number;
        fairMarketProb?: number;
        modelWinProb?: number;
    }): Promise<TrueProbabilityResult & { signals: number[]; commentary?: string }> {
        const { gameContext, marketImpliedProb, fairMarketProb, modelWinProb } = args;

        // 1. Build description for embeddings
        const embeddingText = this.buildEmbeddingText(gameContext);

        // 2. Search Similar Games (Embeddings)
        // NOTE: This assumes the embedding client is wired to a DB of historical games
        let similarGames: any[] = [];
        try {
            const queryVector = await this.deps.embeddingClient.embed(embeddingText);
            // This is a placeholder for actual retrieval logic
            // We simulate finding 'similar' contexts which might be used by the LLM
            const searchResults = await this.deps.embeddingClient.searchSimilar(queryVector, { topK: 5 });

            // Map search results to the format expected by LLM (mocking outcome data if stuck in metadata)
            similarGames = searchResults.map(r => ({
                id: r.id,
                outcome: (r.metadata?.outcome as 'win' | 'loss') || 'win', // safe default fallback
                closingMarketProb: (r.metadata?.closingProb as number) || 0.5
            }));
        } catch (err) {
            console.warn("[LlmTrueProbabilityService] Embedding search failed, proceeding without similar games", err);
        }

        // 3. Generate Contextual Signals (LLM)
        let signals: number[] = [];
        let commentary: string | undefined;

        try {
            const llmResult = await this.deps.llmClient.generateContextualSignals({
                gameContext,
                marketImpliedProb,
                fairMarketProb,
                modelWinProb,
                similarGames
            });
            signals = llmResult.signals;
            commentary = llmResult.commentary;
        } catch (err) {
            console.warn("[LlmTrueProbabilityService] LLM signal generation failed, defaulting to 0 signals", err);
        }

        // 4. Compute Final True Probability engine
        const probResult = this.deps.probabilityEngine.compute({
            marketImpliedProb,
            fairMarketProb,
            modelWinProb,
            contextualSignals: signals
        });

        // 5. Return composite result
        return {
            ...probResult,
            signals,
            commentary
        };
    }

    private buildEmbeddingText(ctx: GameContext): string {
        return `Sport: ${ctx.sport} ${ctx.league || ''}. Matchup: ${ctx.teams.away} @ ${ctx.teams.home}. Market: ${ctx.marketType} ${ctx.marketSide}. Notes: ${ctx.notes || 'None'}.`;
    }
}

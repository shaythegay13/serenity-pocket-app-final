/**
 * lib/clients/ai-clients.ts
 *
 * Concrete implementations of the AI interfaces for the True Probability Service.
 */

import { EmbeddingClient, LlmClient, GameContext } from "@/services/true-probability-llm-service";
import { geminiGenerateText } from "@/lib/gemini";

// --- Mock Embedding Client (Placeholder for Phase 3 expansion) ---

export class SimpleEmbeddingClient implements EmbeddingClient {
    async embed(text: string): Promise<number[]> {
        // Deterministic pseudo-random vector based on text hash
        // In production, call OpenAI/Gemini embedding API here.
        const hash = text.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a
        }, 0);

        // Return a 5-dimension mock vector
        return [
            (hash % 100) / 100,
            ((hash >> 2) % 100) / 100,
            ((hash >> 4) % 100) / 100,
            ((hash >> 6) % 100) / 100,
            ((hash >> 8) % 100) / 100
        ];
    }

    async searchSimilar(
        vector: number[],
        options: { topK: number }
    ): Promise<Array<{ id: string; score: number; metadata?: Record<string, unknown> }>> {
        // Return empty for now - assumes we don't have a vector DB set up yet.
        // This ensures code works "a to z" without crashing on missing infra.
        return [];
    }
}

// --- Gemini LLM Client ---

export class GeminiLlmClient implements LlmClient {
    async generateContextualSignals(input: {
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
    }): Promise<{ signals: number[]; commentary?: string }> {
        const { gameContext, marketImpliedProb, fairMarketProb, modelWinProb } = input;

        const systemPrompt = `You are a Sports Betting Probability Analyst specialized in finding market inefficiencies.
Your goal is to estimate where the market may be WRONG by analyzing context like team form, matchup dynamics, and situational factors.

Return a JSON object with:
- "signals": array of 1-3 numbers representing probability adjustments (e.g. 0.05 for +5%, -0.03 for -3%).
- "commentary": brief explanation of why the market may be mispricing this.

RULES FOR FINDING VALUE (BE AGGRESSIVE):
- Hot streak (3+ recent W): +0.04 to +0.08 (markets are slow to price momentum)
- Cold streak (3+ recent L): -0.04 to -0.08
- Strong home advantage: +0.03 to +0.06
- Back-to-back/travel fatigue: -0.03 to -0.06
- Underdog in rivalry/revenge game: +0.04 to +0.07
- Public heavily on one side: fade public by +0.03 to +0.05 on the other side

YOUR JOB IS TO FIND EDGES, NOT CONFIRM MARKET PRICES:
- Markets are efficient but NOT perfect
- Recent form and situational factors are often slow to be priced in
- If you have contextual notes, USE THEM to generate meaningful signals
- A signal of [0] means you're just confirming market - try to find where value exists
`;

        const userMessage = `
Analyze this match:
Match: ${gameContext.teams.away} @ ${gameContext.teams.home}
Market: ${gameContext.marketType} ${gameContext.marketSide}
Implied Prob: ${marketImpliedProb.toFixed(3)}
Fair Prob: ${fairMarketProb?.toFixed(3) ?? 'N/A'}
Model Prob: ${modelWinProb?.toFixed(3) ?? 'N/A'}
Context: ${gameContext.notes || 'None'}
Sport: ${gameContext.sport}
`;

        try {
            // Use the existing geminiGenerateText helper
            const rawText = await geminiGenerateText({
                system: systemPrompt,
                messages: [{ role: 'user', content: userMessage }],
                responseMimeType: "application/json",
                temperature: 0.2
            });

            const parsed = JSON.parse(rawText);

            // Validation / Fallback - allow larger signals for meaningful edge detection
            const signals = Array.isArray(parsed.signals)
                ? parsed.signals.filter((n: any) => typeof n === 'number').map((n: number) => Math.max(-0.15, Math.min(0.15, n)))
                : [0];

            return {
                signals: signals.length > 0 ? signals : [0],
                commentary: typeof parsed.commentary === 'string' ? parsed.commentary : "Analysis completed."
            };
        } catch (err) {
            console.error("[GeminiLlmClient] Error generating probability signals:", err);
            // Fail gracefully with 0 adjustment
            return { signals: [0], commentary: "AI analysis failed, processing neutral." };
        }
    }
}

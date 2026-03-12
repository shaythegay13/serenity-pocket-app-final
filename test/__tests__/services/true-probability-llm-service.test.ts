import { LlmTrueProbabilityService, GameContext } from "../../../services/true-probability-llm-service";
import { TrueProbabilityEngine } from "../../../lib/true-probability-engine";

describe("LlmTrueProbabilityService", () => {
    let mockEmbeddingClient: any;
    let mockLlmClient: any;
    let mockProbabilityEngine: any;
    let service: LlmTrueProbabilityService;

    const mockGameContext: GameContext = {
        gameId: "123",
        sport: "NBA",
        teams: { home: "Lakers", away: "Celtics" },
        marketType: "spread",
        marketSide: "home",
        startTime: new Date().toISOString()
    };

    beforeEach(() => {
        mockEmbeddingClient = {
            embed: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
            searchSimilar: jest.fn().mockResolvedValue([
                { id: "1", score: 0.9, metadata: { outcome: "win", closingProb: 0.55 } }
            ])
        };

        mockLlmClient = {
            generateContextualSignals: jest.fn().mockResolvedValue({
                signals: [0.05],
                commentary: "Test commentary"
            })
        };

        mockProbabilityEngine = {
            compute: jest.fn().mockReturnValue({
                trueWinProb: 0.6,
                confidenceScore: 0.8
            })
        };

        service = new LlmTrueProbabilityService({
            embeddingClient: mockEmbeddingClient,
            llmClient: mockLlmClient,
            probabilityEngine: mockProbabilityEngine
        });
    });

    it("should process the happy path correctly", async () => {
        const result = await service.getTrueProbabilityForMarket({
            gameContext: mockGameContext,
            marketImpliedProb: 0.5
        });

        // 1. Embedding text built
        expect(mockEmbeddingClient.embed).toHaveBeenCalledWith(expect.stringContaining("NBA"));

        // 2. searchSimilar called
        expect(mockEmbeddingClient.searchSimilar).toHaveBeenCalledWith([0.1, 0.2, 0.3], { topK: 5 });

        // 3. LLM client called with similarGames
        expect(mockLlmClient.generateContextualSignals).toHaveBeenCalledWith(expect.objectContaining({
            similarGames: [{ id: "1", outcome: "win", closingMarketProb: 0.55 }]
        }));

        // 4. Probability engine called with signals
        expect(mockProbabilityEngine.compute).toHaveBeenCalledWith(expect.objectContaining({
            marketImpliedProb: 0.5,
            contextualSignals: [0.05]
        }));

        // 5. Final output matches expected composition
        expect(result).toEqual({
            trueWinProb: 0.6,
            confidenceScore: 0.8,
            signals: [0.05],
            commentary: "Test commentary"
        });
    });

    it("should handle embeddingClient.embed failures gracefully", async () => {
        mockEmbeddingClient.embed.mockRejectedValue(new Error("Embedding API failed"));

        const result = await service.getTrueProbabilityForMarket({
            gameContext: mockGameContext,
            marketImpliedProb: 0.5
        });

        // Search similar should NOT be called if embed fails
        expect(mockEmbeddingClient.searchSimilar).not.toHaveBeenCalled();

        // The LLM client should still be called, but with an empty similarGames array
        expect(mockLlmClient.generateContextualSignals).toHaveBeenCalledWith(expect.objectContaining({
            similarGames: []
        }));

        // Probability engine should be called as normal
        expect(mockProbabilityEngine.compute).toHaveBeenCalledWith(expect.objectContaining({
            marketImpliedProb: 0.5,
            contextualSignals: [0.05]
        }));

        expect(result.trueWinProb).toBe(0.6);
        expect(result.signals).toEqual([0.05]);
    });

    it("should handle embeddingClient.searchSimilar failures gracefully", async () => {
        mockEmbeddingClient.searchSimilar.mockRejectedValue(new Error("Search API failed"));

        const result = await service.getTrueProbabilityForMarket({
            gameContext: mockGameContext,
            marketImpliedProb: 0.5
        });

        // Embed should have been called
        expect(mockEmbeddingClient.embed).toHaveBeenCalled();

        // The LLM client should still be called, but with an empty similarGames array
        expect(mockLlmClient.generateContextualSignals).toHaveBeenCalledWith(expect.objectContaining({
            similarGames: []
        }));

        // Probability engine should be called as normal
        expect(mockProbabilityEngine.compute).toHaveBeenCalledWith(expect.objectContaining({
            marketImpliedProb: 0.5,
            contextualSignals: [0.05]
        }));

        expect(result.trueWinProb).toBe(0.6);
        expect(result.signals).toEqual([0.05]);
    });

    it("should handle llmClient.generateContextualSignals failures gracefully", async () => {
        mockLlmClient.generateContextualSignals.mockRejectedValue(new Error("LLM API failed"));

        const result = await service.getTrueProbabilityForMarket({
            gameContext: mockGameContext,
            marketImpliedProb: 0.5
        });

        // Embedding operations should succeed
        expect(mockEmbeddingClient.embed).toHaveBeenCalled();
        expect(mockEmbeddingClient.searchSimilar).toHaveBeenCalled();

        // Probability engine should be called with empty signals
        expect(mockProbabilityEngine.compute).toHaveBeenCalledWith(expect.objectContaining({
            marketImpliedProb: 0.5,
            contextualSignals: []
        }));

        expect(result.trueWinProb).toBe(0.6);
        expect(result.signals).toEqual([]);
        expect(result.commentary).toBeUndefined();
    });
});

import {
    LlmTrueProbabilityService,
    LlmTrueProbabilityServiceDeps,
    EmbeddingClient,
    LlmClient,
    GameContext
} from '../../services/true-probability-llm-service';
import { TrueProbabilityEngine, TrueProbabilityResult } from '../../lib/true-probability-engine';

describe('LlmTrueProbabilityService', () => {
    let mockEmbeddingClient: jest.Mocked<EmbeddingClient>;
    let mockLlmClient: jest.Mocked<LlmClient>;
    let mockProbabilityEngine: jest.Mocked<TrueProbabilityEngine>;
    let service: LlmTrueProbabilityService;

    const mockGameContext: GameContext = {
        gameId: 'game-123',
        sport: 'basketball',
        league: 'NBA',
        teams: { home: 'Lakers', away: 'Warriors' },
        marketType: 'moneyline',
        marketSide: 'home',
        startTime: '2024-05-01T00:00:00Z',
        notes: 'Curry might be out'
    };

    beforeEach(() => {
        // Reset console.warn before each test to hide expected warnings and/or assert on them
        jest.spyOn(console, 'warn').mockImplementation(() => {});

        mockEmbeddingClient = {
            embed: jest.fn(),
            searchSimilar: jest.fn()
        };

        mockLlmClient = {
            generateContextualSignals: jest.fn()
        };

        mockProbabilityEngine = {
            compute: jest.fn()
        };

        const deps: LlmTrueProbabilityServiceDeps = {
            embeddingClient: mockEmbeddingClient,
            llmClient: mockLlmClient,
            probabilityEngine: mockProbabilityEngine
        };

        service = new LlmTrueProbabilityService(deps);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should successfully calculate true probability when all dependencies succeed', async () => {
        // Arrange
        const mockEmbedding = [0.1, 0.2, 0.3];
        mockEmbeddingClient.embed.mockResolvedValue(mockEmbedding);

        const mockSearchResults = [
            { id: 'game-456', score: 0.9, metadata: { outcome: 'win', closingProb: 0.6 } }
        ];
        mockEmbeddingClient.searchSimilar.mockResolvedValue(mockSearchResults);

        const mockLlmResult = {
            signals: [0.05, -0.01],
            commentary: 'Historically similar games favor the home team.'
        };
        mockLlmClient.generateContextualSignals.mockResolvedValue(mockLlmResult);

        const mockEngineResult: TrueProbabilityResult = {
            trueWinProb: 0.65,
            confidenceScore: 0.8
        };
        mockProbabilityEngine.compute.mockReturnValue(mockEngineResult);

        // Act
        const result = await service.getTrueProbabilityForMarket({
            gameContext: mockGameContext,
            marketImpliedProb: 0.55,
            fairMarketProb: 0.52,
            modelWinProb: 0.60
        });

        // Assert
        expect(mockEmbeddingClient.embed).toHaveBeenCalledWith(
            expect.stringContaining('Lakers')
        );
        expect(mockEmbeddingClient.searchSimilar).toHaveBeenCalledWith(mockEmbedding, { topK: 5 });
        expect(mockLlmClient.generateContextualSignals).toHaveBeenCalledWith({
            gameContext: mockGameContext,
            marketImpliedProb: 0.55,
            fairMarketProb: 0.52,
            modelWinProb: 0.60,
            similarGames: [
                { id: 'game-456', outcome: 'win', closingMarketProb: 0.6 }
            ]
        });
        expect(mockProbabilityEngine.compute).toHaveBeenCalledWith({
            marketImpliedProb: 0.55,
            fairMarketProb: 0.52,
            modelWinProb: 0.60,
            contextualSignals: mockLlmResult.signals
        });

        expect(result).toEqual({
            ...mockEngineResult,
            signals: mockLlmResult.signals,
            commentary: mockLlmResult.commentary
        });
    });

    it('should handle LLM client failure gracefully and continue computation', async () => {
        // Arrange
        mockEmbeddingClient.embed.mockResolvedValue([0.1, 0.2]);
        mockEmbeddingClient.searchSimilar.mockResolvedValue([]);

        const error = new Error('LLM API timeout');
        mockLlmClient.generateContextualSignals.mockRejectedValue(error);

        const mockEngineResult: TrueProbabilityResult = {
            trueWinProb: 0.55,
            confidenceScore: 0.6
        };
        mockProbabilityEngine.compute.mockReturnValue(mockEngineResult);

        // Act
        const result = await service.getTrueProbabilityForMarket({
            gameContext: mockGameContext,
            marketImpliedProb: 0.55
        });

        // Assert
        expect(console.warn).toHaveBeenCalledWith(
            "[LlmTrueProbabilityService] LLM signal generation failed, defaulting to 0 signals",
            error
        );

        // Ensure probability engine was called with empty signals
        expect(mockProbabilityEngine.compute).toHaveBeenCalledWith({
            marketImpliedProb: 0.55,
            fairMarketProb: undefined,
            modelWinProb: undefined,
            contextualSignals: []
        });

        // Ensure the result uses default values for signals and commentary
        expect(result).toEqual({
            ...mockEngineResult,
            signals: [],
            commentary: undefined
        });
    });

    it('should handle embedding client failure gracefully and proceed with empty similar games', async () => {
        // Arrange
        const error = new Error('Embedding API unavailable');
        mockEmbeddingClient.embed.mockRejectedValue(error);

        const mockLlmResult = {
            signals: [0.02],
            commentary: 'Some basic analysis without similar games.'
        };
        mockLlmClient.generateContextualSignals.mockResolvedValue(mockLlmResult);

        const mockEngineResult: TrueProbabilityResult = {
            trueWinProb: 0.57,
            confidenceScore: 0.7
        };
        mockProbabilityEngine.compute.mockReturnValue(mockEngineResult);

        // Act
        const result = await service.getTrueProbabilityForMarket({
            gameContext: mockGameContext,
            marketImpliedProb: 0.55
        });

        // Assert
        expect(console.warn).toHaveBeenCalledWith(
            "[LlmTrueProbabilityService] Embedding search failed, proceeding without similar games",
            error
        );

        // LLM should still be called, but with an empty similarGames array
        expect(mockLlmClient.generateContextualSignals).toHaveBeenCalledWith(
            expect.objectContaining({
                similarGames: []
            })
        );

        // Probability engine should be called with the signals from the LLM
        expect(mockProbabilityEngine.compute).toHaveBeenCalledWith({
            marketImpliedProb: 0.55,
            fairMarketProb: undefined,
            modelWinProb: undefined,
            contextualSignals: mockLlmResult.signals
        });

        expect(result).toEqual({
            ...mockEngineResult,
            signals: mockLlmResult.signals,
            commentary: mockLlmResult.commentary
        });
    });
});

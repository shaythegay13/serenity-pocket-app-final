/**
 * Unit tests for behavioral-risk-modulator.ts
 *
 * Verifies the core invariant: raw probabilities are NEVER modified.
 * Risk modulation only adjusts posture (confidence, sizing, thresholds).
 */

import {
    modulateRisk,
    modulateRiskBatch,
    meetsMinimumEvThreshold,
    type StatisticalOutput,
    type BehavioralRiskInput,
} from '@/lib/behavioral-risk-modulator'

// Helper: build a standard statistical output for testing
function makeStats(overrides?: Partial<StatisticalOutput>): StatisticalOutput {
    return {
        rawProbability: 0.55,
        expectedValue: 4.50,
        evPercent: 4.5,
        baseConfidence: 0.75,
        ...overrides,
    }
}

describe('behavioral-risk-modulator', () => {
    // =========================================================================
    // CORE INVARIANT: Raw probability is never modified
    // =========================================================================

    describe('Raw probability preservation', () => {
        it('should never modify rawProbability regardless of risk level', () => {
            const stats = makeStats({ rawProbability: 0.62 })

            // Test across all risk tiers
            const riskLevels = [0, 20, 39, 40, 59, 60, 79, 80, 100]
            for (const score of riskLevels) {
                const result = modulateRisk(stats, { behavioralRiskScore: score, stabilityScore: 100 - score })
                expect(result.rawProbability).toBe(0.62)
            }
        })

        it('should never modify expectedValue regardless of risk level', () => {
            const stats = makeStats({ expectedValue: 12.34 })

            for (const score of [0, 50, 80, 100]) {
                const result = modulateRisk(stats, { behavioralRiskScore: score, stabilityScore: 100 - score })
                expect(result.expectedValue).toBe(12.34)
            }
        })

        it('should never modify baseConfidence regardless of risk level', () => {
            const stats = makeStats({ baseConfidence: 0.85 })

            for (const score of [0, 50, 80, 100]) {
                const result = modulateRisk(stats, { behavioralRiskScore: score, stabilityScore: 100 - score })
                expect(result.baseConfidence).toBe(0.85)
            }
        })
    })

    // =========================================================================
    // Risk tier classification
    // =========================================================================

    describe('Risk tier: LOW (score < 40)', () => {
        it('returns PROCEED recommendation', () => {
            const result = modulateRisk(makeStats(), { behavioralRiskScore: 20, stabilityScore: 80 })
            expect(result.recommendation).toBe('PROCEED')
            expect(result.riskLevel).toBe('LOW')
        })

        it('uses full bet multiplier (1.0)', () => {
            const result = modulateRisk(makeStats(), { behavioralRiskScore: 0, stabilityScore: 100 })
            expect(result.suggestedBetMultiplier).toBe(1.0)
        })

        it('applies no EV threshold increase', () => {
            const result = modulateRisk(makeStats(), { behavioralRiskScore: 10, stabilityScore: 90 })
            expect(result.minimumEvThreshold).toBe(0.0)
        })

        it('does not restrict high-variance plays', () => {
            const result = modulateRisk(makeStats(), { behavioralRiskScore: 30, stabilityScore: 70 })
            expect(result.restrictHighVariance).toBe(false)
        })

        it('preserves full confidence', () => {
            const stats = makeStats({ baseConfidence: 0.8 })
            const result = modulateRisk(stats, { behavioralRiskScore: 10, stabilityScore: 90 })
            expect(result.adjustedConfidence).toBe(0.8)
        })
    })

    describe('Risk tier: MODERATE (score 40-59)', () => {
        it('returns CAUTION recommendation', () => {
            const result = modulateRisk(makeStats(), { behavioralRiskScore: 50, stabilityScore: 50 })
            expect(result.recommendation).toBe('CAUTION')
            expect(result.riskLevel).toBe('MODERATE')
        })

        it('reduces bet multiplier to 0.5', () => {
            const result = modulateRisk(makeStats(), { behavioralRiskScore: 45, stabilityScore: 55 })
            expect(result.suggestedBetMultiplier).toBe(0.5)
        })

        it('increases EV threshold by 2%', () => {
            const result = modulateRisk(makeStats(), { behavioralRiskScore: 55, stabilityScore: 45 })
            expect(result.minimumEvThreshold).toBe(2.0)
        })

        it('does not restrict high-variance plays', () => {
            const result = modulateRisk(makeStats(), { behavioralRiskScore: 40, stabilityScore: 60 })
            expect(result.restrictHighVariance).toBe(false)
        })
    })

    describe('Risk tier: HIGH (score 60-79)', () => {
        it('returns SKIP recommendation', () => {
            const result = modulateRisk(makeStats(), { behavioralRiskScore: 70, stabilityScore: 30 })
            expect(result.recommendation).toBe('SKIP')
            expect(result.riskLevel).toBe('HIGH')
        })

        it('reduces bet multiplier to 0.25', () => {
            const result = modulateRisk(makeStats(), { behavioralRiskScore: 65, stabilityScore: 35 })
            expect(result.suggestedBetMultiplier).toBe(0.25)
        })

        it('increases EV threshold by 5%', () => {
            const result = modulateRisk(makeStats(), { behavioralRiskScore: 75, stabilityScore: 25 })
            expect(result.minimumEvThreshold).toBe(5.0)
        })

        it('restricts high-variance plays', () => {
            const result = modulateRisk(makeStats(), { behavioralRiskScore: 60, stabilityScore: 40 })
            expect(result.restrictHighVariance).toBe(true)
        })
    })

    describe('Risk tier: CRITICAL (score >= 80)', () => {
        it('returns TAKE_BREAK recommendation', () => {
            const result = modulateRisk(makeStats(), { behavioralRiskScore: 85, stabilityScore: 15 })
            expect(result.recommendation).toBe('TAKE_BREAK')
            expect(result.riskLevel).toBe('CRITICAL')
        })

        it('sets bet multiplier to 0.0', () => {
            const result = modulateRisk(makeStats(), { behavioralRiskScore: 100, stabilityScore: 0 })
            expect(result.suggestedBetMultiplier).toBe(0.0)
        })

        it('increases EV threshold by 8%', () => {
            const result = modulateRisk(makeStats(), { behavioralRiskScore: 90, stabilityScore: 10 })
            expect(result.minimumEvThreshold).toBe(8.0)
        })

        it('restricts high-variance plays', () => {
            const result = modulateRisk(makeStats(), { behavioralRiskScore: 80, stabilityScore: 20 })
            expect(result.restrictHighVariance).toBe(true)
        })
    })

    // =========================================================================
    // Boundary conditions
    // =========================================================================

    describe('Boundary conditions', () => {
        it('handles exact boundary at score 40 as MODERATE', () => {
            const result = modulateRisk(makeStats(), { behavioralRiskScore: 40, stabilityScore: 60 })
            expect(result.riskLevel).toBe('MODERATE')
        })

        it('handles exact boundary at score 60 as HIGH', () => {
            const result = modulateRisk(makeStats(), { behavioralRiskScore: 60, stabilityScore: 40 })
            expect(result.riskLevel).toBe('HIGH')
        })

        it('handles exact boundary at score 80 as CRITICAL', () => {
            const result = modulateRisk(makeStats(), { behavioralRiskScore: 80, stabilityScore: 20 })
            expect(result.riskLevel).toBe('CRITICAL')
        })

        it('clamps risk score above 100 to CRITICAL', () => {
            const result = modulateRisk(makeStats(), { behavioralRiskScore: 150, stabilityScore: 0 })
            expect(result.riskLevel).toBe('CRITICAL')
        })

        it('clamps risk score below 0 to LOW', () => {
            const result = modulateRisk(makeStats(), { behavioralRiskScore: -10, stabilityScore: 100 })
            expect(result.riskLevel).toBe('LOW')
        })
    })

    // =========================================================================
    // Instrumentation data
    // =========================================================================

    describe('Instrumentation data', () => {
        it('always populates instrumentation data', () => {
            const result = modulateRisk(
                makeStats({ expectedValue: 7.77 }),
                { behavioralRiskScore: 55, stabilityScore: 45 }
            )

            expect(result.instrumentationData).toBeDefined()
            expect(result.instrumentationData.stabilityScore).toBe(45)
            expect(result.instrumentationData.behavioralRiskScore).toBe(55)
            expect(result.instrumentationData.rawEv).toBe(7.77)
            expect(result.instrumentationData.adjustedRecommendation).toBe('CAUTION')
            expect(result.instrumentationData.timestamp).toBeTruthy()
        })

        it('includes ISO timestamp', () => {
            const result = modulateRisk(makeStats(), { behavioralRiskScore: 10, stabilityScore: 90 })
            // Should be a valid ISO date string
            expect(() => new Date(result.instrumentationData.timestamp)).not.toThrow()
            expect(new Date(result.instrumentationData.timestamp).toISOString()).toBe(result.instrumentationData.timestamp)
        })
    })

    // =========================================================================
    // Batch modulation
    // =========================================================================

    describe('modulateRiskBatch', () => {
        it('applies same risk context to all picks', () => {
            const picks = [
                makeStats({ rawProbability: 0.55, expectedValue: 5 }),
                makeStats({ rawProbability: 0.60, expectedValue: 10 }),
                makeStats({ rawProbability: 0.45, expectedValue: -2 }),
            ]

            const results = modulateRiskBatch(picks, { behavioralRiskScore: 70, stabilityScore: 30 })

            expect(results).toHaveLength(3)
            // All should get the same risk level from the same risk context
            results.forEach(r => {
                expect(r.riskLevel).toBe('HIGH')
                expect(r.recommendation).toBe('SKIP')
            })

            // But raw probabilities are preserved individually
            expect(results[0].rawProbability).toBe(0.55)
            expect(results[1].rawProbability).toBe(0.60)
            expect(results[2].rawProbability).toBe(0.45)
        })
    })

    // =========================================================================
    // EV threshold helper
    // =========================================================================

    describe('meetsMinimumEvThreshold', () => {
        it('returns true when EV exceeds threshold', () => {
            const riskAdjusted = modulateRisk(makeStats(), { behavioralRiskScore: 50, stabilityScore: 50 })
            // MODERATE tier: threshold = 2.0%
            expect(meetsMinimumEvThreshold(3.0, riskAdjusted)).toBe(true)
        })

        it('returns true when EV exactly equals threshold', () => {
            const riskAdjusted = modulateRisk(makeStats(), { behavioralRiskScore: 50, stabilityScore: 50 })
            expect(meetsMinimumEvThreshold(2.0, riskAdjusted)).toBe(true)
        })

        it('returns false when EV is below threshold', () => {
            const riskAdjusted = modulateRisk(makeStats(), { behavioralRiskScore: 50, stabilityScore: 50 })
            expect(meetsMinimumEvThreshold(1.5, riskAdjusted)).toBe(false)
        })

        it('returns true for any EV when risk is LOW (threshold = 0)', () => {
            const riskAdjusted = modulateRisk(makeStats(), { behavioralRiskScore: 10, stabilityScore: 90 })
            expect(meetsMinimumEvThreshold(0.1, riskAdjusted)).toBe(true)
        })
    })
})

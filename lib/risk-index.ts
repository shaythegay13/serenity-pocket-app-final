// Professional Risk Index for SmartSlip
export interface RiskFactors {
    probDelta: number      // |P_AI - P_market|
    americanOdds: number   // -110, +200
    dataQuality: number    // 0-1 (sample size, injuries known)
    variance: number       // Sport/game specific 0-1
    closingLineValue?: number // Future: future line movement
}

export function calculateRiskIndex({
    probDelta,
    americanOdds,
    dataQuality,
    variance
}: RiskFactors): number {
    // Your formula: RI = (W1·Variance) + (W2·Inverse Odds) + (W3·Model Uncertainty) + (W4·Prob Delta)
    const w1 = 2.0  // Variance weight
    const w2 = 3.0  // Odds risk weight
    const w3 = 4.0  // Uncertainty weight
    const w4 = 1.5  // Probability delta weight (AI vs market disagreement)

    // Handle division by zero: when odds are -100, denominator becomes 0
    // Also handle edge cases where odds could result in very small denominators
    const oddsDenominator = americanOdds / 100 + 1
    const inverseOddsRisk = Math.abs(oddsDenominator) < 0.01
        ? w2 * 10  // Maximum risk when denominator approaches zero
        : Math.abs(1 / oddsDenominator) * w2

    const modelUncertainty = (1 - dataQuality) * w3

    // Factor in probDelta: larger disagreement between AI and market = higher risk
    const probDeltaRisk = Math.abs(probDelta) * w4

    const ri = (variance * w1) + inverseOddsRisk + modelUncertainty + probDeltaRisk

    return Math.min(10, Math.max(0, Math.round(ri * 10) / 10))
}

export function getKellyFraction(ri: number): number {
    // Risk-based Kelly fraction tiers:
    // - Low risk (0-3): Conservative 10% Kelly
    // - Medium risk (3.1-7): Moderate 50% Kelly
    // - High risk (7.1-10): Aggressive 75% Kelly
    if (ri < 3) return 0.10   // Conservative: 10% Kelly
    if (ri < 7) return 0.50   // Moderate: 50% Kelly
    return 0.75               // Aggressive: 75% Kelly
}

export function getSportVariance(league: string): number {
    // High variance = high luck/high scoring
    const variances: Record<string, number> = {
        'basketball_nba': 0.7,      // High scoring
        'icehockey_nhl': 0.8,       // High variance/shootouts
        'mma_ufc': 0.9,             // Individual combat
        'boxing': 0.85,
        'americanfootball_nfl': 0.6,
        'soccer_epl': 0.75,         // Draws, low scoring
        'esports_lol': 0.8,         // High variance metas
        'golf_pga': 0.65           // Field events
    }
    return variances[league] ?? 0.7
}

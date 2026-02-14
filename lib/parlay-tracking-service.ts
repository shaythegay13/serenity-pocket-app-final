/**
 * Parlay Tracking Service
 *
 * Manages the lifecycle of parlays: creation, settlement, emotion linkage,
 * and filtered retrieval. Parallels bet-tracking-service.ts for single bets.
 *
 * Uses storageHybrid for Supabase + localStorage persistence.
 */

import type { Parlay, ParlayLeg, ParlayOutcome, ParlayType } from '@/lib/types/ai-models'
import { storageHybrid as storage } from '@/lib/storage-hybrid'
import {
    calculateCombinedOdds,
    calculateParlayEV,
    calculateParlayEVPercentage,
    americanToDecimal,
    decimalToAmerican,
    detectCorrelations,
    validateParlayLegs,
    calculateSGPOdds,
    recalculateOddsAfterPush,
} from '@/lib/parlay-utils'

// ============================================================================
// Parlay creation helpers
// ============================================================================

/**
 * Detect tilt signals from parlay leg patterns.
 * Returns an array of signal tags for behavioral analysis.
 */
export function detectTiltSignals(
    legs: ParlayLeg[],
    recentBets?: Array<{ outcome: string }>,
): string[] {
    const signals: string[] = []

    // Cross-sport mashup: legs from 2+ different sports
    const sports = new Set(legs.map(l => l.sport).filter(Boolean))
    if (sports.size >= 2) {
        signals.push('cross_sport_mashup')
    }

    // Same-player stacking: multiple legs mentioning the same player name
    const allText = legs.map(l => `${l.teams} ${l.line}`).join(' ').toLowerCase()
    const words = allText.split(/\s+/)
    const nameFreq: Record<string, number> = {}
    words.forEach(w => {
        if (w.length > 3) nameFreq[w] = (nameFreq[w] || 0) + 1
    })
    if (Object.values(nameFreq).some(count => count >= 3)) {
        signals.push('same_player_stacking')
    }

    // Laddering: multiple legs with same bet type on same team
    const ladderKey = legs.map(l => `${l.teams}|${l.betType}`)
    const ladderCounts: Record<string, number> = {}
    ladderKey.forEach(k => { ladderCounts[k] = (ladderCounts[k] || 0) + 1 })
    if (Object.values(ladderCounts).some(c => c >= 2)) {
        signals.push('laddering')
    }

    // Chasing losses: building parlays after 3+ consecutive recent losses
    if (recentBets && recentBets.length >= 3) {
        const lastThree = recentBets.slice(-3)
        if (lastThree.every(b => b.outcome === 'loss')) {
            signals.push('chasing_losses')
        }
    }

    // Post-loss escalation: 5+ leg parlay after recent loss
    if (legs.length >= 5 && recentBets?.length && recentBets[recentBets.length - 1]?.outcome === 'loss') {
        signals.push('post_loss_escalation')
    }

    return signals
}

/**
 * Determine parlay type from leg combination.
 * SGP if all legs share the same gameId, SGP+ if multiple SGP groups, else classic.
 */
export function determineParlayType(legs: ParlayLeg[]): ParlayType {
    const gameIds = legs.map(l => l.gameId).filter(Boolean)
    if (gameIds.length === 0) return 'classic'

    const uniqueGames = new Set(gameIds)
    // All legs from same game → SGP
    if (uniqueGames.size === 1 && gameIds.length === legs.length) {
        return 'sgp'
    }
    // Multiple same-game groups → SGP+
    const gameCounts: Record<string, number> = {}
    gameIds.forEach(g => { gameCounts[g!] = (gameCounts[g!] || 0) + 1 })
    const hasMultiLegGames = Object.values(gameCounts).some(c => c >= 2)
    if (hasMultiLegGames && uniqueGames.size > 1) {
        return 'sgp_plus'
    }

    return 'classic'
}

// ============================================================================
// ParlayTrackingService
// ============================================================================

interface CreateParlayInput {
    legs: ParlayLeg[]
    stake: number
    type?: ParlayType
    emotionAtCreation?: string
    emotionIntensityAtCreation?: number
    recentBets?: Array<{ outcome: string }>
}

interface ParlayFilter {
    sport?: string
    outcome?: ParlayOutcome
    dateFrom?: string
    dateTo?: string
    minLegs?: number
    maxLegs?: number
}

export const ParlayTrackingService = {

    /**
     * Create and persist a new parlay from a set of legs and a stake.
     * Automatically computes combined odds, EV, risk score, and tilt signals.
     */
    async createParlay(input: CreateParlayInput): Promise<Parlay> {
        const { legs, stake, emotionAtCreation, emotionIntensityAtCreation, recentBets } = input

        // Validate legs
        const validation = validateParlayLegs(legs)
        if (!validation.isValid) {
            throw new Error(`Invalid parlay: ${validation.errors.join(', ')}`)
        }

        // Determine parlay type early (needed for odds calculation)
        const type = input.type || determineParlayType(legs)

        // Calculate odds — apply SGP correlation tax when appropriate
        let combinedDecimalOdds: number
        if (type === 'sgp' || type === 'sgp_plus') {
            const sgpResult = calculateSGPOdds(legs)
            combinedDecimalOdds = sgpResult.odds
        } else {
            combinedDecimalOdds = calculateCombinedOdds(legs)
        }
        const combinedAmericanOdds = decimalToAmerican(combinedDecimalOdds)
        const impliedProbability = 1 / combinedDecimalOdds

        // Calculate true probability (product of AI estimates, assuming independence)
        let trueProbability: number | undefined
        const probabilities = legs.map(l => l.aiWinProbability).filter(Boolean) as number[]
        if (probabilities.length === legs.length) {
            trueProbability = probabilities.reduce((p, prob) => p * prob, 1)
        }

        // Calculate EV
        let projectedEV: number | undefined
        try {
            projectedEV = calculateParlayEV(legs, stake)
        } catch {
            // AI probabilities unavailable; EV cannot be computed
        }

        // Compute risk score (0-1 based on leg count, odds, and correlations)
        const correlations = detectCorrelations(legs)
        const highSeverityCount = correlations.filter(w => w.severity === 'high').length
        const legCountFactor = Math.min(legs.length / 10, 1)
        const oddsFactorRaw = impliedProbability < 0.05 ? 1 : impliedProbability < 0.1 ? 0.7 : impliedProbability < 0.2 ? 0.4 : 0.2
        const correlationPenalty = Math.min(highSeverityCount * 0.15, 0.3)
        const riskScore = Math.min(1, legCountFactor * 0.4 + oddsFactorRaw * 0.3 + correlationPenalty + 0.1)

        // Detect tilt signals from leg patterns
        const tiltSignals = detectTiltSignals(legs, recentBets)

        // Mark all legs as pending
        const legsWithStatus: ParlayLeg[] = legs.map(leg => ({
            ...leg,
            outcome: leg.outcome || 'pending' as const,
        }))

        const parlay: Parlay = {
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            type,
            legs: legsWithStatus,
            stake,
            totalOddsAmerican: combinedAmericanOdds,
            totalOddsDecimal: combinedDecimalOdds,
            impliedProbability,
            trueProbability,
            projectedEV,
            riskScore,
            outcome: 'pending',
            emotionAtCreation,
            emotionIntensityAtCreation,
            tiltSignals: tiltSignals.length > 0 ? tiltSignals : undefined,
        }

        // Persist
        await storage.addParlay(parlay)

        return parlay
    },

    /**
     * Settle a parlay by updating leg-level outcomes and computing the final result.
     * If all legs won, parlay is won. If any leg lost, parlay is lost.
     * If any leg is void and no legs lost, parlay is voided or recalculated.
     */
    async settleParlay(
        parlayId: string,
        legOutcomes: Array<{ pickId: string; outcome: 'won' | 'lost' | 'void' | 'push' }>,
        actualPayout?: number,
    ): Promise<Parlay | null> {
        const parlay = await storage.getParlayById(parlayId)
        if (!parlay) return null

        // Update individual leg outcomes
        const updatedLegs = parlay.legs.map(leg => {
            const legResult = legOutcomes.find(lo => lo.pickId === leg.pickId)
            if (legResult) {
                return { ...leg, outcome: legResult.outcome, settledAt: new Date().toISOString() }
            }
            return leg
        })

        // Classify leg states
        const hasLost = updatedLegs.some(l => l.outcome === 'lost')
        const hasPending = updatedLegs.some(l => l.outcome === 'pending')
        const hasVoid = updatedLegs.some(l => l.outcome === 'void')
        const hasPush = updatedLegs.some(l => l.outcome === 'push')
        const activeLegs = updatedLegs.filter(l => l.outcome !== 'push' && l.outcome !== 'void')
        const allActiveWon = activeLegs.length > 0 && activeLegs.every(l => l.outcome === 'won')

        // Determine parlay outcome
        let parlayOutcome: ParlayOutcome = 'pending'
        let settledOdds = parlay.totalOddsDecimal

        if (hasLost) {
            parlayOutcome = 'lost'
        } else if (hasPending) {
            parlayOutcome = 'pending'
        } else if (activeLegs.length === 0) {
            // All legs pushed or voided → full refund
            const allVoid = updatedLegs.every(l => l.outcome === 'void')
            parlayOutcome = allVoid ? 'void' : 'push'
        } else if (allActiveWon && (hasPush || hasVoid)) {
            // All non-pushed/voided legs won → reduce/reprice with remaining legs
            parlayOutcome = 'won'
            settledOdds = recalculateOddsAfterPush(updatedLegs, parlay.type)
        } else if (allActiveWon) {
            parlayOutcome = 'won'
        }

        // Calculate actual payout
        let computedPayout = actualPayout
        if (parlayOutcome === 'won' && !computedPayout) {
            computedPayout = parlay.stake * settledOdds
        } else if (parlayOutcome === 'lost') {
            computedPayout = 0
        } else if (parlayOutcome === 'push' || parlayOutcome === 'void') {
            computedPayout = parlay.stake // Stake returned
        }

        const updatedParlay: Parlay = {
            ...parlay,
            legs: updatedLegs,
            outcome: parlayOutcome,
            actualPayout: computedPayout,
            // Store the repriced odds when pushes reduced the parlay
            totalOddsDecimal: (hasPush || hasVoid) && parlayOutcome === 'won' ? settledOdds : parlay.totalOddsDecimal,
            totalOddsAmerican: (hasPush || hasVoid) && parlayOutcome === 'won' ? decimalToAmerican(settledOdds) : parlay.totalOddsAmerican,
            settledAt: parlayOutcome !== 'pending' ? new Date().toISOString() : undefined,
        }

        await storage.updateParlay(updatedParlay)
        return updatedParlay
    },

    /**
     * Attach an emotion check-in record to a parlay.
     */
    async attachEmotionCheckIn(parlayId: string, emotionCheckInId: string): Promise<Parlay | null> {
        const parlay = await storage.getParlayById(parlayId)
        if (!parlay) return null

        const updated: Parlay = { ...parlay, emotionCheckInId }
        await storage.updateParlay(updated)
        return updated
    },

    /**
     * Get a single parlay by ID.
     */
    async getParlay(parlayId: string): Promise<Parlay | null> {
        return storage.getParlayById(parlayId)
    },

    /**
     * Get all parlays for the current user.
     */
    async getAllParlays(): Promise<Parlay[]> {
        return storage.getParlays()
    },

    /**
     * Get parlays matching the given filter criteria.
     */
    async getParlaysByFilter(filter: ParlayFilter): Promise<Parlay[]> {
        const all = await storage.getParlays()

        return all.filter(parlay => {
            if (filter.outcome && parlay.outcome !== filter.outcome) return false
            if (filter.dateFrom && parlay.createdAt < filter.dateFrom) return false
            if (filter.dateTo && parlay.createdAt > filter.dateTo) return false
            if (filter.minLegs && parlay.legs.length < filter.minLegs) return false
            if (filter.maxLegs && parlay.legs.length > filter.maxLegs) return false
            if (filter.sport) {
                const hasSport = parlay.legs.some(l => l.sport === filter.sport)
                if (!hasSport) return false
            }
            return true
        })
    },

    /**
     * Get pending parlays that need outcome updates.
     */
    async getPendingParlays(): Promise<Parlay[]> {
        const all = await storage.getParlays()
        return all.filter(p => p.outcome === 'pending')
    },

    /**
     * Get settled parlays for analytics.
     */
    async getSettledParlays(): Promise<Parlay[]> {
        const all = await storage.getParlays()
        return all.filter(p => p.outcome !== 'pending')
    },
}

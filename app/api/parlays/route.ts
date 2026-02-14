/**
 * POST /api/parlays — Create a new parlay from selected legs.
 * GET  /api/parlays — List parlays for the current user.
 *
 * Validates legs, computes odds/EV/risk, and delegates to ParlayTrackingService.
 */

import { NextRequest, NextResponse } from 'next/server'
import { ParlayTrackingService } from '@/lib/parlay-tracking-service'
import { validateParlayLegs } from '@/lib/parlay-utils'
import type { ParlayLeg, ParlayType, ParlayOutcome } from '@/lib/types/ai-models'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            legs,
            stake,
            type,
            emotionAtCreation,
            emotionIntensityAtCreation,
            recentBets,
        } = body

        // Validate required fields
        if (!legs || !Array.isArray(legs) || legs.length < 2) {
            return NextResponse.json(
                { error: 'Parlay must have at least 2 legs' },
                { status: 400 }
            )
        }

        const stakeNum = parseFloat(stake)
        if (!stakeNum || stakeNum <= 0) {
            return NextResponse.json(
                { error: 'Stake must be a positive number' },
                { status: 400 }
            )
        }

        // Validate leg structure
        const validation = validateParlayLegs(legs)
        if (!validation.isValid) {
            return NextResponse.json(
                { error: 'Invalid parlay legs', details: validation.errors },
                { status: 400 }
            )
        }

        // Convert raw legs to ParlayLeg format
        const parlayLegs: ParlayLeg[] = legs.map((leg: any, index: number) => ({
            pickId: leg.pickId || `leg-${index}`,
            gameId: leg.gameId,
            teams: leg.teams || leg.selection || `${leg.teamA} vs ${leg.teamB}`,
            betType: leg.betType || 'moneyline',
            line: leg.line || 'N/A',
            odds: leg.odds,
            confidence: leg.confidence,
            aiWinProbability: leg.aiWinProbability,
            sport: leg.sport,
            league: leg.league,
            selection: leg.selection,
        }))

        // Create parlay via tracking service (computes odds, EV, risk, tilt signals)
        const parlay = await ParlayTrackingService.createParlay({
            legs: parlayLegs,
            stake: stakeNum,
            type: type as ParlayType | undefined,
            emotionAtCreation,
            emotionIntensityAtCreation: emotionIntensityAtCreation ? parseInt(emotionIntensityAtCreation) : undefined,
            recentBets,
        })

        return NextResponse.json({
            success: true,
            parlay,
            warnings: validation.warnings,
        })
    } catch (error) {
        console.error('Error creating parlay:', error)
        return NextResponse.json(
            { error: 'Failed to create parlay' },
            { status: 500 }
        )
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)

        // Build filter from query params
        const filter: {
            sport?: string
            outcome?: ParlayOutcome
            dateFrom?: string
            dateTo?: string
            minLegs?: number
            maxLegs?: number
        } = {}

        if (searchParams.get('sport')) filter.sport = searchParams.get('sport')!
        if (searchParams.get('outcome')) filter.outcome = searchParams.get('outcome') as ParlayOutcome
        if (searchParams.get('dateFrom')) filter.dateFrom = searchParams.get('dateFrom')!
        if (searchParams.get('dateTo')) filter.dateTo = searchParams.get('dateTo')!
        if (searchParams.get('minLegs')) filter.minLegs = parseInt(searchParams.get('minLegs')!)
        if (searchParams.get('maxLegs')) filter.maxLegs = parseInt(searchParams.get('maxLegs')!)

        const parlays = Object.keys(filter).length > 0
            ? await ParlayTrackingService.getParlaysByFilter(filter)
            : await ParlayTrackingService.getAllParlays()

        return NextResponse.json({
            success: true,
            parlays,
            count: parlays.length,
        })
    } catch (error) {
        console.error('Error fetching parlays:', error)
        return NextResponse.json(
            { error: 'Failed to fetch parlays' },
            { status: 500 }
        )
    }
}

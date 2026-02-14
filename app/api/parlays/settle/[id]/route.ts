/**
 * POST /api/parlays/settle/[id] — Settle a parlay by providing leg-level outcomes.
 *
 * Body: { legResults: Record<pickId, "win"|"loss"|"push"> }
 *
 * Maps the simplified win/loss/push vocabulary to the internal won/lost/push
 * outcomes expected by ParlayTrackingService.settleParlay.
 */

import { NextRequest, NextResponse } from 'next/server'
import { ParlayTrackingService } from '@/lib/parlay-tracking-service'

interface RouteParams {
    params: Promise<{ id: string }>
}

const OUTCOME_MAP: Record<string, 'won' | 'lost' | 'void' | 'push'> = {
    win: 'won',
    loss: 'lost',
    push: 'push',
    void: 'void',
    // Also accept the canonical forms directly
    won: 'won',
    lost: 'lost',
}

export async function POST(
    request: NextRequest,
    { params }: RouteParams,
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { legResults } = body

        // Validate input — legResults is a Map-like object { pickId: outcome }
        if (!legResults || typeof legResults !== 'object' || Array.isArray(legResults)) {
            return NextResponse.json(
                { error: 'legResults must be an object mapping pickId → "win"|"loss"|"push"' },
                { status: 400 },
            )
        }

        const legOutcomes: Array<{ pickId: string; outcome: 'won' | 'lost' | 'void' | 'push' }> = []

        for (const [pickId, rawOutcome] of Object.entries(legResults)) {
            const mapped = OUTCOME_MAP[String(rawOutcome).toLowerCase()]
            if (!mapped) {
                return NextResponse.json(
                    { error: `Invalid outcome "${rawOutcome}" for leg "${pickId}". Use win, loss, or push.` },
                    { status: 400 },
                )
            }
            legOutcomes.push({ pickId, outcome: mapped })
        }

        if (legOutcomes.length === 0) {
            return NextResponse.json(
                { error: 'legResults must contain at least one entry' },
                { status: 400 },
            )
        }

        const updatedParlay = await ParlayTrackingService.settleParlay(id, legOutcomes)

        if (!updatedParlay) {
            return NextResponse.json(
                { error: 'Parlay not found' },
                { status: 404 },
            )
        }

        return NextResponse.json({
            success: true,
            parlay: updatedParlay,
            payout: updatedParlay.actualPayout ?? 0,
        })
    } catch (error) {
        console.error('Error settling parlay:', error)
        return NextResponse.json(
            { error: 'Failed to settle parlay' },
            { status: 500 },
        )
    }
}

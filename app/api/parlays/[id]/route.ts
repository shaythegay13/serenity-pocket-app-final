/**
 * GET  /api/parlays/[id] — Get a single parlay by ID.
 * PATCH /api/parlays/[id] — Update parlay outcome and settle legs.
 *
 * Supports leg-level outcome tracking and automatic payout calculation.
 */

import { NextRequest, NextResponse } from 'next/server'
import { ParlayTrackingService } from '@/lib/parlay-tracking-service'

interface RouteParams {
    params: Promise<{ id: string }>
}

export async function GET(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { id } = await params
        const parlay = await ParlayTrackingService.getParlay(id)

        if (!parlay) {
            return NextResponse.json(
                { error: 'Parlay not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({ success: true, parlay })
    } catch (error) {
        console.error('Error fetching parlay:', error)
        return NextResponse.json(
            { error: 'Failed to fetch parlay' },
            { status: 500 }
        )
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { legOutcomes, actualPayout } = body

        // Validate legOutcomes format
        if (!legOutcomes || !Array.isArray(legOutcomes)) {
            return NextResponse.json(
                { error: 'legOutcomes must be an array of { pickId, outcome }' },
                { status: 400 }
            )
        }

        for (const lo of legOutcomes) {
            if (!lo.pickId || !['won', 'lost', 'void', 'push'].includes(lo.outcome)) {
                return NextResponse.json(
                    { error: 'Each legOutcome must have a pickId and valid outcome (won/lost/void/push)' },
                    { status: 400 }
                )
            }
        }

        const updatedParlay = await ParlayTrackingService.settleParlay(
            id,
            legOutcomes,
            actualPayout ? parseFloat(actualPayout) : undefined
        )

        if (!updatedParlay) {
            return NextResponse.json(
                { error: 'Parlay not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            parlay: updatedParlay,
        })
    } catch (error) {
        console.error('Error settling parlay:', error)
        return NextResponse.json(
            { error: 'Failed to settle parlay' },
            { status: 500 }
        )
    }
}

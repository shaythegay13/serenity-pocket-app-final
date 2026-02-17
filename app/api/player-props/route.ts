/**
 * Player Props API Route
 *
 * Endpoints:
 * - GET /api/player-props?gameId={id}&sport={sport} - Get available player props for a game
 * - GET /api/player-props?sport={sport} - Get all available player prop markets for a sport
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getPlayerPropsForGame,
  getAvailableMarketsForSport,
  getCacheStats,
} from '@/lib/services/player-data-service'
import { getPropMarketsForSport } from '@/lib/types/player-props'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get('gameId')
    const sport = searchParams.get('sport')
    const marketsParam = searchParams.get('markets')

    // If no sport specified, return error
    if (!sport) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameter: sport',
          availableSports: [
            'americanfootball_nfl',
            'basketball_nba',
            'baseball_mlb',
            'icehockey_nhl'
          ]
        },
        { status: 400 }
      )
    }

    // If no gameId, return available markets for the sport
    if (!gameId) {
      const markets = getPropMarketsForSport(sport)

      return NextResponse.json({
        success: true,
        sport,
        availableMarkets: markets,
        marketCount: markets.length,
        message: markets.length > 0
          ? 'Use these markets with a gameId to fetch player props'
          : 'No player prop markets available for this sport'
      })
    }

    // Parse specific markets if provided
    const markets = marketsParam
      ? marketsParam.split(',').filter(m => m.trim())
      : undefined

    console.log(`[API] Fetching player props for game ${gameId}, sport ${sport}`)

    // Fetch player props for the specific game
    const props = await getPlayerPropsForGame(gameId, sport, markets as any)

    // Get cache stats for debugging
    const cacheStats = getCacheStats()

    return NextResponse.json({
      success: true,
      gameId,
      sport,
      playerProps: props,
      propCount: props.length,
      cacheStats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[API] Error fetching player props:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * POST endpoint for batch fetching player props for multiple games
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { gameIds, sport, markets } = body

    if (!gameIds || !Array.isArray(gameIds) || gameIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing or invalid gameIds array'
        },
        { status: 400 }
      )
    }

    if (!sport) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: sport'
        },
        { status: 400 }
      )
    }

    // Limit batch size to prevent abuse
    const MAX_BATCH_SIZE = 10
    if (gameIds.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `Batch size exceeds maximum of ${MAX_BATCH_SIZE} games`
        },
        { status: 400 }
      )
    }

    console.log(`[API] Batch fetching player props for ${gameIds.length} games`)

    // Fetch props for all games in parallel
    const results = await Promise.all(
      gameIds.map(async (gameId: string) => {
        try {
          const props = await getPlayerPropsForGame(gameId, sport, markets)
          return { gameId, props, success: true }
        } catch (error) {
          return {
            gameId,
            props: [],
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      })
    )

    // Aggregate results
    const totalProps = results.reduce((sum, r) => sum + r.props.length, 0)
    const successCount = results.filter(r => r.success).length

    return NextResponse.json({
      success: true,
      sport,
      results,
      summary: {
        gamesRequested: gameIds.length,
        gamesSuccessful: successCount,
        totalProps,
        averagePropsPerGame: totalProps / successCount || 0
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[API] Error in batch player props fetch:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

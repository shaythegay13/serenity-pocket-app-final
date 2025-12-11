import { NextResponse } from 'next/server';
import {
  storeOddsSnapshot,
  getGameOddsHistory,
  getMultipleGamesHistory,
  getAllGameIds,
  type OddsSnapshot
} from '@/lib/odds-history-store';

/**
 * GET /api/odds-history
 *
 * Fetch odds history for one or more games
 *
 * Query parameters:
 * - gameId: Single game ID (optional)
 * - gameIds: Comma-separated game IDs (optional)
 * - all: 'true' to get all available histories (optional)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');
    const gameIdsParam = searchParams.get('gameIds');
    const all = searchParams.get('all') === 'true';

    // Get all histories
    if (all) {
      const allIds = getAllGameIds();
      const histories = getMultipleGamesHistory(allIds);
      return NextResponse.json({
        success: true,
        count: Object.keys(histories).length,
        data: histories
      });
    }

    // Get single game history
    if (gameId) {
      const history = getGameOddsHistory(gameId);
      if (!history) {
        return NextResponse.json(
          { success: false, error: 'No history found for this game' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        data: history
      });
    }

    // Get multiple game histories
    if (gameIdsParam) {
      const ids = gameIdsParam.split(',').map(id => id.trim());
      const histories = getMultipleGamesHistory(ids);
      return NextResponse.json({
        success: true,
        count: Object.keys(histories).length,
        data: histories
      });
    }

    return NextResponse.json(
      { success: false, error: 'Must provide gameId, gameIds, or all=true' },
      { status: 400 }
    );
  } catch (error) {
    console.error('❌ Error fetching odds history:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch odds history',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/odds-history
 *
 * Store a new odds snapshot for a game
 *
 * Body:
 * {
 *   gameId: string
 *   homeTeam: string
 *   awayTeam: string
 *   sport: string
 *   commenceTime: string
 *   snapshot: OddsSnapshot
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { gameId, homeTeam, awayTeam, sport, commenceTime, snapshot } = body;

    if (!gameId || !homeTeam || !awayTeam || !sport || !commenceTime || !snapshot) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    storeOddsSnapshot(gameId, homeTeam, awayTeam, sport, commenceTime, snapshot);

    return NextResponse.json({
      success: true,
      message: 'Odds snapshot stored successfully'
    });
  } catch (error) {
    console.error('❌ Error storing odds snapshot:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to store odds snapshot',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

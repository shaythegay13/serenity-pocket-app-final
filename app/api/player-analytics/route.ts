import { NextResponse } from 'next/server';
import {
  fetchGamePlayerAnalytics,
  fetchTeamRoster,
  searchPlayer,
  type GamePlayerAnalytics,
  type TeamRoster,
  type PlayerStats
} from '@/lib/player-stats-api';
import type { SupportedSportKey } from '@/lib/types';

/**
 * GET /api/player-analytics
 *
 * Fetch player analytics and team rosters
 *
 * Query parameters:
 * - sport: Sport key (required)
 * - gameId: Game ID (optional)
 * - homeTeam: Home team name (optional, required if gameId provided)
 * - awayTeam: Away team name (optional, required if gameId provided)
 * - teamName: Single team name to fetch roster (optional)
 * - playerName: Player name to search (optional)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sport = searchParams.get('sport') as SupportedSportKey;
    const gameId = searchParams.get('gameId');
    const homeTeam = searchParams.get('homeTeam');
    const awayTeam = searchParams.get('awayTeam');
    const teamName = searchParams.get('teamName');
    const playerName = searchParams.get('playerName');

    if (!sport) {
      return NextResponse.json(
        { success: false, error: 'Sport parameter is required' },
        { status: 400 }
      );
    }

    // Search for specific player
    if (playerName) {
      const player = await searchPlayer(playerName);
      return NextResponse.json({
        success: !!player,
        data: player,
        type: 'player-search'
      });
    }

    // Fetch single team roster
    if (teamName && !gameId) {
      const roster = await fetchTeamRoster(sport, teamName);
      return NextResponse.json({
        success: !!roster,
        data: roster,
        type: 'team-roster'
      });
    }

    // Fetch game player analytics (both teams)
    if (gameId && homeTeam && awayTeam) {
      const analytics = await fetchGamePlayerAnalytics(sport, homeTeam, awayTeam, gameId);
      return NextResponse.json({
        success: true,
        data: analytics,
        type: 'game-analytics'
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Invalid parameters. Provide either: (gameId + homeTeam + awayTeam) or (teamName) or (playerName)'
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('❌ Error in player-analytics API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch player analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

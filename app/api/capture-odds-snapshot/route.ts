import { NextResponse } from 'next/server';
import { fetchEnhancedLiveOdds } from '@/lib/enhanced-odds-api';
import { storeOddsSnapshot } from '@/lib/odds-history-store';

/**
 * POST /api/capture-odds-snapshot
 *
 * Capture current odds for all games and store as historical snapshots
 *
 * Query parameters:
 * - sport: Sport to capture (optional, defaults to all major sports)
 */
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sport = searchParams.get('sport');

    const sports = sport
      ? [sport]
      : ['basketball_nba', 'americanfootball_nfl', 'baseball_mlb', 'icehockey_nhl'];

    let totalGames = 0;
    let totalSnapshots = 0;
    const errors: string[] = [];

    console.log(`📸 Starting odds snapshot capture for: ${sports.join(', ')}`);

    for (const sportKey of sports) {
      try {
        const oddsResponse = await fetchEnhancedLiveOdds(sportKey, 'auto');

        if (!oddsResponse.success || !oddsResponse.data.length) {
          console.log(`⚠️ No odds data for ${sportKey}`);
          continue;
        }

        totalGames += oddsResponse.data.length;

        // Store snapshot for each game
        oddsResponse.data.forEach(game => {
          const snapshot = {
            timestamp: new Date().toISOString(),
            moneyline: undefined as any,
            spread: undefined as any,
            totals: undefined as any
          };

          // Capture moneyline
          if (game.homeOdds?.best || game.awayOdds?.best) {
            snapshot.moneyline = {
              home: game.homeOdds?.best?.odds,
              away: game.awayOdds?.best?.odds,
              bookmaker: game.homeOdds?.best?.bookmaker || game.awayOdds?.best?.bookmaker
            };
          }

          // Capture spread
          if (game.spread) {
            snapshot.spread = {
              home: {
                line: game.spread.home.line,
                odds: game.spread.home.best?.odds || 0
              },
              away: {
                line: game.spread.away.line,
                odds: game.spread.away.best?.odds || 0
              },
              bookmaker: game.spread.home.best?.bookmaker
            };
          }

          // Capture totals
          if (game.totals) {
            snapshot.totals = {
              over: {
                line: game.totals.over.line,
                odds: game.totals.over.best?.odds || 0
              },
              under: {
                line: game.totals.under.line,
                odds: game.totals.under.best?.odds || 0
              },
              bookmaker: game.totals.over.best?.bookmaker
            };
          }

          storeOddsSnapshot(
            game.id,
            game.homeTeam,
            game.awayTeam,
            game.sport,
            game.commenceTime,
            snapshot
          );

          totalSnapshots++;
        });

        console.log(`✅ Captured ${oddsResponse.data.length} games for ${sportKey}`);
      } catch (error) {
        const errorMsg = `Error capturing ${sportKey}: ${error instanceof Error ? error.message : 'Unknown'}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Odds snapshot capture completed',
      stats: {
        totalGames,
        totalSnapshots,
        sports: sports.length,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  } catch (error) {
    console.error('❌ Error in capture-odds-snapshot:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to capture odds snapshots',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import {
  fetchEnhancedLiveOdds,
  fetchAdvantageOpportunities,
  getAvailableAPIs,
  type OddsStrategy
} from '@/lib/enhanced-odds-api';

/**
 * GET /api/enhanced-odds
 *
 * Fetch live odds using enhanced API (combines RapidAPI Sportsbook + The Odds API)
 *
 * Query parameters:
 * - sport: Sport key (e.g., 'basketball_nba', 'americanfootball_nfl')
 * - strategy: 'rapidapi' | 'theodds' | 'both' | 'auto' (default: 'auto')
 * - includeAdvantages: 'true' | 'false' (default: 'false')
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sport = searchParams.get('sport') || 'basketball_nba';
    const strategy = (searchParams.get('strategy') as OddsStrategy) || 'auto';
    const includeAdvantages = searchParams.get('includeAdvantages') === 'true';

    console.log(`📊 Enhanced Odds API Request:`, {
      sport,
      strategy,
      includeAdvantages
    });

    // Check which APIs are available
    const availableAPIs = getAvailableAPIs();
    console.log('🔑 Available APIs:', availableAPIs);

    // Fetch odds data
    const oddsResponse = await fetchEnhancedLiveOdds(sport, strategy);

    // Optionally fetch advantage opportunities
    let advantages = oddsResponse.advantageOpportunities || [];
    if (includeAdvantages && !advantages.length) {
      advantages = await fetchAdvantageOpportunities(sport, 'ALL');
    }

    return NextResponse.json({
      success: oddsResponse.success,
      data: oddsResponse.data,
      source: oddsResponse.source,
      advantageOpportunities: includeAdvantages ? advantages : undefined,
      availableAPIs,
      remainingRequests: oddsResponse.remainingRequests,
      error: oddsResponse.error,
      meta: {
        sport,
        strategy,
        count: oddsResponse.data.length,
        advantageCount: advantages.length
      }
    });
  } catch (error) {
    console.error('❌ Error in enhanced-odds API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch odds data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Enhanced Odds API - Combines The Odds API and RapidAPI Sportsbook
 *
 * This module provides a unified interface for fetching odds data from multiple sources:
 * 1. The Odds API - Broader coverage of international sports
 * 2. RapidAPI Sportsbook - US-focused with arbitrage and +EV opportunities
 *
 * Falls back to mock data if neither API is available.
 */

import {
  fetchAdvantages as fetchSportsbookAdvantages,
  isConfigured as isRapidAPIConfigured,
  type TransformedGame as SportsbookGame
} from './sportsbook-api-v2';
import { fetchSportsDBFixturesForSport } from './thesportsdb';
import { fetchPerplexityGameInsights } from './perplexity-client';

// Sport mapping utilities
function mapSportToLeague(sport: string): string {
  const mapping: Record<string, string> = {
    'americanfootball_nfl': 'NFL',
    'basketball_nba': 'NBA',
    'baseball_mlb': 'MLB',
    'icehockey_nhl': 'NHL'
  };
  return mapping[sport] || sport;
}

function mapLeagueToSport(league: string): string {
  const mapping: Record<string, string> = {
    'NFL': 'americanfootball_nfl',
    'NBA': 'basketball_nba',
    'MLB': 'baseball_mlb',
    'NHL': 'icehockey_nhl'
  };
  return mapping[league] || league.toLowerCase();
}

type SportLeague = 'NFL' | 'NBA' | 'MLB' | 'NHL';
type AdvantageOpportunity = any; // Placeholder

import {
  fetchLiveOdds as fetchTheOddsAPIData,
  fetchPlayerProps as fetchTheOddsAPIProps,
  transformOddsForDisplay,
  type OddsData
} from './odds-api';

/**
 * Strategy for fetching odds data
 */
export type OddsStrategy = 'rapidapi' | 'theodds' | 'both' | 'auto';

/**
 * Combined odds response
 */
export interface EnhancedOddsResponse {
  success: boolean;
  // Rich odds objects compatible with LiveOddsTab (homeTeam/awayTeam/homeOdds/awayOdds)
  data: any[];
  source: 'rapidapi' | 'theodds' | 'combined' | 'sportsdb' | 'perplexity' | 'mock';
  advantageOpportunities?: AdvantageOpportunity[];
  remainingRequests?: {
    rapidapi?: number;
    theodds?: number;
  };
  error?: string;
}

/**
 * Fetch live odds using the best available source
 *
 * Strategy priority:
 * 1. 'rapidapi' - Use RapidAPI only
 * 2. 'theodds' - Use The Odds API only
 * 3. 'both' - Merge data from both APIs
 * 4. 'auto' - Use RapidAPI if available, fallback to The Odds API, then mock
 */
export async function fetchEnhancedLiveOdds(
  sport: string,
  strategy: OddsStrategy = 'auto'
): Promise<EnhancedOddsResponse> {
  // Auto strategy: try The Odds API first, then fallback to RapidAPI
  if (strategy === 'auto') {
    console.log('📊 [AUTO] Trying The Odds API first');

    const theOddsResult = await fetchFromTheOddsAPI(sport);

    const hasRealTheOddsData =
      theOddsResult.success &&
      theOddsResult.source === 'theodds' &&
      Array.isArray(theOddsResult.data) &&
      theOddsResult.data.length > 0;

    if (hasRealTheOddsData) {
      console.log('✅ [AUTO] Using The Odds API data');
      return theOddsResult;
    }

    // If The Odds API has no usable data (empty, mock, or failed), try RapidAPI if configured
    if (isRapidAPIConfigured()) {
      console.log('📊 [AUTO] The Odds API unavailable/empty, trying RapidAPI Sportsbook');
      const rapidResult = await fetchFromRapidAPI(sport);

      const hasRealRapidData =
        rapidResult.success &&
        rapidResult.source === 'rapidapi' &&
        Array.isArray(rapidResult.data) &&
        rapidResult.data.length > 0;

      if (hasRealRapidData) {
        console.log('✅ [AUTO] Using RapidAPI Sportsbook data');
        return rapidResult;
      }

      // Both providers failed or are rate-limited, try TheSportsDB fixtures and then Perplexity research
      console.warn('⚠️ [AUTO] Both The Odds API and RapidAPI are unavailable or rate-limited, trying TheSportsDB fixtures');
      const sportsDBResult = await fetchFromSportsDB(sport);

      if (sportsDBResult.success && Array.isArray(sportsDBResult.data) && sportsDBResult.data.length > 0) {
        console.log('✅ [AUTO] Using TheSportsDB fixtures as fallback, enriching with Perplexity');
        const perplexityResult = await fetchFromPerplexity(sport, sportsDBResult.data);
        if (perplexityResult.success) {
          return perplexityResult;
        }
        return sportsDBResult;
      }

      console.warn('⚠️ [AUTO] TheSportsDB returned no fixtures; falling back to Perplexity league-level insights');
      const leagueOnlyPerplexity = await fetchFromPerplexity(sport, []);
      if (leagueOnlyPerplexity.success && leagueOnlyPerplexity.data.length > 0) {
        return leagueOnlyPerplexity;
      }

      return {
        success: false,
        data: [],
        source: 'mock',
        error: 'Sorry, we are unable to show current game data right now. Please check back another time.'
      };
    }

    // RapidAPI not configured and The Odds API yielded no useful data - try TheSportsDB, then Perplexity
    console.warn('⚠️ [AUTO] The Odds API returned no data and RapidAPI is not configured, trying TheSportsDB fixtures');
    const sportsDBResult = await fetchFromSportsDB(sport);

    if (sportsDBResult.success && Array.isArray(sportsDBResult.data) && sportsDBResult.data.length > 0) {
      console.log('✅ [AUTO] Using TheSportsDB fixtures as fallback, enriching with Perplexity');
      const perplexityResult = await fetchFromPerplexity(sport, sportsDBResult.data);
      if (perplexityResult.success) {
        return perplexityResult;
      }
      return sportsDBResult;
    }

    console.warn('⚠️ [AUTO] TheSportsDB returned no fixtures; falling back to Perplexity league-level insights');
    const leagueOnlyPerplexity = await fetchFromPerplexity(sport, []);
    if (leagueOnlyPerplexity.success && leagueOnlyPerplexity.data.length > 0) {
      return leagueOnlyPerplexity;
    }

    return {
      success: false,
      data: [],
      source: 'mock',
      error: 'Sorry, we are unable to show current game data right now. Please check back another time.'
    };
  }

  // RapidAPI only
  if (strategy === 'rapidapi') {
    return await fetchFromRapidAPI(sport);
  }

  // The Odds API only
  if (strategy === 'theodds') {
    return await fetchFromTheOddsAPI(sport);
  }

  // Both: merge data from both sources
  if (strategy === 'both') {
    const league = mapSportToLeague(sport) as SportLeague;
    return await fetchFromBothAPIs(sport, league);
  }

  // Fallback for invalid strategy: treat as failure
  return {
    success: false,
    data: [],
    source: 'mock',
    error: 'Invalid odds strategy'
  };
}

/**
 * Fetch from RapidAPI Sportsbook only
 * Uses the new sportsbook-api-v2 implementation
 */
async function fetchFromRapidAPI(sport: string): Promise<EnhancedOddsResponse> {
  try {
    const response = await fetchSportsbookAdvantages(sport);

    if (!response.success || !response.data || response.data.length === 0) {
      console.warn('⚠️ RapidAPI Sportsbook failed or returned no data');
      return {
        success: false,
        data: [],
        source: 'mock',
        error: response.error || 'No data available from Sportsbook API'
      };
    }

    console.log(`✅ RapidAPI Sportsbook success - ${response.data.length} games`);

    return {
      success: true,
      data: response.data,
      source: 'rapidapi',
      remainingRequests: {
        rapidapi: response.remainingRequests
      }
    };
  } catch (error) {
    console.error('❌ Error fetching from RapidAPI:', error);
    return {
      success: false,
      data: [],
      source: 'mock',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Use Perplexity to enrich fixtures or, if fixtures are missing, to provide league-level qualitative insights.
 * Never fabricates odds; only attaches aiInsights metadata to game-like objects.
 */
async function fetchFromPerplexity(
  sport: string,
  games: any[],
): Promise<EnhancedOddsResponse> {
  try {
    const fixturesForAI = games.map(g => ({
      id: String(g.id ?? ''),
      homeTeam: String(g.homeTeam ?? ''),
      awayTeam: String(g.awayTeam ?? ''),
      commenceTime: g.commenceTime instanceof Date ? g.commenceTime : g.commenceTime ? new Date(g.commenceTime) : undefined,
    }))

    const aiResponse = await fetchPerplexityGameInsights(sport, fixturesForAI)

    if (!aiResponse.success || !aiResponse.data) {
      console.warn('⚠️ Perplexity failed or returned no data')
      return {
        success: false,
        data: [],
        source: 'mock',
        error: aiResponse.error || 'Perplexity did not return insights',
      }
    }

    if (games.length === 0) {
      // League-level only: create a synthetic item containing narrative
      const first = aiResponse.data[0]
      if (!first) {
        return {
          success: false,
          data: [],
          source: 'mock',
          error: 'Perplexity returned empty insights array',
        }
      }

      return {
        success: true,
        source: 'perplexity',
        data: [
          {
            id: first.id || `perplexity-${sport}`,
            sport,
            sportKey: sport,
            homeTeam: first.homeTeam || 'N/A',
            awayTeam: first.awayTeam || 'N/A',
            commenceTime: first.commenceTime ? new Date(first.commenceTime) : new Date(),
            homeOdds: undefined,
            awayOdds: undefined,
            bookmakers: [],
            aiInsights: {
              source: 'perplexity',
              narrative: first.narrative,
              keyFactors: first.keyFactors,
              riskWarnings: first.riskWarnings,
            },
          },
        ],
      }
    }

    // Map insights back onto the provided games
    const byId = new Map<string, ReturnType<typeof Object>>()
    for (const ai of aiResponse.data) {
      byId.set(String(ai.id), ai)
    }

    const enriched = games.map(g => {
      const id = String(g.id ?? '')
      const ai = byId.get(id)
      if (!ai) return g

      return {
        ...g,
        aiInsights: {
          source: 'perplexity',
          narrative: ai.narrative,
          keyFactors: ai.keyFactors,
          riskWarnings: ai.riskWarnings,
        },
      }
    })

    return {
      success: true,
      data: enriched,
      source: 'perplexity',
    }
  } catch (error) {
    console.error('❌ Error enriching with Perplexity:', error)
    return {
      success: false,
      data: [],
      source: 'mock',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Fetch from TheSportsDB as a tertiary fallback
 * Returns real fixtures (teams + start times) without odds
 */
async function fetchFromSportsDB(sport: string): Promise<EnhancedOddsResponse> {
  try {
    const fixturesResponse = await fetchSportsDBFixturesForSport(sport);

    if (!fixturesResponse.success || !fixturesResponse.data || fixturesResponse.data.length === 0) {
      console.warn('⚠️ TheSportsDB returned no fixtures or failed');
      return {
        success: false,
        data: [],
        source: 'mock',
        error: fixturesResponse.error || 'No fixtures available from TheSportsDB',
      };
    }

    const transformed = fixturesResponse.data.map(fixture => ({
      id: fixture.id,
      sport,
      sportKey: sport,
      homeTeam: fixture.homeTeam,
      awayTeam: fixture.awayTeam,
      commenceTime: fixture.commenceTime,
      homeOdds: undefined,
      awayOdds: undefined,
      bookmakers: [],
    }));

    return {
      success: true,
      data: transformed,
      source: 'sportsdb',
    };
  } catch (error) {
    console.error('❌ Error fetching from TheSportsDB:', error);
    return {
      success: false,
      data: [],
      source: 'mock',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch from The Odds API only
 * Uses the LiveOddsResponse shape from odds-api.ts (success flag and data array)
 */
async function fetchFromTheOddsAPI(sport: string): Promise<EnhancedOddsResponse> {
  try {
    const oddsResponse = await fetchTheOddsAPIData(sport);

    const dataArray = Array.isArray(oddsResponse.data) ? oddsResponse.data : [];

    if (!oddsResponse.success || dataArray.length === 0) {
      console.warn('⚠️ The Odds API returned no data or failed');
      return {
        success: false,
        data: [],
        source: 'mock',
        error: oddsResponse.error,
        remainingRequests: oddsResponse.remainingRequests ? { theodds: oddsResponse.remainingRequests } : undefined
      };
    }

    // Use the same rich format that LiveOddsTab expects
    const transformed = transformOddsForDisplay(dataArray as OddsData[]);

    return {
      success: true,
      data: transformed,
      source: 'theodds',
      remainingRequests: oddsResponse.remainingRequests ? { theodds: oddsResponse.remainingRequests } : undefined
    };
  } catch (error) {
    console.error('❌ Error fetching from The Odds API:', error);
    return {
      success: false,
      data: [],
      source: 'mock',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Fetch from both APIs and merge the data
 */
async function fetchFromBothAPIs(
  sport: string,
  league: SportLeague
): Promise<EnhancedOddsResponse> {
  try {
    const [rapidAPIResult, theOddsResult] = await Promise.all([
      fetchFromRapidAPI(league),
      fetchFromTheOddsAPI(sport)
    ]);

    // Merge events from both sources, avoiding duplicate event IDs
    const byId = new Map<string, any>();

    for (const item of rapidAPIResult.data || []) {
      if (item && item.id) byId.set(item.id, item);
    }
    for (const item of theOddsResult.data || []) {
      if (item && item.id && !byId.has(item.id)) {
        byId.set(item.id, item);
      }
    }

    const mergedData = Array.from(byId.values());

    return {
      success: true,
      data: mergedData,
      source: 'combined',
      advantageOpportunities: rapidAPIResult.advantageOpportunities,
      remainingRequests: {
        rapidapi: rapidAPIResult.remainingRequests?.rapidapi,
        theodds: theOddsResult.remainingRequests?.theodds
      }
    };
  } catch (error) {
    console.error('❌ Error fetching from both APIs:', error);
    return {
      success: false,
      data: [],
      source: 'mock',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Fetch advantage opportunities (arbitrage, +EV, etc.)
 * Only available with RapidAPI Sportsbook
 */
export async function fetchAdvantageOpportunities(
  sport?: string,
  type: 'ARBITRAGE' | 'POSITIVE_EV' | 'ALL' = 'ALL'
): Promise<AdvantageOpportunity[]> {
  if (!isRapidAPIConfigured()) {
    console.warn('⚠️ RapidAPI not configured, cannot fetch advantage opportunities');
    return [];
  }

  const league = sport ? mapSportToLeague(sport) : undefined;

  try {
    // The newer Sportsbook API v2 integration exposes a unified `fetchAdvantages`
    // which already returns transformed game data. For now, we don't surface
    // separate arbitrage / +EV structures, so this helper simply returns an
    // empty list while keeping the API shape intact.
    console.warn('⚠️ fetchAdvantageOpportunities is not implemented for the current Sportsbook API v2. Returning empty list.');
    void league; // avoid unused variable warning
    return [];
  } catch (error) {
    console.error('❌ Error fetching advantage opportunities:', error);
    return [];
  }
}

/**
 * Check which APIs are configured
 */
export function getAvailableAPIs(): {
  rapidapi: boolean;
  theodds: boolean;
} {
  return {
    rapidapi: isRapidAPIConfigured(),
    theodds: !!process.env.NEXT_PUBLIC_ODDS_API_KEY
  };
}

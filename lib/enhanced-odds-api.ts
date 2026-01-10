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

/**
 * Filter games to only include those matching the requested sport
 * This is a safety measure to prevent cross-sport contamination
 */
function filterGamesBySport(games: any[], requestedSport: string): any[] {
  const expectedLeague = mapSportToLeague(requestedSport);

  // Map of sport variations for more flexible matching
  const sportVariations: Record<string, string[]> = {
    'americanfootball_nfl': ['NFL', 'AMERICAN_FOOTBALL', 'AMERICANFOOTBALL', 'FOOTBALL'],
    'basketball_nba': ['NBA', 'BASKETBALL'],
    'baseball_mlb': ['MLB', 'BASEBALL'],
    'icehockey_nhl': ['NHL', 'ICE_HOCKEY', 'ICEHOCKEY', 'HOCKEY']
  };

  const allowedVariations = sportVariations[requestedSport] || [expectedLeague];

  return games.filter(game => {
    // Check both the sport field and sportKey field
    const gameSport = (game.sport || game.sportKey || '');

    // If no sport data, trust the API filtering and keep the game
    if (!gameSport) {
      console.log(`ℹ️ Keeping game with no sport data: ${game.awayTeam} @ ${game.homeTeam} (trusting API filter)`);
      return true;
    }

    const gameSportStr = gameSport.toString();
    const gameSportUpper = gameSportStr.toUpperCase();

    // Exact match on sport key (e.g., "americanfootball_nfl")
    if (gameSportStr === requestedSport) {
      return true;
    }

    // Match by any of the allowed variations
    for (const variation of allowedVariations) {
      if (gameSportUpper.includes(variation)) {
        return true;
      }
    }

    // Check if this is a different major sport (cross-contamination)
    const otherSports = ['NFL', 'NBA', 'MLB', 'NHL', 'AMERICAN_FOOTBALL', 'BASKETBALL', 'BASEBALL', 'ICE_HOCKEY'];
    const isDefinitelyWrongSport = otherSports.some(sport =>
      sport !== expectedLeague &&
      !allowedVariations.includes(sport) &&
      gameSportUpper.includes(sport)
    );

    if (isDefinitelyWrongSport) {
      console.log(`🚫 Filtering out game from wrong sport: ${game.awayTeam} @ ${game.homeTeam} (sport: "${gameSportStr}", expected: ${requestedSport})`);
      return false;
    }

    // If we can't determine it's wrong, keep it (trust the API)
    console.log(`⚠️ Uncertain sport match, keeping: ${game.awayTeam} @ ${game.homeTeam} (sport: "${gameSportStr}", expected: ${requestedSport})`);
    return true;
  });
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
  source: 'rapidapi' | 'theodds' | 'combined' | 'sportsdb' | 'mock';
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

      // Both providers failed or are rate-limited, try TheSportsDB fixtures
      console.warn('⚠️ [AUTO] Both The Odds API and RapidAPI are unavailable or rate-limited, trying TheSportsDB fixtures');
      const sportsDBResult = await fetchFromSportsDB(sport);

      if (sportsDBResult.success && Array.isArray(sportsDBResult.data) && sportsDBResult.data.length > 0) {
        return sportsDBResult;
      }

      return {
        success: false,
        data: [],
        source: 'mock',
        error: 'Sorry, we are unable to show current game data right now. Please check back another time.'
      };
    }

    // RapidAPI not configured and The Odds API yielded no useful data - try TheSportsDB
    console.warn('⚠️ [AUTO] The Odds API returned no data and RapidAPI is not configured, trying TheSportsDB fixtures');
    const sportsDBResult = await fetchFromSportsDB(sport);

    if (sportsDBResult.success && Array.isArray(sportsDBResult.data) && sportsDBResult.data.length > 0) {
      return sportsDBResult;
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
 * Normalize RapidAPI data structure to match The Odds API format
 * This ensures the picker route can extract spread and total data correctly
 */
function normalizeRapidAPIData(games: any[]): any[] {
  return games.map(game => {
    // If the game already has The Odds API format, return as-is
    if (game.homeSpread || game.overLine) {
      return game;
    }

    // Convert RapidAPI format to The Odds API format
    const normalized: any = {
      ...game,
    };

    // Convert spread data: spread.home/away → homeSpread/awaySpread
    if (game.spread) {
      if (game.spread.home) {
        normalized.homeSpread = {
          best: {
            bookmaker: game.spread.home.best?.bookmaker || 'Unknown',
            odds: game.spread.home.best?.odds,
            line: game.spread.home.line
          },
          all: game.spread.home.all || []
        };
      }
      if (game.spread.away) {
        normalized.awaySpread = {
          best: {
            bookmaker: game.spread.away.best?.bookmaker || 'Unknown',
            odds: game.spread.away.best?.odds,
            line: game.spread.away.line
          },
          all: game.spread.away.all || []
        };
      }
    }

    // Convert totals data: totals.over/under → overLine/underLine
    if (game.totals) {
      if (game.totals.over) {
        normalized.overLine = {
          best: {
            bookmaker: game.totals.over.best?.bookmaker || 'Unknown',
            odds: game.totals.over.best?.odds,
            line: game.totals.over.line
          },
          all: game.totals.over.all || []
        };
      }
      if (game.totals.under) {
        normalized.underLine = {
          best: {
            bookmaker: game.totals.under.best?.bookmaker || 'Unknown',
            odds: game.totals.under.best?.odds,
            line: game.totals.under.line
          },
          all: game.totals.under.all || []
        };
      }
    }

    console.log(`🔄 Normalized RapidAPI game: ${game.awayTeam} @ ${game.homeTeam}`, {
      hasSpread: !!normalized.homeSpread,
      hasTotals: !!normalized.overLine
    });

    return normalized;
  });
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

    // Apply strict sport filtering to ensure no cross-contamination
    const filteredData = filterGamesBySport(response.data, sport);
    console.log(`✅ After sport filtering: ${filteredData.length} games remain for ${sport}`);

    if (filteredData.length === 0) {
      console.warn('⚠️ RapidAPI Sportsbook returned data but all games were filtered out');
      return {
        success: false,
        data: [],
        source: 'mock',
        error: 'No games available after sport filtering'
      };
    }

    // Normalize RapidAPI data to match The Odds API structure
    const normalizedData = normalizeRapidAPIData(filteredData);
    console.log(`🔄 Normalized ${normalizedData.length} RapidAPI games to The Odds API format`);

    return {
      success: true,
      data: normalizedData,
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

    // Apply strict sport filtering to ensure no cross-contamination
    const filteredData = filterGamesBySport(transformed, sport);
    console.log(`✅ The Odds API: After sport filtering, ${filteredData.length} games remain for ${sport}`);

    if (filteredData.length === 0) {
      console.warn('⚠️ The Odds API returned data but all games were filtered out');
      return {
        success: false,
        data: [],
        source: 'mock',
        error: 'No games available after sport filtering',
        remainingRequests: oddsResponse.remainingRequests ? { theodds: oddsResponse.remainingRequests } : undefined
      };
    }

    return {
      success: true,
      data: filteredData,
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

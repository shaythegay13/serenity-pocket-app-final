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
  fetchArbitrageOpportunities,
  fetchPositiveEVOpportunities,
  fetchLiveOddsData as fetchRapidAPILiveOdds,
  fetchPlayerPropsData as fetchRapidAPIPlayerProps,
  isRapidAPIConfigured,
  mapSportToLeague,
  mapLeagueToSport,
  type AdvantageOpportunity,
  type LiveOdds as RapidAPILiveOdds,
  type SportLeague
} from './rapidapi-sportsbook';

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
  source: 'rapidapi' | 'theodds' | 'combined' | 'mock';
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
  const league = mapSportToLeague(sport);

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
      const rapidResult = await fetchFromRapidAPI(league);

      const hasRealRapidData =
        rapidResult.success &&
        rapidResult.source === 'rapidapi' &&
        Array.isArray(rapidResult.data) &&
        rapidResult.data.length > 0;

      if (hasRealRapidData) {
        console.log('✅ [AUTO] Using RapidAPI Sportsbook data');
        return rapidResult;
      }

      // Both providers failed or are rate-limited
      console.warn('⚠️ [AUTO] Both The Odds API and RapidAPI are unavailable or rate-limited');
      return {
        success: false,
        data: [],
        source: 'mock',
        error: 'Sorry, we are unable to show current game data right now. Please check back another time.'
      };
    }

    // RapidAPI not configured and The Odds API yielded no useful data
    console.warn('⚠️ [AUTO] The Odds API returned no data and RapidAPI is not configured');
    return {
      success: false,
      data: [],
      source: 'mock',
      error: 'Sorry, we are unable to show current game data right now. Please check back another time.'
    };
  }

  // RapidAPI only
  if (strategy === 'rapidapi') {
    return await fetchFromRapidAPI(league);
  }

  // The Odds API only
  if (strategy === 'theodds') {
    return await fetchFromTheOddsAPI(sport);
  }

  // Both: merge data from both sources
  if (strategy === 'both') {
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
 */
async function fetchFromRapidAPI(league: SportLeague): Promise<EnhancedOddsResponse> {
  try {
    // Fetch both live odds and advantage opportunities in parallel
    const [oddsResponse, arbResponse, evResponse] = await Promise.all([
      fetchRapidAPILiveOdds(league),
      fetchArbitrageOpportunities(league),
      fetchPositiveEVOpportunities(league)
    ]);

    if (!oddsResponse.success) {
      console.warn('⚠️ RapidAPI failed');
      return {
        success: false,
        data: [],
        source: 'mock',
        error: oddsResponse.error
      };
    }

    // Transform RapidAPI data into rich format compatible with LiveOddsTab
    const transformedData = transformRapidAPIData(oddsResponse.data || []);

    // Combine advantage opportunities
    const advantages = [
      ...(arbResponse.data || []),
      ...(evResponse.data || [])
    ];

    return {
      success: true,
      data: transformedData,
      source: 'rapidapi',
      advantageOpportunities: advantages,
      remainingRequests: {
        rapidapi: oddsResponse.remainingRequests
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
 * Transform RapidAPI odds data to our rich internal format
 */
function transformRapidAPIData(odds: RapidAPILiveOdds[]): any[] {
  // Guard against clearly broken American odds from the upstream feed
  const isReasonableAmerican = (o: number) => o > -2000 && o < 2000;

  return odds
    .map((event, index) => {
      // Focus on MONEYLINE market for side odds
      const moneylineMarket = event.markets?.find(m => m.type === 'MONEYLINE');

      if (!moneylineMarket?.sportsbooks || moneylineMarket.sportsbooks.length === 0) {
        return null;
      }

      const homeTeam = event.homeTeam;
      const awayTeam = event.awayTeam;

      // Build odds arrays for each side, filtering out absurd prices
      const homeOddsAll = moneylineMarket.sportsbooks
        .filter(book => typeof book.odds.home === 'number' && isReasonableAmerican(book.odds.home as number))
        .map(book => ({
          bookmaker: book.name,
          team: homeTeam,
          odds: book.odds.home as number
        }));

      const awayOddsAll = moneylineMarket.sportsbooks
        .filter(book => typeof book.odds.away === 'number' && isReasonableAmerican(book.odds.away as number))
        .map(book => ({
          bookmaker: book.name,
          team: awayTeam,
          odds: book.odds.away as number
        }));

      if (homeOddsAll.length === 0 || awayOddsAll.length === 0) {
        return null;
      }

      const bestHome = homeOddsAll.reduce((best, current) =>
        current.odds > best.odds ? current : best
      );

      const bestAway = awayOddsAll.reduce((best, current) =>
        current.odds > best.odds ? current : best
      );

      const bookmakers = Array.from(new Set([
        ...homeOddsAll.map(o => o.bookmaker),
        ...awayOddsAll.map(o => o.bookmaker)
      ]));

      return {
        id: event.id || `rapid-${index}`,
        sport: mapLeagueToSport(event.league),
        sportKey: mapLeagueToSport(event.league),
        homeTeam,
        awayTeam,
        commenceTime: new Date(event.eventTime),
        homeOdds: {
          best: bestHome,
          all: homeOddsAll
        },
        awayOdds: {
          best: bestAway,
          all: awayOddsAll
        },
        bookmakers
      };
    })
    .filter((item): item is any => item !== null);
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
    if (type === 'ALL') {
      const [arbResponse, evResponse] = await Promise.all([
        fetchArbitrageOpportunities(league),
        fetchPositiveEVOpportunities(league)
      ]);

      const arbData = Array.isArray(arbResponse?.data) ? arbResponse.data : [];
      const evData = Array.isArray(evResponse?.data) ? evResponse.data : [];

      return [
        ...arbData,
        ...evData
      ];
    } else if (type === 'ARBITRAGE') {
      const response = await fetchArbitrageOpportunities(league);
      return Array.isArray(response?.data) ? response.data : [];
    } else {
      const response = await fetchPositiveEVOpportunities(league);
      return Array.isArray(response?.data) ? response.data : [];
    }
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

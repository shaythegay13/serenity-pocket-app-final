/**
 * RapidAPI Sportsbook API Integration
 *
 * Provides real-time odds data from 10+ major US sportsbooks across 20+ sports leagues.
 * Updates every minute with live lines when games start.
 *
 * Documentation: https://sportsbookapi.com/documentation/
 * RapidAPI Page: https://rapidapi.com/sportsbook-api-sportsbook-api-default/api/sportsbook-api2
 */

const RAPIDAPI_HOST = 'sportsbook-api2.p.rapidapi.com';
const RAPIDAPI_BASE_URL = `https://${RAPIDAPI_HOST}/v0`;

// API Key from environment variable
const RAPIDAPI_KEY = process.env.NEXT_PUBLIC_RAPIDAPI_SPORTSBOOK_KEY || '';

/**
 * Available advantage types for the API
 */
export type AdvantageType =
  | 'ARBITRAGE'      // Risk-free profit opportunities across different books
  | 'POSITIVE_EV'    // Bets with positive expected value
  | 'LOW_HOLD'       // Markets with low vig/juice
  | 'MIDDLING';      // Opportunities to win both sides

/**
 * Supported sports leagues
 */
export type SportLeague =
  | 'NFL'
  | 'NBA'
  | 'MLB'
  | 'NHL'
  | 'NCAAF'    // College Football
  | 'NCAAB'    // College Basketball
  | 'MLS'      // Soccer
  | 'EPL'      // English Premier League
  | 'UFC'
  | 'NASCAR'
  | 'TENNIS'
  | 'GOLF'
  | 'BOXING';

/**
 * Market types available
 */
export type MarketType =
  | 'MONEYLINE'
  | 'SPREAD'
  | 'TOTAL'
  | 'PLAYER_PROPS'
  | 'TEAM_PROPS'
  | 'GAME_PROPS';

/**
 * Major US sportsbooks supported
 */
export const SUPPORTED_SPORTSBOOKS = [
  'DraftKings',
  'FanDuel',
  'BetMGM',
  'Caesars',
  'PointsBet',
  'BetRivers',
  'WynnBet',
  'Unibet',
  'Barstool',
  'Fox Bet'
] as const;

/**
 * Advantage opportunity interface
 */
export interface AdvantageOpportunity {
  id: string;
  sport: string;
  league: SportLeague;
  event: string;
  eventTime: string;
  marketType: MarketType;
  advantageType: AdvantageType;
  expectedValue?: number;
  arbitrageProfit?: number;
  books: {
    sportsbook: string;
    selection: string;
    odds: number;
    price: string;
  }[];
  profitPercentage?: number;
  holdPercentage?: number;
}

/**
 * Live odds for a specific event
 */
export interface LiveOdds {
  id: string;
  sport: string;
  league: SportLeague;
  eventTime: string;
  homeTeam: string;
  awayTeam: string;
  markets: {
    type: MarketType;
    sportsbooks: {
      name: string;
      odds: {
        home?: number;
        away?: number;
        over?: number;
        under?: number;
        line?: number;
      };
      lastUpdated: string;
    }[];
  }[];
}

/**
 * Player prop data
 */
export interface PlayerProp {
  id: string;
  playerId: string;
  playerName: string;
  team: string;
  sport: string;
  league: SportLeague;
  eventId: string;
  propType: string; // e.g., "points", "assists", "touchdowns"
  line: number;
  sportsbooks: {
    name: string;
    overOdds: number;
    underOdds: number;
    lastUpdated: string;
  }[];
}

/**
 * API Response wrapper
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  remainingRequests?: number;
}

/**
 * Make authenticated request to RapidAPI Sportsbook
 */
async function makeRequest<T>(endpoint: string): Promise<ApiResponse<T>> {
  if (!RAPIDAPI_KEY) {
    console.warn('⚠️ RAPIDAPI_SPORTSBOOK_KEY not configured');
    return {
      success: false,
      error: 'API key not configured'
    };
  }

  try {
    const url = `${RAPIDAPI_BASE_URL}${endpoint}`;
    console.log(`📡 Fetching from Sportsbook API: ${endpoint}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': RAPIDAPI_HOST,
        'x-rapidapi-key': RAPIDAPI_KEY
      }
    });

    // Check rate limit headers
    const remainingRequests = response.headers.get('x-ratelimit-requests-remaining');
    console.log(`⏳ Remaining API requests: ${remainingRequests || 'unknown'}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Sportsbook API error (${response.status}):`, errorText);

      return {
        success: false,
        error: `API request failed: ${response.status} ${response.statusText}`,
        remainingRequests: remainingRequests ? parseInt(remainingRequests) : undefined
      };
    }

    const data = await response.json();

    return {
      success: true,
      data: data as T,
      remainingRequests: remainingRequests ? parseInt(remainingRequests) : undefined
    };
  } catch (error) {
    console.error('❌ Error fetching from Sportsbook API:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Fetch arbitrage opportunities
 * These are risk-free profit opportunities where you can bet both sides across different books
 */
export async function fetchArbitrageOpportunities(
  sport?: SportLeague
): Promise<ApiResponse<AdvantageOpportunity[]>> {
  let endpoint = '/advantages/?type=ARBITRAGE';
  if (sport) {
    endpoint += `&sport=${sport}`;
  }

  return makeRequest<AdvantageOpportunity[]>(endpoint);
}

/**
 * Fetch positive expected value opportunities
 * These are bets where the odds offered are better than the true probability
 */
export async function fetchPositiveEVOpportunities(
  sport?: SportLeague
): Promise<ApiResponse<AdvantageOpportunity[]>> {
  let endpoint = '/advantages/?type=POSITIVE_EV';
  if (sport) {
    endpoint += `&sport=${sport}`;
  }

  return makeRequest<AdvantageOpportunity[]>(endpoint);
}

/**
 * Fetch low hold opportunities
 * Markets where sportsbooks have minimal vig/juice
 */
export async function fetchLowHoldOpportunities(
  sport?: SportLeague
): Promise<ApiResponse<AdvantageOpportunity[]>> {
  let endpoint = '/advantages/?type=LOW_HOLD';
  if (sport) {
    endpoint += `&sport=${sport}`;
  }

  return makeRequest<AdvantageOpportunity[]>(endpoint);
}

/**
 * Fetch live odds for all events
 * Optionally filter by sport/league
 */
export async function fetchLiveOddsData(
  sport?: SportLeague,
  marketType?: MarketType
): Promise<ApiResponse<LiveOdds[]>> {
  let endpoint = '/odds';
  const params = new URLSearchParams();

  if (sport) params.append('sport', sport);
  if (marketType) params.append('market', marketType);

  if (params.toString()) {
    endpoint += `?${params.toString()}`;
  }

  return makeRequest<LiveOdds[]>(endpoint);
}

/**
 * Fetch player props for a specific event
 */
export async function fetchPlayerPropsData(
  eventId: string,
  propType?: string
): Promise<ApiResponse<PlayerProp[]>> {
  let endpoint = `/events/${eventId}/props`;
  if (propType) {
    endpoint += `?type=${propType}`;
  }

  return makeRequest<PlayerProp[]>(endpoint);
}

/**
 * Fetch odds for a specific event by ID
 */
export async function fetchEventOdds(
  eventId: string
): Promise<ApiResponse<LiveOdds>> {
  return makeRequest<LiveOdds>(`/events/${eventId}`);
}

/**
 * Convert American odds to decimal
 */
export function americanToDecimal(americanOdds: number): number {
  if (americanOdds > 0) {
    return (americanOdds / 100) + 1;
  } else {
    return (100 / Math.abs(americanOdds)) + 1;
  }
}

/**
 * Convert decimal odds to American
 */
export function decimalToAmerican(decimalOdds: number): number {
  if (decimalOdds >= 2) {
    return Math.round((decimalOdds - 1) * 100);
  } else {
    return Math.round(-100 / (decimalOdds - 1));
  }
}

/**
 * Calculate implied probability from American odds
 */
export function calculateImpliedProbability(americanOdds: number): number {
  if (americanOdds > 0) {
    return (100 / (americanOdds + 100)) * 100;
  } else {
    return (Math.abs(americanOdds) / (Math.abs(americanOdds) + 100)) * 100;
  }
}

/**
 * Calculate expected value
 */
export function calculateExpectedValue(
  odds: number,
  trueProbability: number,
  stake: number
): number {
  const decimal = americanToDecimal(odds);
  const payout = stake * decimal;
  const expectedWin = (trueProbability / 100) * payout;
  const expectedLoss = ((100 - trueProbability) / 100) * stake;
  return expectedWin - expectedLoss;
}

/**
 * Find best odds across sportsbooks for a selection
 */
export function findBestOdds(
  odds: Array<{ sportsbook: string; odds: number }>
): { sportsbook: string; odds: number } | null {
  if (!odds || odds.length === 0) return null;

  return odds.reduce((best, current) => {
    // Higher odds = better for the bettor
    return current.odds > best.odds ? current : best;
  });
}

/**
 * Check if API is configured
 */
export function isRapidAPIConfigured(): boolean {
  return !!RAPIDAPI_KEY && RAPIDAPI_KEY.length > 0;
}

/**
 * Map our internal sport names to RapidAPI league format
 */
export function mapSportToLeague(sport: string): SportLeague {
  const mapping: Record<string, SportLeague> = {
    'basketball_nba': 'NBA',
    'americanfootball_nfl': 'NFL',
    'baseball_mlb': 'MLB',
    'icehockey_nhl': 'NHL',
    'soccer_epl': 'EPL',
    'americanfootball_ncaaf': 'NCAAF',
    'basketball_ncaab': 'NCAAB',
  };

  return mapping[sport] || sport.toUpperCase() as SportLeague;
}

/**
 * Map RapidAPI league to our internal sport key
 */
export function mapLeagueToSport(league: SportLeague): string {
  const mapping: Record<SportLeague, string> = {
    'NBA': 'basketball_nba',
    'NFL': 'americanfootball_nfl',
    'MLB': 'baseball_mlb',
    'NHL': 'icehockey_nhl',
    'EPL': 'soccer_epl',
    'NCAAF': 'americanfootball_ncaaf',
    'NCAAB': 'basketball_ncaab',
    'MLS': 'soccer_mls',
    'UFC': 'mma_ufc',
    'NASCAR': 'racing_nascar',
    'TENNIS': 'tennis',
    'GOLF': 'golf',
    'BOXING': 'boxing'
  };

  return mapping[league] || league.toLowerCase();
}

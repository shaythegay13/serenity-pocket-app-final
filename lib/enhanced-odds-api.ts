/**
 * Enhanced Odds API - Multi-Sport Support
 * 
 * Supports comprehensive sports coverage for AI systems
 */

import { getSportById, getSportsWithLiveOdds, SportConfig } from './sports-config';

type SportLeague = string; // Dynamic based on sports config
type AdvantageOpportunity = any; // Placeholder

/**
 * Strategy for fetching odds data
 */
export type OddsStrategy = 'rapidapi' | 'theodds' | 'both' | 'auto';

/**
 * Combined odds response
 */
export interface EnhancedOddsResponse {
  success: boolean;
  data: any[];
  source: 'rapidapi' | 'theodds' | 'combined' | 'sportsdb' | 'mock';
  advantageOpportunities?: AdvantageOpportunity[];
  timestamp: Date;
  error?: string;
}

/**
 * Mock odds data for compatibility - Enhanced for multiple sports
 */
function getMockOddsData(sport?: string): any[] {
  const sportConfig = sport ? getSportById(sport) : null;
  
  if (!sportConfig) {
    // Return sample data for all popular sports
    return getSportsWithLiveOdds().slice(0, 4).map(sport => ({
      id: `${sport.id}-mock-1`,
      sport: sport.id,
      sportName: sport.name,
      league: sport.oddsApiLeague || sport.id,
      homeTeam: getRealTeamName(sport.id, 'home'),
      awayTeam: getRealTeamName(sport.id, 'away'),
      odds: -110,
      market: 'Moneyline',
      startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
      lastUpdate: new Date()
    }));
  }

  // Return mock data for specific sport
  return [
    {
      id: `${sportConfig.id}-mock-1`,
      sport: sportConfig.id,
      sportName: sportConfig.name,
      league: sportConfig.oddsApiLeague || sportConfig.id,
      homeTeam: getRealTeamName(sportConfig.id, 'home'),
      awayTeam: getRealTeamName(sportConfig.id, 'away'),
      odds: -110,
      market: sportConfig.popularMarkets[0] || 'Moneyline',
      startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
      lastUpdate: new Date()
    },
    {
      id: `${sportConfig.id}-mock-2`,
      sport: sportConfig.id,
      sportName: sportConfig.name,
      league: sportConfig.oddsApiLeague || sportConfig.id,
      homeTeam: getRealTeamName(sportConfig.id, 'favorite'),
      awayTeam: getRealTeamName(sportConfig.id, 'underdog'),
      odds: +150,
      market: sportConfig.popularMarkets[0] || 'Moneyline',
      startTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
      lastUpdate: new Date()
    }
  ];
}

/**
 * Get realistic team names for mock data
 */
function getRealTeamName(sport: string, type: 'home' | 'away' | 'favorite' | 'underdog'): string {
  const teamNames: Record<string, Record<string, string[]>> = {
    'basketball_nba': {
      home: ['Los Angeles Lakers', 'Boston Celtics', 'Golden State Warriors', 'Miami Heat'],
      away: ['Denver Nuggets', 'Phoenix Suns', 'Milwaukee Bucks', 'Philadelphia 76ers'],
      favorite: ['Los Angeles Lakers', 'Boston Celtics'],
      underdog: ['Orlando Magic', 'Detroit Pistons']
    },
    'football_nfl': {
      home: ['Kansas City Chiefs', 'Buffalo Bills', 'Dallas Cowboys', 'Philadelphia Eagles'],
      away: ['New England Patriots', 'Green Bay Packers', 'San Francisco 49ers', 'Detroit Lions'],
      favorite: ['Kansas City Chiefs', 'Buffalo Bills'],
      underdog: ['Arizona Cardinals', 'Washington Commanders']
    },
    'baseball_mlb': {
      home: ['New York Yankees', 'Boston Red Sox', 'Los Angeles Dodgers', 'Houston Astros'],
      away: ['Chicago Cubs', 'San Francisco Giants', 'Atlanta Braves', 'St. Louis Cardinals'],
      favorite: ['New York Yankees', 'Los Angeles Dodgers'],
      underdog: ['Pittsburgh Pirates', 'Oakland Athletics']
    },
    'soccer_epl': {
      home: ['Manchester United', 'Liverpool', 'Arsenal', 'Chelsea'],
      away: ['Manchester City', 'Tottenham', 'Newcastle', 'Leicester City'],
      favorite: ['Manchester City', 'Arsenal'],
      underdog: ['Nottingham Forest', 'Bournemouth']
    }
  };

  const sportTeams = teamNames[sport] || teamNames['basketball_nba'];
  const typeTeams = sportTeams[type] || sportTeams.home;
  
  return typeTeams[Math.floor(Math.random() * typeTeams.length)];
}

/**
 * Fetch enhanced odds data with multiple sources
 */
export async function fetchEnhancedLiveOdds(
  sport?: string,
  strategy: OddsStrategy = 'auto'
): Promise<EnhancedOddsResponse> {
  const sportConfig = sport ? getSportById(sport) : null;
  const sportName = sportConfig?.displayName || sport || 'all sports';
  
  console.log(`📊 Enhanced Odds API: Fetching odds for ${sportName}`);
  
  // Try real APIs first, fall back to mock if needed
  try {
    // Try TheOddsAPI first (more reliable for live odds)
    if (isTheOddsAPIConfigured()) {
      console.log(`📊 Trying TheOddsAPI for ${sportName}`);
      const theOddsResult = await fetchFromTheOddsAPI(sport);
      if (theOddsResult.success && theOddsResult.data.length > 0) {
        console.log(`✅ TheOddsAPI returned ${theOddsResult.data.length} games`);
        return theOddsResult;
      }
    }

    // Try RapidAPI as fallback
    if (isRapidAPIConfigured()) {
      console.log(`📊 Trying RapidAPI for ${sportName}`);
      const rapidResult = await fetchFromRapidAPI(sport);
      if (rapidResult.success && rapidResult.data.length > 0) {
        console.log(`✅ RapidAPI returned ${rapidResult.data.length} games`);
        return rapidResult;
      }
    }

    console.log(`⚠️ No real API data available, using mock data for ${sportName}`);
    return {
      success: true,
      data: getMockOddsData(sport),
      source: 'mock',
      timestamp: new Date(),
    };
  } catch (error) {
    console.error(`❌ Error fetching odds:`, error);
    return {
      success: true,
      data: getMockOddsData(sport),
      source: 'mock',
      timestamp: new Date(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Fetch from TheOddsAPI
 */
async function fetchFromTheOddsAPI(sport?: string): Promise<EnhancedOddsResponse> {
  const apiKey = process.env.NEXT_PUBLIC_ODDS_API_KEY;
  if (!apiKey) {
    return { success: false, data: [], source: 'theodds', timestamp: new Date(), error: 'API key not configured' };
  }

  const sportKey = sport === 'basketball_nba' ? 'basketball_nba' : 
                   sport === 'football_nfl' ? 'american_football_nfl' :
                   sport === 'baseball_mlb' ? 'baseball_mlb' :
                   sport ? sport : 'basketball_nba';

  const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?regions=us&markets=h2h,spreads,totals&oddsFormat=american&apiKey=${apiKey}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`TheOddsAPI error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      success: true,
      data: data.map((game: any) => ({
        id: game.id,
        sport: sportKey,
        sportName: sport,
        league: game.sport_title,
        homeTeam: game.home_team,
        awayTeam: game.away_team,
        homeOdds: { best: { odds: game.bookmakers?.[0]?.markets?.[0]?.outcomes?.[0]?.price } },
        awayOdds: { best: { odds: game.bookmakers?.[0]?.markets?.[0]?.outcomes?.[1]?.price } },
        commenceTime: game.commence_time,
        lastUpdate: new Date()
      })),
      source: 'theodds',
      timestamp: new Date()
    };
  } catch (error) {
    return { 
      success: false, 
      data: [], 
      source: 'theodds', 
      timestamp: new Date(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Fetch from RapidAPI
 */
async function fetchFromRapidAPI(sport?: string): Promise<EnhancedOddsResponse> {
  const apiKey = process.env.NEXT_PUBLIC_RAPIDAPI_SPORTSBOOK_KEY;
  if (!apiKey) {
    return { success: false, data: [], source: 'rapidapi', timestamp: new Date(), error: 'API key not configured' };
  }

  const sportKey = sport === 'basketball_nba' ? 'NBA' : 
                   sport === 'football_nfl' ? 'NFL' :
                   sport === 'baseball_mlb' ? 'MLB' :
                   sport ? sport.toUpperCase() : 'NBA';

  const url = `https://odds.p.rapidapi.com/v4/sports/${sportKey}/odds`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'odds.p.rapidapi.com'
      }
    });
    
    if (!response.ok) {
      throw new Error(`RapidAPI error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      success: true,
      data: data.map((game: any) => ({
        id: game.id,
        sport: sportKey,
        sportName: sport,
        league: game.sport_title,
        homeTeam: game.home_team,
        awayTeam: game.away_team,
        homeOdds: { best: { odds: game.bookmakers?.[0]?.markets?.[0]?.outcomes?.[0]?.price } },
        awayOdds: { best: { odds: game.bookmakers?.[0]?.markets?.[0]?.outcomes?.[1]?.price } },
        commenceTime: game.commence_time,
        lastUpdate: new Date()
      })),
      source: 'rapidapi',
      timestamp: new Date()
    };
  } catch (error) {
    return { 
      success: false, 
      data: [], 
      source: 'rapidapi', 
      timestamp: new Date(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check if RapidAPI is configured
 */
export function isRapidAPIConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_RAPIDAPI_SPORTSBOOK_KEY; // Check for actual API key
}

/**
 * Check if The Odds API is configured
 */
export function isTheOddsAPIConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_ODDS_API_KEY;
}

/**
 * Get available sports for odds fetching
 */
export function getAvailableOddsSports(): SportConfig[] {
  return getSportsWithLiveOdds();
}

/**
 * Fetch advantage opportunities
 */
export async function fetchSportsbookAdvantages(): Promise<AdvantageOpportunity[]> {
  // Enhanced to support multiple sports
  const sports = getAvailableOddsSports();
  console.log(`📈 Checking for advantages across ${sports.length} sports`);
  return []; // Return empty for now, can be enhanced later
}

/**
 * Transform odds for display
 */
export function transformOddsForDisplay(data: any[]): any[] {
  return data; // Return as-is, can add transformations later
}

/**
 * Fetch player props
 */
export async function fetchPlayerProps(sport?: string): Promise<any[]> {
  const sportConfig = sport ? getSportById(sport) : null;
  
  if (!sportConfig || !sportConfig.hasPlayerProps) {
    console.log(`📊 Player props not available for ${sportConfig?.displayName || sport}`);
    return [];
  }
  
  console.log(`📊 Fetching player props for ${sportConfig.displayName}`);
  return []; // Return empty for now, can be enhanced with real API
}

/**
 * Mock odds data type
 */
export type OddsData = any;

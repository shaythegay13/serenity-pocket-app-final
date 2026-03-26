/**
 * Enhanced Odds API - Multi-Sport Support
 * 
 * Supports comprehensive sports coverage for AI systems
 */

import { getSportById, getSportsWithLiveOdds, SportConfig } from './sports-config';
import { incrementRapidAPIUsage } from './api-monitoring';

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
  source: 'rapidapi' | 'theodds' | 'combined' | 'sportsdb';
  advantageOpportunities?: AdvantageOpportunity[];
  timestamp: Date;
  error?: string;
}

// Mock data functions removed to ensure only real data is used

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
    let theOddsError: string | undefined;
    let rapidError: string | undefined;

    // Try TheOddsAPI first (more reliable for live odds)
    if (isTheOddsAPIConfigured()) {
      console.log(`📊 Trying TheOddsAPI for ${sportName}`);
      const theOddsResult = await fetchFromTheOddsAPI(sport);
      if (theOddsResult.success && theOddsResult.data.length > 0) {
        console.log(`✅ TheOddsAPI returned ${theOddsResult.data.length} games`);
        return theOddsResult;
      }
      theOddsError = theOddsResult.error || (theOddsResult.success ? `0 games returned` : 'unknown error');
      console.log(`⚠️ TheOddsAPI fallthrough: ${theOddsError}`);
    }

    // Try RapidAPI as fallback
    if (isRapidAPIConfigured()) {
      console.log(`📊 Trying RapidAPI for ${sportName}`);
      const rapidResult = await fetchFromRapidAPI(sport);
      if (rapidResult.success && rapidResult.data.length > 0) {
        console.log(`✅ RapidAPI returned ${rapidResult.data.length} games`);
        return rapidResult;
      }
      rapidError = rapidResult.error || (rapidResult.success ? `0 games returned` : 'unknown error');
      console.log(`⚠️ RapidAPI fallthrough: ${rapidError}`);
    }

    const combinedError = [
      theOddsError ? `TheOddsAPI: ${theOddsError}` : null,
      rapidError ? `RapidAPI: ${rapidError}` : null,
    ].filter(Boolean).join(' | ') || 'No real-time odds available for this sport at the moment.';

    console.log(`⚠️ No real API data available for ${sportName}: ${combinedError}`);
    return {
      success: false,
      data: [],
      source: 'combined',
      timestamp: new Date(),
      error: combinedError,
    };
  } catch (error) {
    console.error(`❌ Error fetching odds:`, error);
    return {
      success: false,
      data: [],
      source: 'combined',
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

  const sportConfig = sport ? getSportById(sport) : null;

  // Construct the correct key for TheOddsAPI
  // Format: sportKey_leagueKey (e.g., americanfootball_nfl, basketball_nba)
  let sportKey = 'basketball_nba'; // Default fallback

  if (sportConfig) {
    if (sportConfig.oddsApiSport && sportConfig.oddsApiLeague) {
      // Fix: Prevent double prefixing (e.g. soccer_soccer_epl)
      if (sportConfig.oddsApiLeague.startsWith(sportConfig.oddsApiSport)) {
        sportKey = sportConfig.oddsApiLeague;
      } else {
        sportKey = `${sportConfig.oddsApiSport}_${sportConfig.oddsApiLeague}`;
      }
    } else {
      sportKey = sportConfig.id;
    }
  } else if (sport) {
    sportKey = sport;
  }

  const fullUrl = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?regions=us&markets=h2h,spreads,totals,alternate_spreads,alternate_totals,team_totals&oddsFormat=american&apiKey=${apiKey}`;
  const basicUrl = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?regions=us&markets=h2h,spreads,totals&oddsFormat=american&apiKey=${apiKey}`;

  try {
    let response = await fetch(fullUrl);
    if (!response.ok) {
      // Premium markets (alternate_spreads, alternate_totals, team_totals) may not be
      // available on all API plans or for all sports. Fall back to basic markets.
      console.warn(`[TheOddsAPI] Full markets request failed (${response.status}), retrying with basic markets for ${sportKey}`);
      response = await fetch(basicUrl);
      if (!response.ok) {
        throw new Error(`TheOddsAPI error: ${response.status} ${response.statusText}`);
      }
    }

    const data = await response.json();

    if (Array.isArray(data) && data.length === 0) {
      console.warn(`[TheOddsAPI] No games returned for key: ${sportKey}. Check if key format is correct or if season is active.`);
    }

    // Filter out stale games at the source — only keep future or in-progress (started < 4h ago)
    const now = Date.now();
    const FOUR_HOURS = 4 * 60 * 60 * 1000;
    const freshGames = Array.isArray(data) ? data.filter((game: any) => {
      const ct = game.commence_time;
      if (!ct) return true; // keep if no date info
      const t = Date.parse(ct);
      if (Number.isNaN(t)) return true;
      return t >= now - FOUR_HOURS;
    }) : data;

    console.log(`[TheOddsAPI] ${data.length} total games, ${freshGames.length} after date filter for ${sportKey}`);

    return {
      success: true,
      data: freshGames.map((game: any) => {
        const homeTeam = game.home_team;
        const awayTeam = game.away_team;

        let h2hMarket: any = null;
        let spreadsMarket: any = null;
        let totalsMarket: any = null;

        if (Array.isArray(game.bookmakers)) {
          const findMarket = (book: any, key: string) => book.markets?.find((m: any) => m.key === key);

          // 1. Try to find one book that has everything (consistency)
          const preferredBooks = ['draftkings', 'fanduel', 'betmgm', 'caesars', 'bovada'];
          const perfectBook = game.bookmakers.find((b: any) =>
            preferredBooks.includes(b.key) &&
            findMarket(b, 'h2h') && findMarket(b, 'spreads') && findMarket(b, 'totals')
          ) || game.bookmakers.find((b: any) =>
            findMarket(b, 'h2h') && findMarket(b, 'spreads') && findMarket(b, 'totals')
          );

          if (perfectBook) {
            h2hMarket = findMarket(perfectBook, 'h2h');
            spreadsMarket = findMarket(perfectBook, 'spreads');
            totalsMarket = findMarket(perfectBook, 'totals');
          } else {
            // 2. Mix and match best available if no single book has all
            for (const book of game.bookmakers) {
              if (!h2hMarket && findMarket(book, 'h2h')) h2hMarket = findMarket(book, 'h2h');
              if (!spreadsMarket && findMarket(book, 'spreads')) spreadsMarket = findMarket(book, 'spreads');
              if (!totalsMarket && findMarket(book, 'totals')) totalsMarket = findMarket(book, 'totals');
            }
          }
        }

        // --- Alt spreads: collect all lines across bookmakers, group by point value ---
        const altSpreadMap = new Map<string, { homeOdds: number[]; awayOdds: number[]; homeLine: number; awayLine: number }>();
        const altTotalMap = new Map<number, { overOdds: number[]; underOdds: number[] }>();
        const teamTotalMap = new Map<string, { overOdds: number[]; underOdds: number[]; team: string; line: number }>();

        for (const book of game.bookmakers || []) {
          for (const market of book.markets || []) {
            if (market.key === 'alternate_spreads') {
              for (const o of market.outcomes || []) {
                if (o.point === undefined) continue;
                const key = `${o.name}_${o.point}`;
                if (!altSpreadMap.has(key)) {
                  altSpreadMap.set(key, { homeOdds: [], awayOdds: [], homeLine: o.point, awayLine: -o.point });
                }
                const entry = altSpreadMap.get(key)!;
                if (o.name === homeTeam) entry.homeOdds.push(o.price);
                else if (o.name === awayTeam) entry.awayOdds.push(o.price);
              }
            } else if (market.key === 'alternate_totals') {
              for (const o of market.outcomes || []) {
                if (o.point === undefined) continue;
                if (!altTotalMap.has(o.point)) altTotalMap.set(o.point, { overOdds: [], underOdds: [] });
                const entry = altTotalMap.get(o.point)!;
                if (o.name === 'Over') entry.overOdds.push(o.price);
                else if (o.name === 'Under') entry.underOdds.push(o.price);
              }
            } else if (market.key === 'team_totals') {
              for (const o of market.outcomes || []) {
                if (o.point === undefined || !o.description) continue;
                const team = o.description;
                const key = `${team}_${o.point}`;
                if (!teamTotalMap.has(key)) teamTotalMap.set(key, { overOdds: [], underOdds: [], team, line: o.point });
                const entry = teamTotalMap.get(key)!;
                if (o.name === 'Over') entry.overOdds.push(o.price);
                else if (o.name === 'Under') entry.underOdds.push(o.price);
              }
            }
          }
        }

        const calcBestArr = (arr: number[]) => arr.length > 0 ? Math.max(...arr) : undefined;

        // Build alt spread lines (only include those where both sides have odds)
        const altSpreads: any[] = [];
        const seenAltSpreadLines = new Set<number>();
        for (const [, entry] of altSpreadMap) {
          if (entry.homeOdds.length > 0 && entry.awayOdds.length > 0 && !seenAltSpreadLines.has(entry.homeLine)) {
            seenAltSpreadLines.add(entry.homeLine);
            altSpreads.push({
              homeLine: entry.homeLine, awayLine: -entry.homeLine,
              homeOdds: calcBestArr(entry.homeOdds), awayOdds: calcBestArr(entry.awayOdds),
              variantType: 'alt_line', marketLevel: 'game'
            });
          }
        }
        altSpreads.sort((a, b) => a.homeLine - b.homeLine);

        // Build alt total lines
        const altTotals: any[] = [];
        for (const [line, entry] of altTotalMap) {
          if (entry.overOdds.length > 0 && entry.underOdds.length > 0) {
            altTotals.push({
              line, overOdds: calcBestArr(entry.overOdds), underOdds: calcBestArr(entry.underOdds),
              variantType: 'alt_line', marketLevel: 'game'
            });
          }
        }
        altTotals.sort((a, b) => a.line - b.line);

        // Build team total lines
        const teamTotals: any[] = [];
        for (const [, entry] of teamTotalMap) {
          if (entry.overOdds.length > 0 && entry.underOdds.length > 0) {
            teamTotals.push({
              team: entry.team, line: entry.line,
              overOdds: calcBestArr(entry.overOdds), underOdds: calcBestArr(entry.underOdds),
              variantType: 'base_line', marketLevel: 'team'
            });
          }
        }
        teamTotals.sort((a, b) => a.team.localeCompare(b.team) || a.line - b.line);

        const homeOdds = h2hMarket?.outcomes?.find((o: any) => o.name === homeTeam)?.price;
        const awayOdds = h2hMarket?.outcomes?.find((o: any) => o.name === awayTeam)?.price;

        const homeSpreadOutcome = spreadsMarket?.outcomes?.find((o: any) => o.name === homeTeam);
        const awaySpreadOutcome = spreadsMarket?.outcomes?.find((o: any) => o.name === awayTeam);

        const overOutcome = totalsMarket?.outcomes?.find((o: any) => o.name === 'Over');
        const underOutcome = totalsMarket?.outcomes?.find((o: any) => o.name === 'Under');

        // Calculate best and average odds across all bookmakers for true EV via line shopping
        const allHomeOdds: number[] = [];
        const allAwayOdds: number[] = [];
        const allHomeSpreadOdds: number[] = [];
        const allAwaySpreadOdds: number[] = [];
        const allOverOdds: number[] = [];
        const allUnderOdds: number[] = [];

        for (const book of game.bookmakers || []) {
          const h2h = book.markets?.find((m: any) => m.key === 'h2h');
          const spreads = book.markets?.find((m: any) => m.key === 'spreads');
          const totals = book.markets?.find((m: any) => m.key === 'totals');

          const ho = h2h?.outcomes?.find((o: any) => o.name === homeTeam)?.price;
          const ao = h2h?.outcomes?.find((o: any) => o.name === awayTeam)?.price;
          if (typeof ho === 'number') allHomeOdds.push(ho);
          if (typeof ao === 'number') allAwayOdds.push(ao);

          const hso = spreads?.outcomes?.find((o: any) => o.name === homeTeam)?.price;
          const aso = spreads?.outcomes?.find((o: any) => o.name === awayTeam)?.price;
          if (typeof hso === 'number') allHomeSpreadOdds.push(hso);
          if (typeof aso === 'number') allAwaySpreadOdds.push(aso);

          const oo = totals?.outcomes?.find((o: any) => o.name === 'Over')?.price;
          const uo = totals?.outcomes?.find((o: any) => o.name === 'Under')?.price;
          if (typeof oo === 'number') allOverOdds.push(oo);
          if (typeof uo === 'number') allUnderOdds.push(uo);
        }

        const calcAvg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : undefined;
        const calcBest = (arr: number[]) => arr.length > 0 ? Math.max(...arr) : undefined; // Best for bettor = highest odds

        return {
          id: game.id,
          sport: sportKey,
          sportName: sport,
          league: game.sport_title,
          homeTeam,
          awayTeam,
          homeOdds: { best: { odds: calcBest(allHomeOdds) || homeOdds }, average: calcAvg(allHomeOdds), allBooks: allHomeOdds },
          awayOdds: { best: { odds: calcBest(allAwayOdds) || awayOdds }, average: calcAvg(allAwayOdds), allBooks: allAwayOdds },
          homeSpread: homeSpreadOutcome ? { best: { line: homeSpreadOutcome.point, odds: calcBest(allHomeSpreadOdds) || homeSpreadOutcome.price }, average: calcAvg(allHomeSpreadOdds) } : undefined,
          awaySpread: awaySpreadOutcome ? { best: { line: awaySpreadOutcome.point, odds: calcBest(allAwaySpreadOdds) || awaySpreadOutcome.price }, average: calcAvg(allAwaySpreadOdds) } : undefined,
          overLine: overOutcome ? { best: { line: overOutcome.point, odds: calcBest(allOverOdds) || overOutcome.price }, average: calcAvg(allOverOdds) } : undefined,
          underLine: underOutcome ? { best: { line: underOutcome.point, odds: calcBest(allUnderOdds) || underOutcome.price }, average: calcAvg(allUnderOdds) } : undefined,
          commenceTime: game.commence_time,
          lastUpdate: new Date(),
          bookmakerCount: game.bookmakers?.length || 0,
          // Alternate and team-level markets
          altSpreads: altSpreads.length > 0 ? altSpreads : undefined,
          altTotals: altTotals.length > 0 ? altTotals : undefined,
          teamTotals: teamTotals.length > 0 ? teamTotals : undefined,
        };
      }),
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

  const sportConfig = sport ? getSportById(sport) : null;

  // Construct the correct key for RapidAPI — same format as TheOddsAPI
  // (e.g. basketball_nba, americanfootball_nfl, soccer_epl)
  let sportKey = 'basketball_nba'; // Default fallback

  if (sportConfig) {
    if (sportConfig.oddsApiSport && sportConfig.oddsApiLeague) {
      // Prevent double prefixing (e.g. soccer_soccer_epl)
      if (sportConfig.oddsApiLeague.startsWith(sportConfig.oddsApiSport)) {
        sportKey = sportConfig.oddsApiLeague;
      } else {
        sportKey = `${sportConfig.oddsApiSport}_${sportConfig.oddsApiLeague}`;
      }
    } else {
      sportKey = sportConfig.id;
    }
  } else if (sport) {
    sportKey = sport;
  }

  const url = `https://odds.p.rapidapi.com/v4/sports/${sportKey}/odds`;

  try {
    const response = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'odds.p.rapidapi.com'
      }
    });

    // Track RapidAPI usage after each request
    await incrementRapidAPIUsage().catch(err => console.warn('[RapidAPI Tracker] Failed to increment:', err));

    if (!response.ok) {
      throw new Error(`RapidAPI error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Filter out stale games — only keep future or in-progress (started < 4h ago)
    const nowRapid = Date.now();
    const FOUR_HOURS_RAPID = 4 * 60 * 60 * 1000;
    const freshRapidGames = Array.isArray(data) ? data.filter((game: any) => {
      const ct = game.commence_time;
      if (!ct) return true;
      const t = Date.parse(ct);
      if (Number.isNaN(t)) return true;
      return t >= nowRapid - FOUR_HOURS_RAPID;
    }) : data;

    return {
      success: true,
      data: freshRapidGames.map((game: any) => {
        const homeTeam = game.home_team;
        const awayTeam = game.away_team;
        const bookmaker = game.bookmakers?.[0];

        const h2hMarket = bookmaker?.markets?.find((m: any) => m.key === 'h2h');
        const spreadsMarket = bookmaker?.markets?.find((m: any) => m.key === 'spreads');
        const totalsMarket = bookmaker?.markets?.find((m: any) => m.key === 'totals');

        const homeOdds = h2hMarket?.outcomes?.find((o: any) => o.name === homeTeam)?.price;
        const awayOdds = h2hMarket?.outcomes?.find((o: any) => o.name === awayTeam)?.price;

        const homeSpreadOutcome = spreadsMarket?.outcomes?.find((o: any) => o.name === homeTeam);
        const awaySpreadOutcome = spreadsMarket?.outcomes?.find((o: any) => o.name === awayTeam);

        const overOutcome = totalsMarket?.outcomes?.find((o: any) => o.name === 'Over');
        const underOutcome = totalsMarket?.outcomes?.find((o: any) => o.name === 'Under');

        return {
          id: game.id,
          sport: sportKey,
          sportName: sport,
          league: game.sport_title,
          homeTeam,
          awayTeam,
          homeOdds: { best: { odds: homeOdds } },
          awayOdds: { best: { odds: awayOdds } },
          homeSpread: homeSpreadOutcome ? { best: { line: homeSpreadOutcome.point, odds: homeSpreadOutcome.price } } : undefined,
          awaySpread: awaySpreadOutcome ? { best: { line: awaySpreadOutcome.point, odds: awaySpreadOutcome.price } } : undefined,
          overLine: overOutcome ? { best: { line: overOutcome.point, odds: overOutcome.price } } : undefined,
          underLine: underOutcome ? { best: { line: underOutcome.point, odds: underOutcome.price } } : undefined,
          commenceTime: game.commence_time,
          lastUpdate: new Date()
        };
      }),
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

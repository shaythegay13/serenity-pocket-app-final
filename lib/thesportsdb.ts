/**
 * TheSportsDB API Service
 * Enhanced sports research with caching for AI systems
 */

// Simple in-memory cache (in production, use Redis)
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

const CACHE_TTL = {
  TEAM_INFO: 7 * 24 * 60 * 60 * 1000, // 7 days - team info rarely changes
  TEAM_SEARCH: 7 * 24 * 60 * 60 * 1000, // 7 days - team IDs don't change
  PLAYER_INFO: 24 * 60 * 60 * 1000, // 24 hours
  ROSTER: 7 * 24 * 60 * 60 * 1000, // 7 days - rosters only change seasonally
  LEAGUE_INFO: 30 * 24 * 60 * 60 * 1000, // 30 days - league info is very stable
  EVENT_INFO: 2 * 60 * 60 * 1000, // 2 hours
  RECENT_FORM: 30 * 60 * 1000, // 30 minutes - balance freshness vs rate limits
  HEAD_TO_HEAD: 24 * 60 * 60 * 1000, // 24 hours - historical data doesn't change often
};

const API_BASE = (process.env.NEXT_PUBLIC_THESPORTSDB_BASE_URL || process.env.NEXT_PUBLIC_THESPORTSDB_BASE_URL_V1 || 'https://www.thesportsdb.com/api/v1/json').replace(/\/+$/, '');

// Get API key from environment - priority to server-side key. Default to '123' (free public key)
const API_KEY = process.env.NEXT_PUBLIC_THESPORTSDB_API_KEY || '123';
const FALLBACK_PUBLIC_KEY = '123';

function getCacheKey(endpoint: string, params: string): string {
  return `${endpoint}:${params}`;
}

function getFromCache(key: string): any | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: any, ttl: number): void {
  cache.set(key, { data, timestamp: Date.now(), ttl });
}

async function fetchWithCache(url: string, cacheKey: string, ttl: number): Promise<any> {
  const cached = getFromCache(cacheKey);
  if (cached) {
    console.log(`📦 Cache hit for ${cacheKey}`);
    return cached;
  }

  try {
    // Basic sanitization
    const sanitizedUrl = url.replace(/([^:])\/\/+/g, "$1/");
    const maskedUrl = sanitizedUrl.replace(API_KEY, '***');

    let response = await fetch(sanitizedUrl);

    // If we 404 with the primary key, try with the fallback key '3'
    if (!response.ok && response.status === 404 && API_KEY !== FALLBACK_PUBLIC_KEY) {
      console.warn(`⚠️ Primary API key failed (404), retrying with fallback key '${FALLBACK_PUBLIC_KEY}'`);
      const retryUrl = sanitizedUrl.replace(`/${API_KEY}/`, `/${FALLBACK_PUBLIC_KEY}/`);
      response = await fetch(retryUrl);
    }

    if (!response.ok) {
      console.error(`❌ TheSportsDB HTTP Error: ${response.status} for ${maskedUrl}`);
      throw new Error(`TheSportsDB API error: ${response.status}`);
    }

    const data = await response.json();
    if (!data || (Object.keys(data).length === 1 && Object.values(data)[0] === null)) {
      console.warn(`⚠️ TheSportsDB returned empty/null result for ${cacheKey}`);
    }

    setCache(cacheKey, data, ttl);
    return data;
  } catch (error) {
    console.error(`❌ TheSportsDB API error for ${cacheKey}:`, error);
    throw error;
  }
}

export interface TeamInfo {
  idTeam: string;
  strTeam: string;
  strLeague: string;
  idLeague?: string;
  strCountry: string;
  strSport: string;
  intFormedYear?: string;
  strStadium?: string;
  strStadiumLocation?: string;
  intStadiumCapacity?: string;
  strDescriptionEN?: string;
  strTeamBadge?: string;
  strTeamLogo?: string;
  strTeamFanart1?: string;
}

export interface PlayerInfo {
  idPlayer: string;
  strPlayer: string;
  strTeam: string;
  strPosition: string;
  strNationality: string;
  dateBorn?: string;
  strHeight?: string;
  strWeight?: string;
  strDescriptionEN?: string;
  strThumb?: string;
  strCutout?: string;
  strStatus?: string;
  strSport: string;
}

export interface LeagueInfo {
  idLeague: string;
  strLeague: string;
  strSport: string;
  strCountry: string;
  strCurrentSeason: string;
  intFormedYear?: string;
  strDescriptionEN?: string;
  strBadge?: string;
  strLogo?: string;
  strFanart1?: string;
}

export interface EventInfo {
  idEvent: string;
  strEvent: string;
  strHomeTeam: string;
  strAwayTeam: string;
  dateEvent: string;
  strTime: string;
  idHomeTeam: string;
  idAwayTeam: string;
  strLeague: string;
  idLeague: string;
  strSeason: string;
  intHomeScore?: string;
  intAwayScore?: string;
  strStatus?: string;
}

export interface RecentForm {
  team: string;
  last5: string[];
  winRate: number;
  goalsFor: number;
  goalsAgainst: number;
  cleanSheets: number;
}

/**
 * Search for teams by name
 */
export async function searchTeams(teamName: string): Promise<TeamInfo[]> {
  const url = `${API_BASE}/${API_KEY}/searchteams.php?t=${encodeURIComponent(teamName)}`;
  const cacheKey = getCacheKey('searchteams', teamName);

  try {
    const response = await fetchWithCache(url, cacheKey, CACHE_TTL.TEAM_SEARCH);
    return response.teams || [];
  } catch (error) {
    console.error('Error searching teams:', error);
    return [];
  }
}

/**
 * Search for players by name
 */
export async function searchPlayers(playerName: string): Promise<PlayerInfo[]> {
  const url = `${API_BASE}/${API_KEY}/searchplayers.php?p=${encodeURIComponent(playerName)}`;
  const cacheKey = getCacheKey('searchplayers', playerName);

  try {
    const response = await fetchWithCache(url, cacheKey, CACHE_TTL.PLAYER_INFO);
    return response.player || [];
  } catch (error) {
    console.error('Error searching players:', error);
    return [];
  }
}

/**
 * Get detailed team information by ID
 */
export async function getTeamInfo(teamId: string): Promise<TeamInfo | null> {
  const url = `${API_BASE}/${API_KEY}/lookupteam.php?id=${teamId}`;
  const cacheKey = getCacheKey('lookupteam', teamId);

  try {
    const response = await fetchWithCache(url, cacheKey, CACHE_TTL.TEAM_INFO);
    const teams = response.teams || [];
    return teams.length > 0 ? teams[0] : null;
  } catch (error) {
    console.error('Error getting team info:', error);
    return null;
  }
}

/**
 * Get detailed player information by ID
 */
export async function getPlayerInfo(playerId: string): Promise<PlayerInfo | null> {
  const url = `${API_BASE}/${API_KEY}/lookupplayer.php?id=${playerId}`;
  const cacheKey = getCacheKey('lookupplayer', playerId);

  try {
    const response = await fetchWithCache(url, cacheKey, CACHE_TTL.PLAYER_INFO);
    const players = response.players || [];
    return players.length > 0 ? players[0] : null;
  } catch (error) {
    console.error('Error getting player info:', error);
    return null;
  }
}

/**
 * Get league information by ID
 */
export async function getLeagueInfo(leagueId: string): Promise<LeagueInfo | null> {
  const url = `${API_BASE}/${API_KEY}/lookupleague.php?id=${leagueId}`;
  const cacheKey = getCacheKey('lookupleague', leagueId);

  try {
    const response = await fetchWithCache(url, cacheKey, CACHE_TTL.LEAGUE_INFO);
    const leagues = response.leagues || [];
    return leagues.length > 0 ? leagues[0] : null;
  } catch (error) {
    console.error('Error getting league info:', error);
    return null;
  }
}

/**
 * Get recent events for a team
 */
export async function getRecentEvents(teamId: string, limit: number = 10): Promise<EventInfo[]> {
  const url = `${API_BASE}/${API_KEY}/eventslast.php?id=${teamId}`;
  const cacheKey = getCacheKey('eventslast', `${teamId}:${limit}`);

  try {
    const response = await fetchWithCache(url, cacheKey, CACHE_TTL.RECENT_FORM);
    const events = response.results || [];
    return events.slice(0, limit);
  } catch (error) {
    console.error('Error getting recent events:', error);
    return [];
  }
}

/**
 * Get next events for a team
 */
export async function getNextEvents(teamId: string, limit: number = 5): Promise<EventInfo[]> {
  const url = `${API_BASE}/${API_KEY}/eventsnext.php?id=${teamId}`;
  const cacheKey = getCacheKey('eventsnext', `${teamId}:${limit}`);

  try {
    const response = await fetchWithCache(url, cacheKey, CACHE_TTL.RECENT_FORM);
    const events = response.events || [];
    return events.slice(0, limit);
  } catch (error) {
    console.error('Error getting next events:', error);
    return [];
  }
}

/**
 * Get event results
 */
export async function getEventResults(eventId: string): Promise<any> {
  const url = `${API_BASE}/${API_KEY}/lookupevent.php?id=${eventId}`;
  const cacheKey = getCacheKey('lookupevent', eventId);

  try {
    const response = await fetchWithCache(url, cacheKey, CACHE_TTL.EVENT_INFO);
    return response.events?.[0] || null;
  } catch (error) {
    console.error('Error getting event results:', error);
    return null;
  }
}

/**
 * Get team roster (players)
 */
export async function getTeamRoster(teamId: string, season?: string): Promise<PlayerInfo[]> {
  const url = season
    ? `${API_BASE}/${API_KEY}/lookup_all_players.php?id=${teamId}&s=${season}`
    : `${API_BASE}/${API_KEY}/lookup_all_players.php?id=${teamId}`;
  const cacheKey = getCacheKey('lookup_all_players', `${teamId}:${season || 'current'}`);

  try {
    const response = await fetchWithCache(url, cacheKey, CACHE_TTL.ROSTER);
    return response.player || [];
  } catch (error) {
    console.error('Error getting team roster:', error);
    return [];
  }
}

/**
 * Calculate team recent form
 * Fetches 20 events to share cache with getHeadToHead, but only uses last 5 for form
 */
export async function getTeamRecentForm(teamId: string): Promise<RecentForm | null> {
  try {
    // Fetch 20 events to share cache key with getHeadToHead (which also uses 20)
    const allEvents = await getRecentEvents(teamId, 20);
    if (allEvents.length === 0) return null;

    // Only use last 5 for form calculation
    const recentEvents = allEvents.slice(0, 5);

    const teamInfo = await getTeamInfo(teamId);
    if (!teamInfo) return null;

    let wins = 0, draws = 0, losses = 0;
    let goalsFor = 0, goalsAgainst = 0;
    let cleanSheets = 0;
    const last5: string[] = [];

    recentEvents.forEach(event => {
      const isHome = event.idHomeTeam === teamId;
      const teamScoreRaw = isHome ? event.intHomeScore : event.intAwayScore;
      const opponentScoreRaw = isHome ? event.intAwayScore : event.intHomeScore;

      if (teamScoreRaw && opponentScoreRaw) {
        const teamScore = parseInt(teamScoreRaw, 10);
        const opponentScore = parseInt(opponentScoreRaw, 10);

        // Skip if parsing failed
        if (isNaN(teamScore) || isNaN(opponentScore)) return;

        goalsFor += teamScore;
        goalsAgainst += opponentScore;

        if (teamScore > opponentScore) {
          wins++;
          last5.push('W');
        } else if (teamScore === opponentScore) {
          draws++;
          last5.push('D');
        } else {
          losses++;
          last5.push('L');
        }

        if (opponentScore === 0) cleanSheets++;
      }
    });

    const totalGames = wins + draws + losses;
    const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;

    return {
      team: teamInfo.strTeam,
      last5,
      winRate,
      goalsFor,
      goalsAgainst,
      cleanSheets
    };
  } catch (error) {
    console.error('Error calculating team form:', error);
    return null;
  }
}

/**
 * Get head-to-head record between two teams
 * Results are cached for 24 hours since historical matchups don't change
 */
export async function getHeadToHead(team1Id: string, team2Id: string): Promise<any> {
  // Sort IDs to ensure consistent cache key regardless of argument order
  const sortedIds = [team1Id, team2Id].sort();
  const cacheKey = getCacheKey('h2h', `${sortedIds[0]}:${sortedIds[1]}`);

  // Check cache first
  const cached = getFromCache(cacheKey);
  if (cached) {
    console.log(`📦 Cache hit for H2H ${team1Id} vs ${team2Id}`);
    return cached;
  }

  try {
    // Use the same limit as getTeamRecentForm to maximize cache reuse
    const team1Events = await getRecentEvents(team1Id, 20);
    const team2Events = await getRecentEvents(team2Id, 20);

    // Find matches between the two teams
    const h2hMatches = team1Events.filter(event =>
      event.idHomeTeam === team2Id || event.idAwayTeam === team2Id
    );

    let team1Wins = 0, team2Wins = 0, draws = 0;

    h2hMatches.forEach(match => {
      const team1Score = match.idHomeTeam === team1Id ? match.intHomeScore : match.intAwayScore;
      const team2Score = match.idHomeTeam === team2Id ? match.intHomeScore : match.intAwayScore;

      if (team1Score && team2Score) {
        if (team1Score > team2Score) team1Wins++;
        else if (team2Score > team1Score) team2Wins++;
        else draws++;
      }
    });

    const result = {
      matches: h2hMatches.length,
      team1Wins,
      team2Wins,
      draws,
      recent: h2hMatches.slice(0, 5)
    };

    // Cache the computed H2H result
    setCache(cacheKey, result, CACHE_TTL.HEAD_TO_HEAD);
    return result;
  } catch (error) {
    console.error('Error getting head-to-head:', error);
    return null;
  }
}

/**
 * Clear cache (useful for testing or forced refresh)
 */
export function clearCache(): void {
  cache.clear();
  console.log('🗑️ TheSportsDB cache cleared');
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: cache.size,
    keys: Array.from(cache.keys())
  };
}

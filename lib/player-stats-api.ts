/**
 * Player Stats API
 *
 * Fetches player statistics using Sports Information API (RapidAPI)
 * Documentation: https://rapidapi.com/sports-information/api/sports-information
 */

import type { SupportedSportKey } from './types';

// ============================================================================
// TYPES
// ============================================================================

export interface PlayerStats {
  playerId: string;
  playerName: string;
  teamName: string;
  position?: string;
  jerseyNumber?: string;
  nationality?: string;
  age?: number;
  height?: string;
  weight?: string;
  stats?: {
    // Basketball
    points?: number;
    rebounds?: number;
    assists?: number;
    steals?: number;
    blocks?: number;
    fieldGoalPct?: number;
    threePointPct?: number;
    freeThrowPct?: number;

    // Football
    passingYards?: number;
    passingTDs?: number;
    rushingYards?: number;
    rushingTDs?: number;
    receptions?: number;
    receivingYards?: number;
    receivingTDs?: number;

    // Baseball
    battingAverage?: number;
    homeRuns?: number;
    rbi?: number;
    era?: number;
    strikeouts?: number;
    wins?: number;

    // Hockey
    goals?: number;
    assists_hockey?: number;
    plusMinus?: number;
    penaltyMinutes?: number;
    powerPlayGoals?: number;
    shotsOnGoal?: number;
    savePercentage?: number;
  };
  recentForm?: string[];
  injuryStatus?: {
    isInjured: boolean;
    description?: string;
    expectedReturn?: string;
  };
  imageUrl?: string;
}

export interface TeamRoster {
  teamId: string;
  teamName: string;
  players: PlayerStats[];
}

export interface GamePlayerAnalytics {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  homeRoster?: TeamRoster;
  awayRoster?: TeamRoster;
  keyPlayers?: {
    home: PlayerStats[];
    away: PlayerStats[];
  };
}

// ============================================================================
// SPORTS INFORMATION API (RapidAPI)
// ============================================================================

const RAPIDAPI_KEY = process.env.NEXT_PUBLIC_RAPIDAPI_SPORTSBOOK_KEY || '';
const SPORTS_INFO_HOST = 'sports-information.p.rapidapi.com';

// ============================================================================
// CACHING (to avoid hitting rate limits)
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;

  const age = Date.now() - entry.timestamp;
  if (age > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

  console.log(`✅ Cache HIT: ${key} (age: ${Math.round(age / 1000)}s)`);
  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

// ============================================================================
// RATE LIMITING (4 requests per minute limit)
// ============================================================================

let requestQueue: Array<() => Promise<any>> = [];
let isProcessing = false;
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 15000; // 15 seconds between requests (4 per minute = 1 every 15s)

async function queuedFetch(url: string, options: RequestInit): Promise<Response> {
  return new Promise((resolve, reject) => {
    const task = async () => {
      try {
        // Wait if we need to respect rate limit
        const now = Date.now();
        const timeSinceLastRequest = now - lastRequestTime;

        if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
          const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
          console.log(`⏳ Rate limit: waiting ${Math.round(waitTime / 1000)}s before next request`);
          await new Promise(r => setTimeout(r, waitTime));
        }

        lastRequestTime = Date.now();
        const response = await fetch(url, options);
        resolve(response);
      } catch (error) {
        reject(error);
      }
    };

    requestQueue.push(task);
    processQueue();
  });
}

async function processQueue() {
  if (isProcessing || requestQueue.length === 0) return;

  isProcessing = true;

  while (requestQueue.length > 0) {
    const task = requestQueue.shift();
    if (task) {
      await task();
    }
  }

  isProcessing = false;
}

/**
 * Map our sport keys to Sports Information API sport codes
 */
function getSportPath(sport: SupportedSportKey): string {
  switch (sport) {
    case 'basketball_nba':
      return 'nba';
    case 'americanfootball_nfl':
      return 'nfl';
    case 'baseball_mlb':
      return 'mlb';
    case 'icehockey_nhl':
      return 'nhl';
    default:
      return 'nba';
  }
}

/**
 * Fetch team roster from Sports Information API
 * Using correct endpoint paths per API documentation
 */
async function fetchSportsInfoTeamRoster(sport: SupportedSportKey, teamName: string): Promise<PlayerStats[]> {
  if (!RAPIDAPI_KEY) {
    console.warn('⚠️ RAPIDAPI_KEY not configured');
    return [];
  }

  // Check cache first
  const cacheKey = `roster:${sport}:${teamName}`;
  const cached = getCached<PlayerStats[]>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const sportPath = getSportPath(sport);
    const currentSeason = new Date().getFullYear();

    // Check if we have teams list cached
    const teamsCacheKey = `teams:${sport}`;
    let teamsData = getCached<any[]>(teamsCacheKey);

    if (!teamsData) {
      // Use correct endpoint: /team-list instead of /teams
      const teamsUrl = `https://${SPORTS_INFO_HOST}/${sportPath}/team-list`;
      console.log(`📡 Fetching teams from: ${teamsUrl}`);

      const teamsRes = await queuedFetch(teamsUrl, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': RAPIDAPI_KEY,
          'x-rapidapi-host': SPORTS_INFO_HOST
        }
      });

      if (!teamsRes.ok) {
        console.warn(`❌ Team list API failed: ${teamsRes.status} ${teamsRes.statusText}`);

        // If 403 Forbidden, the subscription doesn't include this endpoint
        if (teamsRes.status === 403) {
          console.warn(`⚠️ Sports Information API subscription doesn't include team/roster endpoints`);
          console.warn(`📝 Note: The API key is valid but the plan doesn't have access to these endpoints`);
          console.warn(`💡 Please upgrade API plan or use a different provider for player data.`);
        }

        // Return empty array - no roster data available
        return [];
      }

      const data = await teamsRes.json();
      // Extract teams array from response (might be nested)
      teamsData = data?.sports?.[0]?.leagues?.[0]?.teams || data?.teams || data || [];

      // Cache the teams list for 30 minutes
      setCache(teamsCacheKey, teamsData);
    }
    console.log(`📊 Found ${teamsData?.length || 0} teams`);

    // Find the matching team (case-insensitive, partial match)
    const team = teamsData?.find((t: any) => {
      const teamObj = t.team || t;
      const tName = teamObj.displayName || teamObj.name || teamObj.team || teamObj.teamName || '';
      const tAbbr = teamObj.abbreviation || teamObj.abbrev || '';

      return tName.toLowerCase().includes(teamName.toLowerCase()) ||
             teamName.toLowerCase().includes(tName.toLowerCase()) ||
             tAbbr.toLowerCase() === teamName.toLowerCase();
    });

    if (!team) {
      console.warn(`❌ Team not found: ${teamName}`);
      console.log('Available teams:', teamsData?.slice(0, 5).map((t: any) => {
        const teamObj = t.team || t;
        return teamObj.displayName || teamObj.name || teamObj.team;
      }));
      return [];
    }

    const teamObj = team.team || team;
    const teamId = teamObj.id || teamObj.teamId;
    console.log(`✅ Found team: ${teamObj.displayName || teamObj.name} (ID: ${teamId})`);

    // Use correct endpoint: /team-roster?teamId={id}&season={year}
    const rosterUrl = `https://${SPORTS_INFO_HOST}/${sportPath}/team-roster?teamId=${teamId}&season=${currentSeason}`;
    console.log(`📡 Fetching roster from: ${rosterUrl}`);

    const rosterRes = await queuedFetch(rosterUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': SPORTS_INFO_HOST
      }
    });

    if (!rosterRes.ok) {
      console.warn(`❌ Roster API failed: ${rosterRes.status} ${rosterRes.statusText}`);

      // Try alternative endpoint: /team-players/:id
      const playersUrl = `https://${SPORTS_INFO_HOST}/${sportPath}/team-players/${teamId}`;
      console.log(`📡 Trying alternative endpoint: ${playersUrl}`);

      const playersRes = await queuedFetch(playersUrl, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': RAPIDAPI_KEY,
          'x-rapidapi-host': SPORTS_INFO_HOST
        }
      });

      if (!playersRes.ok) {
        console.warn(`❌ Team players API also failed: ${playersRes.status}`);
        return [];
      }

      const playersData = await playersRes.json();
      const players = playersData?.athletes || playersData?.players || playersData || [];
      console.log(`✅ Found ${players.length} players via team-players endpoint`);

      const transformedPlayers = transformPlayersData(players, teamName);
      setCache(cacheKey, transformedPlayers);
      return transformedPlayers;
    }

    const rosterData = await rosterRes.json();
    const players = rosterData?.athletes || rosterData?.players || rosterData?.roster || rosterData || [];

    console.log(`✅ Found ${players.length} players for ${teamName}`);

    const transformedPlayers = transformPlayersData(players, teamName);

    // Cache the result
    setCache(cacheKey, transformedPlayers);

    return transformedPlayers;
  } catch (error) {
    console.error(`❌ Error fetching roster for ${teamName}:`, error);
    return [];
  }
}

/**
 * Transform raw player data from API to our PlayerStats format
 */
function transformPlayersData(players: any[], teamName: string): PlayerStats[] {
  return players.map((p: any) => {
    const athlete = p.athlete || p;

    return {
      playerId: athlete.id?.toString() || p.id?.toString() || `unknown-${athlete.displayName}`,
      playerName: athlete.displayName || athlete.name || athlete.fullName || `${athlete.firstName || ''} ${athlete.lastName || ''}`.trim() || 'Unknown',
      teamName,
      position: athlete.position?.abbreviation || athlete.position?.name || athlete.position || p.position,
      jerseyNumber: athlete.jersey?.toString() || p.jersey?.toString() || athlete.number?.toString(),
      age: athlete.age || p.age,
      height: athlete.displayHeight || athlete.height,
      weight: athlete.displayWeight || athlete.weight?.toString(),
      imageUrl: athlete.headshot?.href || athlete.headshot || p.headshot,
      stats: {
        // Basketball stats
        points: p.ppg || p.points || athlete.stats?.ppg,
        rebounds: p.rpg || p.rebounds || athlete.stats?.rpg,
        assists: p.apg || p.assists || athlete.stats?.apg,
        fieldGoalPct: p.fgPct || athlete.stats?.fgPct,
        threePointPct: p.fg3Pct || athlete.stats?.fg3Pct,

        // Football stats
        passingYards: p.passingYards || athlete.stats?.passingYards,
        passingTDs: p.passingTDs || athlete.stats?.passingTDs,
        rushingYards: p.rushingYards || athlete.stats?.rushingYards,
        rushingTDs: p.rushingTDs || athlete.stats?.rushingTDs,
        receptions: p.receptions || athlete.stats?.receptions,
        receivingYards: p.receivingYards || athlete.stats?.receivingYards,

        // Baseball stats
        battingAverage: p.avg || athlete.stats?.avg,
        homeRuns: p.hr || athlete.stats?.hr,
        rbi: p.rbi || athlete.stats?.rbi,
        era: p.era || athlete.stats?.era,

        // Hockey stats
        goals: p.goals || athlete.stats?.goals,
        assists_hockey: p.assists || athlete.stats?.assists,
        plusMinus: p.plusMinus || athlete.stats?.plusMinus
      }
    };
  });
}

/**
 * Fetch team roster with player stats
 */
export async function fetchTeamRoster(
  sport: SupportedSportKey,
  teamName: string
): Promise<TeamRoster | null> {
  console.log(`📊 Fetching roster for ${teamName} (${sport})`);

  const players = await fetchSportsInfoTeamRoster(sport, teamName);

  if (players.length === 0) {
    console.warn(`❌ No roster data found for ${teamName}`);
    return null;
  }

  return {
    teamId: teamName.toLowerCase().replace(/\s+/g, '-'),
    teamName,
    players
  };
}

/**
 * Fetch player analytics for a specific game
 */
export async function fetchGamePlayerAnalytics(
  sport: SupportedSportKey,
  homeTeam: string,
  awayTeam: string,
  gameId: string
): Promise<GamePlayerAnalytics> {
  console.log(`📊 Fetching player analytics for ${awayTeam} @ ${homeTeam}`);

  // Fetch both rosters in parallel
  const [homeRoster, awayRoster] = await Promise.all([
    fetchTeamRoster(sport, homeTeam),
    fetchTeamRoster(sport, awayTeam)
  ]);

  // Identify key players (top 5 by stats)
  const getKeyPlayers = (roster: TeamRoster | null): PlayerStats[] => {
    if (!roster) return [];

    // Sort by primary stat depending on sport
    const sorted = [...roster.players].sort((a, b) => {
      const aScore = a.stats?.points || a.stats?.passingYards || a.stats?.goals || 0;
      const bScore = b.stats?.points || b.stats?.passingYards || b.stats?.goals || 0;
      return bScore - aScore;
    });

    return sorted.slice(0, 5);
  };

  return {
    gameId,
    homeTeam,
    awayTeam,
    homeRoster: homeRoster || undefined,
    awayRoster: awayRoster || undefined,
    keyPlayers: {
      home: getKeyPlayers(homeRoster),
      away: getKeyPlayers(awayRoster)
    }
  };
}

/**
 * Search for a specific player using player-info endpoint
 */
export async function searchPlayer(playerName: string, playerId?: string): Promise<PlayerStats | null> {
  if (!RAPIDAPI_KEY) {
    console.warn('⚠️ RAPIDAPI_KEY not configured');
    return null;
  }

  // Check cache first
  const cacheKey = `player-search:${playerName.toLowerCase()}`;
  const cached = getCached<PlayerStats>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // If we have a player ID, use the player-info endpoint directly
    if (playerId) {
      const url = `https://${SPORTS_INFO_HOST}/nba/player-info?playerId=${playerId}`;
      console.log(`📡 Fetching player info: ${url}`);

      const response = await queuedFetch(url, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': RAPIDAPI_KEY,
          'x-rapidapi-host': SPORTS_INFO_HOST
        }
      });

      if (!response.ok) {
        console.warn(`❌ Player info API failed: ${response.status}`);
        return null;
      }

      const data = await response.json();
      const athlete = data?.athlete || data;

      if (!athlete) return null;

      const result: PlayerStats = {
        playerId: athlete.id?.toString() || playerId,
        playerName: athlete.displayName || athlete.name || 'Unknown',
        teamName: athlete.team?.displayName || athlete.team?.name || 'Unknown Team',
        position: athlete.position?.abbreviation || athlete.position?.name,
        jerseyNumber: athlete.jersey?.toString(),
        age: athlete.age,
        height: athlete.displayHeight || athlete.height,
        weight: athlete.displayWeight || athlete.weight?.toString(),
        imageUrl: athlete.headshot?.href || athlete.headshot
      };

      // Cache the result
      setCache(cacheKey, result);

      return result;
    }

    // Without a player ID, we can't search by name with this API
    // The API doesn't provide a search-by-name endpoint
    console.warn(`⚠️ Player search by name not supported without player ID`);
    return null;
  } catch (error) {
    console.error(`Error searching for player ${playerName}:`, error);
    return null;
  }
}

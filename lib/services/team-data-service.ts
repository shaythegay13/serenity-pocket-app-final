/**
 * Team Data Service
 * Fetches real team statistics from sports APIs with support for ties and sport-specific metrics
 */

import { sportsDataCache } from './sports-data-cache';

export interface TeamStats {
  id: string;
  name: string;
  abbreviation: string;
  logo: string;
  wins: number;
  losses: number;
  ties?: number; // NHL and NFL can have ties
  gamesPlayed: number;
  winningPercentage: number;
  trend: number[];
  // NFL specific
  pointsPerGame?: number;
  pointsAllowed?: number;
  totalYards?: number;
  turnovers?: number;
  // NBA specific
  offensiveRating?: number;
  defensiveRating?: number;
  pace?: number;
  // MLB specific
  runsScored?: number;
  runsAllowed?: number;
  teamOps?: number;
  era?: number;
  whip?: number;
  // NHL specific
  goalsFor?: number;
  goalsAgainst?: number;
  powerPlayPercentage?: number;
  penaltyKillPercentage?: number;
  corsiPercentage?: number;
  fenwickPercentage?: number;
}

export interface TeamRecord {
  wins: number;
  losses: number;
  ties?: number;
  gamesPlayed: number;
  winningPercentage: number;
  formatted: string; // e.g., "45-22-5" or "45-22"
}

/**
 * Fetch team statistics from appropriate sports API with caching
 */
export async function fetchTeamStats(sport: string, teamId: string): Promise<TeamStats> {
  // Check cache first
  const cached = sportsDataCache.getTeamData(teamId, sport);
  if (cached) {
    console.log(`[TeamDataService] Using cached data for ${sport}:${teamId}`);
    return cached.data;
  }

  try {
    let teamStats: TeamStats;
    
    switch (sport) {
      case 'americanfootball_nfl':
        teamStats = await fetchNFLTeamStats(teamId);
        break;
      case 'basketball_nba':
        teamStats = await fetchNBATeamStats(teamId);
        break;
      case 'baseball_mlb':
        teamStats = await fetchMLBTeamStats(teamId);
        break;
      case 'icehockey_nhl':
        teamStats = await fetchNHLTeamStats(teamId);
        break;
      default:
        throw new Error(`Unsupported sport: ${sport}`);
    }

    // Cache the successful result
    sportsDataCache.setTeamData(teamId, sport, teamStats, true);
    
    return teamStats;
  } catch (error) {
    console.error(`Error fetching ${sport} team stats:`, error);
    const emptyStats = getEmptyTeamStats(teamId, sport);
    
    // Cache the empty result with shorter TTL
    sportsDataCache.setTeamData(teamId, sport, emptyStats, false);
    
    return emptyStats;
  }
}

/**
 * Fetch NFL team statistics
 */
async function fetchNFLTeamStats(teamId: string): Promise<TeamStats> {
  try {
    // Use ESPN API for NFL team stats
    const endpoint = `https://site.web.api.espn.com/apis/site/v2/sports/football/nfl/teams/${teamId}`;
    const data = await fetchFromESPN(endpoint);
    
    const team = data.team;
    const stats = team.record?.items?.[0]?.stats || [];
    const seasonStats = team.season?.[0] || {};
    
    // Extract wins, losses, ties
    const wins = parseInt(stats.find((s: any) => s.name === 'wins')?.value || '0');
    const losses = parseInt(stats.find((s: any) => s.name === 'losses')?.value || '0');
    const ties = parseInt(stats.find((s: any) => s.name === 'ties')?.value || '0');
    const gamesPlayed = wins + losses + ties;
    
    return {
      id: team.id,
      name: team.displayName,
      abbreviation: team.abbreviation,
      logo: team.logos?.[0]?.href || '',
      wins,
      losses,
      ties,
      gamesPlayed,
      winningPercentage: gamesPlayed > 0 ? (wins + ties * 0.5) / gamesPlayed : 0,
      trend: generateMockTrend(wins, losses, ties),
      pointsPerGame: parseFloat(stats.find((s: any) => s.name === 'pointsPerGame')?.value || '0'),
      pointsAllowed: parseFloat(stats.find((s: any) => s.name === 'pointsAllowedPerGame')?.value || '0'),
      totalYards: parseFloat(stats.find((s: any) => s.name === 'totalYardsPerGame')?.value || '0'),
      turnovers: parseFloat(stats.find((s: any) => s.name === 'turnoverDifferential')?.value || '0')
    };
  } catch (error) {
    console.error('Error fetching NFL team stats:', error);
    return getEmptyTeamStats(teamId, 'americanfootball_nfl');
  }
}

/**
 * Fetch NBA team statistics
 */
async function fetchNBATeamStats(teamId: string): Promise<TeamStats> {
  try {
    // Use NBA Stats API
    const endpoint = `https://stats.nba.com/stats/leaguedashteamstats?LeagueID=00&Season=2024-25&TeamID=${teamId}`;
    const data = await fetchFromSecondaryAPI('nba', endpoint);
    
    const teamStats = data.resultSets?.[0]?.rowSet?.[0] || [];
    
    const wins = parseInt(teamStats[3] || '0');
    const losses = parseInt(teamStats[4] || '0');
    const gamesPlayed = wins + losses;
    
    return {
      id: teamId,
      name: teamStats[1] || 'Unknown Team',
      abbreviation: teamStats[2] || '',
      logo: '',
      wins,
      losses,
      gamesPlayed,
      winningPercentage: gamesPlayed > 0 ? wins / gamesPlayed : 0,
      trend: generateMockTrend(wins, losses),
      offensiveRating: parseFloat(teamStats[23] || '0'),
      defensiveRating: parseFloat(teamStats[24] || '0'),
      pace: parseFloat(teamStats[18] || '0')
    };
  } catch (error) {
    console.error('Error fetching NBA team stats:', error);
    return getEmptyTeamStats(teamId, 'basketball_nba');
  }
}

/**
 * Fetch MLB team statistics
 */
async function fetchMLBTeamStats(teamId: string): Promise<TeamStats> {
  try {
    // Use MLB Stats API
    const currentYear = new Date().getFullYear();
    const endpoint = `https://statsapi.web.mlb.com/api/v1/teams/${teamId}/stats?season=${currentYear}&stats=season`;
    const data = await fetchFromSecondaryAPI('mlb', endpoint);
    
    const stats = data.stats?.[0]?.stat || {};
    
    const wins = parseInt(stats.wins || '0');
    const losses = parseInt(stats.losses || '0');
    const gamesPlayed = wins + losses;
    
    return {
      id: teamId,
      name: data.name || 'Unknown Team',
      abbreviation: data.teamCode || '',
      logo: '',
      wins,
      losses,
      gamesPlayed,
      winningPercentage: gamesPlayed > 0 ? wins / gamesPlayed : 0,
      trend: generateMockTrend(wins, losses),
      runsScored: parseFloat(stats.runs || '0'),
      runsAllowed: parseFloat(stats.earnedRunsAllowed || '0'),
      teamOps: parseFloat(stats.ops || '0'),
      era: parseFloat(stats.era || '0'),
      whip: parseFloat(stats.whip || '0')
    };
  } catch (error) {
    console.error('Error fetching MLB team stats:', error);
    return getEmptyTeamStats(teamId, 'baseball_mlb');
  }
}

/**
 * Fetch NHL team statistics from statsapi.web.nhl.com
 */
async function fetchNHLTeamStats(teamId: string): Promise<TeamStats> {
  try {
    const currentYear = new Date().getFullYear();
    const endpoint = `https://statsapi.web.nhl.com/api/v1/teams/${teamId}/stats?season=${currentYear}`;
    const data = await fetchFromSecondaryAPI('nhl', endpoint);
    
    const stats = data.stats?.[0]?.splits?.[0]?.stat || {};
    
    const wins = parseInt(stats.wins || '0');
    const losses = parseInt(stats.losses || '0');
    const ties = parseInt(stats.ot || '0'); // NHL counts OT losses as ties for record purposes
    const gamesPlayed = wins + losses + ties;
    
    return {
      id: teamId,
      name: data.name || 'Unknown Team',
      abbreviation: data.teamCode || '',
      logo: '',
      wins,
      losses,
      ties,
      gamesPlayed,
      winningPercentage: gamesPlayed > 0 ? (wins + ties * 0.5) / gamesPlayed : 0,
      trend: generateMockTrend(wins, losses, ties),
      goalsFor: parseFloat(stats.goalsPerGame || '0'),
      goalsAgainst: parseFloat(stats.goalsAgainstPerGame || '0'),
      powerPlayPercentage: parseFloat(stats.powerPlayPercentage || '0') / 100,
      penaltyKillPercentage: parseFloat(stats.penaltyKillPercentage || '0') / 100,
      corsiPercentage: parseFloat(stats.corsiPercentage || '0') / 100,
      fenwickPercentage: parseFloat(stats.fenwickPercentage || '0') / 100
    };
  } catch (error) {
    console.error('Error fetching NHL team stats:', error);
    return getEmptyTeamStats(teamId, 'icehockey_nhl');
  }
}

/**
 * Format team record with proper tie support
 */
export function formatTeamRecord(wins: number, losses: number, ties?: number): TeamRecord {
  const gamesPlayed = wins + losses + (ties || 0);
  const winningPercentage = gamesPlayed > 0 ? (wins + (ties || 0) * 0.5) / gamesPlayed : 0;
  
  let formatted = `${wins}-${losses}`;
  if (ties && ties > 0) {
    formatted += `-${ties}`;
  }
  
  return {
    wins,
    losses,
    ties,
    gamesPlayed,
    winningPercentage,
    formatted
  };
}

/**
 * Get empty team stats structure
 */
function getEmptyTeamStats(teamId: string, sport: string): TeamStats {
  return {
    id: teamId,
    name: 'Unknown Team',
    abbreviation: 'UNK',
    logo: '',
    wins: 0,
    losses: 0,
    gamesPlayed: 0,
    winningPercentage: 0,
    trend: []
  };
}

/**
 * Generate mock trend data (placeholder until real historical data is available)
 */
function generateMockTrend(wins: number, losses: number, ties: number = 0): number[] {
  const totalGames = wins + losses + ties;
  const winRate = totalGames > 0 ? (wins + ties * 0.5) / totalGames : 0.5;
  
  // Generate last 10 games trend
  return Array.from({ length: 10 }, () => Math.random() > (1 - winRate) ? 1 : 0);
}

/**
 * Fetch from ESPN API
 */
async function fetchFromESPN(endpoint: string): Promise<any> {
  try {
    const baseUrl = process.env.NODE_ENV === 'production' ? 
      'https://your-domain.com' : 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/espn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ endpoint }),
    });

    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching from ESPN:', error);
    throw error;
  }
}

/**
 * Fetch from secondary APIs
 */
async function fetchFromSecondaryAPI(sport: string, endpoint: string): Promise<any> {
  try {
    const response = await fetch(endpoint, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Origin': process.env.NODE_ENV === 'production' ? 'https://your-domain.com' : 'http://localhost:3000'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Secondary API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.warn(`Secondary API unavailable for ${sport}:`, error);
    return {};
  }
}

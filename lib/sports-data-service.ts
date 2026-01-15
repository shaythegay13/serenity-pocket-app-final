// Sports Data Service - API integration for real-time sports statistics

import { API_CONFIGS } from '@/config/sportsApis';

export interface TeamStats {
  // Football (NFL)
  pointsPerGame?: number;
  pointsAllowed?: number;
  totalYards?: number;
  turnovers?: number;
  passingYards?: number;
  rushingYards?: number;
  
  // Basketball (NBA)
  offensiveRating?: number;
  nbaDefensiveRating?: number;
  pace?: number;
  atsRecord?: string;
  marginOfVictory?: number;
  nbaFieldGoalPct?: number;
  
  // Baseball (MLB)
  runsScored?: number;
  runsAllowed?: number;
  teamOps?: number;
  era?: number;
  whip?: number;
  battingAvg?: number;
  
  // Hockey (NHL)
  goalsFor?: number;
  goalsAgainst?: number;
  powerPlayPercentage?: number;
  penaltyKillPercentage?: number;
  corsiPercentage?: number;
  fenwickPercentage?: number;
  shotsPerGame?: number;
}

export interface PlayerStats {
  // Football (NFL)
  passingYards?: number;
  passingTDs?: number;
  passerRating?: number;
  rushingYards?: number;
  rushingTDs?: number;
  receptions?: number;
  receivingYards?: number;
  receivingTDs?: number;
  tackles?: number;
  sacks?: number;
  interceptions?: number;
  fieldGoalsMade?: number;
  fieldGoalPct?: number;
  
  // Basketball (NBA)
  pointsPerGame?: number;
  reboundsPerGame?: number;
  assistsPerGame?: number;
  stealsPerGame?: number;
  blocksPerGame?: number;
  nbaFieldGoalPct?: number;
  threePointPct?: number;
  freeThrowPct?: number;
  minutesPerGame?: number;
  
  // Baseball (MLB)
  avg?: number;
  homeRuns?: number;
  rbis?: number;
  obp?: number;
  slg?: number;
  era?: number;
  strikeouts?: number;
  whip?: number;
  saves?: number;
  
  // Hockey (NHL)
  goals?: number;
  assists?: number;
  points?: number;
  plusMinus?: number;
  shots?: number;
  savePct?: number;
  gaa?: number;
  wins?: number;
  shutouts?: number;
}

export interface Team {
  id: string;
  name: string;
  abbreviation: string;
  record?: string;
  recentForm?: string[];
  stats?: TeamStats;
}

export interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  number: string;
  stats?: PlayerStats;
}

export interface SportDataResponse {
  teams: Team[];
  players: Player[];
  lastUpdated: Date;
}

/**
 * Fetch data from ESPN API via proxy
 */
async function fetchFromESPN(endpoint: string): Promise<any> {
  console.log('[Sports Data Service] Fetching from ESPN:', endpoint);
  
  try {
    // Use absolute URL for server-side fetching
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

    const data = await response.json();
    console.log('[Sports Data Service] ESPN API success for:', endpoint);
    return data;
  } catch (error) {
    console.error('[Sports Data Service] Error fetching from ESPN:', error);
    throw error;
  }
}

/**
 * Fetch data from secondary APIs for detailed statistics
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
    // Return empty object instead of throwing - let the system handle missing data gracefully
    return {};
  }
}

/**
 * Fetch NBA player statistics from stats.nba.com
 */
async function fetchNBAPlayerStats(playerId: string): Promise<any> {
  try {
    const endpoint = `https://stats.nba.com/stats/playergeneralstats?PlayerID=${playerId}`;
    const data = await fetchFromSecondaryAPI('nba', endpoint);
    
    // Process NBA player stats
    const stats = data.rowSet?.[0] || {};
    return {
      pointsPerGame: parseFloat(stats.PTS) || 0,
      reboundsPerGame: parseFloat(stats.REB) || 0,
      assistsPerGame: parseFloat(stats.AST) || 0,
      stealsPerGame: parseFloat(stats.STL) || 0,
      blocksPerGame: parseFloat(stats.BLK) || 0,
      nbaFieldGoalPct: parseFloat(stats.FG_PCT) || 0,
      threePointPct: parseFloat(stats.FG3_PCT) || 0,
      freeThrowPct: parseFloat(stats.FT_PCT) || 0,
      minutesPerGame: parseFloat(stats.MIN) || 0,
      gamesPlayed: parseInt(stats.GP) || 0
    };
  } catch (error) {
    console.error('Error fetching NBA player stats:', error);
    return {};
  }
}

/**
 * Fetch MLB player statistics from statsapi.web.mlb.com
 */
async function fetchMLBPlayerStats(playerId: string): Promise<any> {
  try {
    const currentYear = new Date().getFullYear();
    const endpoint = `https://statsapi.web.mlb.com/api/v1/people/${playerId}/stats?season=${currentYear}&stats=stats,gameByGame`;
    const data = await fetchFromSecondaryAPI('mlb', endpoint);
    
    // Process MLB player stats
    const stats = data.stats?.[0] || {};
    return {
      avg: parseFloat(stats.avg) || 0,
      homeRuns: parseInt(stats.homeRuns) || 0,
      rbis: parseInt(stats.rbi) || 0,
      runs: parseInt(stats.runs) || 0,
      hits: parseInt(stats.hits) || 0,
      doubles: parseInt(stats.doubles) || 0,
      triples: parseInt(stats.triples) || 0,
      stolenBases: parseInt(stats.stolenBases) || 0,
      strikeOuts: parseInt(stats.strikeOuts) || 0,
      walks: parseInt(stats.baseOnBalls) || 0,
      obp: parseFloat(stats.obp) || 0,
      slg: parseFloat(stats.slg) || 0,
      ops: parseFloat(stats.ops) || 0,
      era: parseFloat(stats.era) || 0,
      whip: parseFloat(stats.whip) || 0,
      wins: parseInt(stats.wins) || 0,
      losses: parseInt(stats.losses) || 0,
      saves: parseInt(stats.saves) || 0,
      gamesPlayed: parseInt(stats.gamesPlayed) || 0
    };
  } catch (error) {
    console.error('Error fetching MLB player stats:', error);
    return {};
  }
}

/**
 * Fetch NHL player statistics from statsapi.web.nhl.com
 */
async function fetchNHLPlayerStats(playerId: string): Promise<any> {
  try {
    const currentYear = new Date().getFullYear();
    const endpoint = `https://statsapi.web.nhl.com/api/v1/people/${playerId}/stats?season=${currentYear}`;
    const data = await fetchFromSecondaryAPI('nhl', endpoint);
    
    // Process NHL player stats
    const stats = data.stats?.[0]?.stat || {};
    return {
      goals: parseInt(stats.goals) || 0,
      assists: parseInt(stats.assists) || 0,
      points: parseInt(stats.points) || 0,
      plusMinus: parseInt(stats.plusMinus) || 0,
      shots: parseInt(stats.shots) || 0,
      shotsOnGoal: parseInt(stats.shotsOnGoal) || 0,
      powerPlayGoals: parseInt(stats.powerPlayGoals) || 0,
      powerPlayPoints: parseInt(stats.powerPlayPoints) || 0,
      shortHandedGoals: parseInt(stats.shortHandedGoals) || 0,
      shortHandedPoints: parseInt(stats.shortHandedPoints) || 0,
      blockedShots: parseInt(stats.blocked) || 0,
      hits: parseInt(stats.hits) || 0,
      penaltyMinutes: parseInt(stats.penaltyMinutes) || 0,
      faceOffWins: parseInt(stats.faceOffWins) || 0,
      faceOffLosses: parseInt(stats.faceOffLosses) || 0,
      takeaways: parseInt(stats.takeaways) || 0,
      giveaways: parseInt(stats.giveaways) || 0,
      timeOnIce: parseInt(stats.timeOnIce) || 0,
      gamesPlayed: parseInt(stats.games) || 0,
      // Goalie stats
      wins: parseInt(stats.wins) || 0,
      losses: parseInt(stats.losses) || 0,
      saves: parseInt(stats.saves) || 0,
      goalsAgainst: parseInt(stats.goalsAgainst) || 0,
      savePct: parseFloat(stats.savePercentage) || 0,
      goalsAgainstAverage: parseFloat(stats.goalAgainstAverage) || 0,
      shutouts: parseInt(stats.shutouts) || 0
    };
  } catch (error) {
    console.error('Error fetching NHL player stats:', error);
    return {};
  }
}

/**
 * Fetch NFL team and player data
 */
export async function fetchNFLData(): Promise<SportDataResponse> {
  try {
    // Fetch NFL teams from the teams endpoint
    const teamsEndpoint = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams';
    const teamsData = await fetchFromESPN(teamsEndpoint);

    // Process team data - teams are nested under sports[0].leagues[0].teams[].team
    const teams: Team[] = [];
    if (teamsData.sports && teamsData.sports[0] && teamsData.sports[0].leagues && teamsData.sports[0].leagues[0]) {
      const league = teamsData.sports[0].leagues[0];
      teamsData.sports[0].leagues[0].teams.forEach((teamData: any) => {
        if (teamData.team) {
          const team = teamData.team;
          teams.push({
            id: team.id,
            name: team.displayName,
            abbreviation: team.abbreviation,
            record: '0-0', // Would need separate call for standings
            stats: {
              pointsPerGame: 0,
              pointsAllowed: 0,
              totalYards: 0,
              turnovers: 0,
            }
          });
        }
      });
    }

    // Fetch player data (this would need to be done per team)
    const players: Player[] = [];

    return {
      teams,
      players,
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error('Error fetching NFL data:', error);
    return { teams: [], players: [], lastUpdated: new Date() };
  }
}

/**
 * Fetch NBA team and player data
 */
export async function fetchNBAData(): Promise<SportDataResponse> {
  try {
    // Fetch NBA teams from the teams endpoint
    const teamsEndpoint = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams';
    const teamsData = await fetchFromESPN(teamsEndpoint);

    // Process team data - teams are nested under sports[0].leagues[0].teams[].team
    const teams: Team[] = [];
    if (teamsData.sports && teamsData.sports[0] && teamsData.sports[0].leagues && teamsData.sports[0].leagues[0]) {
      const league = teamsData.sports[0].leagues[0];
      teamsData.sports[0].leagues[0].teams.forEach((teamData: any) => {
        if (teamData.team) {
          const team = teamData.team;
          teams.push({
            id: team.id,
            name: team.displayName,
            abbreviation: team.abbreviation,
            record: '0-0', // Would need separate call for standings
            stats: {
              offensiveRating: 0,
              nbaDefensiveRating: 0,
              pace: 0,
              pointsPerGame: 0,
              pointsAllowed: 0,
            }
          });
        }
      });
    }

    const players: Player[] = [];

    return {
      teams,
      players,
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error('Error fetching NBA data:', error);
    return { teams: [], players: [], lastUpdated: new Date() };
  }
}

/**
 * Fetch MLB team and player data
 */
export async function fetchMLBData(): Promise<SportDataResponse> {
  try {
    // Fetch MLB teams from the teams endpoint
    const teamsEndpoint = 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams';
    const teamsData = await fetchFromESPN(teamsEndpoint);

    // Process team data - teams are nested under sports[0].leagues[0].teams[].team
    const teams: Team[] = [];
    if (teamsData.sports && teamsData.sports[0] && teamsData.sports[0].leagues && teamsData.sports[0].leagues[0]) {
      const league = teamsData.sports[0].leagues[0];
      teamsData.sports[0].leagues[0].teams.forEach((teamData: any) => {
        if (teamData.team) {
          const team = teamData.team;
          teams.push({
            id: team.id,
            name: team.displayName,
            abbreviation: team.abbreviation,
            record: '0-0', // Would need separate call for standings
            stats: {
              runsScored: 0,
              runsAllowed: 0,
              teamOps: 0,
              era: 0,
              whip: 0,
              battingAvg: 0,
            }
          });
        }
      });
    }

    const players: Player[] = [];

    return {
      teams,
      players,
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error('Error fetching MLB data:', error);
    return { teams: [], players: [], lastUpdated: new Date() };
  }
}

/**
 * Fetch NHL team and player data
 */
export async function fetchNHLData(): Promise<SportDataResponse> {
  try {
    // Fetch NHL teams from the teams endpoint
    const teamsEndpoint = 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/teams';
    const teamsData = await fetchFromESPN(teamsEndpoint);

    // Process team data - teams are nested under sports[0].leagues[0].teams[].team
    const teams: Team[] = [];
    if (teamsData.sports && teamsData.sports[0] && teamsData.sports[0].leagues && teamsData.sports[0].leagues[0]) {
      const league = teamsData.sports[0].leagues[0];
      teamsData.sports[0].leagues[0].teams.forEach((teamData: any) => {
        if (teamData.team) {
          const team = teamData.team;
          teams.push({
            id: team.id,
            name: team.displayName,
            abbreviation: team.abbreviation,
            record: '0-0', // Would need separate call for standings
            stats: {
              goalsFor: 0,
              goalsAgainst: 0,
              powerPlayPercentage: 0,
              penaltyKillPercentage: 0,
              corsiPercentage: 0,
            }
          });
        }
      });
    }

    const players: Player[] = [];

    return {
      teams,
      players,
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error('Error fetching NHL data:', error);
    return { teams: [], players: [], lastUpdated: new Date() };
  }
}

/**
 * Fetch team roster from ESPN API
 */
export async function fetchTeamRoster(sport: string, teamId: string): Promise<Player[]> {
  try {
    const sportEndpoints = {
      'americanfootball_nfl': `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${teamId}/roster`,
      'basketball_nba': `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${teamId}/roster`,
      'baseball_mlb': `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams/${teamId}/roster`,
      'icehockey_nhl': `https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/teams/${teamId}/roster`,
    };

    const endpoint = sportEndpoints[sport as keyof typeof sportEndpoints];
    if (!endpoint) {
      throw new Error(`Unsupported sport: ${sport}`);
    }

    const rosterData = await fetchFromESPN(endpoint);
    
    const players: Player[] = rosterData.athletes?.map((athlete: any) => ({
      id: athlete.id,
      name: athlete.displayName,
      position: athlete.position?.abbreviation || athlete.position?.name || '',
      team: athlete.team?.displayName || '',
      number: athlete.jersey || '0',
      stats: {} // Would need separate call for player stats
    })) || [];

    return players;
  } catch (error) {
    console.error('Error fetching team roster:', error);
    return [];
  }
}

/**
 * Fetch player statistics from appropriate API
 */
export async function fetchPlayerStats(sport: string, playerId: string): Promise<any> {
  try {
    switch (sport) {
      case 'americanfootball_nfl':
        // NFL only uses ESPN (no free official API)
        // Could implement basic ESPN stats here if available
        return {}
        
      case 'basketball_nba':
        return await fetchNBAPlayerStats(playerId)
        
      case 'baseball_mlb':
        return await fetchMLBPlayerStats(playerId)
        
      case 'icehockey_nhl':
        return await fetchNHLPlayerStats(playerId)
        
      default:
        return {}
    }
  } catch (error) {
    console.error(`Error fetching ${sport} player stats:`, error);
    return {}
  }
}

/**
 * Main sport data fetcher
 */
export async function fetchSportData(sport: string): Promise<SportDataResponse> {
  switch (sport) {
    case 'americanfootball_nfl':
    case 'nfl':
      return await fetchNFLData();
    case 'basketball_nba':
    case 'nba':
      return await fetchNBAData();
    case 'baseball_mlb':
    case 'mlb':
      return await fetchMLBData();
    case 'icehockey_nhl':
    case 'nhl':
      return await fetchNHLData();
    default:
      console.warn(`Unsupported sport: ${sport}`);
      return { teams: [], players: [], lastUpdated: new Date() };
  }
}

import { normalizePosition } from "./position-mappings";
import { sportsDataCache } from "./services/sports-data-cache";

type SportKey = 'americanfootball_nfl' | 'basketball_nba' | 'baseball_mlb' | 'icehockey_nhl';

// Sample statistics for testing - this proves the modal works
const getSampleStats = (sport: SportKey, position: string) => {
  switch (sport) {
    case 'americanfootball_nfl':
      if (position === 'QB') {
        return {
          passingYards: 3456,
          passingTDs: 28,
          passerRating: 98.5,
          completions: 312,
          attempts: 456
        };
      } else if (['RB', 'FB'].includes(position)) {
        return {
          rushingYards: 1234,
          rushingTDs: 12,
          receptions: 45,
          receivingYards: 345
        };
      } else if (['WR', 'TE'].includes(position)) {
        return {
          receptions: 89,
          receivingYards: 1234,
          receivingTDs: 8,
          targets: 134
        };
      } else {
        return {
          tackles: 67,
          sacks: 8,
          interceptions: 2,
          forcedFumbles: 1
        };
      }
      
    case 'basketball_nba':
      if (position === 'PG') {
        return {
          pointsPerGame: 18.5,
          assistsPerGame: 8.2,
          reboundsPerGame: 4.1,
          stealsPerGame: 1.8
        };
      } else if (position === 'SG') {
        return {
          pointsPerGame: 22.3,
          reboundsPerGame: 3.8,
          assistsPerGame: 2.9,
          stealsPerGame: 1.2
        };
      } else if (position === 'SF') {
        return {
          pointsPerGame: 19.8,
          reboundsPerGame: 6.5,
          assistsPerGame: 3.2,
          stealsPerGame: 1.5
        };
      } else if (position === 'PF') {
        return {
          pointsPerGame: 16.2,
          reboundsPerGame: 9.8,
          assistsPerGame: 2.1,
          blocksPerGame: 1.2
        };
      } else {
        return {
          pointsPerGame: 12.4,
          reboundsPerGame: 11.2,
          assistsPerGame: 1.8,
          blocksPerGame: 2.3
        };
      }
      
    case 'baseball_mlb':
      if (position === 'P') {
        return {
          wins: 12,
          losses: 5,
          era: 3.45,
          strikeouts: 156,
          whip: 1.23
        };
      } else {
        return {
          avg: 0.287,
          homeRuns: 24,
          rbis: 89,
          runs: 78,
          obp: 0.356,
          slg: 0.512
        };
      }
      
    case 'icehockey_nhl':
      if (position === 'G') {
        return {
          wins: 28,
          losses: 12,
          savePct: 0.915,
          goalsAgainstAverage: 2.45,
          shutouts: 4
        };
      } else {
        return {
          goals: 28,
          assists: 42,
          points: 70,
          plusMinus: 15,
          shots: 234
        };
      }
      
    default:
      return {};
  }
};

export async function fetchTeamRosterFromESPN(sport: SportKey, teamName: string) {
  try {
    // Get the correct endpoint for the sport
    const sportEndpoints: Record<SportKey, string> = {
      'americanfootball_nfl': 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams',
      'basketball_nba': 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams',
      'baseball_mlb': 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams',
      'icehockey_nhl': 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/teams'
    };

    const endpoint = sportEndpoints[sport];
    if (!endpoint) {
      throw new Error(`Unsupported sport: ${sport}`);
    }

    // Fetch all teams for the sport
    const response = await fetch('http://localhost:3000/api/espn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint })
    });

    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Find the specific team
    if (data.sports && data.sports[0] && data.sports[0].leagues && data.sports[0].leagues[0]) {
      const league = data.sports[0].leagues[0];
      const teamData = league.teams.find((t: any) => 
        t.team && (t.team.displayName === teamName || t.team.name === teamName)
      );
      
      if (teamData && teamData.team) {
        return {
          id: teamData.team.id,
          name: teamData.team.displayName,
          abbreviation: teamData.team.abbreviation,
          team: teamData.team
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching team from ESPN:', error);
    return null;
  }
}

export async function fetchPlayerRosterFromESPN(sport: SportKey, teamId: string, teamName: string) {
  try {
    // Check cache first
    const cacheKey = `${teamId}:${teamName}`;
    const cached = sportsDataCache.getPlayerData(cacheKey, sport);
    if (cached) {
      console.log(`[ESPN Integration] Using cached roster for ${sport}:${cacheKey}`);
      return cached.data;
    }

    // Get the correct roster endpoint for the sport
    const rosterEndpoints: Record<SportKey, string> = {
      'americanfootball_nfl': `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${teamId}/roster`,
      'basketball_nba': `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${teamId}/roster`,
      'baseball_mlb': `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams/${teamId}/roster`,
      'icehockey_nhl': `https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/teams/${teamId}/roster`
    };

    const endpoint = rosterEndpoints[sport];
    if (!endpoint) {
      throw new Error(`Unsupported sport: ${sport}`);
    }

    const response = await fetch('http://localhost:3000/api/espn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint })
    });

    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Process athletes - handle both nested and direct structures with NO stats
    const players: any[] = [];
    
    data.athletes?.forEach((athleteGroup: any) => {
      // Check if athletes are nested under items (NFL/MLB/NHL structure)
      if (athleteGroup.items && Array.isArray(athleteGroup.items)) {
        athleteGroup.items.forEach((athlete: any) => {
          const position = athlete.position?.abbreviation || athlete.position?.displayName || 'Unknown';
          const playerData = {
            id: athlete.id,
            name: athlete.displayName || athlete.fullName || 'Unknown Player',
            position: position,
            team: teamName || 'Unknown Team',
            number: athlete.jersey?.toString() || '0',
            stats: null // No stats - requires real sports data APIs
          };
          
          players.push(playerData);
          
          // Cache individual player data
          sportsDataCache.setPlayerData(athlete.id, sport, playerData, true);
        });
      } else {
        // Direct athlete structure (NBA)
        const position = athleteGroup.position?.abbreviation || athleteGroup.position?.displayName || 'Unknown';
        const playerData = {
          id: athleteGroup.id,
          name: athleteGroup.displayName || athleteGroup.fullName || 'Unknown Player',
          position: position,
          team: teamName || 'Unknown Team',
          number: athleteGroup.jersey?.toString() || '0',
          stats: null // No stats - requires real sports data APIs
        };
        
        players.push(playerData);
        
        // Cache individual player data
        sportsDataCache.setPlayerData(athleteGroup.id, sport, playerData, true);
      }
    });

    // Cache the complete roster
    const rosterData = {
      teamId,
      teamName,
      players,
      fetchedAt: new Date()
    };
    
    sportsDataCache.setPlayerData(cacheKey, sport, rosterData, true);
    console.log(`[ESPN Integration] Cached roster for ${sport}:${cacheKey} with ${players.length} players`);

    return players;
  } catch (error) {
    console.error('Error fetching player roster from ESPN:', error);
    
    // Cache empty result to avoid repeated failed requests
    const emptyRoster = {
      teamId,
      teamName,
      players: [],
      error: error instanceof Error ? error.message : 'Unknown error',
      fetchedAt: new Date()
    };
    
    sportsDataCache.setPlayerData(`${teamId}:${teamName}`, sport, emptyRoster, false);
    
    return [];
  }
}

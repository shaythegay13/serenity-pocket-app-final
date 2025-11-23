/**
 * Sports Data API Integration
 * Fetches team rosters, player stats, and player images
 * - TheSportsDB: Player rosters, images, biographical data
 * - ESPN API: Real-time stats that update after each game
 */

import { fetchPlayerStatsByTeam } from './espn-api'

export interface Player {
  id: string
  name: string
  position?: string
  number?: string
  imageUrl?: string
  team: string
}

export interface PlayerStats {
  // General stats
  gamesPlayed?: number
  gamesStarted?: number

  // Basketball stats
  pointsPerGame?: number
  assistsPerGame?: number
  reboundsPerGame?: number
  stealsPerGame?: number
  blocksPerGame?: number
  fieldGoalPercentage?: number
  threePointPercentage?: number
  freeThrowPercentage?: number
  minutesPerGame?: number

  // Football stats
  passingYards?: number
  passingTouchdowns?: number
  rushingYards?: number
  rushingTouchdowns?: number
  receivingYards?: number
  receivingTouchdowns?: number
  receptions?: number

  // Baseball batting stats
  battingAverage?: number
  homeRuns?: number
  rbi?: number
  hits?: number
  atBats?: number
  stolenBases?: number
  onBasePercentage?: number
  sluggingPercentage?: number
  runs?: number

  // Baseball pitching stats
  era?: number
  wins?: number
  losses?: number
  strikeouts?: number
  walks?: number
  whip?: number
  inningsPitched?: number
  saves?: number

  // Hockey skater stats
  goals?: number
  assists?: number
  points?: number
  plusMinus?: number
  penaltyMinutes?: number
  shots?: number
  gameWinningGoals?: number
  powerPlayGoals?: number
  shortHandedGoals?: number

  // Hockey goalie stats
  goalsAgainstAverage?: number
  savePercentage?: number
  shutouts?: number
  goalsAgainst?: number

  // Betting-related stats
  overUnderRecord?: string
  averageLineMovement?: string
  performanceAgainstSpread?: string
  recentForm?: string

  // Meta information
  isMockData?: boolean  // True if stats are generated mock data
}

export interface PlayerDetail extends Player {
  stats?: PlayerStats
  bio?: string
  height?: string
  weight?: string
  dateOfBirth?: string
  nationality?: string
}

interface TheSportsDBPlayer {
  idPlayer: string
  strPlayer: string
  strPosition?: string
  strNumber?: string
  strCutout?: string
  strThumb?: string
  strHeight?: string
  strWeight?: string
  dateBorn?: string
  strNationality?: string
  strDescriptionEN?: string
  strTeam?: string
}

interface TheSportsDBResponse {
  player?: TheSportsDBPlayer[]
  players?: TheSportsDBPlayer[]
}

/**
 * Fetch team roster from TheSportsDB
 */
export async function fetchTeamRoster(teamName: string, sport: string): Promise<Player[]> {
  try {
    // TheSportsDB free API - search for team first to get team ID
    const teamSearchUrl = `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(teamName)}`
    const teamResponse = await fetch(teamSearchUrl)
    const teamData = await teamResponse.json()

    if (!teamData.teams || teamData.teams.length === 0) {
      console.warn(`Team not found: ${teamName}`)
      return getMockRosterForTeam(teamName, sport)
    }

    const teamId = teamData.teams[0].idTeam

    // Fetch players for the team
    const playersUrl = `https://www.thesportsdb.com/api/v1/json/3/lookup_all_players.php?id=${teamId}`
    const playersResponse = await fetch(playersUrl)
    const playersData: TheSportsDBResponse = await playersResponse.json()

    if (!playersData.player || playersData.player.length === 0) {
      console.warn(`No players found for team: ${teamName}`)
      return getMockRosterForTeam(teamName, sport)
    }

    // Transform to our Player interface
    return playersData.player.slice(0, 15).map(p => ({
      id: p.idPlayer,
      name: p.strPlayer,
      position: p.strPosition,
      number: p.strNumber,
      imageUrl: p.strCutout || p.strThumb,
      team: teamName
    }))
  } catch (error) {
    console.error('Error fetching roster:', error)
    return getMockRosterForTeam(teamName, sport)
  }
}

/**
 * Fetch detailed player information
 * Uses TheSportsDB for bio/image and ESPN for real-time stats
 */
export async function fetchPlayerDetails(playerId: string, playerName: string, teamName?: string, sport?: string): Promise<PlayerDetail | null> {
  try {
    // Search by player name in TheSportsDB for bio and image
    const searchUrl = `https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(playerName)}`
    const response = await fetch(searchUrl)
    const data: TheSportsDBResponse = await response.json()

    if (!data.player || data.player.length === 0) {
      return null
    }

    const player = data.player[0]

    // Try to get real-time stats from ESPN if team and sport are provided
    let stats: PlayerStats | null = null
    if (teamName && sport) {
      console.log(`[Player Details] Attempting to fetch ESPN stats for ${playerName} (${teamName}, ${sport})`)
      stats = await fetchPlayerStatsByTeam(teamName, playerName, sport)
    } else {
      console.warn(`[Player Details] No team/sport provided for ${playerName}, will use mock data`)
    }

    // Fallback to mock stats if ESPN fails or no team/sport provided
    if (!stats) {
      console.warn(`[Player Details] ⚠️ Using MOCK DATA for ${playerName} - ESPN API failed or returned no data`)
      stats = generateMockStats(player.strPosition || '')
    } else {
      console.log(`[Player Details] ✓ Using real ESPN data for ${playerName}`)
    }

    return {
      id: player.idPlayer,
      name: player.strPlayer,
      position: player.strPosition,
      number: player.strNumber,
      imageUrl: player.strCutout || player.strThumb,
      team: player.strTeam || teamName || '',
      height: player.strHeight,
      weight: player.strWeight,
      dateOfBirth: player.dateBorn,
      nationality: player.strNationality,
      bio: player.strDescriptionEN,
      stats: stats
    }
  } catch (error) {
    console.error('Error fetching player details:', error)
    return null
  }
}

/**
 * Generate realistic mock stats based on position
 * Used as fallback when ESPN API fails
 */
function generateMockStats(position: string): PlayerStats {
  const isBasketball = ['Guard', 'Forward', 'Center', 'Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward'].includes(position)

  if (isBasketball) {
    return {
      gamesPlayed: Math.floor(Math.random() * 30) + 50,
      gamesStarted: Math.floor(Math.random() * 20) + 40,
      pointsPerGame: Math.random() * 20 + 10,
      assistsPerGame: Math.random() * 5 + 2,
      reboundsPerGame: Math.random() * 8 + 3,
      stealsPerGame: Math.random() * 2 + 0.5,
      blocksPerGame: Math.random() * 1.5 + 0.3,
      fieldGoalPercentage: Math.random() * 20 + 40,
      threePointPercentage: Math.random() * 15 + 30,
      freeThrowPercentage: Math.random() * 15 + 70,
      minutesPerGame: Math.random() * 10 + 25,
      overUnderRecord: '12-8 O/U (M)',
      performanceAgainstSpread: '55% Cover Rate (M)',
      recentForm: 'Hot (3 games over projection) (M)',
      isMockData: true
    }
  }

  // Football stats
  return {
    gamesPlayed: Math.floor(Math.random() * 5) + 12,
    gamesStarted: Math.floor(Math.random() * 4) + 10,
    passingYards: Math.random() * 2000 + 2500,
    passingTouchdowns: Math.floor(Math.random() * 15) + 15,
    rushingYards: Math.random() * 500 + 300,
    rushingTouchdowns: Math.floor(Math.random() * 5) + 3,
    receivingYards: Math.random() * 800 + 400,
    receivingTouchdowns: Math.floor(Math.random() * 8) + 4,
    receptions: Math.floor(Math.random() * 40) + 50,
    overUnderRecord: '9-7 O/U (M)',
    performanceAgainstSpread: '58% Cover Rate (M)',
    recentForm: 'Consistent (Within 10% of projection) (M)',
    isMockData: true
  }
}

/**
 * Mock roster generator when API fails or for unsupported sports
 */
function getMockRosterForTeam(teamName: string, sport: string): Player[] {
  const hash = teamName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const positions = sport === 'NBA'
    ? ['PG', 'SG', 'SF', 'PF', 'C']
    : ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'CB', 'S']

  const firstNames = ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles', 'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Donald']
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas']

  const roster: Player[] = []
  for (let i = 0; i < 12; i++) {
    const first = firstNames[(hash + i * 3) % firstNames.length]
    const last = lastNames[(hash + i * 7) % lastNames.length]
    roster.push({
      id: `mock-${teamName}-${i}`,
      name: `${first} ${last}`,
      position: positions[i % positions.length],
      number: String((i + 1) * 3),
      team: teamName
    })
  }
  return roster
}

/**
 * Fetch NBA player stats from balldontlie API (free)
 */
export async function fetchNBAPlayerStats(playerName: string): Promise<PlayerStats | null> {
  try {
    // Search for player
    const searchUrl = `https://www.balldontlie.io/api/v1/players?search=${encodeURIComponent(playerName)}`
    const searchResponse = await fetch(searchUrl)
    const searchData = await searchResponse.json()

    if (!searchData.data || searchData.data.length === 0) {
      return null
    }

    const playerId = searchData.data[0].id

    // Get current season stats
    const currentYear = new Date().getFullYear()
    const statsUrl = `https://www.balldontlie.io/api/v1/season_averages?season=${currentYear}&player_ids[]=${playerId}`
    const statsResponse = await fetch(statsUrl)
    const statsData = await statsResponse.json()

    if (!statsData.data || statsData.data.length === 0) {
      return null
    }

    const stats = statsData.data[0]

    return {
      gamesPlayed: stats.games_played,
      pointsPerGame: stats.pts,
      assistsPerGame: stats.ast,
      reboundsPerGame: stats.reb,
      stealsPerGame: stats.stl,
      blocksPerGame: stats.blk,
      fieldGoalPercentage: stats.fg_pct * 100,
      threePointPercentage: stats.fg3_pct * 100,
      freeThrowPercentage: stats.ft_pct * 100,
      minutesPerGame: stats.min,
      overUnderRecord: '12-8 O/U', // Mock betting stats
      performanceAgainstSpread: '55% Cover Rate',
      recentForm: 'Hot (3 games over projection)'
    }
  } catch (error) {
    console.error('Error fetching NBA stats:', error)
    return null
  }
}

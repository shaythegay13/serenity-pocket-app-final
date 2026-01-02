/**
 * Sports Data API Integration
 * Fetches team rosters, player stats, and player images
 * - TheSportsDB: Player rosters, images, biographical data
 * - ESPN API: Real-time stats that update after each game
 */

import { fetchPlayerStatsByTeam } from './espn-api'
import { storageHybrid } from './storage-hybrid'
import type { SupportedSportKey } from './types'
import {
  computeTeamOverUnderRecord,
  computeTeamATSRecord,
  formatOverUnderRecord,
  formatATSRecord,
} from './betting-history'

// Using v1 API with premium subscription key from environment variables
const THESPORTSDB_V1_BASE_URL = process.env.NEXT_PUBLIC_THESPORTSDB_BASE_URL_V1 || 'https://www.thesportsdb.com/api/v1/json'
const THESPORTSDB_V1_KEY = process.env.NEXT_PUBLIC_THESPORTSDB_API_KEY || ''

function isTheSportsDBConfigured(): boolean {
  // v1 API is available with premium subscription
  return !!THESPORTSDB_V1_BASE_URL && !!THESPORTSDB_V1_KEY
}

// Build v1 API URLs (uses PHP-style endpoints with query parameters)
function buildV1SearchTeamUrl(teamName: string): string {
  return `${THESPORTSDB_V1_BASE_URL}/${THESPORTSDB_V1_KEY}/searchteams.php?t=${encodeURIComponent(teamName)}`
}

function buildV1SearchPlayerUrl(playerName: string): string {
  return `${THESPORTSDB_V1_BASE_URL}/${THESPORTSDB_V1_KEY}/searchplayers.php?p=${encodeURIComponent(playerName)}`
}

function buildV1LookupTeamPlayersUrl(teamId: string): string {
  return `${THESPORTSDB_V1_BASE_URL}/${THESPORTSDB_V1_KEY}/lookup_all_players.php?id=${teamId}`
}

function buildV1TeamLastEventsUrl(teamId: string): string {
  return `${THESPORTSDB_V1_BASE_URL}/${THESPORTSDB_V1_KEY}/eventslast.php?id=${teamId}`
}

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

interface TheSportsDBEvent {
  idEvent?: string
  strHomeTeam?: string
  strAwayTeam?: string
  intHomeScore?: string | number | null
  intAwayScore?: string | number | null
  dateEvent?: string
}

interface TheSportsDBEventResponse {
  events?: TheSportsDBEvent[]
  results?: TheSportsDBEvent[] // v1 API uses 'results' instead of 'events'
}

/**
 * Fetch team roster from TheSportsDB
 */
export async function fetchTeamRoster(teamName: string, sport: string): Promise<Player[]> {
  try {
    if (!isTheSportsDBConfigured()) {
      return getMockRosterForTeam(teamName, sport)
    }

    // Search for team using v1 API
    const teamSearchUrl = buildV1SearchTeamUrl(teamName)
    const teamResponse = await fetch(teamSearchUrl)

    // Check if response is OK and is JSON before parsing
    if (!teamResponse.ok) {
      console.warn(`Failed to fetch team data for roster: ${teamResponse.status} ${teamResponse.statusText}`)
      return getMockRosterForTeam(teamName, sport)
    }

    const contentType = teamResponse.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      console.warn(`Invalid response type for team roster: ${contentType}`)
      return getMockRosterForTeam(teamName, sport)
    }

    const teamData = await teamResponse.json()

    if (!teamData.teams || teamData.teams.length === 0) {
      console.warn(`Team not found: ${teamName}`)
      return getMockRosterForTeam(teamName, sport)
    }

    const teamId = teamData.teams[0].idTeam

    // Get players for team using v1 API
    const playersUrl = buildV1LookupTeamPlayersUrl(teamId)
    const playersResponse = await fetch(playersUrl)

    // Check if response is OK and is JSON before parsing
    if (!playersResponse.ok) {
      console.warn(`Failed to fetch players data: ${playersResponse.status} ${playersResponse.statusText}`)
      return getMockRosterForTeam(teamName, sport)
    }

    const playersContentType = playersResponse.headers.get('content-type')
    if (!playersContentType || !playersContentType.includes('application/json')) {
      console.warn(`Invalid response type for players: ${playersContentType}`)
      return getMockRosterForTeam(teamName, sport)
    }

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
 * Fetch recent results for a team (e.g., last 5 games) as a simple form string array like ['W','L','D']
 */
export async function fetchTeamRecentResults(teamName: string, limit: number = 5): Promise<string[]> {
  try {
    if (!isTheSportsDBConfigured()) {
      return []
    }

    // Search for team using v1 API
    const teamSearchUrl = buildV1SearchTeamUrl(teamName)
    const teamResponse = await fetch(teamSearchUrl)

    // Check if response is OK and is JSON before parsing
    if (!teamResponse.ok) {
      console.warn(`[Team Form] Failed to fetch team data: ${teamResponse.status} ${teamResponse.statusText}`)
      return []
    }

    const contentType = teamResponse.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      console.warn(`[Team Form] Invalid response type: ${contentType}`)
      return []
    }

    const teamData = await teamResponse.json()

    if (!teamData.teams || teamData.teams.length === 0) {
      console.warn(`[Team Form] Team not found: ${teamName}`)
      return []
    }

    const teamId = teamData.teams[0].idTeam

    // Get recent events using v1 API
    const scheduleUrl = buildV1TeamLastEventsUrl(teamId)
    const scheduleResponse = await fetch(scheduleUrl)

    // Check if response is OK and is JSON before parsing
    if (!scheduleResponse.ok) {
      console.warn(`[Team Form] Failed to fetch schedule data: ${scheduleResponse.status} ${scheduleResponse.statusText}`)
      return []
    }

    const scheduleContentType = scheduleResponse.headers.get('content-type')
    if (!scheduleContentType || !scheduleContentType.includes('application/json')) {
      console.warn(`[Team Form] Invalid schedule response type: ${scheduleContentType}`)
      return []
    }

    const scheduleData: TheSportsDBEventResponse = await scheduleResponse.json()

    // v1 API returns 'results', v2 API returns 'events'
    const eventsArray = scheduleData.results || scheduleData.events
    if (!eventsArray || eventsArray.length === 0) {
      console.warn(`[Team Form] No previous events for team: ${teamName}`)
      return []
    }

    const events = eventsArray.slice(0, limit)

    return events.map((evt) => {
      const homeScore = evt.intHomeScore != null ? Number(evt.intHomeScore) : null
      const awayScore = evt.intAwayScore != null ? Number(evt.intAwayScore) : null
      if (homeScore == null || awayScore == null) return '–'

      const isHome = evt.strHomeTeam?.toLowerCase() === teamName.toLowerCase()
      const isAway = evt.strAwayTeam?.toLowerCase() === teamName.toLowerCase()
      if (!isHome && !isAway) return '–'

      if (homeScore === awayScore) return 'D'

      const didWin = (isHome && homeScore > awayScore) || (isAway && awayScore > homeScore)
      return didWin ? 'W' : 'L'
    })
  } catch (error) {
    console.error('[Team Form] Error fetching recent results:', error)
    return []
  }
}

/**
 * Fetch detailed player information
 * Uses TheSportsDB for bio/image and ESPN for real-time stats
 */
export async function fetchPlayerDetails(playerId: string, playerName: string, teamName?: string, sport?: string): Promise<PlayerDetail | null> {
  try {
    if (!isTheSportsDBConfigured()) {
      console.warn(`[Player Details] TheSportsDB not configured, using mock profile for ${playerName}`)
      return createMockPlayerProfile(playerName, teamName, sport)
    }
    // Search for player using v1 API
    const searchUrl = buildV1SearchPlayerUrl(playerName)
    const response = await fetch(searchUrl)

    // Check if response is OK and is JSON before parsing
    if (!response.ok) {
      console.warn(`[Player Details] Failed to fetch player data: ${response.status} ${response.statusText}`)
      return createMockPlayerProfile(playerName, teamName, sport)
    }

    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      console.warn(`[Player Details] Invalid response type: ${contentType}`)
      return createMockPlayerProfile(playerName, teamName, sport)
    }

    const data: TheSportsDBResponse = await response.json()

    if (!data.player || data.player.length === 0) {
      console.warn(`[Player Details] No data from TheSportsDB for ${playerName}, using mock profile`)
      return createMockPlayerProfile(playerName, teamName, sport)
    }

    // Select the best matching player by name rather than blindly taking the first
    const candidates = data.player
    const normalize = (s: string) =>
      s
        .normalize('NFD')
        .replace(/[^\p{L}\p{N}\s]/gu, '')
        .toLowerCase()
        .trim()

    const target = normalize(playerName)

    // Prefer exact normalized match
    let player = candidates.find(p => normalize(p.strPlayer) === target)

    // Fallback: loose containment match
    if (!player) {
      player = candidates.find(p => {
        const n = normalize(p.strPlayer)
        return n.includes(target) || target.includes(n)
      })
    }

    if (!player) {
      console.warn(`[Player Details] No close name match in TheSportsDB for "${playerName}", using mock profile`)
      return createMockPlayerProfile(playerName, teamName, sport)
    }

    // Try to get real-time stats from ESPN if team and sport are provided
    let stats: PlayerStats | null = null
    if (teamName && sport) {
      console.log(`[Player Details] Attempting to fetch ESPN stats for ${playerName} (${teamName}, ${sport})`)
      stats = await fetchPlayerStatsByTeam(teamName, playerName, sport)
    } else {
      console.warn(`[Player Details] No team/sport provided for ${playerName}, will use alternative data sources`)
    }

    if (!stats) {
      console.warn(`[Player Details] No reliable stats available for ${playerName}`)
    }

    // Enhance betting-related stats (over/under and ATS) using real game history
    // and fallback values when odds providers can't supply data.
    if (stats && teamName && sport) {
      try {
        const sportKey = sport as SupportedSportKey
        const history = await storageHybrid.getGameLines()

        const ouRecord = computeTeamOverUnderRecord(teamName, sportKey, history)
        const atsRecord = computeTeamATSRecord(teamName, sportKey, history)

        const hasOUHistory = (ouRecord.over + ouRecord.under + ouRecord.push) > 0
        const hasATSHistory = (atsRecord.covers + atsRecord.fails + atsRecord.pushes) > 0

        let overUnderText: string | undefined
        let atsText: string | undefined

        if (hasOUHistory) {
          overUnderText = formatOverUnderRecord(ouRecord)
        }
        if (hasATSHistory) {
          atsText = formatATSRecord(atsRecord)
        }

        if (overUnderText) {
          stats.overUnderRecord = overUnderText
        }
        if (atsText) {
          stats.performanceAgainstSpread = atsText
        }
      } catch (err) {
        console.warn('[Player Details] Failed to enrich betting metrics from history:', err)
      }
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
      stats: stats || undefined,
    }
  } catch (error) {
    console.error('Error fetching player details:', error)
    console.warn(`[Player Details] Error occurred, using mock profile for ${playerName}`)
    return createMockPlayerProfile(playerName, teamName, sport)
  }
}

/**
 * Create a mock player profile when API is unavailable
 */
function createMockPlayerProfile(playerName: string, teamName?: string, sport?: string): PlayerDetail {
  const positions = sport === 'basketball_nba' 
    ? ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center']
    : ['Quarterback', 'Running Back', 'Wide Receiver', 'Tight End', 'Linebacker']
  
  const randomPosition = positions[Math.floor(Math.random() * positions.length)]
  const stats = generateMockStats(randomPosition)
  
  return {
    id: `mock-${Date.now()}`,
    name: playerName,
    position: randomPosition,
    number: String(Math.floor(Math.random() * 89) + 1),
    imageUrl: undefined,
    team: teamName || 'Unknown Team',
    height: `${Math.floor(Math.random() * 8) + 68}"`,
    weight: `${Math.floor(Math.random() * 60) + 180} lbs`,
    dateOfBirth: undefined,
    nationality: 'USA',
    bio: `Professional ${sport || 'basketball'} player. Statistical data shown is for demonstration purposes.`,
    stats: stats
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

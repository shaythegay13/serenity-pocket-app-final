/**
 * Cricket Data Fetcher — Unified interface for all cricket data sources
 *
 * Fetches fixtures, live scores, player/team stats, and ball-by-ball data
 * with automatic fallback chain: ICC → Cricbuzz → ESPNcricinfo → IPL Official
 *
 * All responses are cached via the global apiCache (5-min TTL default).
 */

import { apiCache, cachedFetch } from './api-cache'
import {
  getSourcesForLeague,
  isCricketLeague,
  CRICKET_THESPORTSDB_LEAGUE_IDS,
  CRICKET_FORMAT_CONFIG,
  ICC_ENDPOINTS,
  CRICBUZZ_ENDPOINTS,
  ESPNCRICINFO_ENDPOINTS,
  IPL_ENDPOINTS,
  ESPNCRICINFO_SERIES_IDS,
  CRICBUZZ_SERIES_IDS,
  type CricketApiSource,
  type CricketFormatConfig,
} from './cricket-apis'
import {
  searchTeams,
  getTeamRecentForm,
  getHeadToHead,
  getNextEvents,
  getRecentEvents,
  type TeamInfo,
  type RecentForm,
  type EventInfo,
} from './thesportsdb'

// ─── Cache TTLs ───────────────────────────────────────────────────────────
const CACHE_TTL = {
  FIXTURES: 5 * 60 * 1000,       // 5 minutes
  LIVE_MATCH: 30 * 1000,         // 30 seconds (live data)
  PLAYER_STATS: 60 * 60 * 1000,  // 1 hour
  TEAM_FORM: 30 * 60 * 1000,     // 30 minutes
  BALL_BY_BALL: 15 * 1000,       // 15 seconds (very fresh)
  RANKINGS: 24 * 60 * 60 * 1000, // 24 hours
}

// ─── Response Types ───────────────────────────────────────────────────────

export interface CricketFixture {
  id: string
  league: string
  leagueKey: string
  homeTeam: string
  awayTeam: string
  venue?: string
  startTime: string
  status: 'upcoming' | 'live' | 'completed'
  format: 'T20' | 'ODI' | 'Test'
  source: string
}

export interface CricketLiveMatch {
  id: string
  league: string
  homeTeam: string
  awayTeam: string
  homeScore?: string
  awayScore?: string
  currentInnings?: number
  overs?: string
  battingTeam?: string
  status: string
  lastWicket?: string
  currentBatsmen?: string[]
  currentBowler?: string
  source: string
}

export interface CricketPlayerStats {
  playerId: string
  name: string
  team?: string
  role: 'batsman' | 'bowler' | 'allrounder' | 'wicketkeeper'
  batting?: {
    matches: number
    innings: number
    runs: number
    average: number
    strikeRate: number
    fifties: number
    hundreds: number
    highScore: string
  }
  bowling?: {
    matches: number
    innings: number
    wickets: number
    average: number
    economy: number
    bestFigures: string
    fiveWickets: number
  }
  recentForm?: string[]
  source: string
}

export interface CricketTeamForm {
  teamId: string
  teamName: string
  league: string
  last5: string[]
  winRate: number
  recentMatches: Array<{
    opponent: string
    result: 'W' | 'L' | 'D' | 'NR'
    score?: string
    date: string
  }>
  source: string
}

export interface CricketBallByBall {
  matchId: string
  innings: number
  overs: Array<{
    overNumber: number
    balls: Array<{
      ball: number
      runs: number
      extras?: number
      wicket?: boolean
      commentary: string
    }>
  }>
  source: string
}

// ─── Helper: Fetch with Fallback Chain ────────────────────────────────────

async function fetchWithFallback<T>(
  leagueKey: string,
  fetchFns: Array<{ source: string; fn: () => Promise<T | null> }>,
  cacheKey: string,
  ttl: number,
): Promise<T | null> {
  // Check cache first
  const cached = apiCache.get<T>(cacheKey)
  if (cached !== null) return cached

  for (const { source, fn } of fetchFns) {
    try {
      const result = await fn()
      if (result !== null) {
        apiCache.set(cacheKey, result, { ttl })
        console.log(`🏏 [Cricket] ${source} returned data for ${leagueKey}`)
        return result
      }
    } catch (err) {
      console.warn(`⚠️ [Cricket] ${source} failed for ${leagueKey}:`, err instanceof Error ? err.message : err)
    }
  }

  console.warn(`❌ [Cricket] All sources failed for ${leagueKey} (${cacheKey})`)
  return null
}

// ─── TheSportsDB Cricket Helpers (always available, free tier) ─────────────

async function fetchTheSportsDBFixtures(leagueKey: string): Promise<CricketFixture[]> {
  const leagueId = CRICKET_THESPORTSDB_LEAGUE_IDS[leagueKey]
  if (!leagueId) return []

  // Search for teams in this league and get their next events
  const formatConfig = CRICKET_FORMAT_CONFIG[leagueKey]
  const format = formatConfig?.format || 'T20'

  try {
    // TheSportsDB doesn't have a direct "league fixtures" endpoint on free tier,
    // but we can search by league ID using the eventsnextleague endpoint
    const API_BASE = (process.env.NEXT_PUBLIC_THESPORTSDB_BASE_URL || 'https://www.thesportsdb.com/api/v1/json').replace(/\/+$/, '')
    const API_KEY = process.env.NEXT_PUBLIC_THESPORTSDB_API_KEY || '123'
    const url = `${API_BASE}/${API_KEY}/eventsnextleague.php?id=${leagueId}`

    const response = await fetch(url)
    if (!response.ok) return []

    const data = await response.json()
    const events: any[] = data?.events || []

    return events.map((e: any) => ({
      id: e.idEvent || '',
      league: e.strLeague || leagueKey,
      leagueKey,
      homeTeam: e.strHomeTeam || '',
      awayTeam: e.strAwayTeam || '',
      venue: e.strVenue || undefined,
      startTime: `${e.dateEvent || ''}T${e.strTime || '00:00:00'}`,
      status: 'upcoming' as const,
      format,
      source: 'TheSportsDB',
    }))
  } catch (err) {
    console.warn(`[Cricket/TheSportsDB] Failed to fetch fixtures for ${leagueKey}:`, err)
    return []
  }
}

async function fetchTheSportsDBTeamForm(teamName: string, leagueKey: string): Promise<CricketTeamForm | null> {
  try {
    const teams = await searchTeams(teamName)
    if (!teams || teams.length === 0) return null

    // Find the cricket team
    const cricketTeam = teams.find(t => t.strSport === 'Cricket') || teams[0]
    const form = await getTeamRecentForm(cricketTeam.idTeam)
    if (!form) return null

    const recentEvents = await getRecentEvents(cricketTeam.idTeam, 5)

    return {
      teamId: cricketTeam.idTeam,
      teamName: form.team,
      league: leagueKey,
      last5: form.last5,
      winRate: form.winRate,
      recentMatches: recentEvents.map(e => ({
        opponent: e.idHomeTeam === cricketTeam.idTeam ? e.strAwayTeam : e.strHomeTeam,
        result: (() => {
          const isHome = e.idHomeTeam === cricketTeam.idTeam
          const teamScore = parseInt(isHome ? (e.intHomeScore || '0') : (e.intAwayScore || '0'), 10)
          const oppScore = parseInt(isHome ? (e.intAwayScore || '0') : (e.intHomeScore || '0'), 10)
          if (isNaN(teamScore) || isNaN(oppScore)) return 'NR' as const
          if (teamScore > oppScore) return 'W' as const
          if (teamScore < oppScore) return 'L' as const
          return 'D' as const
        })(),
        score: `${e.intHomeScore || '?'}-${e.intAwayScore || '?'}`,
        date: e.dateEvent,
      })),
      source: 'TheSportsDB',
    }
  } catch (err) {
    console.warn(`[Cricket/TheSportsDB] Failed to fetch team form for ${teamName}:`, err)
    return null
  }
}

// ─── ESPNcricinfo Helpers ─────────────────────────────────────────────────

async function fetchESPNcricinfoLiveMatches(): Promise<CricketLiveMatch[]> {
  try {
    const url = `https://hs-consumer-api.espncricinfo.com/v1/pages/matches/current`
    const response = await fetch(url, { headers: { 'Accept': 'application/json' } })
    if (!response.ok) return []

    const data = await response.json()
    const matches: any[] = data?.matches || []

    return matches.map((m: any) => ({
      id: m.objectId || m.slug || '',
      league: m.series?.name || '',
      homeTeam: m.teams?.[0]?.team?.name || '',
      awayTeam: m.teams?.[1]?.team?.name || '',
      homeScore: m.teams?.[0]?.score || undefined,
      awayScore: m.teams?.[1]?.score || undefined,
      currentInnings: m.liveInning || undefined,
      overs: m.liveOversSummary || undefined,
      battingTeam: undefined,
      status: m.status || 'live',
      source: 'ESPNcricinfo',
    }))
  } catch (err) {
    console.warn('[Cricket/ESPNcricinfo] Failed to fetch live matches:', err)
    return []
  }
}

async function fetchESPNcricinfoPlayerStats(playerId: string): Promise<CricketPlayerStats | null> {
  try {
    const url = `https://hs-consumer-api.espncricinfo.com/v1/pages/player/stats?playerId=${playerId}`
    const response = await fetch(url, { headers: { 'Accept': 'application/json' } })
    if (!response.ok) return null

    const data = await response.json()
    const player = data?.player

    if (!player) return null

    return {
      playerId,
      name: player.name || player.longName || '',
      team: player.country?.name || undefined,
      role: mapESPNRole(player.playingRole || ''),
      batting: player.battingStats ? {
        matches: player.battingStats.matches || 0,
        innings: player.battingStats.innings || 0,
        runs: player.battingStats.runs || 0,
        average: player.battingStats.average || 0,
        strikeRate: player.battingStats.strikeRate || 0,
        fifties: player.battingStats.fifties || 0,
        hundreds: player.battingStats.hundreds || 0,
        highScore: player.battingStats.highScore || '0',
      } : undefined,
      bowling: player.bowlingStats ? {
        matches: player.bowlingStats.matches || 0,
        innings: player.bowlingStats.innings || 0,
        wickets: player.bowlingStats.wickets || 0,
        average: player.bowlingStats.average || 0,
        economy: player.bowlingStats.economy || 0,
        bestFigures: player.bowlingStats.bestInnings || '0/0',
        fiveWickets: player.bowlingStats.fiveWickets || 0,
      } : undefined,
      source: 'ESPNcricinfo',
    }
  } catch (err) {
    console.warn('[Cricket/ESPNcricinfo] Failed to fetch player stats:', err)
    return null
  }
}

function mapESPNRole(role: string): CricketPlayerStats['role'] {
  const lower = role.toLowerCase()
  if (lower.includes('bat')) return 'batsman'
  if (lower.includes('bowl')) return 'bowler'
  if (lower.includes('all')) return 'allrounder'
  if (lower.includes('keeper') || lower.includes('wk')) return 'wicketkeeper'
  return 'batsman'
}

// ─── ICC Helpers ──────────────────────────────────────────────────────────

async function fetchICCFixtures(format: 'odi' | 't20i' | 'test'): Promise<CricketFixture[]> {
  try {
    const url = `https://api.icc-cricket.com/content${ICC_ENDPOINTS.fixtures(format)}`
    const response = await fetch(url, { headers: { 'Accept': 'application/json' } })
    if (!response.ok) return []

    const data = await response.json()
    const matches: any[] = data?.results || data?.matches || data?.content || []

    return matches.map((m: any) => ({
      id: m.matchId || m.id || '',
      league: `ICC ${format.toUpperCase()}`,
      leagueKey: format === 'odi' ? 'cricket_icc_odi' : format === 't20i' ? 'cricket_icc_t20' : 'cricket_test',
      homeTeam: m.homeTeam?.name || m.team1?.name || '',
      awayTeam: m.awayTeam?.name || m.team2?.name || '',
      venue: m.venue?.name || undefined,
      startTime: m.startDate || m.startDateTime || '',
      status: 'upcoming' as const,
      format: format === 'odi' ? 'ODI' : format === 't20i' ? 'T20' : 'Test',
      source: 'ICC',
    }))
  } catch (err) {
    console.warn(`[Cricket/ICC] Failed to fetch ${format} fixtures:`, err)
    return []
  }
}

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Get upcoming fixtures for a cricket league.
 * Fallback: TheSportsDB → ICC (if international) → ESPNcricinfo
 */
export async function getFixtures(
  leagueKey: string,
): Promise<CricketFixture[]> {
  if (!isCricketLeague(leagueKey)) return []

  const cacheKey = `cricket:fixtures:${leagueKey}`

  const result = await fetchWithFallback<CricketFixture[]>(
    leagueKey,
    [
      // TheSportsDB is free and covers most leagues
      { source: 'TheSportsDB', fn: () => fetchTheSportsDBFixtures(leagueKey) },
      // ICC for international formats
      ...(leagueKey.includes('icc') || leagueKey === 'cricket_test'
        ? [{
            source: 'ICC',
            fn: () => fetchICCFixtures(
              leagueKey === 'cricket_icc_odi' || leagueKey === 'cricket_icc_world_cup' ? 'odi' as const
                : leagueKey === 'cricket_test' ? 'test' as const
                : 't20i' as const
            ),
          }]
        : []),
    ],
    cacheKey,
    CACHE_TTL.FIXTURES,
  )

  return result || []
}

/**
 * Get live match data. Tries ESPNcricinfo first (best live coverage).
 */
export async function getLiveMatch(matchId: string): Promise<CricketLiveMatch | null> {
  const cacheKey = `cricket:live:${matchId}`

  return fetchWithFallback<CricketLiveMatch>(
    'live',
    [
      {
        source: 'ESPNcricinfo',
        fn: async () => {
          const allLive = await fetchESPNcricinfoLiveMatches()
          return allLive.find(m => m.id === matchId) || null
        },
      },
    ],
    cacheKey,
    CACHE_TTL.LIVE_MATCH,
  )
}

/**
 * Get all currently live cricket matches across all leagues.
 */
export async function getAllLiveMatches(): Promise<CricketLiveMatch[]> {
  const cacheKey = 'cricket:live:all'

  const result = await fetchWithFallback<CricketLiveMatch[]>(
    'all_live',
    [
      { source: 'ESPNcricinfo', fn: fetchESPNcricinfoLiveMatches },
    ],
    cacheKey,
    CACHE_TTL.LIVE_MATCH,
  )

  return result || []
}

/**
 * Get player stats (batting/bowling).
 * Tries ESPNcricinfo first (most comprehensive stats).
 */
export async function getPlayerStats(
  playerId: string,
  _type: 'batting' | 'bowling' = 'batting',
): Promise<CricketPlayerStats | null> {
  const cacheKey = `cricket:player:${playerId}`

  return fetchWithFallback<CricketPlayerStats>(
    'player',
    [
      { source: 'ESPNcricinfo', fn: () => fetchESPNcricinfoPlayerStats(playerId) },
    ],
    cacheKey,
    CACHE_TTL.PLAYER_STATS,
  )
}

/**
 * Get team recent form for a cricket team.
 * Uses TheSportsDB (free, always available).
 */
export async function getTeamForm(
  teamName: string,
  leagueKey: string = 'cricket_ipl',
): Promise<CricketTeamForm | null> {
  const cacheKey = `cricket:form:${teamName}:${leagueKey}`

  return fetchWithFallback<CricketTeamForm>(
    leagueKey,
    [
      { source: 'TheSportsDB', fn: () => fetchTheSportsDBTeamForm(teamName, leagueKey) },
    ],
    cacheKey,
    CACHE_TTL.TEAM_FORM,
  )
}

/**
 * Get ball-by-ball commentary (placeholder — requires authenticated API access).
 * Currently returns null; will be implemented when Cricbuzz/ESPN keys are available.
 */
export async function getBallByBall(matchId: string): Promise<CricketBallByBall | null> {
  console.log(`[Cricket] Ball-by-ball for ${matchId} — requires authenticated API access. Returning null.`)
  return null
}

/**
 * Get head-to-head record between two cricket teams via TheSportsDB.
 */
export async function getCricketHeadToHead(
  team1Name: string,
  team2Name: string,
): Promise<{ team1Wins: number; team2Wins: number; draws: number; totalMatches: number } | null> {
  const cacheKey = `cricket:h2h:${[team1Name, team2Name].sort().join(':')}`

  const cached = apiCache.get<any>(cacheKey)
  if (cached) return cached

  try {
    const [teams1, teams2] = await Promise.all([
      searchTeams(team1Name),
      searchTeams(team2Name),
    ])

    const t1 = teams1.find(t => t.strSport === 'Cricket') || teams1[0]
    const t2 = teams2.find(t => t.strSport === 'Cricket') || teams2[0]

    if (!t1 || !t2) return null

    const h2h = await getHeadToHead(t1.idTeam, t2.idTeam)
    if (!h2h) return null

    const result = {
      team1Wins: h2h.team1Wins || 0,
      team2Wins: h2h.team2Wins || 0,
      draws: h2h.draws || 0,
      totalMatches: h2h.matches || 0,
    }

    apiCache.set(cacheKey, result, { ttl: 24 * 60 * 60 * 1000 })
    return result
  } catch (err) {
    console.warn(`[Cricket] H2H failed for ${team1Name} vs ${team2Name}:`, err)
    return null
  }
}

/**
 * Get format-specific metadata for a cricket league (useful for AI analysis).
 */
export function getCricketFormatConfig(leagueKey: string): CricketFormatConfig | null {
  return CRICKET_FORMAT_CONFIG[leagueKey] || null
}

/**
 * Convenience: Get all cricket data for a match — team form, H2H, format config.
 * Used by the picker route to feed Gemini with rich cricket context.
 */
export async function getCricketMatchContext(
  homeTeam: string,
  awayTeam: string,
  leagueKey: string,
): Promise<{
  homeForm: CricketTeamForm | null
  awayForm: CricketTeamForm | null
  headToHead: { team1Wins: number; team2Wins: number; draws: number; totalMatches: number } | null
  formatConfig: CricketFormatConfig | null
}> {
  const [homeForm, awayForm, headToHead] = await Promise.all([
    getTeamForm(homeTeam, leagueKey),
    getTeamForm(awayTeam, leagueKey),
    getCricketHeadToHead(homeTeam, awayTeam),
  ])

  return {
    homeForm,
    awayForm,
    headToHead,
    formatConfig: getCricketFormatConfig(leagueKey),
  }
}

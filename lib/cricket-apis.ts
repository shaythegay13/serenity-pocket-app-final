/**
 * Cricket API Configuration
 * 
 * Centralized config for all cricket data sources with endpoints,
 * rate limits, and fallback order.
 * 
 * Priority chain: ICC (official) → Cricbuzz → ESPNcricinfo → IPL official
 */

// ─── TheSportsDB Cricket League IDs ───────────────────────────────────────
export const CRICKET_THESPORTSDB_LEAGUE_IDS: Record<string, string> = {
  cricket_ipl: '4707',
  cricket_mlc: '5401',
  cricket_big_bash: '4920',
  cricket_cpl: '4937',
  cricket_the_hundred: '5090',
  cricket_psl: '4817',
  cricket_sa20: '5380',
  cricket_icc_odi: '4729',
  cricket_icc_t20: '4730',
  cricket_test: '4728',
  cricket_icc_world_cup: '4729',
}

// ─── Cricket Data Source Definitions ──────────────────────────────────────
export interface CricketApiSource {
  name: string
  baseUrl: string
  envKey?: string           // env var holding API key (if needed)
  rateLimit: number         // requests per minute
  dailyLimit?: number       // requests per day (if applicable)
  priority: number          // lower = tried first
  supportsLive: boolean
  supportsBallByBall: boolean
  supportsPlayerStats: boolean
  supportsFixtures: boolean
  leagues: string[]         // which cricket_* keys this source covers
}

export const CRICKET_API_SOURCES: CricketApiSource[] = [
  {
    name: 'ICC',
    baseUrl: 'https://api.icc-cricket.com/content',
    envKey: undefined,      // Public API, no key needed
    rateLimit: 30,
    dailyLimit: 1000,
    priority: 1,
    supportsLive: true,
    supportsBallByBall: false,
    supportsPlayerStats: true,
    supportsFixtures: true,
    leagues: [
      'cricket_icc_odi', 'cricket_icc_t20', 'cricket_test',
      'cricket_icc_world_cup',
    ],
  },
  {
    name: 'Cricbuzz',
    baseUrl: 'https://www.cricbuzz.com/api',
    envKey: 'CRICBUZZ_API_KEY',
    rateLimit: 20,
    dailyLimit: 500,
    priority: 2,
    supportsLive: true,
    supportsBallByBall: true,
    supportsPlayerStats: true,
    supportsFixtures: true,
    leagues: [
      'cricket_ipl', 'cricket_mlc', 'cricket_big_bash', 'cricket_cpl',
      'cricket_the_hundred', 'cricket_psl', 'cricket_sa20',
      'cricket_icc_odi', 'cricket_icc_t20', 'cricket_test',
      'cricket_icc_world_cup',
    ],
  },
  {
    name: 'ESPNcricinfo',
    baseUrl: 'https://hs-consumer-api.espncricinfo.com/v1',
    envKey: undefined,      // Public API endpoints
    rateLimit: 15,
    dailyLimit: 500,
    priority: 3,
    supportsLive: true,
    supportsBallByBall: true,
    supportsPlayerStats: true,
    supportsFixtures: true,
    leagues: [
      'cricket_ipl', 'cricket_mlc', 'cricket_big_bash', 'cricket_cpl',
      'cricket_the_hundred', 'cricket_psl', 'cricket_sa20',
      'cricket_icc_odi', 'cricket_icc_t20', 'cricket_test',
      'cricket_icc_world_cup',
    ],
  },
  {
    name: 'IPL Official',
    baseUrl: 'https://www.iplt20.com/api',
    envKey: undefined,
    rateLimit: 10,
    dailyLimit: 300,
    priority: 4,
    supportsLive: true,
    supportsBallByBall: true,
    supportsPlayerStats: true,
    supportsFixtures: true,
    leagues: ['cricket_ipl'],
  },
]

// ─── Cricket API Endpoints ────────────────────────────────────────────────

/** ICC endpoint builders */
export const ICC_ENDPOINTS = {
  fixtures: (format: 'odi' | 't20i' | 'test') =>
    `/matches?matchState=upcoming&matchFormat=${format}`,
  liveMatches: () => '/matches?matchState=live',
  rankings: (format: 'odi' | 't20i' | 'test', type: 'batting' | 'bowling' | 'allrounder') =>
    `/rankings/${format}/${type}`,
  teamRankings: (format: 'odi' | 't20i' | 'test') =>
    `/rankings/${format}/team`,
  playerProfile: (playerId: string) => `/players/${playerId}`,
}

/** Cricbuzz endpoint builders */
export const CRICBUZZ_ENDPOINTS = {
  liveMatches: () => '/cricket-match/commentaries/live',
  upcomingMatches: () => '/cricket-match/commentaries/upcoming',
  matchDetails: (matchId: string) => `/cricket-match/commentary/${matchId}`,
  ballByBall: (matchId: string) => `/cricket-match/full-commentary/${matchId}`,
  playerStats: (playerId: string) => `/cricket-player/${playerId}`,
  teamSchedule: (teamId: string) => `/cricket-team/${teamId}/schedule`,
  seriesMatches: (seriesId: string) => `/cricket-series/${seriesId}/matches`,
}

/** ESPNcricinfo endpoint builders */
export const ESPNCRICINFO_ENDPOINTS = {
  liveMatches: () => '/pages/matches/current',
  matchDetails: (matchId: string) => `/pages/match/details?matchId=${matchId}`,
  scorecard: (matchId: string) => `/pages/match/scorecard?matchId=${matchId}`,
  playerProfile: (playerId: string) => `/pages/player/stats?playerId=${playerId}`,
  seriesMatches: (seriesId: string) => `/pages/series/schedule?seriesId=${seriesId}`,
  standings: (seriesId: string) => `/pages/series/standings?seriesId=${seriesId}`,
}

/** IPL Official endpoint builders */
export const IPL_ENDPOINTS = {
  fixtures: (season: string) => `/content/ipl/fixtures/${season}`,
  liveScore: (matchId: string) => `/content/ipl/match/${matchId}/live`,
  playerStats: (playerId: string) => `/content/ipl/player/${playerId}`,
  teamSquad: (teamId: string) => `/content/ipl/team/${teamId}/squad`,
  standings: (season: string) => `/content/ipl/standings/${season}`,
}

// ─── ESPNcricinfo Series IDs for major leagues ────────────────────────────
export const ESPNCRICINFO_SERIES_IDS: Record<string, string> = {
  cricket_ipl: '1410320',
  cricket_mlc: '1407530',
  cricket_big_bash: '1388434',
  cricket_cpl: '1407540',
  cricket_the_hundred: '1407550',
  cricket_psl: '1395800',
  cricket_sa20: '1395810',
}

// ─── Cricbuzz Series IDs (approximate — may change by season) ─────────────
export const CRICBUZZ_SERIES_IDS: Record<string, string> = {
  cricket_ipl: '7607',
  cricket_mlc: '7850',
  cricket_big_bash: '7700',
  cricket_cpl: '7860',
  cricket_psl: '7650',
}

// ─── Cricket Format Metadata ──────────────────────────────────────────────
export interface CricketFormatConfig {
  format: 'T20' | 'ODI' | 'Test'
  oversPerInnings: number | 'unlimited'
  inningsCount: number
  typicalDuration: string
  totalRunsRange: { min: number; max: number; avg: number }
}

export const CRICKET_FORMAT_CONFIG: Record<string, CricketFormatConfig> = {
  cricket_ipl:            { format: 'T20', oversPerInnings: 20, inningsCount: 2, typicalDuration: '3-4 hours', totalRunsRange: { min: 200, max: 450, avg: 320 } },
  cricket_mlc:            { format: 'T20', oversPerInnings: 20, inningsCount: 2, typicalDuration: '3-4 hours', totalRunsRange: { min: 200, max: 450, avg: 310 } },
  cricket_big_bash:       { format: 'T20', oversPerInnings: 20, inningsCount: 2, typicalDuration: '3-4 hours', totalRunsRange: { min: 200, max: 450, avg: 310 } },
  cricket_cpl:            { format: 'T20', oversPerInnings: 20, inningsCount: 2, typicalDuration: '3-4 hours', totalRunsRange: { min: 200, max: 440, avg: 300 } },
  cricket_the_hundred:    { format: 'T20', oversPerInnings: 20, inningsCount: 2, typicalDuration: '2.5-3 hours', totalRunsRange: { min: 180, max: 400, avg: 290 } },
  cricket_psl:            { format: 'T20', oversPerInnings: 20, inningsCount: 2, typicalDuration: '3-4 hours', totalRunsRange: { min: 200, max: 440, avg: 310 } },
  cricket_sa20:           { format: 'T20', oversPerInnings: 20, inningsCount: 2, typicalDuration: '3-4 hours', totalRunsRange: { min: 200, max: 440, avg: 300 } },
  cricket_icc_odi:        { format: 'ODI', oversPerInnings: 50, inningsCount: 2, typicalDuration: '8 hours', totalRunsRange: { min: 300, max: 700, avg: 480 } },
  cricket_icc_t20:        { format: 'T20', oversPerInnings: 20, inningsCount: 2, typicalDuration: '3-4 hours', totalRunsRange: { min: 200, max: 450, avg: 310 } },
  cricket_test:           { format: 'Test', oversPerInnings: 'unlimited', inningsCount: 4, typicalDuration: '5 days', totalRunsRange: { min: 400, max: 1500, avg: 900 } },
  cricket_icc_world_cup:  { format: 'ODI', oversPerInnings: 50, inningsCount: 2, typicalDuration: '8 hours', totalRunsRange: { min: 300, max: 700, avg: 490 } },
}

/**
 * Get the best API source for a given cricket league, ordered by priority.
 */
export function getSourcesForLeague(leagueKey: string): CricketApiSource[] {
  return CRICKET_API_SOURCES
    .filter(src => src.leagues.includes(leagueKey))
    .sort((a, b) => a.priority - b.priority)
}

/**
 * Check if a sport key is a cricket league.
 */
export function isCricketLeague(sportKey: string): boolean {
  return sportKey.startsWith('cricket_')
}

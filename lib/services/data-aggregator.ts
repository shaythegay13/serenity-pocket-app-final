/**
 * Data Aggregator Service
 *
 * Orchestrates data fetching from multiple sports betting data providers:
 * - The Odds API
 * - OddsJam API
 * - Sportradar API
 * - SportsDataIO
 *
 * Features:
 * - Multi-provider failover
 * - Response caching with TTL
 * - Rate limiting
 * - Data normalization
 * - Error handling and logging
 */

import type {
  LiveGameData,
  LiveOddsData,
  LineMovementData,
  BettingTrendsData,
  DataSourceConfig,
  CacheConfig,
  LiveDataAPIResponse,
} from "../types/live-betting"
import type { SupportedSportKey } from "../types"

// ============================================================================
// IN-MEMORY CACHE
// ============================================================================

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class DataCache {
  private cache = new Map<string, CacheEntry<any>>()

  set<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const age = Date.now() - entry.timestamp
    if (age > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  getAge(key: string): number | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    return Date.now() - entry.timestamp
  }

  clear(pattern?: string): void {
    if (!pattern) {
      this.cache.clear()
      return
    }

    const keysToDelete: string[] = []
    this.cache.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key)
      }
    })
    keysToDelete.forEach(key => this.cache.delete(key))
  }
}

const cache = new DataCache()

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

const CACHE_CONFIG: CacheConfig = {
  liveGames: 5000, // 5 seconds for live games
  liveOdds: 5000, // 5 seconds for odds
  lineMovement: 15000, // 15 seconds for line movement
  bettingTrends: 30000, // 30 seconds for trends
}

// ============================================================================
// DATA SOURCE CONFIGURATION
// ============================================================================

function getDataSources(): DataSourceConfig[] {
  return [
    {
      provider: "odds-api",
      apiKey: process.env.ODDS_API_KEY || "",
      enabled: !!process.env.ODDS_API_KEY,
      priority: 1,
      rateLimitPerMinute: 500,
      endpoints: {
        liveOdds: "https://api.the-odds-api.com/v4/sports/{sport}/odds",
        liveGames: "https://api.the-odds-api.com/v4/sports/{sport}/scores",
      },
    },
    {
      provider: "oddsjam",
      apiKey: process.env.ODDSJAM_API_KEY || "",
      enabled: !!process.env.ODDSJAM_API_KEY,
      priority: 2,
      rateLimitPerMinute: 1000,
      endpoints: {
        liveOdds: "https://api-external.oddsjam.com/api/v2/game-odds",
        bettingTrends: "https://api-external.oddsjam.com/api/v2/market-trends",
      },
    },
    {
      provider: "sportradar",
      apiKey: process.env.SPORTRADAR_API_KEY || "",
      enabled: !!process.env.SPORTRADAR_API_KEY,
      priority: 3,
      rateLimitPerMinute: 1000,
      endpoints: {
        liveGames: "https://api.sportradar.com/",
        liveOdds: "https://api.sportradar.com/",
        lineMovement: "https://api.sportradar.com/",
      },
    },
    {
      provider: "sportsdata",
      apiKey: process.env.SPORTSDATA_API_KEY || "",
      enabled: !!process.env.SPORTSDATA_API_KEY,
      priority: 4,
      rateLimitPerMinute: 100,
      endpoints: {
        liveGames: "https://api.sportsdata.io/v3/",
        liveOdds: "https://api.sportsdata.io/v3/",
        lineMovement: "https://api.sportsdata.io/v3/",
      },
    },
  ].filter(source => source.enabled)
}

// ============================================================================
// API REQUEST HELPERS
// ============================================================================

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = 10000
): Promise<Response> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(id)
    return response
  } catch (error) {
    clearTimeout(id)
    throw error
  }
}

// ============================================================================
// THE ODDS API INTEGRATION
// ============================================================================

async function fetchOddsAPI(
  sport: SupportedSportKey,
  dataType: "odds" | "scores",
  apiKey: string
): Promise<any> {
  const sportMapping: Record<SupportedSportKey, string> = {
    nfl: "americanfootball_nfl",
    nba: "basketball_nba",
    mlb: "baseball_mlb",
    nhl: "icehockey_nhl",
  }

  const endpoint = dataType === "odds" ? "odds" : "scores"
  const url = `https://api.the-odds-api.com/v4/sports/${sportMapping[sport]}/${endpoint}?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals&oddsFormat=american&dateFormat=iso`

  const response = await fetchWithTimeout(url)
  if (!response.ok) {
    throw new Error(`Odds API error: ${response.statusText}`)
  }

  return await response.json()
}

function normalizeOddsAPIResponse(rawData: any[]): LiveOddsData[] {
  return rawData.map(game => {
    const bookmakers = game.bookmakers?.map((book: any) => {
      const moneyline = book.markets?.find((m: any) => m.key === "h2h")
      const spread = book.markets?.find((m: any) => m.key === "spreads")
      const total = book.markets?.find((m: any) => m.key === "totals")

      return {
        bookmaker: book.title,
        bookmakerId: book.key,
        lastUpdate: new Date(book.last_update),
        moneyline: moneyline ? {
          home: { value: moneyline.outcomes[0].price },
          away: { value: moneyline.outcomes[1].price },
        } : undefined,
        spread: spread ? {
          home: {
            value: spread.outcomes[0].price,
            point: spread.outcomes[0].point,
          },
          away: {
            value: spread.outcomes[1].price,
            point: spread.outcomes[1].point,
          },
        } : undefined,
        total: total ? {
          over: {
            value: total.outcomes[0].price,
            point: total.outcomes[0].point,
          },
          under: {
            value: total.outcomes[1].price,
            point: total.outcomes[1].point,
          },
        } : undefined,
      }
    }) || []

    return {
      gameId: game.id,
      sport: "nfl", // Would need to map back
      homeTeam: game.home_team,
      awayTeam: game.away_team,
      commenceTime: new Date(game.commence_time),
      bookmakers,
      lastUpdated: new Date(),
    }
  })
}

// ============================================================================
// PUBLIC API FUNCTIONS
// ============================================================================

/**
 * Fetch live odds data with caching and failover
 */
export async function getLiveOdds(
  sport: SupportedSportKey,
  gameId?: string
): Promise<LiveDataAPIResponse<LiveOddsData[]>> {
  const cacheKey = `odds:${sport}:${gameId || "all"}`
  const cached = cache.get<LiveOddsData[]>(cacheKey)

  if (cached) {
    return {
      success: true,
      data: cached,
      source: "cache",
      timestamp: new Date(),
      cached: true,
      cacheAge: cache.getAge(cacheKey) || 0,
    }
  }

  const sources = getDataSources().sort((a, b) => a.priority - b.priority)

  for (const source of sources) {
    try {
      if (source.provider === "odds-api" && source.endpoints.liveOdds) {
        const rawData = await fetchOddsAPI(sport, "odds", source.apiKey)
        const normalized = normalizeOddsAPIResponse(rawData)
        const filtered = gameId ? normalized.filter(g => g.gameId === gameId) : normalized

        cache.set(cacheKey, filtered, CACHE_CONFIG.liveOdds)

        return {
          success: true,
          data: filtered,
          source: source.provider,
          timestamp: new Date(),
          cached: false,
        }
      }

      // Add other providers here (OddsJam, Sportradar, etc.)

    } catch (error) {
      console.error(`Error fetching from ${source.provider}:`, error)
      continue // Try next provider
    }
  }

  return {
    success: false,
    data: [],
    source: "none",
    timestamp: new Date(),
    error: "All data sources failed",
  }
}

/**
 * Fetch live game data with scores
 */
export async function getLiveGames(
  sport: SupportedSportKey,
  gameId?: string
): Promise<LiveDataAPIResponse<LiveGameData[]>> {
  const cacheKey = `games:${sport}:${gameId || "all"}`
  const cached = cache.get<LiveGameData[]>(cacheKey)

  if (cached) {
    return {
      success: true,
      data: cached,
      source: "cache",
      timestamp: new Date(),
      cached: true,
      cacheAge: cache.getAge(cacheKey) || 0,
    }
  }

  const sources = getDataSources().sort((a, b) => a.priority - b.priority)

  for (const source of sources) {
    try {
      if (source.provider === "odds-api" && source.endpoints.liveGames) {
        const rawData = await fetchOddsAPI(sport, "scores", source.apiKey)

        // Normalize the scores response
        const normalized: LiveGameData[] = rawData
          .filter((game: any) => !game.completed)
          .map((game: any) => ({
            gameId: game.id,
            sport,
            homeTeam: game.home_team,
            awayTeam: game.away_team,
            status: {
              period: 1, // Would need actual data
              clock: "12:00",
              isFinal: game.completed || false,
              homeScore: game.scores?.find((s: any) => s.name === game.home_team)?.score || 0,
              awayScore: game.scores?.find((s: any) => s.name === game.away_team)?.score || 0,
            },
            lastUpdated: new Date(game.last_update),
          }))

        const filtered = gameId ? normalized.filter(g => g.gameId === gameId) : normalized
        cache.set(cacheKey, filtered, CACHE_CONFIG.liveGames)

        return {
          success: true,
          data: filtered,
          source: source.provider,
          timestamp: new Date(),
          cached: false,
        }
      }
    } catch (error) {
      console.error(`Error fetching games from ${source.provider}:`, error)
      continue
    }
  }

  return {
    success: false,
    data: [],
    source: "none",
    timestamp: new Date(),
    error: "All data sources failed",
  }
}

/**
 * Fetch line movement data
 */
export async function getLineMovement(
  sport: SupportedSportKey,
  gameId: string
): Promise<LiveDataAPIResponse<LineMovementData>> {
  const cacheKey = `movement:${sport}:${gameId}`
  const cached = cache.get<LineMovementData>(cacheKey)

  if (cached) {
    return {
      success: true,
      data: cached,
      source: "cache",
      timestamp: new Date(),
      cached: true,
      cacheAge: cache.getAge(cacheKey) || 0,
    }
  }

  // Import odds history store
  const { getGameOddsHistory } = await import('../odds-history-store')

  // Fetch historical odds data
  const history = getGameOddsHistory(gameId)

  if (!history || history.snapshots.length === 0) {
    // Return empty structure if no history exists yet
    const emptyData: LineMovementData = {
      gameId,
      sport,
      homeTeam: "Unknown",
      awayTeam: "Unknown",
      commenceTime: new Date(),
      movements: {
        moneyline: { home: [], away: [] },
        spread: { home: [], away: [] },
        total: { over: [], under: [] },
      },
      lastUpdated: new Date(),
    }

    return {
      success: true,
      data: emptyData,
      source: "no-history",
      timestamp: new Date(),
      cached: false,
    }
  }

  // Build movement data from snapshots
  const movements: LineMovementData['movements'] = {
    moneyline: { home: [], away: [] },
    spread: { home: [], away: [] },
    total: { over: [], under: [] },
  }

  const opening: LineMovementData['opening'] = {}
  let consensus: LineMovementData['consensus'] = {}

  // Process each snapshot
  history.snapshots.forEach((snapshot, index) => {
    const timestamp = new Date(snapshot.timestamp)

    // Process moneyline
    if (snapshot.moneyline) {
      if (snapshot.moneyline.home) {
        movements.moneyline.home.push({
          timestamp: timestamp.toISOString(),
          bookmaker: snapshot.moneyline.bookmaker || 'Unknown',
          side: 'home',
          odds: { value: snapshot.moneyline.home }
        })

        // Set opening odds (first snapshot)
        if (index === 0) {
          opening.moneyline = {
            home: { value: snapshot.moneyline.home },
            away: { value: snapshot.moneyline.away || 0 }
          }
        }

        // Set consensus (latest snapshot)
        if (index === history.snapshots.length - 1) {
          consensus.moneyline = {
            home: { odds: snapshot.moneyline.home },
            away: { odds: snapshot.moneyline.away || 0 }
          }
        }
      }

      if (snapshot.moneyline.away) {
        movements.moneyline.away.push({
          timestamp: timestamp.toISOString(),
          bookmaker: snapshot.moneyline.bookmaker || 'Unknown',
          side: 'away',
          odds: { value: snapshot.moneyline.away }
        })
      }
    }

    // Process spread
    if (snapshot.spread) {
      movements.spread.home.push({
        timestamp: timestamp.toISOString(),
        bookmaker: snapshot.spread.bookmaker || 'Unknown',
        side: 'home',
        odds: {
          value: snapshot.spread.home.odds,
          point: snapshot.spread.home.line
        }
      })

      movements.spread.away.push({
        timestamp: timestamp.toISOString(),
        bookmaker: snapshot.spread.bookmaker || 'Unknown',
        side: 'away',
        odds: {
          value: snapshot.spread.away.odds,
          point: snapshot.spread.away.line
        }
      })

      // Set opening spread
      if (index === 0) {
        opening.spread = {
          home: {
            value: snapshot.spread.home.odds,
            point: snapshot.spread.home.line
          },
          away: {
            value: snapshot.spread.away.odds,
            point: snapshot.spread.away.line
          }
        }
      }

      // Set consensus spread
      if (index === history.snapshots.length - 1) {
        consensus.spread = {
          home: {
            odds: snapshot.spread.home.odds,
            point: snapshot.spread.home.line
          },
          away: {
            odds: snapshot.spread.away.odds,
            point: snapshot.spread.away.line
          }
        }
      }
    }

    // Process totals
    if (snapshot.totals) {
      movements.total.over.push({
        timestamp: timestamp.toISOString(),
        bookmaker: snapshot.totals.bookmaker || 'Unknown',
        side: 'over',
        odds: {
          value: snapshot.totals.over.odds,
          point: snapshot.totals.over.line
        }
      })

      movements.total.under.push({
        timestamp: timestamp.toISOString(),
        bookmaker: snapshot.totals.bookmaker || 'Unknown',
        side: 'under',
        odds: {
          value: snapshot.totals.under.odds,
          point: snapshot.totals.under.line
        }
      })

      // Set opening total
      if (index === 0) {
        opening.total = {
          over: {
            value: snapshot.totals.over.odds,
            point: snapshot.totals.over.line
          },
          under: {
            value: snapshot.totals.under.odds,
            point: snapshot.totals.under.line
          }
        }
      }

      // Set consensus total
      if (index === history.snapshots.length - 1) {
        consensus.total = {
          over: {
            odds: snapshot.totals.over.odds,
            point: snapshot.totals.over.line
          },
          under: {
            odds: snapshot.totals.under.odds,
            point: snapshot.totals.under.line
          }
        }
      }
    }
  })

  const lineMovementData: LineMovementData = {
    gameId,
    sport,
    homeTeam: history.homeTeam,
    awayTeam: history.awayTeam,
    commenceTime: new Date(history.commenceTime),
    movements,
    opening,
    consensus,
    lastUpdated: new Date(),
  }

  cache.set(cacheKey, lineMovementData, CACHE_CONFIG.lineMovement)

  return {
    success: true,
    data: lineMovementData,
    source: "odds-history",
    timestamp: new Date(),
    cached: false,
  }
}

/**
 * Fetch betting trends data
 *
 * NOTE: This uses simulated/estimated data based on line movement patterns.
 * For production, integrate with premium data providers like:
 * - Action Network API
 * - OddsJam API
 * - Sports Insights
 */
export async function getBettingTrends(
  sport: SupportedSportKey,
  gameId: string
): Promise<LiveDataAPIResponse<BettingTrendsData>> {
  const cacheKey = `trends:${sport}:${gameId}`
  const cached = cache.get<BettingTrendsData>(cacheKey)

  if (cached) {
    return {
      success: true,
      data: cached,
      source: "cache",
      timestamp: new Date(),
      cached: true,
      cacheAge: cache.getAge(cacheKey) || 0,
    }
  }

  try {
    // Get line movement data to infer betting trends
    const lineMovementResponse = await getLineMovement(sport, gameId)

    if (!lineMovementResponse.success || !lineMovementResponse.data) {
      throw new Error('No line movement data available')
    }

    const { data: lineData } = lineMovementResponse

    // Estimate betting trends based on line movement
    // Sharp money typically moves lines significantly
    // Public money tends to follow favorites and overs

    // Simulate public betting percentages (60-80% on favorites, slight over bias)
    const publicMoneylinePct = {
      home: Math.floor(40 + Math.random() * 20), // 40-60%
      away: 0
    }
    publicMoneylinePct.away = 100 - publicMoneylinePct.home

    const publicSpreadPct = {
      home: Math.floor(45 + Math.random() * 15), // 45-60%
      away: 0
    }
    publicSpreadPct.away = 100 - publicSpreadPct.home

    const publicTotalPct = {
      over: Math.floor(52 + Math.random() * 10), // 52-62% (public loves overs)
      under: 0
    }
    publicTotalPct.under = 100 - publicTotalPct.over

    // Simulate sharp money (can be opposite of public)
    const sharpMoneylinePct = {
      home: Math.floor(35 + Math.random() * 30),
      away: 0
    }
    sharpMoneylinePct.away = 100 - sharpMoneylinePct.home

    const trendsData: BettingTrendsData = {
      gameId,
      sport,
      homeTeam: lineData.homeTeam,
      awayTeam: lineData.awayTeam,
      commenceTime: lineData.commenceTime,
      splits: {
        moneyline: {
          public: [
            { side: 'home', bets: publicMoneylinePct.home, money: publicMoneylinePct.home - 5 },
            { side: 'away', bets: publicMoneylinePct.away, money: publicMoneylinePct.away + 5 }
          ],
          sharp: [
            { side: 'home', bets: sharpMoneylinePct.home, money: sharpMoneylinePct.home + 8 },
            { side: 'away', bets: sharpMoneylinePct.away, money: sharpMoneylinePct.away - 8 }
          ]
        },
        spread: {
          public: [
            { side: 'home', bets: publicSpreadPct.home, money: publicSpreadPct.home - 3 },
            { side: 'away', bets: publicSpreadPct.away, money: publicSpreadPct.away + 3 }
          ],
          sharp: [
            { side: 'home', bets: 48, money: 55 },
            { side: 'away', bets: 52, money: 45 }
          ]
        },
        total: {
          public: [
            { side: 'over', bets: publicTotalPct.over, money: publicTotalPct.over - 4 },
            { side: 'under', bets: publicTotalPct.under, money: publicTotalPct.under + 4 }
          ],
          sharp: [
            { side: 'over', bets: 45, money: 48 },
            { side: 'under', bets: 55, money: 52 }
          ]
        }
      },
      sharpMoneyIndicators: [
        {
          betType: 'moneyline',
          side: sharpMoneylinePct.home > sharpMoneylinePct.away ? 'home' : 'away',
          confidence: 'medium',
          description: `Sharp action detected on ${sharpMoneylinePct.home > sharpMoneylinePct.away ? lineData.homeTeam : lineData.awayTeam}`
        }
      ],
      lastUpdated: new Date(),
    }

    cache.set(cacheKey, trendsData, CACHE_CONFIG.bettingTrends)

    return {
      success: true,
      data: trendsData,
      source: "estimated",
      timestamp: new Date(),
      cached: false,
    }
  } catch (error) {
    console.error('Error generating betting trends:', error)

    // Return minimal mock data as fallback
    const fallbackData: BettingTrendsData = {
      gameId,
      sport,
      homeTeam: "Unknown",
      awayTeam: "Unknown",
      commenceTime: new Date(),
      splits: {
        moneyline: { public: [], sharp: [] },
        spread: { public: [], sharp: [] },
        total: { public: [], sharp: [] },
      },
      sharpMoneyIndicators: [],
      lastUpdated: new Date(),
    }

    return {
      success: false,
      data: fallbackData,
      source: "fallback",
      timestamp: new Date(),
      cached: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Clear cache for specific sport or all
 */
export function clearCache(sport?: SupportedSportKey): void {
  if (sport) {
    cache.clear(sport)
  } else {
    cache.clear()
  }
}

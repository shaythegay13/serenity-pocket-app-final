/**
 * Player Data Service for Serenity Pocket App
 *
 * Fetches player prop lines from TheOddsAPI and caches results.
 * Integrates with the existing enhanced-odds-api.ts pattern.
 */

import { getSportById } from '../sports-config'
import {
  PlayerInfo,
  PlayerPropLine,
  OddsAPIPlayerPropsResponse,
  OddsAPIBookmaker,
  OddsAPIMarket,
  OddsAPIOutcome,
  getPropCategory,
  getPropDisplayName,
  getPropMarketsForSport,
  PlayerPropMarket,
} from '../types/player-props'

// ==================== Cache Configuration ====================

interface CacheEntry<T> {
  data: T
  timestamp: number
}

// Cache TTL: 5 minutes (in milliseconds)
const CACHE_TTL = 5 * 60 * 1000

// In-memory cache for player props
const propsCache = new Map<string, CacheEntry<PlayerPropLine[]>>()
const playerInfoCache = new Map<string, CacheEntry<PlayerInfo>>()

// ==================== TheOddsAPI Configuration ====================

function getApiKey(): string | undefined {
  return process.env.NEXT_PUBLIC_ODDS_API_KEY
}

function isConfigured(): boolean {
  return !!getApiKey()
}

/**
 * Build the sport key for TheOddsAPI
 */
function buildSportKey(sport: string): string {
  const sportConfig = getSportById(sport)

  if (sportConfig) {
    if (sportConfig.oddsApiSport && sportConfig.oddsApiLeague) {
      if (sportConfig.oddsApiLeague.startsWith(sportConfig.oddsApiSport)) {
        return sportConfig.oddsApiLeague
      }
      return `${sportConfig.oddsApiSport}_${sportConfig.oddsApiLeague}`
    }
    return sportConfig.id
  }

  return sport
}

// ==================== Player Props Fetching ====================

/**
 * Fetch player props for a specific game from TheOddsAPI
 *
 * @param gameId - The event/game ID
 * @param sport - The sport key (e.g., "basketball_nba", "americanfootball_nfl")
 * @param markets - Optional specific markets to fetch (defaults to all available for sport)
 */
export async function getPlayerPropsForGame(
  gameId: string,
  sport: string,
  markets?: PlayerPropMarket[]
): Promise<PlayerPropLine[]> {
  // Check cache first
  const cacheKey = `props_${gameId}_${sport}`
  const cached = propsCache.get(cacheKey)

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[PlayerDataService] Cache hit for ${cacheKey}`)
    return cached.data
  }

  // Validate API configuration
  if (!isConfigured()) {
    console.warn('[PlayerDataService] TheOddsAPI key not configured')
    return []
  }

  const apiKey = getApiKey()!
  const sportKey = buildSportKey(sport)

  // Determine which markets to fetch
  const marketsToFetch = markets || getPropMarketsForSport(sport)
  if (marketsToFetch.length === 0) {
    console.log(`[PlayerDataService] No player prop markets available for ${sport}`)
    return []
  }

  // Build markets query string
  const marketsQuery = marketsToFetch.join(',')

  // TheOddsAPI player props endpoint
  const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/events/${gameId}/odds?apiKey=${apiKey}&regions=us&markets=${marketsQuery}&oddsFormat=american`

  console.log(`[PlayerDataService] Fetching player props for game ${gameId}`)

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      // Cache-Control for Next.js
      next: { revalidate: 300 } // Revalidate every 5 minutes
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[PlayerDataService] API error: ${response.status} - ${errorText}`)

      // Return empty on 404 (no props available for this game)
      if (response.status === 404) {
        return []
      }

      throw new Error(`TheOddsAPI error: ${response.status}`)
    }

    const data: OddsAPIPlayerPropsResponse = await response.json()

    // Transform API response to PlayerPropLine[]
    const propLines = transformPropsResponse(data, gameId)

    // Update cache
    propsCache.set(cacheKey, {
      data: propLines,
      timestamp: Date.now()
    })

    console.log(`[PlayerDataService] Found ${propLines.length} player prop lines for game ${gameId}`)

    return propLines
  } catch (error) {
    console.error('[PlayerDataService] Error fetching player props:', error)
    return []
  }
}

/**
 * Fetch player props for multiple games
 */
export async function getPlayerPropsForGames(
  gameIds: string[],
  sport: string
): Promise<Map<string, PlayerPropLine[]>> {
  const results = new Map<string, PlayerPropLine[]>()

  // Fetch in parallel with rate limiting (max 3 concurrent)
  const CONCURRENT_LIMIT = 3
  const chunks: string[][] = []

  for (let i = 0; i < gameIds.length; i += CONCURRENT_LIMIT) {
    chunks.push(gameIds.slice(i, i + CONCURRENT_LIMIT))
  }

  for (const chunk of chunks) {
    const promises = chunk.map(async (gameId) => {
      const props = await getPlayerPropsForGame(gameId, sport)
      return { gameId, props }
    })

    const chunkResults = await Promise.all(promises)

    for (const { gameId, props } of chunkResults) {
      results.set(gameId, props)
    }

    // Small delay between chunks to respect rate limits
    if (chunks.indexOf(chunk) < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }

  return results
}

/**
 * Get all available player prop markets for a sport
 */
export async function getAvailableMarketsForSport(sport: string): Promise<PlayerPropMarket[]> {
  return getPropMarketsForSport(sport)
}

// ==================== Transform Functions ====================

/**
 * Transform TheOddsAPI response to our PlayerPropLine format
 */
function transformPropsResponse(
  response: OddsAPIPlayerPropsResponse,
  gameId: string
): PlayerPropLine[] {
  const propLines: PlayerPropLine[] = []

  if (!response.bookmakers || response.bookmakers.length === 0) {
    return propLines
  }

  // Group outcomes by player and stat to find best odds
  const playerStatMap = new Map<string, {
    playerId: string
    playerName: string
    stat: string
    line: number
    overOdds: number[]
    underOdds: number[]
    bookmakers: string[]
  }>()

  for (const bookmaker of response.bookmakers) {
    for (const market of bookmaker.markets) {
      // Process each outcome (player prop line)
      for (const outcome of market.outcomes) {
        if (!outcome.description || outcome.point === undefined) continue

        const playerName = outcome.description
        const playerId = generatePlayerId(playerName, response.home_team, response.away_team)
        const stat = market.key
        const line = outcome.point

        // Create unique key for this player's specific prop line
        const key = `${playerId}_${stat}_${line}`

        if (!playerStatMap.has(key)) {
          playerStatMap.set(key, {
            playerId,
            playerName,
            stat,
            line,
            overOdds: [],
            underOdds: [],
            bookmakers: []
          })
        }

        const entry = playerStatMap.get(key)!

        if (outcome.name === 'Over') {
          entry.overOdds.push(outcome.price)
        } else if (outcome.name === 'Under') {
          entry.underOdds.push(outcome.price)
        }

        if (!entry.bookmakers.includes(bookmaker.key)) {
          entry.bookmakers.push(bookmaker.key)
        }
      }
    }
  }

  // Convert map entries to PlayerPropLine objects
  for (const [_, entry] of playerStatMap) {
    // Only include if we have both over and under odds
    if (entry.overOdds.length > 0 && entry.underOdds.length > 0) {
      // Use best odds for the bettor (highest for over, highest for under)
      const bestOverOdds = Math.max(...entry.overOdds)
      const bestUnderOdds = Math.max(...entry.underOdds)

      propLines.push({
        playerId: entry.playerId,
        playerName: entry.playerName,
        gameId,
        stat: entry.stat,
        statDisplayName: getPropDisplayName(entry.stat),
        category: getPropCategory(entry.stat),
        line: entry.line,
        overOdds: bestOverOdds,
        underOdds: bestUnderOdds,
        bookmaker: entry.bookmakers[0], // Primary bookmaker
        lastUpdated: new Date().toISOString()
      })
    }
  }

  // Sort by player name, then by stat
  propLines.sort((a, b) => {
    const nameCompare = a.playerName.localeCompare(b.playerName)
    if (nameCompare !== 0) return nameCompare
    return a.stat.localeCompare(b.stat)
  })

  return propLines
}

/**
 * Generate a consistent player ID from name and teams
 * This is a temporary solution until we have proper player ID mapping
 */
function generatePlayerId(playerName: string, homeTeam: string, awayTeam: string): string {
  // Normalize name: lowercase, remove special chars, replace spaces with underscores
  const normalizedName = playerName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .trim()

  // Create a simple hash-like ID
  return `player_${normalizedName}`
}

// ==================== Player Info Functions ====================

/**
 * Get player info by ID
 * Note: This is a simplified implementation. In production, you'd want to
 * integrate with a player database or external API.
 */
export async function getPlayerInfo(playerId: string): Promise<PlayerInfo | null> {
  // Check cache
  const cached = playerInfoCache.get(playerId)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL * 12) { // 1 hour cache for player info
    return cached.data
  }

  // For now, extract info from the player ID
  // In production, this would fetch from a database or external API
  const namePart = playerId.replace('player_', '').replace(/_/g, ' ')
  const formattedName = namePart
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  const playerInfo: PlayerInfo = {
    id: playerId,
    name: formattedName,
    team: 'Unknown',
    position: 'Unknown',
    sport: 'Unknown'
  }

  // Cache the result
  playerInfoCache.set(playerId, {
    data: playerInfo,
    timestamp: Date.now()
  })

  return playerInfo
}

/**
 * Update player info with additional data (e.g., from prop lines)
 */
export function updatePlayerInfoFromProp(playerId: string, team: string, position?: string): void {
  const cached = playerInfoCache.get(playerId)

  if (cached) {
    const updatedInfo: PlayerInfo = {
      ...cached.data,
      team: team || cached.data.team,
      position: position || cached.data.position
    }

    playerInfoCache.set(playerId, {
      data: updatedInfo,
      timestamp: Date.now()
    })
  }
}

// ==================== Historical Stats (Placeholder) ====================

/**
 * Get player historical stats for a specific stat type
 *
 * Note: This is a placeholder. In production, you'd integrate with:
 * - SportsDataIO
 * - ESPN API
 * - Sports-Reference
 * - Your own historical data store
 */
export async function getPlayerHistoricalStats(
  playerId: string,
  stat: string,
  gamesBack: number = 10
): Promise<number[]> {
  // Placeholder: Return empty array
  // TODO: Integrate with historical data source
  console.log(`[PlayerDataService] Historical stats not yet implemented for ${playerId}`)
  return []
}

/**
 * Calculate hit rate for a player prop line based on historical data
 */
export async function calculateHitRate(
  playerId: string,
  stat: string,
  line: number,
  direction: 'over' | 'under',
  gamesBack: number = 10
): Promise<number | null> {
  const historicalStats = await getPlayerHistoricalStats(playerId, stat, gamesBack)

  if (historicalStats.length === 0) {
    return null
  }

  const hits = historicalStats.filter(value => {
    if (direction === 'over') {
      return value > line
    } else {
      return value < line
    }
  })

  return hits.length / historicalStats.length
}

// ==================== Cache Management ====================

/**
 * Clear all caches
 */
export function clearAllCaches(): void {
  propsCache.clear()
  playerInfoCache.clear()
  console.log('[PlayerDataService] All caches cleared')
}

/**
 * Clear props cache for a specific game
 */
export function clearPropsCache(gameId?: string): void {
  if (gameId) {
    // Clear specific game
    for (const key of propsCache.keys()) {
      if (key.includes(gameId)) {
        propsCache.delete(key)
      }
    }
  } else {
    propsCache.clear()
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { propsEntries: number; playerInfoEntries: number } {
  return {
    propsEntries: propsCache.size,
    playerInfoEntries: playerInfoCache.size
  }
}

// ==================== Exports ====================

export const playerDataService = {
  getPlayerPropsForGame,
  getPlayerPropsForGames,
  getAvailableMarketsForSport,
  getPlayerInfo,
  getPlayerHistoricalStats,
  calculateHitRate,
  clearAllCaches,
  clearPropsCache,
  getCacheStats,
  isConfigured
}

export default playerDataService

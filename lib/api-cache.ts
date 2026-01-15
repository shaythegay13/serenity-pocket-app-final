/**
 * Global API Cache System
 * 
 * Provides intelligent caching for API responses to reduce redundant calls
 * and improve performance across the application.
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

interface CacheConfig {
  ttl: number // Time to live in milliseconds
}

class APICache {
  private cache = new Map<string, CacheEntry<any>>()
  private defaultTTL = 5 * 60 * 1000 // 5 minutes default TTL

  /**
   * Generate a cache key from URL and parameters
   */
  private generateKey(url: string, params?: Record<string, any>): string {
    const paramString = params ? JSON.stringify(params, Object.keys(params).sort()) : ''
    return `${url}${paramString}`
  }

  /**
   * Check if a cache entry is still valid
   */
  private isValid(entry: CacheEntry<any>): boolean {
    return Date.now() < entry.expiresAt
  }

  /**
   * Get data from cache
   */
  get<T>(url: string, params?: Record<string, any>): T | null {
    const key = this.generateKey(url, params)
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }
    
    if (!this.isValid(entry)) {
      this.cache.delete(key)
      return null
    }
    
    console.log(`🎯 Cache hit for: ${key}`)
    return entry.data
  }

  /**
   * Set data in cache
   */
  set<T>(url: string, data: T, config?: Partial<CacheConfig>, params?: Record<string, any>): void {
    const key = this.generateKey(url, params)
    const ttl = config?.ttl || this.defaultTTL
    const now = Date.now()
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl
    }
    
    this.cache.set(key, entry)
    console.log(`💾 Cache set for: ${key} (TTL: ${ttl}ms)`)
  }

  /**
   * Invalidate cache entry
   */
  invalidate(url: string, params?: Record<string, any>): void {
    const key = this.generateKey(url, params)
    this.cache.delete(key)
    console.log(`🗑️ Cache invalidated: ${key}`)
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const size = this.cache.size
    this.cache.clear()
    console.log(`🧹 Cache cleared (${size} entries)`)
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    let cleaned = 0
    for (const [key, entry] of this.cache.entries()) {
      if (!this.isValid(entry)) {
        this.cache.delete(key)
        cleaned++
      }
    }
    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} expired cache entries`)
    }
  }
}

// Global cache instance
export const apiCache = new APICache()

// Auto-cleanup every 5 minutes
setInterval(() => {
  apiCache.cleanup()
}, 5 * 60 * 1000)

/**
 * Enhanced fetch function with caching
 */
export async function cachedFetch<T = any>(
  url: string,
  options?: RequestInit & { cacheConfig?: Partial<CacheConfig> },
  params?: Record<string, any>
): Promise<T> {
  // Check cache first
  const cachedData = apiCache.get<T>(url, params)
  if (cachedData !== null) {
    return cachedData
  }

  // Build URL with parameters
  let fetchUrl = url
  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value))
      }
    })
    const paramString = searchParams.toString()
    if (paramString) {
      fetchUrl = `${url}?${paramString}`
    }
  }

  // Fetch fresh data
  console.log(`🌐 Fetching fresh data: ${fetchUrl}`)
  const response = await fetch(fetchUrl, options)
  
  if (!response.ok) {
    throw new Error(`API responded with status ${response.status}`)
  }
  
  const data = await response.json()
  
  // Cache the response
  apiCache.set(url, data, options?.cacheConfig, params)
  
  return data
}

/**
 * Cache configurations for different API endpoints
 * Optimized for better performance vs freshness balance
 */
export const cacheConfigs = {
  // Enhanced odds - cache for 3 minutes (increased from 2 for better performance)
  // Live data changes frequently but 3 minutes is reasonable for sports odds
  enhancedOdds: { ttl: 3 * 60 * 1000 },
  
  // Player analytics - cache for 45 minutes (increased from 30 for better performance)
  // Player data changes less frequently, longer cache improves performance
  playerAnalytics: { ttl: 45 * 60 * 1000 },
  
  // Team stats - cache for 20 minutes (increased from 15 for better performance)
  // Team stats don't change that frequently during a season
  teamStats: { ttl: 20 * 60 * 1000 },
  
  // Betting trends - cache for 7 minutes (increased from 5 for better performance)
  // Trends change moderately frequently, but 7 minutes balances freshness and performance
  bettingTrends: { ttl: 7 * 60 * 1000 },
  
  // Line movement - cache for 2 minutes (increased from 1 for better performance)
  // Very time-sensitive but 2 minutes reduces API calls while maintaining reasonable freshness
  lineMovement: { ttl: 2 * 60 * 1000 },
  
  // Live games - cache for 30 seconds (new config for live game data)
  // Live scores need to be very fresh but some caching helps performance
  liveGames: { ttl: 30 * 1000 },
  
  // User data - cache for 10 minutes (new config for user profile data)
  // User data changes infrequently, longer cache improves performance
  userData: { ttl: 10 * 60 * 1000 }
} as const

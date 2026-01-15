"use client"

import { useEffect, useState } from "react"
import type { SupportedSportKey } from "@/lib/types"
import { cachedFetch, cacheConfigs } from "@/lib/api-cache"

export interface EnhancedOddsGame {
  id: string
  sport: SupportedSportKey | string
  sportKey?: SupportedSportKey | string
  homeTeam: string
  awayTeam: string
  commenceTime: string | Date
  homeOdds?: {
    best?: {
      bookmaker: string
      odds: number
    }
  }
  awayOdds?: {
    best?: {
      bookmaker: string
      odds: number
    }
  }
  bookmakers?: string[]
}

export interface EnhancedOddsResponseBody {
  success: boolean
  data: EnhancedOddsGame[]
  source?: string
  error?: string
}

export function useEnhancedOdds(sport: SupportedSportKey) {
  const [data, setData] = useState<EnhancedOddsGame[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const params = {
          sport,
          strategy: "auto",
          includeAdvantages: "false",
        }
        
        console.log('📡 Fetching enhanced odds with caching:', { sport, params })
        
        const body: EnhancedOddsResponseBody = await cachedFetch(
          '/api/enhanced-odds',
          {
            cacheConfig: cacheConfigs.enhancedOdds
          },
          params
        )
        
        console.log('📡 Enhanced odds response:', { 
          sport, 
          success: body.success, 
          dataLength: body.data?.length, 
          source: body.source, 
          error: body.error 
        })
        
        if (!cancelled) {
          if (!body.success) {
            setError(body.error || "Failed to load odds data")
            setData([])
          } else {
            setData(body.data || [])
          }
        }
      } catch (err) {
        console.error('❌ Enhanced odds fetch error:', err)
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error")
          setData([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [sport])

  return { data, loading, error }
}

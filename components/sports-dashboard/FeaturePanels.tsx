"use client"

import React, { useEffect, useState } from "react"
import { GameCard } from "./shared/GameCard"
import { TabSkeleton } from "./shared/LoadingSkeleton"
import { useSportsStore, type SportsFeatureView } from "@/lib/stores/sports-store"
import type { SupportedSportKey } from "@/lib/types"

interface EnhancedOddsGame {
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

interface EnhancedOddsResponseBody {
  success: boolean
  data: EnhancedOddsGame[]
  source?: string
  error?: string
}

function useEnhancedOdds(sport: SupportedSportKey) {
  const [data, setData] = useState<EnhancedOddsGame[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({
          sport,
          strategy: "auto",
          includeAdvantages: "false",
        })
        const res = await fetch(`/api/enhanced-odds?${params.toString()}`)
        if (!res.ok) {
          throw new Error(`API responded with status ${res.status}`)
        }
        const body: EnhancedOddsResponseBody = await res.json()
        if (!cancelled) {
          if (!body.success) {
            setError(body.error || "Failed to load odds data")
            setData([])
          } else {
            setData(body.data || [])
          }
        }
      } catch (err) {
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

function LiveOddsPanel({ sport }: { sport: SupportedSportKey }) {
  const { data, loading, error } = useEnhancedOdds(sport)

  if (loading && !data) {
    return <TabSkeleton cardCount={9} />
  }

  if (error) {
    return (
      <div className="p-6 text-sm text-red-300 bg-red-900/20 border border-red-500/40 rounded-xl mt-4">
        <p className="font-semibold mb-1">Unable to load live odds right now.</p>
        <p className="opacity-80 break-words">{error}</p>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-6 text-sm text-gray-300 bg-black/10 border border-white/10 rounded-xl mt-4">
        <p>No current games found for this sport. Try again a bit later when new odds are available.</p>
      </div>
    )
  }

  return (
    <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {data.map((game) => {
        const commence = game.commenceTime instanceof Date
          ? game.commenceTime
          : new Date(game.commenceTime)

        return (
          <GameCard
            key={game.id}
            sport={(game.sportKey || game.sport || sport) as string}
            game={{
              id: game.id,
              sport: (game.sportKey || game.sport || sport) as string,
              homeTeam: game.homeTeam,
              awayTeam: game.awayTeam,
              gameTime: commence,
              spread: undefined,
              total: undefined,
              moneyline: undefined,
              stats: [
                game.homeOdds?.best && {
                  label: `${game.homeTeam} best ML`,
                  value: game.homeOdds.best.odds,
                  color: "teal" as const,
                },
                game.awayOdds?.best && {
                  label: `${game.awayTeam} best ML`,
                  value: game.awayOdds.best.odds,
                  color: "gold" as const,
                },
              ].filter(Boolean) as any,
              status: "UPCOMING",
            }}
          />
        )
      })}
    </div>
  )
}

function PanelHeader({ feature }: { feature: SportsFeatureView }) {
  const titles: Record<SportsFeatureView, string> = {
    live_odds: "Live Odds Comparison",
    player_props: "Player Props Explorer",
    matchups: "Matchup Breakdown",
    game_dashboard: "Game Dashboard",
    injuries: "Injury & Availability Report",
    upcoming_games: "Upcoming Games Schedule",
    historical_trends: "Historical Betting Trends",
    team_analytics: "Team Analytics & Advanced Stats",
    line_movement: "Line Movement History",
  }

  return (
    <div className="mt-6 mb-2 flex items-baseline justify-between">
      <h2 className="text-xl font-semibold text-[#F5F5F5] tracking-tight">
        {titles[feature] ?? "Sports Insight"}
      </h2>
    </div>
  )
}

export function FeaturePanels() {
  const activeSport = useSportsStore((state) => state.activeSport)
  const activeFeature = useSportsStore((state) => state.activeFeature)

  return (
    <section className="px-4 md:px-6 pb-8">
      <PanelHeader feature={activeFeature} />
      {activeFeature === "live_odds" && (
        <LiveOddsPanel sport={activeSport} />
      )}
      {/* Future panels for other features will be added here, all using real data paths. */}
    </section>
  )
}

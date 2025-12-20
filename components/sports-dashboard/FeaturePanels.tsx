"use client"

import React from "react"
import { useEffect, useState } from "react"
// DISABLED: Not needed while "Feature Coming Soon" wall is active
// import { useEffect, useState } from "react"
// import { GameCard } from "./shared/GameCard"
// import { TabSkeleton } from "./shared/LoadingSkeleton"
import { GameCard } from "./shared/GameCard"
import { TabSkeleton } from "./shared/LoadingSkeleton"
import { useSportsStore, type SportsFeatureView } from "@/lib/stores/sports-store"
import type { SupportedSportKey } from "@/lib/types"
import { X, Activity, LineChart, Users, Target } from "lucide-react"

// DISABLED: Advanced live betting components not needed while "Feature Coming Soon" wall is active
// import { LiveGameCard } from "@/components/live-betting/LiveGameCard"
// import { OddsGrid } from "@/components/live-betting/OddsGrid"
// import { LineMovementChart } from "@/components/live-betting/LineMovementChart"
// import { BettingTrendsDashboard } from "@/components/live-betting/BettingTrendsDashboard"
import { LiveGameCard } from "@/components/live-betting/LiveGameCard"
import { OddsGrid } from "@/components/live-betting/OddsGrid"
import { LineMovementChart } from "@/components/live-betting/LineMovementChart"
import { BettingTrendsDashboard } from "@/components/live-betting/BettingTrendsDashboard"

// DISABLED: Enhanced panels not needed while "Feature Coming Soon" wall is active
// import {
//   LiveScoresPanelEnhanced as LiveScoresPanelWithDemo,
//   UpcomingGamesOddsPanelEnhanced as UpcomingGamesOddsPanelWithDemo,
//   LineMovementPanelEnhanced as LineMovementPanelWithDemo,
//   BettingTrendsPanelEnhanced as BettingTrendsPanelWithDemo,
//   TeamPlayerAnalyticsPanelEnhanced as TeamPlayerAnalyticsPanelWithDemo,
// } from "./FeaturePanelsEnhanced"

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
        console.log('📡 Fetching enhanced odds:', { sport, url: `/api/enhanced-odds?${params.toString()}` })
        const res = await fetch(`/api/enhanced-odds?${params.toString()}`)
        if (!res.ok) {
          throw new Error(`API responded with status ${res.status}`)
        }
        const body: EnhancedOddsResponseBody = await res.json()
        console.log('📡 Enhanced odds response:', { sport, success: body.success, dataLength: body.data?.length, source: body.source, error: body.error })
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

// Note: any external team analytics provider has been removed.

// ============================================================================
// ENHANCED PANELS WITH REAL-TIME FEATURES
// ============================================================================

/**
 * Enhanced Live Scores Panel with WebSocket support
 */
function LiveScoresPanelEnhanced({ sport }: { sport: SupportedSportKey }) {
  const { data, loading } = useEnhancedOdds(sport)

  if (loading && !data) return <TabSkeleton cardCount={3} />

  // Show first 3 games as live game cards
  const gamesToShow = data?.slice(0, 3) || []

  return (
    <div className="space-y-4">
      {gamesToShow.map((game) => (
        <LiveGameCard
          key={game.id}
          sport={sport}
          gameId={game.id}
        />
      ))}
      {gamesToShow.length === 0 && (
        <div className="p-6 text-sm text-gray-300 bg-black/10 border border-white/10 rounded-xl">
          <p>No live games available. Check back during game time for real-time scores!</p>
        </div>
      )}
    </div>
  )
}

/**
 * Enhanced Upcoming Games & Odds Panel with multi-book comparison
 */
function UpcomingGamesOddsPanelEnhanced({ sport }: { sport: SupportedSportKey }) {
  const { data, loading } = useEnhancedOdds(sport)

  if (loading && !data) return <TabSkeleton cardCount={3} />

  const gamesToShow = data?.slice(0, 3) || []

  return (
    <div className="space-y-6">
      {gamesToShow.map((game) => (
        <OddsGrid
          key={game.id}
          sport={sport}
          gameId={game.id}
        />
      ))}
      {gamesToShow.length === 0 && (
        <div className="p-6 text-sm text-gray-300 bg-black/10 border border-white/10 rounded-xl">
          <p>No upcoming games with odds available.</p>
        </div>
      )}
    </div>
  )
}

/**
 * Enhanced Line Movement Panel with historical tracking
 */
function LineMovementPanelEnhanced({ sport }: { sport: SupportedSportKey }) {
  const { data, loading } = useEnhancedOdds(sport)

  if (loading && !data) return <TabSkeleton cardCount={2} />

  const gamesToShow = data?.slice(0, 2) || []

  return (
    <div className="space-y-6">
      {gamesToShow.map((game) => (
        <LineMovementChart
          key={game.id}
          sport={sport}
          gameId={game.id}
        />
      ))}
      {gamesToShow.length === 0 && (
        <div className="p-6 text-sm text-gray-300 bg-black/10 border border-white/10 rounded-xl">
          <p>No line movement data available.</p>
        </div>
      )}
    </div>
  )
}

/**
 * Enhanced Betting Trends Panel with sharp money analysis
 */
function BettingTrendsPanelEnhanced({ sport }: { sport: SupportedSportKey }) {
  const { data, loading } = useEnhancedOdds(sport)

  if (loading && !data) return <TabSkeleton cardCount={2} />

  const gamesToShow = data?.slice(0, 2) || []

  return (
    <div className="space-y-6">
      {gamesToShow.map((game) => (
        <BettingTrendsDashboard
          key={game.id}
          sport={sport}
          gameId={game.id}
        />
      ))}
      {gamesToShow.length === 0 && (
        <div className="p-6 text-sm text-gray-300 bg-black/10 border border-white/10 rounded-xl">
          <p>No betting trends data available.</p>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// ORIGINAL BASIC PANELS (Kept for fallback)
// ============================================================================

function LiveOddsPanel({ sport }: { sport: SupportedSportKey }) {
  const { data, loading, error } = useEnhancedOdds(sport)

  if (loading && !data) {
    return <TabSkeleton cardCount={9} />
  }

  if (error) {
    return (
      <div className="p-6 text-sm text-red-300 bg-red-900/20 border border-red-500/40 rounded-xl mt-4">
        <p className="font-semibold mb-1">Data Unavailable</p>
        <p className="opacity-80 wrap-break-word">Sorry, we are having difficulty accessing the data right now. Please come back later and try again.</p>
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

function LiveScoresPanel({ sport }: { sport: SupportedSportKey }) {
  const { data, loading, error } = useEnhancedOdds(sport)

  if (loading && !data) return <TabSkeleton cardCount={4} />

  if (error) {
    return (
      <div className="p-6 text-sm text-red-300 bg-red-900/20 border border-red-500/40 rounded-xl">
        <p className="font-semibold mb-1">Data Unavailable</p>
        <p className="opacity-80">Sorry, we are having difficulty accessing the data right now. Please come back later and try again.</p>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-6 text-sm text-gray-300 bg-black/10 border border-white/10 rounded-xl">
        <p>No games are currently available. Live scores will appear during game time.</p>
      </div>
    )
  }

  return (
    <div className="mt-4 space-y-3">
      {data.slice(0, 10).map((game) => {
        const commence = game.commenceTime instanceof Date
          ? game.commenceTime
          : new Date(game.commenceTime)

        const statusLabel = commence > new Date() ? "UPCOMING" : "IN PROGRESS / FINAL"

        return (
          <div
            key={game.id}
            className="p-4 bg-black/20 border border-white/10 rounded-lg flex items-center justify-between"
          >
            <div>
              <div className="text-sm font-semibold text-[#F5F5F5]">
                {game.awayTeam} @ {game.homeTeam}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {commence.toLocaleString()}
              </div>
            </div>
            <div className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-100">
              {statusLabel}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function UpcomingGamesOddsPanel({ sport }: { sport: SupportedSportKey }) {
  return <LiveOddsPanel sport={sport} />
}

function BettingTrendsPanel({ sport }: { sport: SupportedSportKey }) {
  const { data, loading, error } = useEnhancedOdds(sport)

  if (loading && !data) return <TabSkeleton cardCount={4} />
  if (error) {
    return (
      <div className="p-6 text-sm text-red-300 bg-red-900/20 border border-red-500/40 rounded-xl">
        <p className="font-semibold mb-1">Data Unavailable</p>
        <p className="opacity-80">Sorry, we are having difficulty accessing the data right now. Please come back later and try again.</p>
      </div>
    )
  }
  if (!data || data.length === 0) {
    return (
      <div className="p-6 text-sm text-gray-300 bg-black/10 border border-white/10 rounded-xl">
        <p>No betting trends available yet. Check back closer to game time.</p>
      </div>
    )
  }

  return (
    <div className="mt-4 space-y-3">
      {data.slice(0, 6).map((game) => (
        <div key={game.id} className="p-4 bg-black/20 border border-white/10 rounded-lg">
          <div className="text-sm font-semibold text-[#F5F5F5] mb-2">
            {game.awayTeam} @ {game.homeTeam}
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-black/30 rounded">
              <div className="text-gray-400 mb-1">Public Betting</div>
              <div className="text-gray-300">Detailed splits coming soon.</div>
            </div>
            <div className="p-3 bg-black/30 rounded">
              <div className="text-gray-400 mb-1">Sharp Action</div>
              <div className="text-gray-300">Will highlight sharp moves on key games.</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function WeatherConditionsPanel() {
  return (
    <div className="flex items-center justify-center min-h-[260px]">
      <div className="max-w-md w-full p-8 bg-linear-to-br from-[#1a1f2e] to-[#151923] border border-white/10 rounded-xl text-center">
        <h3 className="text-xl font-bold text-[#F5F5F5] mb-3">Weather impact coming soon</h3>
        <p className="text-sm text-gray-400 mb-4">
          Real-time weather forecasts and historical impact on game totals will appear here in a
          future update.
        </p>
        <p className="text-xs text-gray-500">
          Wind, precipitation, and temperature trends will help you understand how the environment
          shifts edges on sides and totals.
        </p>
      </div>
    </div>
  )
}

function LineMovementPanel({ sport }: { sport: SupportedSportKey }) {
  const { data, loading, error } = useEnhancedOdds(sport)

  if (loading && !data) return <TabSkeleton cardCount={4} />
  if (error) {
    return (
      <div className="p-6 text-sm text-red-300 bg-red-900/20 border border-red-500/40 rounded-xl">
        <p className="font-semibold mb-1">Data Unavailable</p>
        <p className="opacity-80">Sorry, we are having difficulty accessing the data right now. Please come back later and try again.</p>
      </div>
    )
  }
  if (!data || data.length === 0) {
    return (
      <div className="p-6 text-sm text-gray-300 bg-black/10 border border-white/10 rounded-xl">
        <p>Line movement data will appear here once markets are more active.</p>
      </div>
    )
  }

  return (
    <div className="mt-4 space-y-3">
      {data.slice(0, 6).map((game) => (
        <div key={game.id} className="p-4 bg-black/20 border border-white/10 rounded-lg">
          <div className="text-sm font-semibold text-[#F5F5F5] mb-2">
            {game.awayTeam} @ {game.homeTeam}
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-gray-400 mb-1">Current best ML</div>
              <div className="text-[#20B2AA] font-semibold">
                {game.homeOdds?.best?.odds ?? game.awayOdds?.best?.odds ?? "N/A"}
              </div>
            </div>
            <div>
              <div className="text-gray-400 mb-1">Movement</div>
              <div className="text-gray-300">Opening vs now comparisons coming soon.</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function TeamPlayerAnalyticsPanel({ sport }: { sport: SupportedSportKey }) {
  const { data, loading, error } = useEnhancedOdds(sport)

  if (loading && !data) return <TabSkeleton cardCount={3} />
  if (error) {
    return (
      <div className="p-6 text-sm text-red-300 bg-red-900/20 border border-red-500/40 rounded-xl">
        <p className="font-semibold mb-1">Data Unavailable</p>
        <p className="opacity-80">Sorry, we are having difficulty accessing the data right now. Please come back later and try again.</p>
      </div>
    )
  }
  if (!data || data.length === 0) {
    return (
      <div className="p-6 text-sm text-gray-300 bg-black/10 border border-white/10 rounded-xl">
        <p>Analytics will appear here once more data sources are connected.</p>
      </div>
    )
  }

  const primaryGame = data[0]

  return (
    <div className="mt-4 space-y-3">
      <p className="text-sm text-gray-400">
        This dashboard previously used a third-party provider for deep team and player analytics.
        That integration has been disabled.
      </p>
      <div className="p-5 bg-linear-to-br from-[#1a1f2e] to-[#151923] border border-white/10 rounded-xl">
        <div className="flex items-baseline justify-between mb-3">
          <div className="text-base font-bold text-[#F5F5F5]">
            {primaryGame.awayTeam} @ {primaryGame.homeTeam}
          </div>
          <div className="text-xs text-gray-400">
            {new Date(primaryGame.commenceTime).toLocaleString()}
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-400">
          In a future update, this view can be wired to a different stats provider or to your own
          internal database for team trends, player prop projections, and injury summaries.
        </div>
      </div>
    </div>
  )
}

function PanelHeader({ feature }: { feature: SportsFeatureView | null }) {
  const titles: Record<SportsFeatureView, string> = {
    live_scores: "Live Scores & In-Game Updates",
    upcoming_games_odds: "Upcoming Games & Live Odds",
    team_player_analytics: "Team & Player Analytics",
    line_movement: "Line Movement History",
    betting_trends: "Betting Trends & Public Action",
    weather_conditions: "Weather Impact Analysis",
  }

  if (!feature) {
    return null
  }

  return (
    <h2 className="text-2xl font-bold text-[#F5F5F5] tracking-tight">
      {titles[feature] ?? "Sports Insight"}
    </h2>
  )
}

export function FeaturePanels() {
  const activeSport = useSportsStore((state) => state.activeSport)
  const activeFeature = useSportsStore((state) => state.activeFeature)
  const setActiveFeature = useSportsStore((state) => state.setActiveFeature)

  // DISABLED: No API calls while "Feature Coming Soon" wall is active
  // This prevents unnecessary API usage while features are in development
  // const { data: oddsData, loading: oddsLoading } = useEnhancedOdds(activeSport)

  if (!activeFeature) {
    return null
  }

  const handleClose = () => {
    setActiveFeature(null)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  return (
    <>
      {/* Modal Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
        <div className="relative w-full max-w-6xl my-8">
          <section className="bg-[#1b212c] border border-white/20 rounded-2xl shadow-2xl">
            {/* Header with Close Button */}
            <div className="sticky top-0 bg-[#1b212c] border-b border-white/10 rounded-t-2xl z-10">
              <div className="px-6 py-4 flex items-center justify-between">
                <PanelHeader feature={activeFeature} />
                <button
                  onClick={handleClose}
                  className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
                  aria-label="Close panel"
                >
                  <X className="h-5 w-5 text-gray-300" />
                </button>
              </div>
            </div>

            {/* Panel Content */}
            <div className="px-6 pb-8">
              {/* Feature Coming Soon Overlay - Blocks all features for all sports */}
              <div className="flex items-center justify-center min-h-[400px] py-12">
                <div className="max-w-2xl w-full p-12 bg-linear-to-br from-[#1a1f2e] to-[#151923] border-2 border-[#20B2AA]/30 rounded-2xl text-center shadow-2xl">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#20B2AA]/10 border border-[#20B2AA]/40 mb-6">
                    <Target className="w-10 h-10 text-[#20B2AA]" />
                  </div>

                  <h3 className="text-3xl font-bold text-[#F5F5F5] mb-4">
                    Feature Coming Soon
                  </h3>

                  <p className="text-lg text-gray-300 mb-6 leading-relaxed">
                    We're working hard to bring you advanced sports analytics, live betting insights, and real-time data tracking.
                  </p>

                  <div className="flex items-center justify-center gap-3 text-sm text-gray-400 mb-8">
                    <div className="flex items-center gap-2 px-4 py-2 bg-black/30 rounded-lg border border-white/10">
                      <Activity className="w-4 h-4 text-[#20B2AA]" />
                      <span>Live Scores</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-black/30 rounded-lg border border-white/10">
                      <LineChart className="w-4 h-4 text-[#20B2AA]" />
                      <span>Line Movement</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-black/30 rounded-lg border border-white/10">
                      <Users className="w-4 h-4 text-[#20B2AA]" />
                      <span>Player Analytics</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500">
                    Check back soon for updates. We're fine-tuning the experience to deliver the best sports insights.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}

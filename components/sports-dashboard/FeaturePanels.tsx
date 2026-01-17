"use client"

import React, { memo, useMemo, useCallback, useState } from "react"
import { GameCard } from "./shared/GameCard"
import { TabSkeleton } from "./shared/LoadingSkeleton"
import { useSportsStore, type SportsFeatureView } from "@/lib/stores/sports-store"
import type { SupportedSportKey } from "@/lib/types"
import { X, Activity, LineChart, Users, Target, AlertTriangle, TrendingUp, BarChart3 } from "lucide-react"

// Extracted hooks and components
import { useEnhancedOdds, type EnhancedOddsGame } from "./hooks/useEnhancedOdds"
import { TeamPlayerAnalyticsPanel } from "./panels/TeamPlayerAnalyticsPanel"
import { LineMovementPanelEnhanced } from "./panels/LineMovementPanelEnhanced"
import { BettingTrendsPanelEnhanced } from "./panels/BettingTrendsPanelEnhanced"

// Lazy load heavy components to improve initial load performance
import dynamic from "next/dynamic"

const LiveGameCard = dynamic(() => import("@/components/live-betting/LiveGameCard").then(mod => ({ default: mod.LiveGameCard })), {
  loading: () => <div className="animate-pulse bg-gray-800 h-32 rounded-lg mb-2"></div>,
  ssr: false
})

const OddsGrid = dynamic(() => import("@/components/live-betting/OddsGrid").then(mod => ({ default: mod.OddsGrid })), {
  loading: () => <div className="animate-pulse bg-gray-800 h-64 rounded-lg"></div>,
  ssr: false
})

const LineMovementChart = dynamic(() => import("@/components/live-betting/LineMovementChart").then(mod => ({ default: mod.LineMovementChart })), {
  loading: () => <div className="animate-pulse bg-gray-800 h-48 rounded-lg"></div>,
  ssr: false
})

const BettingTrendsDashboard = dynamic(() => import("@/components/live-betting/BettingTrendsDashboard").then(mod => ({ default: mod.BettingTrendsDashboard })), {
  loading: () => <div className="animate-pulse bg-gray-800 h-64 rounded-lg"></div>,
  ssr: false
})

// DISABLED: Enhanced panels not needed while "Feature Coming Soon" wall is active
// import {
//   LiveScoresPanelEnhanced as LiveScoresPanelWithDemo,
//   UpcomingGamesOddsPanelEnhanced as UpcomingGamesOddsPanelWithDemo,
//   LineMovementPanelEnhanced as LineMovementPanelWithDemo,
//   BettingTrendsPanelEnhanced as BettingTrendsPanelWithDemo,
//   TeamPlayerAnalyticsPanelEnhanced as TeamPlayerAnalyticsPanelWithDemo,
// } from "./FeaturePanelsEnhanced"


// Note: any external team analytics provider has been removed.

// ============================================================================
// ENHANCED PANELS WITH REAL-TIME FEATURES
// ============================================================================

/**
 * Enhanced Live Scores Panel with WebSocket support
 */
export function LiveScoresPanelEnhanced({ sport, subscriptionTier }: { sport: SupportedSportKey; subscriptionTier: string }) {
  const { data, loading, error } = useEnhancedOdds(sport)

  const handleBetClick = (game: any) => {
    // Always navigate to TiltLab with game information
    console.log('Bet clicked for game:', game, 'subscriptionTier:', subscriptionTier)
    
    // Store game data for pre-filling TiltLab
    const gameData = {
      awayTeam: game.awayTeam,
      homeTeam: game.homeTeam,
      sport: game.sport || sport,
      odds: {
        home: game.homeOdds?.best?.odds,
        away: game.awayOdds?.best?.odds
      },
      commenceTime: game.commenceTime,
      source: 'live-scores' // Track where this came from
    }
    
    sessionStorage.setItem('pendingBetGame', JSON.stringify(gameData))
    localStorage.setItem('aiAdvisorFromLiveOdds', 'true') // Use existing flag
    
    // Navigate to AI Picks tab
    window.location.href = "/?tab=ai-picks"
    alert(`Opening TiltLab for ${game.awayTeam} @ ${game.homeTeam}...`)
  }

  if (loading && !data) return <TabSkeleton cardCount={3} />

  if (error) {
    return (
      <div className="p-6 text-sm bg-red-900/20 border border-red-500/30 rounded-xl">
        <p className="text-red-400 font-semibold">⚠️ Error loading live scores</p>
        <p className="text-red-300/70 mt-2">{error}</p>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-6 text-sm text-gray-300 bg-black/10 border border-white/10 rounded-xl">
        <p>No live games available. Check back during game time for real-time scores!</p>
      </div>
    )
  }

  const now = new Date()

  return (
    <div className="space-y-4">
      {data.map((game) => {
        const commence = game.commenceTime instanceof Date ? game.commenceTime : new Date(game.commenceTime)
        const isLive = commence <= now
        const isPast = commence < new Date(now.getTime() - 4 * 60 * 60 * 1000) // 4 hours ago

        return (
          <div key={game.id} className="bg-linear-to-br from-[#1a1f2e] to-[#151923] border border-white/10 rounded-xl p-6">
            {/* Status Badge */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {isLive && !isPast && (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-xs font-bold text-red-400">LIVE</span>
                  </div>
                )}
                {isPast && (
                  <div className="px-3 py-1 rounded-full bg-gray-500/20 border border-gray-500/40">
                    <span className="text-xs font-bold text-gray-400">FINAL</span>
                  </div>
                )}
                {!isLive && (
                  <div className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/40">
                    <span className="text-xs font-bold text-blue-400">UPCOMING</span>
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-400">
                {commence.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            {/* Teams */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400">Away</span>
                  <span className="text-lg font-bold text-[#F5F5F5]">{game.awayTeam}</span>
                </div>
                {game.awayOdds?.best && (
                  <div className="text-right">
                    <div className="text-sm font-bold text-[#20B2AA]">
                      {game.awayOdds.best.odds > 0 ? '+' : ''}{game.awayOdds.best.odds}
                    </div>
                    <div className="text-xs text-gray-500">{game.awayOdds.best.bookmaker}</div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400">Home</span>
                  <span className="text-lg font-bold text-[#F5F5F5]">{game.homeTeam}</span>
                </div>
                {game.homeOdds?.best && (
                  <div className="text-right">
                    <div className="text-sm font-bold text-[#20B2AA]">
                      {game.homeOdds.best.odds > 0 ? '+' : ''}{game.homeOdds.best.odds}
                    </div>
                    <div className="text-xs text-gray-500">{game.homeOdds.best.bookmaker}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Bet Button */}
            {!isPast && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <button
                  onClick={() => handleBetClick(game)}
                  className="w-full bg-linear-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 cursor-pointer pointer-events-auto min-h-[48px] text-base"
                  style={{ minHeight: '48px', padding: '16px 24px' }}
                >
                  <TrendingUp className="h-5 w-5 shrink-0" />
                  <span className="font-semibold">Bet on This Game</span>
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/**
 * Enhanced Upcoming Games & Odds Panel with multi-book comparison
 */
function UpcomingGamesOddsPanelEnhanced({ sport }: { sport: SupportedSportKey }) {
  const { data, loading, error } = useEnhancedOdds(sport)

  if (loading && !data) return <TabSkeleton cardCount={3} />

  if (error) {
    return (
      <div className="p-6 text-sm bg-red-900/20 border border-red-500/30 rounded-xl">
        <p className="text-red-400 font-semibold">⚠️ Error loading odds data</p>
        <p className="text-red-300/70 mt-2">{error}</p>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-6 text-sm text-gray-300 bg-black/10 border border-white/10 rounded-xl">
        <p>No upcoming games with odds available.</p>
      </div>
    )
  }

  const now = new Date()
  const upcomingGames = data.filter(game => {
    const commence = game.commenceTime instanceof Date ? game.commenceTime : new Date(game.commenceTime)
    return commence > now
  })

  return (
    <div className="space-y-6">
      {upcomingGames.map((game) => {
        const commence = game.commenceTime instanceof Date ? game.commenceTime : new Date(game.commenceTime)
        const timeUntil = commence.getTime() - now.getTime()
        const hoursUntil = Math.floor(timeUntil / (1000 * 60 * 60))
        const daysUntil = Math.floor(hoursUntil / 24)

        return (
          <div key={game.id} className="bg-linear-to-br from-[#1a1f2e] to-[#151923] border border-white/20 rounded-xl p-6">
            {/* Game Header */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
              <div>
                <div className="text-xl font-bold text-[#F5F5F5] mb-1">
                  {game.awayTeam} @ {game.homeTeam}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>{commence.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  <span>•</span>
                  <span>{commence.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span>•</span>
                  <span className="text-[#20B2AA]">
                    {daysUntil > 0 ? `${daysUntil}d ${hoursUntil % 24}h` : `${hoursUntil}h`} away
                  </span>
                </div>
              </div>
            </div>

            {/* Odds Comparison */}
            <div className="grid grid-cols-2 gap-4">
              {/* Away Team Odds */}
              <div className="space-y-2">
                <div className="text-sm font-semibold text-gray-400 flex items-center gap-2">
                  <span>{game.awayTeam}</span>
                  <span className="text-xs text-gray-500">(Away)</span>
                </div>
                {game.awayOdds?.best ? (
                  <div className="p-3 bg-black/30 rounded-lg border border-[#20B2AA]/20">
                    <div className="text-xs text-gray-400 mb-1">Best Moneyline</div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-bold text-[#20B2AA]">
                        {game.awayOdds.best.odds > 0 ? '+' : ''}{game.awayOdds.best.odds}
                      </span>
                      <span className="text-xs text-gray-500">{game.awayOdds.best.bookmaker}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-black/20 rounded-lg">
                    <div className="text-xs text-gray-500">No odds available</div>
                  </div>
                )}
              </div>

              {/* Home Team Odds */}
              <div className="space-y-2">
                <div className="text-sm font-semibold text-gray-400 flex items-center gap-2">
                  <span>{game.homeTeam}</span>
                  <span className="text-xs text-gray-500">(Home)</span>
                </div>
                {game.homeOdds?.best ? (
                  <div className="p-3 bg-black/30 rounded-lg border border-[#FFD700]/20">
                    <div className="text-xs text-gray-400 mb-1">Best Moneyline</div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-bold text-[#FFD700]">
                        {game.homeOdds.best.odds > 0 ? '+' : ''}{game.homeOdds.best.odds}
                      </span>
                      <span className="text-xs text-gray-500">{game.homeOdds.best.bookmaker}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-black/20 rounded-lg">
                    <div className="text-xs text-gray-500">No odds available</div>
                  </div>
                )}
              </div>
            </div>

            {/* Bookmaker Info */}
            {game.bookmakers && game.bookmakers.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                <div className="text-xs text-gray-400">
                  Odds from {game.bookmakers.length} sportsbook{game.bookmakers.length !== 1 ? 's' : ''}
                </div>
                <div className="text-xs text-gray-500">
                  Compare lines to find the best value
                </div>
              </div>
            )}
          </div>
        )
      })}
      {upcomingGames.length === 0 && (
        <div className="p-6 text-sm text-gray-300 bg-black/10 border border-white/10 rounded-xl">
          <p>No upcoming games found. All games have already started.</p>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// STANDARD PANELS
// ============================================================================

function LiveOddsPanel({ sport, subscriptionTier }: { sport: SupportedSportKey; subscriptionTier: string }) {
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

function LiveScoresPanel({ sport, subscriptionTier }: { sport: SupportedSportKey; subscriptionTier: string }) {
  const { data, loading, error } = useEnhancedOdds(sport)

  const handleBetClick = (game: any) => {
    // Always navigate to TiltLab with game information
    console.log('Bet clicked for game:', game, 'subscriptionTier:', subscriptionTier)
    
    // Store game data for pre-filling TiltLab
    const gameData = {
      awayTeam: game.awayTeam,
      homeTeam: game.homeTeam,
      sport: game.sport || sport,
      odds: {
        home: game.homeOdds?.best?.odds,
        away: game.awayOdds?.best?.odds
      },
      commenceTime: game.commenceTime,
      source: 'live-scores' // Track where this came from
    }
    
    sessionStorage.setItem('pendingBetGame', JSON.stringify(gameData))
    localStorage.setItem('aiAdvisorFromLiveOdds', 'true') // Use existing flag
    
    // Navigate to AI Picks tab
    window.location.href = "/?tab=ai-picks"
    alert(`Opening TiltLab for ${game.awayTeam} @ ${game.homeTeam}...`)
  }

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
        const canBet = commence > new Date() // Can only bet on upcoming games

        return (
          <div
            key={game.id}
            className="p-4 bg-black/20 border border-white/10 rounded-lg"
          >
            <div className="flex items-center justify-between mb-3">
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
            
            {/* Bet Button */}
            {canBet && (
              <button
                onClick={() => handleBetClick(game)}
                className="w-full bg-linear-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 cursor-pointer pointer-events-auto min-h-[48px] text-base"
                style={{ minHeight: '48px', padding: '16px 24px' }}
              >
                <TrendingUp className="h-5 w-5 shrink-0" />
                <span className="font-semibold">Bet on This Game</span>
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

function UpcomingGamesOddsPanel({ sport }: { sport: SupportedSportKey }) {
  return <LiveOddsPanel sport={sport} subscriptionTier="premium" />
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

// Memoized panel components to prevent unnecessary re-renders
const MemoizedLiveScoresPanel = memo(LiveScoresPanelEnhanced)
const MemoizedUpcomingGamesPanel = memo(UpcomingGamesOddsPanelEnhanced)
const MemoizedLineMovementPanel = memo(LineMovementPanelEnhanced)
const MemoizedTeamPlayerPanel = memo(TeamPlayerAnalyticsPanel)
const MemoizedBettingTrendsPanel = memo(BettingTrendsPanelEnhanced)

export const FeaturePanels = memo(function FeaturePanels({ userData }: { userData?: { subscriptionTier?: string } }) {
  // Combine all store selections into a single hook call to avoid hooks rule violations
  const { 
    activeSport, 
    activeFeature, 
    setActiveFeature 
  } = useSportsStore((state) => ({
    activeSport: state.activeSport,
    activeFeature: state.activeFeature,
    setActiveFeature: state.setActiveFeature
  }))
  const [isPanelLoading, setIsPanelLoading] = useState(false)
  
  // Memoize subscription tier to prevent unnecessary recalculations
  const subscriptionTier = useMemo(() => userData?.subscriptionTier || "free", [userData?.subscriptionTier])

  // Optimize navigation function with useCallback
  const navigateToBettingFeature = useCallback((feature: 'smartslip' | 'tiltlab', game: any) => {
    // Store the game data for pre-filling
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pendingBetGame', JSON.stringify({
        awayTeam: game.awayTeam,
        homeTeam: game.homeTeam,
        sport: game.sport || activeSport,
        odds: {
          home: game.homeOdds?.best?.odds,
          away: game.awayOdds?.best?.odds
        },
        commenceTime: game.commenceTime
      }))
    }
    
    // Navigate to AI Picks tab
    window.location.hash = '#ai-picks'
    
    // Show toast notification
    if (feature === 'smartslip') {
      alert(`Navigating to SmartSlip for ${game.awayTeam} @ ${game.homeTeam}...`)
    } else {
      alert(`Navigating to TiltLab for ${game.awayTeam} @ ${game.homeTeam}...`)
    }
  }, [activeSport])

  // Early return if no active feature
  if (!activeFeature) {
    return null
  }

  // Optimize close handlers
  const handleClose = useCallback(() => {
    setActiveFeature(null)
  }, [setActiveFeature])

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }, [handleClose])

  // Memoize panel content rendering
  const renderPanelContent = useMemo(() => {
    setIsPanelLoading(true)
    
    const panelMap = {
      live_scores: <MemoizedLiveScoresPanel sport={activeSport} subscriptionTier={subscriptionTier} />,
      upcoming_games_odds: <MemoizedUpcomingGamesPanel sport={activeSport} />,
      line_movement: <MemoizedLineMovementPanel sport={activeSport} />,
      team_player_analytics: <MemoizedTeamPlayerPanel sport={activeSport} />,
      betting_trends: <MemoizedBettingTrendsPanel sport={activeSport} />
    }
    
    const content = panelMap[activeFeature as keyof typeof panelMap] || null
    
    // Simulate progressive loading
    setTimeout(() => setIsPanelLoading(false), 100)
    
    return content
  }, [activeFeature, activeSport, subscriptionTier])

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

            {/* Panel Content with Progressive Loading */}
            <div className="px-6 pb-8">
              {isPanelLoading ? (
                <div className="py-12">
                  <TabSkeleton cardCount={3} />
                </div>
              ) : (
                <div className="animate-fadeIn">
                  {renderPanelContent}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  )
})

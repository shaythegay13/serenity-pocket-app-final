/**
 * Live Betting Dashboard Page
 *
 * Complete integration example showing all four data layers:
 * 1. Live game data with real-time scores
 * 2. Multi-sportsbook odds comparison
 * 3. Line movement tracking
 * 4. Betting trends and sharp money indicators
 */

"use client"

import { useState, Suspense } from "react"
import { LiveGameCard } from "@/components/live-betting/LiveGameCard"
import { OddsGrid } from "@/components/live-betting/OddsGrid"
import { LineMovementChart } from "@/components/live-betting/LineMovementChart"
import { BettingTrendsDashboard } from "@/components/live-betting/BettingTrendsDashboard"
import { useSportsStore } from "@/lib/stores/sports-store"
import type { SupportedSportKey } from "@/lib/types"
import { Activity, TrendingUp, BarChart3, Users } from "lucide-react"

export default function LiveBettingPage() {
  const activeSport = useSportsStore((state) => state.activeSport)
  const [selectedGameId, setSelectedGameId] = useState<string>("game-example-1")
  const [activeView, setActiveView] = useState<"overview" | "detailed">("overview")

  // Example game IDs (in production, fetch from API)
  const exampleGames = [
    { id: "game-example-1", label: "Game 1" },
    { id: "game-example-2", label: "Game 2" },
    { id: "game-example-3", label: "Game 3" },
  ]

  return (
    <div className="min-h-screen bg-[#1b212c]">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#1b212c] sticky top-0 z-40">
        <div className="px-4 md:px-6 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#20B2AA]/10 border border-[#20B2AA]/30">
                  <Activity className="h-7 w-7 text-[#20B2AA]" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-[#F5F5F5] tracking-tight">
                    Live Betting Dashboard
                  </h1>
                  <p className="text-sm text-gray-400">
                    Real-time odds, line movement, and sharp money tracking
                  </p>
                </div>
              </div>
            </div>

            {/* View toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveView("overview")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                  activeView === "overview"
                    ? "bg-[#20B2AA] text-white"
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Overview
              </button>
              <button
                onClick={() => setActiveView("detailed")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                  activeView === "detailed"
                    ? "bg-[#20B2AA] text-white"
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                Detailed Analysis
              </button>
            </div>
          </div>

          {/* Game selector */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {exampleGames.map((game) => (
              <button
                key={game.id}
                onClick={() => setSelectedGameId(game.id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                  selectedGameId === game.id
                    ? "bg-[#20B2AA]/20 text-[#20B2AA] border border-[#20B2AA]/40"
                    : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10"
                }`}
              >
                {game.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 md:px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <Suspense fallback={<LoadingFallback />}>
            {activeView === "overview" ? (
              <OverviewView sport={activeSport} gameId={selectedGameId} />
            ) : (
              <DetailedView sport={activeSport} gameId={selectedGameId} />
            )}
          </Suspense>
        </div>
      </main>
    </div>
  )
}

/**
 * Overview View - Compact view with key information
 */
function OverviewView({ sport, gameId }: { sport: SupportedSportKey; gameId: string }) {
  return (
    <div className="space-y-6">
      {/* Live Game Card */}
      <LiveGameCard sport={sport} gameId={gameId} />

      {/* Odds Grid */}
      <OddsGrid sport={sport} gameId={gameId} />

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Best Odds Card */}
        <div className="bg-gradient-to-br from-[#1a1f2e] to-[#151923] border border-white/20 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-[#20B2AA]" />
            <h3 className="text-lg font-bold text-[#F5F5F5]">Best Available</h3>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            Always get the best odds across all sportsbooks
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-black/20 rounded">
              <span className="text-xs text-gray-400">Home ML</span>
              <span className="text-sm font-bold text-[#20B2AA]">-105</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-black/20 rounded">
              <span className="text-xs text-gray-400">Away ML</span>
              <span className="text-sm font-bold text-[#FFD700]">+120</span>
            </div>
          </div>
        </div>

        {/* Line Movement Card */}
        <div className="bg-gradient-to-br from-[#1a1f2e] to-[#151923] border border-white/20 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-[#F5F5F5]">Line Movement</h3>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            Track how lines have moved since opening
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Spread</span>
              <div className="flex items-center gap-1 text-green-400">
                <TrendingUp className="w-3 h-3" />
                <span className="text-sm font-bold">+3.2%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Total</span>
              <div className="flex items-center gap-1 text-red-400">
                <TrendingUp className="w-3 h-3 rotate-180" />
                <span className="text-sm font-bold">-1.8%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sharp Money Card */}
        <div className="bg-gradient-to-br from-[#1a1f2e] to-[#151923] border border-white/20 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-[#FFD700]" />
            <h3 className="text-lg font-bold text-[#F5F5F5]">Sharp Action</h3>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            Where professional bettors are placing money
          </p>
          <div className="px-3 py-2 bg-amber-500/20 border border-amber-500/40 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-amber-400">UNDER</span>
              <span className="text-sm font-bold text-amber-400">HIGH</span>
            </div>
            <p className="text-xs text-gray-300">72% sharp money + RLM detected</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Detailed View - Full analysis with all components
 */
function DetailedView({ sport, gameId }: { sport: SupportedSportKey; gameId: string }) {
  return (
    <div className="space-y-6">
      {/* Live Game Card */}
      <LiveGameCard sport={sport} gameId={gameId} />

      {/* Odds Grid */}
      <OddsGrid sport={sport} gameId={gameId} />

      {/* Two Column Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Movement Chart */}
        <LineMovementChart sport={sport} gameId={gameId} />

        {/* Placeholder for second column */}
        <div className="bg-gradient-to-br from-[#1a1f2e] to-[#151923] border border-white/20 rounded-xl p-6">
          <h3 className="text-lg font-bold text-[#F5F5F5] mb-4">Bookmaker Comparison</h3>
          <p className="text-sm text-gray-400">
            Detailed comparison of odds across all sportsbooks will appear here
          </p>
        </div>
      </div>

      {/* Betting Trends Dashboard */}
      <BettingTrendsDashboard sport={sport} gameId={gameId} />

      {/* Additional Analysis Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Value Bets */}
        <div className="bg-gradient-to-br from-[#1a1f2e] to-[#151923] border border-white/20 rounded-xl p-6">
          <h3 className="text-lg font-bold text-[#F5F5F5] mb-4">Value Opportunities</h3>
          <p className="text-sm text-gray-400 mb-4">
            Bets with positive expected value based on market analysis
          </p>
          <div className="space-y-3">
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-green-400">UNDER 45.5</span>
                <span className="text-xs bg-green-500/20 px-2 py-1 rounded text-green-400">
                  +7.2% EV
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Market inefficiency detected. Sharp consensus aligned.
              </p>
            </div>
          </div>
        </div>

        {/* Market Summary */}
        <div className="bg-gradient-to-br from-[#1a1f2e] to-[#151923] border border-white/20 rounded-xl p-6">
          <h3 className="text-lg font-bold text-[#F5F5F5] mb-4">Market Summary</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Total Volume</span>
              <span className="text-sm font-bold text-[#F5F5F5]">High</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Market Efficiency</span>
              <span className="text-sm font-bold text-[#20B2AA]">92%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Sharp Activity</span>
              <span className="text-sm font-bold text-amber-400">Elevated</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Best Books</span>
              <span className="text-sm font-bold text-[#F5F5F5]">FanDuel, DraftKings</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Loading Fallback
 */
function LoadingFallback() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-[#1a1f2e] border border-white/10 rounded-xl p-6 animate-pulse">
          <div className="h-6 bg-white/10 rounded mb-4 w-1/3" />
          <div className="h-32 bg-white/10 rounded" />
        </div>
      ))}
    </div>
  )
}

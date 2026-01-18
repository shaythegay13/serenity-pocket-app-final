/**
 * Line Movement Chart Component
 *
 * Visualizes how betting lines have moved over time with:
 * - Time series chart showing opening vs current odds
 * - Percentage change indicators
 * - Steam move detection
 * - Reverse line movement highlighting
 */

"use client"

import React, { useState, useEffect } from "react"
import type { LineMovementData, LineMovementSnapshot } from "@/lib/types/live-betting"
import { ChartEmptyState } from "@/components/ui/chart-empty-state"

interface LineMovementChartProps {
  sport: string
  gameId: string
}

export function LineMovementChart({ sport, gameId }: LineMovementChartProps) {
  const [data, setData] = useState<LineMovementData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBetType, setSelectedBetType] = useState<"moneyline" | "spread" | "total">("spread")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/line-movement?sport=${sport}&gameId=${gameId}`)
        const result = await response.json()

        if (result.success) {
          setData(result.data)
        } else {
          setError(result.error || "Failed to load line movement")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 15000) // Refresh every 15 seconds

    return () => clearInterval(interval)
  }, [sport, gameId])

  if (loading) {
    return (
      <div className="bg-[#1a1f2e] border border-white/10 rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/10 rounded w-1/3" />
          <div className="h-64 bg-white/10 rounded" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-red-900/20 border border-red-500/40 rounded-xl p-6">
        <p className="text-sm text-red-300">Unable to load line movement{error && `: ${error}`}</p>
      </div>
    )
  }

  const { opening, consensus, movements } = data

  // Derived values based on selected market
  let homeChange = 0
  let awayChange = 0
  let currentMovementsHome: LineMovementSnapshot[] = []
  let currentMovementsAway: LineMovementSnapshot[] = []

  if (selectedBetType === "moneyline") {
    const openingML = opening?.moneyline
    const consensusML = consensus?.moneyline

    if (openingML?.home && consensusML?.home) {
      const current = (consensusML.home as any).odds || consensusML.home
      homeChange = calculateOddsChange(openingML.home.value, current)
    }

    if (openingML?.away && consensusML?.away) {
      const current = (consensusML.away as any).odds || consensusML.away
      awayChange = calculateOddsChange(openingML.away.value, current)
    }

    currentMovementsHome = movements.moneyline.home
    currentMovementsAway = movements.moneyline.away
  } else if (selectedBetType === "spread") {
    const openingSpread = opening?.spread
    const consensusSpread = consensus?.spread

    if (openingSpread?.home && consensusSpread?.home) {
      const current = (consensusSpread.home as any).odds || consensusSpread.home
      homeChange = calculateOddsChange(openingSpread.home.value, current)
    }

    if (openingSpread?.away && consensusSpread?.away) {
      const current = (consensusSpread.away as any).odds || consensusSpread.away
      awayChange = calculateOddsChange(openingSpread.away.value, current)
    }

    currentMovementsHome = movements.spread.home
    currentMovementsAway = movements.spread.away
  } else {
    // total: treat "away" side as Over and "home" side as Under for display
    const openingTotal = opening?.total
    const consensusTotal = consensus?.total

    if (openingTotal?.under && consensusTotal?.under) {
      const current = (consensusTotal.under as any).odds || consensusTotal.under
      homeChange = calculateOddsChange(openingTotal.under.value, current)
    }

    if (openingTotal?.over && consensusTotal?.over) {
      const current = (consensusTotal.over as any).odds || consensusTotal.over
      awayChange = calculateOddsChange(openingTotal.over.value, current)
    }

    currentMovementsHome = movements.total.under
    currentMovementsAway = movements.total.over
  }

  return (
    <div className="bg-linear-to-br from-[#1a1f2e] to-[#151923] border border-white/20 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-[#F5F5F5] mb-1">Line Movement History</h3>
            <p className="text-sm text-gray-400">
              {data.awayTeam} @ {data.homeTeam}
            </p>
          </div>
        </div>

        {/* Bet type selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedBetType("moneyline")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              selectedBetType === "moneyline"
                ? "bg-[#20B2AA] text-white"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            }`}
          >
            Moneyline
          </button>
          <button
            onClick={() => setSelectedBetType("spread")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              selectedBetType === "spread"
                ? "bg-[#20B2AA] text-white"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            }`}
          >
            Spread
          </button>
          <button
            onClick={() => setSelectedBetType("total")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              selectedBetType === "total"
                ? "bg-[#20B2AA] text-white"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            }`}
          >
            Total
          </button>
        </div>
      </div>

      {/* Movement summary */}
      <div className="p-6 grid grid-cols-2 gap-4">
        {/* Away/Over side */}
        <div className="p-4 bg-black/20 rounded-lg">
          <div className="text-xs text-gray-400 mb-2">
            {selectedBetType === "total" ? "Over" : data.awayTeam}
          </div>
          <div className="flex items-baseline gap-3 mb-2">
            <div className="text-sm text-gray-500 tabular-nums">
              Opening: {selectedBetType === "total"
                ? opening?.total?.over
                  ? formatOdds(opening.total.over.value)
                  : "N/A"
                : opening?.[selectedBetType]?.away
                ? formatOdds((opening as any)[selectedBetType].away.value)
                : "N/A"}
            </div>
            <div className="text-2xl font-bold text-[#20B2AA] tabular-nums">
              {selectedBetType === "total"
                ? consensus?.total?.over
                  ? formatOdds(((consensus.total as any).over.odds || (consensus.total as any).over) as number)
                  : "N/A"
                : consensus?.[selectedBetType]?.away
                ? formatOdds(((consensus as any)[selectedBetType].away.odds || (consensus as any)[selectedBetType].away) as number)
                : "N/A"}
            </div>
          </div>
          <div className={`flex items-center gap-1 text-sm ${
            awayChange > 0 ? "text-green-400" : awayChange < 0 ? "text-red-400" : "text-gray-400"
          }`}>
            {awayChange > 0 ? (
              <TrendingUp className="w-4 h-4" />
            ) : awayChange < 0 ? (
              <TrendingDown className="w-4 h-4" />
            ) : null}
            <span className="font-semibold tabular-nums">
              {awayChange > 0 ? "+" : ""}{awayChange.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Home/Under side */}
        <div className="p-4 bg-black/20 rounded-lg">
          <div className="text-xs text-gray-400 mb-2">
            {selectedBetType === "total" ? "Under" : data.homeTeam}
          </div>
          <div className="flex items-baseline gap-3 mb-2">
            <div className="text-sm text-gray-500 tabular-nums">
              Opening: {selectedBetType === "total"
                ? opening?.total?.under
                  ? formatOdds(opening.total.under.value)
                  : "N/A"
                : opening?.[selectedBetType]?.home
                ? formatOdds((opening as any)[selectedBetType].home.value)
                : "N/A"}
            </div>
            <div className="text-2xl font-bold text-[#FFD700] tabular-nums">
              {selectedBetType === "total"
                ? consensus?.total?.under
                  ? formatOdds(((consensus.total as any).under.odds || (consensus.total as any).under) as number)
                  : "N/A"
                : consensus?.[selectedBetType]?.home
                ? formatOdds(((consensus as any)[selectedBetType].home.odds || (consensus as any)[selectedBetType].home) as number)
                : "N/A"}
            </div>
          </div>
          <div className={`flex items-center gap-1 text-sm ${
            homeChange > 0 ? "text-green-400" : homeChange < 0 ? "text-red-400" : "text-gray-400"
          }`}>
            {homeChange > 0 ? (
              <TrendingUp className="w-4 h-4" />
            ) : homeChange < 0 ? (
              <TrendingDown className="w-4 h-4" />
            ) : null}
            <span className="font-semibold tabular-nums">
              {homeChange > 0 ? "+" : ""}{homeChange.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Movement timeline */}
      <div className="p-6 border-t border-white/10">
        <h4 className="text-sm font-bold text-[#F5F5F5] mb-4 flex items-center gap-2">
          <ZapIcon className="w-4 h-4 text-[#20B2AA]" />
          Recent Line Movements
        </h4>

        {currentMovementsHome.length > 0 || currentMovementsAway.length > 0 ? (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {[...currentMovementsHome, ...currentMovementsAway]
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .slice(0, 10)
              .map((movement, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-gray-400">
                      {new Date(movement.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="text-sm font-medium text-gray-300">
                      {movement.bookmaker}
                    </div>
                    <div className="px-2 py-0.5 bg-white/10 rounded text-xs text-gray-400">
                      {movement.side.toUpperCase()}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-[#20B2AA] tabular-nums">
                    {formatOdds(movement.odds.value)}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <ChartEmptyState message="No line movements recorded yet. Check back closer to game time for movement data." />
        )}
      </div>

      {/* Insights */}
      <div className="p-6 border-t border-white/10 bg-linear-to-r from-amber-500/10 to-transparent">
        <h4 className="text-sm font-bold text-[#F5F5F5] mb-3">Movement Insights</h4>
        <div className="space-y-2 text-sm">
          {Math.abs(homeChange) > 5 || Math.abs(awayChange) > 5 ? (
            <div className="flex items-start gap-2 text-amber-300">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>
                <strong>Significant Line Movement:</strong> Line has moved more than 5% since opening. This could indicate sharp money action.
              </p>
            </div>
          ) : (
            <div className="text-gray-400">
              Line has been relatively stable since opening
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

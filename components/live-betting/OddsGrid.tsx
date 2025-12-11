/**
 * Odds Grid Component
 *
 * Displays odds from multiple sportsbooks side-by-side with:
 * - Best odds highlighted
 * - Color-coded value indicators
 * - Heat map visualization
 * - Real-time updates
 */

"use client"

import React, { useState } from "react"
import { useLiveOdds } from "@/lib/hooks/useWebSocket"
import type { SupportedSportKey } from "@/lib/types"
import { formatOdds, americanToDecimal, calculateImpliedProbability } from "@/lib/utils/betting-calculations"
import { Trophy, TrendingUp, Activity } from "lucide-react"

interface OddsGridProps {
  sport: SupportedSportKey
  gameId: string
}

type BetTypeTab = "moneyline" | "spread" | "total"

export function OddsGrid({ sport, gameId }: OddsGridProps) {
  const { data: odds, loading, error, isConnected } = useLiveOdds(sport, gameId)
  const [activeBetType, setActiveBetType] = useState<BetTypeTab>("moneyline")

  if (loading) {
    return (
      <div className="bg-[#1a1f2e] border border-white/10 rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/10 rounded w-1/3" />
          <div className="h-64 bg-white/10 rounded" />
        </div>
      </div>
    )
  }

  if (error || !odds) {
    return (
      <div className="bg-red-900/20 border border-red-500/40 rounded-xl p-6">
        <p className="text-sm text-red-300">Unable to load odds{error && `: ${error}`}</p>
      </div>
    )
  }

  const { bookmakers, bestOdds } = odds as any // Type assertion for enhanced data

  return (
    <div className="bg-gradient-to-br from-[#1a1f2e] to-[#151923] border border-white/20 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-[#F5F5F5] mb-1">Live Odds Comparison</h3>
            <p className="text-sm text-gray-400">
              {odds.awayTeam} @ {odds.homeTeam}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isConnected && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/20 border border-green-500/40 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-semibold text-green-400">LIVE</span>
              </div>
            )}
          </div>
        </div>

        {/* Bet type tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveBetType("moneyline")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeBetType === "moneyline"
                ? "bg-[#20B2AA] text-white"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            }`}
          >
            Moneyline
          </button>
          <button
            onClick={() => setActiveBetType("spread")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeBetType === "spread"
                ? "bg-[#20B2AA] text-white"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            }`}
          >
            Spread
          </button>
          <button
            onClick={() => setActiveBetType("total")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeBetType === "total"
                ? "bg-[#20B2AA] text-white"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            }`}
          >
            Total
          </button>
        </div>
      </div>

      {/* Odds table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-black/20">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Sportsbook
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {activeBetType === "total" ? "Over" : odds.awayTeam}
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {activeBetType === "total" ? "Under" : odds.homeTeam}
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Implied Prob
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {bookmakers.map((book: any, index: number) => {
              const betData = book[activeBetType]
              if (!betData) return null

              const leftOdds = activeBetType === "total" ? betData.over : betData.away
              const rightOdds = activeBetType === "total" ? betData.under : betData.home

              const isBestLeft = activeBetType === "total"
                ? bestOdds?.total?.over?.bookmaker === book.bookmaker
                : activeBetType === "spread"
                ? bestOdds?.spread?.away?.bookmaker === book.bookmaker
                : bestOdds?.moneyline?.away?.bookmaker === book.bookmaker

              const isBestRight = activeBetType === "total"
                ? bestOdds?.total?.under?.bookmaker === book.bookmaker
                : activeBetType === "spread"
                ? bestOdds?.spread?.home?.bookmaker === book.bookmaker
                : bestOdds?.moneyline?.home?.bookmaker === book.bookmaker

              return (
                <tr key={index} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-300">
                    {book.bookmaker}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {isBestLeft && <Trophy className="w-4 h-4 text-[#FFD700]" />}
                      <div className={`font-bold ${isBestLeft ? "text-[#20B2AA]" : "text-gray-300"}`}>
                        {activeBetType !== "moneyline" && leftOdds.point && (
                          <span className="text-sm mr-1">
                            {leftOdds.point > 0 ? "+" : ""}{leftOdds.point}
                          </span>
                        )}
                        <span>{formatOdds(leftOdds.value)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {isBestRight && <Trophy className="w-4 h-4 text-[#FFD700]" />}
                      <div className={`font-bold ${isBestRight ? "text-[#20B2AA]" : "text-gray-300"}`}>
                        {activeBetType !== "moneyline" && rightOdds.point && (
                          <span className="text-sm mr-1">
                            {rightOdds.point > 0 ? "+" : ""}{rightOdds.point}
                          </span>
                        )}
                        <span>{formatOdds(rightOdds.value)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="text-xs text-gray-400">
                      {calculateImpliedProbability(leftOdds.value).toFixed(1)}% / {" "}
                      {calculateImpliedProbability(rightOdds.value).toFixed(1)}%
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Best odds summary */}
      {bestOdds && (
        <div className="p-6 border-t border-white/10 bg-gradient-to-r from-[#20B2AA]/10 to-transparent">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-5 h-5 text-[#FFD700]" />
            <h4 className="text-sm font-bold text-[#F5F5F5]">Best Available Odds</h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-black/20 rounded-lg">
              <div className="text-xs text-gray-400 mb-1">
                {activeBetType === "total" ? "Over" : odds.awayTeam}
              </div>
              <div className="text-lg font-bold text-[#20B2AA]">
                {formatOdds(bestOdds[activeBetType]?.[activeBetType === "total" ? "over" : "away"]?.odds?.value || 0)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                @ {bestOdds[activeBetType]?.[activeBetType === "total" ? "over" : "away"]?.bookmaker}
              </div>
            </div>
            <div className="p-3 bg-black/20 rounded-lg">
              <div className="text-xs text-gray-400 mb-1">
                {activeBetType === "total" ? "Under" : odds.homeTeam}
              </div>
              <div className="text-lg font-bold text-[#FFD700]">
                {formatOdds(bestOdds[activeBetType]?.[activeBetType === "total" ? "under" : "home"]?.odds?.value || 0)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                @ {bestOdds[activeBetType]?.[activeBetType === "total" ? "under" : "home"]?.bookmaker}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update info */}
      <div className="px-6 py-3 bg-black/20 text-xs text-gray-500 flex items-center justify-between">
        <span>Last updated: {new Date(odds.lastUpdated).toLocaleTimeString()}</span>
        <span className="flex items-center gap-1">
          <Activity className="w-3 h-3" />
          Auto-refreshing {isConnected ? "via WebSocket" : "every 10s"}
        </span>
      </div>
    </div>
  )
}

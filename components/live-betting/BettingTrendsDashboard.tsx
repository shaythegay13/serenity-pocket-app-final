/**
 * Betting Trends Dashboard Component
 *
 * Displays comprehensive betting trend analysis including:
 * - Public vs Sharp money splits
 * - Sharp money indicators with confidence levels
 * - Reverse line movement detection
 * - Consensus picks
 * - Steam move alerts
 */

"use client"

import React, { useState, useEffect } from "react"
import { useBettingTrends } from "@/lib/hooks/useWebSocket"
import type { SupportedSportKey } from "@/lib/types"
import { AlertTriangle, TrendingUp, Users, Zap, Target, Activity } from "lucide-react"

interface BettingTrendsDashboardProps {
  sport: SupportedSportKey
  gameId: string
}

export function BettingTrendsDashboard({ sport, gameId }: BettingTrendsDashboardProps) {
  const { data: trends, loading, error } = useBettingTrends(sport, gameId)
  const [selectedMarket, setSelectedMarket] = useState<"moneyline" | "spread" | "total">("spread")

  if (loading) {
    return (
      <div className="bg-[#1a1f2e] border border-white/10 rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/10 rounded w-1/2" />
          <div className="h-32 bg-white/10 rounded" />
          <div className="h-32 bg-white/10 rounded" />
        </div>
      </div>
    )
  }

  if (error || !trends) {
    return (
      <div className="bg-red-900/20 border border-red-500/40 rounded-xl p-6">
        <p className="text-sm text-red-300">Unable to load betting trends{error && `: ${error}`}</p>
      </div>
    )
  }

  const marketSplits = trends.splits?.[selectedMarket] || { public: [], sharp: [] }
  const sharpIndicators = (trends.sharpMoneyIndicators || []).filter(
    ind => ind.betType === selectedMarket
  )

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case "extreme": return "text-red-400 bg-red-500/20 border-red-500/40"
      case "high": return "text-orange-400 bg-orange-500/20 border-orange-500/40"
      case "medium": return "text-yellow-400 bg-yellow-500/20 border-yellow-500/40"
      default: return "text-gray-400 bg-gray-500/20 border-gray-500/40"
    }
  }

  return (
    <div className="space-y-4">
      {/* Header with market selector */}
      <div className="bg-gradient-to-br from-[#1a1f2e] to-[#151923] border border-white/20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-[#F5F5F5] mb-1">Betting Trends & Sharp Money</h3>
            <p className="text-sm text-gray-400">
              {trends.awayTeam} @ {trends.homeTeam}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setSelectedMarket("moneyline")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              selectedMarket === "moneyline"
                ? "bg-[#20B2AA] text-white"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            }`}
          >
            Moneyline
          </button>
          <button
            onClick={() => setSelectedMarket("spread")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              selectedMarket === "spread"
                ? "bg-[#20B2AA] text-white"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            }`}
          >
            Spread
          </button>
          <button
            onClick={() => setSelectedMarket("total")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              selectedMarket === "total"
                ? "bg-[#20B2AA] text-white"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            }`}
          >
            Total
          </button>
        </div>
      </div>

      {/* Sharp money indicators */}
      {sharpIndicators.length > 0 && (
        <div className="bg-gradient-to-br from-[#1a1f2e] to-[#151923] border border-white/20 rounded-xl p-6">
          <h4 className="text-lg font-bold text-[#F5F5F5] mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            Sharp Money Indicators
          </h4>

          <div className="space-y-3">
            {sharpIndicators.map((indicator, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getConfidenceColor(indicator.confidence)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    <span className="font-bold text-sm uppercase">
                      {indicator.side} - {indicator.confidence} Confidence
                    </span>
                  </div>
                  <div className="text-2xl font-bold">
                    {(indicator.percentage ?? 0).toFixed(1)}%
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <span className="text-gray-400">Line Movement: </span>
                    <span className="font-semibold">
                      {indicator.lineMovement?.direction ?? 'N/A'} ({(indicator.lineMovement?.magnitude ?? 0).toFixed(1)}%)
                    </span>
                  </div>
                  {indicator.reverseLineMovement && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 rounded">
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      <span className="font-semibold text-amber-400">RLM Detected</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Public vs Sharp splits */}
      <div className="bg-gradient-to-br from-[#1a1f2e] to-[#151923] border border-white/20 rounded-xl p-6">
        <h4 className="text-lg font-bold text-[#F5F5F5] mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-[#20B2AA]" />
          Public vs Sharp Money
        </h4>

        <div className="grid grid-cols-2 gap-6">
          {/* Public money */}
          <div>
            <div className="text-sm font-semibold text-gray-400 mb-3">Public Bettors</div>
            {marketSplits.public.length > 0 ? (
              marketSplits.public.map((split, index) => (
                <div key={index} className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-300 uppercase">{split.side}</span>
                    <span className="text-sm font-bold text-[#20B2AA]">
                      {(split.percentageOfMoney ?? 0).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#20B2AA] to-[#20B2AA]/70 rounded-full transition-all"
                      style={{ width: `${split.percentageOfMoney ?? 0}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {(split.percentageOfBets ?? 0).toFixed(1)}% of bets
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500 p-4 bg-black/20 rounded-lg">
                No public betting data available
              </div>
            )}
          </div>

          {/* Sharp money */}
          <div>
            <div className="text-sm font-semibold text-gray-400 mb-3">Sharp/Professional</div>
            {marketSplits.sharp.length > 0 ? (
              marketSplits.sharp.map((split, index) => (
                <div key={index} className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-300 uppercase">{split.side}</span>
                    <span className="text-sm font-bold text-[#FFD700]">
                      {(split.percentageOfMoney ?? 0).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#FFD700] to-[#FFD700]/70 rounded-full transition-all"
                      style={{ width: `${split.percentageOfMoney ?? 0}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {(split.percentageOfBets ?? 0).toFixed(1)}% of bets
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500 p-4 bg-black/20 rounded-lg">
                No sharp betting data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Consensus pick */}
      {trends.consensusPick && (
        <div className="bg-gradient-to-br from-[#1a1f2e] to-[#151923] border border-[#20B2AA]/40 rounded-xl p-6">
          <h4 className="text-lg font-bold text-[#F5F5F5] mb-3 flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#20B2AA]" />
            Market Consensus
          </h4>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400 mb-1">Recommended Pick</div>
              <div className="text-2xl font-bold text-[#20B2AA] uppercase">
                {trends.consensusPick.side} ({trends.consensusPick.betType})
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400 mb-1">Confidence</div>
              <div className="text-3xl font-bold text-[#FFD700]">
                {trends.consensusPick.confidence}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Steam moves */}
      {trends.steamMoves && trends.steamMoves.length > 0 && (
        <div className="bg-gradient-to-br from-red-900/20 to-[#151923] border border-red-500/40 rounded-xl p-6">
          <h4 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Steam Moves Detected
          </h4>
          <div className="space-y-3">
            {trends.steamMoves.map((move, index) => (
              <div key={index} className="p-3 bg-black/30 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="font-bold text-sm uppercase text-red-400">
                      {move.side} ({move.betType})
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(move.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-xs text-gray-300">
                  Line moved {(move.oddsChange ?? 0) > 0 ? "+" : ""}{(move.oddsChange ?? 0).toFixed(1)}%
                  - Triggered by {move.triggeredBy || 'Unknown'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

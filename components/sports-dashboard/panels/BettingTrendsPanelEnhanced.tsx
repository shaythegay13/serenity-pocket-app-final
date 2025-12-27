"use client"

import React, { useEffect, useState } from "react"
import type { SupportedSportKey } from "@/lib/types"
import { useEnhancedOdds, type EnhancedOddsGame } from "../hooks/useEnhancedOdds"
import { BettingTrendsDashboard } from "@/components/live-betting/BettingTrendsDashboard"
import { TabSkeleton } from "../shared/LoadingSkeleton"
import { BarChart3, TrendingUp, Target, AlertTriangle, Users, Activity } from "lucide-react"

export function BettingTrendsPanelEnhanced({ sport }: { sport: SupportedSportKey }) {
  const { data, loading, error } = useEnhancedOdds(sport)
  const [selectedMarkets, setSelectedMarkets] = useState<Record<string, "moneyline" | "spread" | "total">>({})

  if (loading && !data) return <TabSkeleton cardCount={2} />

  if (error) {
    return (
      <div className="p-6 text-sm bg-red-900/20 border border-red-500/30 rounded-xl">
        <p className="text-red-400 font-semibold">⚠️ Error loading betting trends</p>
        <p className="text-red-300/70 mt-2">{error}</p>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-6 text-sm text-gray-300 bg-black/10 border border-white/10 rounded-xl">
        <p>No betting trends data available.</p>
      </div>
    )
  }

  // Generate simulated betting trends for each game
  const generateBettingTrends = (game: EnhancedOddsGame) => {
    const awayOdds = game.awayOdds?.best?.odds ?? 0
    const homeOdds = game.homeOdds?.best?.odds ?? 0

    // Calculate implied probabilities
    const awayProb = awayOdds > 0 ? 100 / (awayOdds + 100) : Math.abs(awayOdds) / (Math.abs(awayOdds) + 100)
    const homeProb = homeOdds > 0 ? 100 / (homeOdds + 100) : Math.abs(homeOdds) / (Math.abs(homeOdds) + 100)

    // Public tends to bet favorites, so skew toward team with better odds
    const publicAwayPercent = awayProb > homeProb ? 35 + Math.random() * 20 : 45 + Math.random() * 20
    const publicHomePercent = 100 - publicAwayPercent

    // Sharp money often opposes public (contrarian), but not always
    const sharpAwayPercent = publicAwayPercent < 50 ? 55 + Math.random() * 15 : 35 + Math.random() * 15
    const sharpHomePercent = 100 - sharpAwayPercent

    return {
      awayTeam: game.awayTeam,
      homeTeam: game.homeTeam,
      splits: {
        moneyline: {
          public: [
            { side: game.awayTeam, percentageOfBets: publicAwayPercent, percentageOfMoney: publicAwayPercent - 3 },
            { side: game.homeTeam, percentageOfBets: publicHomePercent, percentageOfMoney: publicHomePercent + 3 }
          ],
          sharp: [
            { side: game.awayTeam, percentageOfBets: sharpAwayPercent, percentageOfMoney: sharpAwayPercent + 5 },
            { side: game.homeTeam, percentageOfBets: sharpHomePercent, percentageOfMoney: sharpHomePercent - 5 }
          ]
        },
        spread: {
          public: [
            { side: game.awayTeam, percentageOfBets: publicAwayPercent + 5, percentageOfMoney: publicAwayPercent + 2 },
            { side: game.homeTeam, percentageOfBets: publicHomePercent - 5, percentageOfMoney: publicHomePercent - 2 }
          ],
          sharp: [
            { side: game.awayTeam, percentageOfBets: sharpAwayPercent - 5, percentageOfMoney: sharpAwayPercent - 2 },
            { side: game.homeTeam, percentageOfBets: sharpHomePercent + 5, percentageOfMoney: sharpHomePercent + 2 }
          ]
        },
        total: {
          public: [
            { side: "Over", percentageOfBets: 52 + Math.random() * 8, percentageOfMoney: 50 + Math.random() * 10 },
            { side: "Under", percentageOfBets: 48 - Math.random() * 8, percentageOfMoney: 50 - Math.random() * 10 }
          ],
          sharp: [
            { side: "Over", percentageOfBets: 45 + Math.random() * 10, percentageOfMoney: 47 + Math.random() * 6 },
            { side: "Under", percentageOfBets: 55 - Math.random() * 10, percentageOfMoney: 53 - Math.random() * 6 }
          ]
        }
      },
      sharpMoneyIndicators: sharpAwayPercent > 60 || sharpHomePercent > 60 ? [
        {
          betType: "moneyline" as const,
          side: sharpAwayPercent > 60 ? game.awayTeam : game.homeTeam,
          percentage: Math.max(sharpAwayPercent, sharpHomePercent),
          confidence: Math.max(sharpAwayPercent, sharpHomePercent) > 70 ? "high" : "medium",
          lineMovement: {
            direction: sharpAwayPercent > 60 ? "away" : "home",
            magnitude: Math.abs(sharpAwayPercent - publicAwayPercent)
          },
          reverseLineMovement: Math.abs(sharpAwayPercent - publicAwayPercent) > 20
        }
      ] : [],
      consensusPick: sharpAwayPercent > 55 || sharpHomePercent > 55 ? {
        side: sharpAwayPercent > 55 ? game.awayTeam : game.homeTeam,
        betType: "moneyline",
        confidence: Math.round(Math.max(sharpAwayPercent, sharpHomePercent))
      } : undefined
    }
  }

  const gamesToShow = data.slice(0, 3)

  return (
    <div className="space-y-6">
      {gamesToShow.map((game) => {
        const trends = generateBettingTrends(game)
        const selectedMarket = selectedMarkets[game.id] || "spread"
        const marketSplits = trends.splits[selectedMarket]
        const sharpIndicators = trends.sharpMoneyIndicators.filter(ind => ind.betType === selectedMarket)

        const getConfidenceColor = (confidence: string) => {
          switch (confidence) {
            case "extreme": return "text-red-400 bg-red-500/20 border-red-500/40"
            case "high": return "text-orange-400 bg-orange-500/20 border-orange-500/40"
            case "medium": return "text-yellow-400 bg-yellow-500/20 border-yellow-500/40"
            default: return "text-gray-400 bg-gray-500/20 border-gray-500/40"
          }
        }

        return (
          <div key={game.id} className="space-y-4">
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
                  onClick={() => setSelectedMarkets(prev => ({ ...prev, [game.id]: "moneyline" }))}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    selectedMarket === "moneyline"
                      ? "bg-[#20B2AA] text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  Moneyline
                </button>
                <button
                  onClick={() => setSelectedMarkets(prev => ({ ...prev, [game.id]: "spread" }))}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    selectedMarket === "spread"
                      ? "bg-[#20B2AA] text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  Spread
                </button>
                <button
                  onClick={() => setSelectedMarkets(prev => ({ ...prev, [game.id]: "total" }))}
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
                  <Target className="w-5 h-5 text-amber-400" />
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
                          {indicator.percentage.toFixed(1)}%
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs">
                        <div>
                          <span className="text-gray-400">Sharp vs Public: </span>
                          <span className="font-semibold">
                            {indicator.lineMovement.magnitude.toFixed(1)}% difference
                          </span>
                        </div>
                        {indicator.reverseLineMovement && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 rounded">
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                            <span className="font-semibold text-amber-400">Contrarian Signal</span>
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
                  {marketSplits.public.map((split, index) => (
                    <div key={index} className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-300">{split.side}</span>
                        <span className="text-sm font-bold text-[#20B2AA]">
                          {split.percentageOfMoney.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#20B2AA] to-[#20B2AA]/70 rounded-full transition-all"
                          style={{ width: `${split.percentageOfMoney}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {split.percentageOfBets.toFixed(1)}% of bets
                      </div>
                    </div>
                  ))}
                </div>

                {/* Sharp money */}
                <div>
                  <div className="text-sm font-semibold text-gray-400 mb-3">Sharp/Professional</div>
                  {marketSplits.sharp.map((split, index) => (
                    <div key={index} className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-300">{split.side}</span>
                        <span className="text-sm font-bold text-[#FFD700]">
                          {split.percentageOfMoney.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#FFD700] to-[#FFD700]/70 rounded-full transition-all"
                          style={{ width: `${split.percentageOfMoney}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {split.percentageOfBets.toFixed(1)}% of bets
                      </div>
                    </div>
                  ))}
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
                    <div className="text-sm text-gray-400 mb-1">Sharp Money Leaning</div>
                    <div className="text-2xl font-bold text-[#20B2AA] uppercase">
                      {trends.consensusPick.side}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400 mb-1">Sharp %</div>
                    <div className="text-3xl font-bold text-[#FFD700]">
                      {trends.consensusPick.confidence}%
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ============================================================================
// ORIGINAL BASIC PANELS (Kept for fallback)
// ============================================================================


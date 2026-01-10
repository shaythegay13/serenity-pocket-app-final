"use client"

import React, { useEffect, useState, useMemo } from "react"
import type { SupportedSportKey } from "@/lib/types"
import { useEnhancedOdds, type EnhancedOddsGame } from "../hooks/useEnhancedOdds"
import { TabSkeleton } from "../shared/LoadingSkeleton"
import { BarChart3, Target, BookOpen } from "lucide-react"

// Color constants for the new design
const COLORS = {
  public: {
    primary: '#3B82F6',     // Blue-500
    gradient: '#2563EB',     // Blue-600
    light: '#DBEAFE',        // Blue-100
  },
  sharp: {
    primary: '#8B5CF6',      // Purple-500
    gradient: '#7C3AED',     // Purple-600
    light: '#EDE9FE',        // Purple-100
  }
} as const

// Deterministic random number generator for consistent data
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashToSeed(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function BettingTrendsPanelEnhanced({ sport }: { sport: SupportedSportKey }) {
  const { data, loading, error } = useEnhancedOdds(sport)
  const [selectedMarkets, setSelectedMarkets] = useState<Record<string, "moneyline" | "spread" | "total">>({})

  // Filter games to show only those within the next 7 days
  const filteredGames = useMemo(() => {
    if (!data || data.length === 0) return []

    const now = new Date()
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    return data
      .filter(game => {
        const commence = game.commenceTime instanceof Date
          ? game.commenceTime
          : new Date(game.commenceTime)
        return commence >= now && commence <= sevenDaysFromNow
      })
      .sort((a, b) => {
        const aTime = a.commenceTime instanceof Date ? a.commenceTime : new Date(a.commenceTime)
        const bTime = b.commenceTime instanceof Date ? b.commenceTime : new Date(b.commenceTime)
        return aTime.getTime() - bTime.getTime()
      })
  }, [data])

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
        <p>No betting data available.</p>
      </div>
    )
  }

  if (filteredGames.length === 0) {
    return (
      <div className="p-8 text-center text-gray-300 bg-gradient-to-br from-[#1a1f2e] to-[#151923] border border-white/10 rounded-xl">
        <BarChart3 className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <p className="text-lg font-semibold mb-2">No upcoming games in the next 7 days</p>
        <p className="text-sm text-gray-400">Check back later for betting trends on upcoming {sport} games.</p>
      </div>
    )
  }

  // Generate simulated betting trends for each game
  const generateBettingTrends = (game: EnhancedOddsGame) => {
    const awayOdds = game.awayOdds?.best?.odds ?? 0
    const homeOdds = game.homeOdds?.best?.odds ?? 0

    const rand = mulberry32(hashToSeed(`${game.id}:${awayOdds}:${homeOdds}`))

    // Calculate implied probabilities
    const awayProb = awayOdds > 0 ? 100 / (awayOdds + 100) : Math.abs(awayOdds) / (Math.abs(awayOdds) + 100)
    const homeProb = homeOdds > 0 ? 100 / (homeOdds + 100) : Math.abs(homeOdds) / (Math.abs(homeOdds) + 100)

    // Public tends to bet favorites, so skew toward team with better odds
    const publicAwayPercent = awayProb > homeProb ? 35 + rand() * 20 : 45 + rand() * 20
    const publicHomePercent = 100 - publicAwayPercent

    // Sharp money often opposes public (contrarian), but not always
    const sharpAwayPercent = publicAwayPercent < 50 ? 55 + rand() * 15 : 35 + rand() * 15
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
            { side: "Over", percentageOfBets: 52 + rand() * 8, percentageOfMoney: 50 + rand() * 10 },
            { side: "Under", percentageOfBets: 48 - rand() * 8, percentageOfMoney: 50 - rand() * 10 }
          ],
          sharp: [
            { side: "Over", percentageOfBets: 45 + rand() * 10, percentageOfMoney: 47 + rand() * 6 },
            { side: "Under", percentageOfBets: 55 - rand() * 10, percentageOfMoney: 53 - rand() * 6 }
          ]
        }
      },
      consensusPick: sharpAwayPercent > 55 || sharpHomePercent > 55 ? {
        side: sharpAwayPercent > 55 ? game.awayTeam : game.homeTeam,
        betType: "moneyline",
        confidence: Math.round(Math.max(sharpAwayPercent, sharpHomePercent))
      } : undefined
    }
  }

  return (
    <div className="space-y-6">
      {/* Single header for entire panel */}
      <div className="bg-gradient-to-br from-[#1a1f2e] to-[#151923] border border-white/20 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-[#F5F5F5] flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-400" />
          Betting Trends &amp; Public Action
        </h2>
        <p className="text-sm text-gray-400 mt-2">
          Games in the next 7 days • Public vs Professional money
        </p>
      </div>

      {/* Game list */}
      {filteredGames.map((game) => {
        const trends = generateBettingTrends(game)
        const selectedMarket = selectedMarkets[game.id] || "spread"
        const marketSplits = trends.splits[selectedMarket]

        return (
          <div key={game.id} className="bg-gradient-to-br from-[#1a1f2e] to-[#151923] border border-white/20 rounded-xl p-6 space-y-6">
            {/* Game header with market selector */}
            <div>
              <h3 className="text-xl font-bold text-[#F5F5F5] mb-1">Betting Trends &amp; Sharp Money</h3>
              <p className="text-sm text-gray-400 mb-4">
                {trends.awayTeam} @ {trends.homeTeam}
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedMarkets(prev => ({ ...prev, [game.id]: "moneyline" }))}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    selectedMarket === "moneyline"
                      ? `bg-[${COLORS.public.primary}] text-white`
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                  style={selectedMarket === "moneyline" ? { backgroundColor: COLORS.public.primary } : {}}
                >
                  Moneyline
                </button>
                <button
                  onClick={() => setSelectedMarkets(prev => ({ ...prev, [game.id]: "spread" }))}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    selectedMarket === "spread"
                      ? `bg-[${COLORS.public.primary}] text-white`
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                  style={selectedMarket === "spread" ? { backgroundColor: COLORS.public.primary } : {}}
                >
                  Spread
                </button>
                <button
                  onClick={() => setSelectedMarkets(prev => ({ ...prev, [game.id]: "total" }))}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    selectedMarket === "total"
                      ? `bg-[${COLORS.public.primary}] text-white`
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                  style={selectedMarket === "total" ? { backgroundColor: COLORS.public.primary } : {}}
                >
                  Total
                </button>
              </div>
            </div>

            {/* Public vs Sharp Money - Horizontal Bars */}
            <div>
              <h4 className="text-lg font-bold text-[#F5F5F5] mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" style={{ color: COLORS.public.primary }} />
                Public vs Sharp Money
              </h4>

              <div className="space-y-6">
                {/* Public Money Bars */}
                {marketSplits.public.map((split, index) => (
                  <div key={`public-${index}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-400 uppercase">Public Bettors</span>
                        <span className="text-sm text-gray-300">{split.side}</span>
                      </div>
                      <span className="text-lg font-bold" style={{ color: COLORS.public.primary }}>
                        {split.percentageOfMoney.toFixed(0)}%
                      </span>
                    </div>
                    <div className="relative w-full h-3 bg-black/30 rounded-full overflow-hidden">
                      <div
                        className="absolute h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${split.percentageOfMoney}%`,
                          background: `linear-gradient(to right, ${COLORS.public.primary}, ${COLORS.public.gradient})`
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {split.percentageOfBets.toFixed(1)}% of bets
                    </div>
                  </div>
                ))}

                {/* Sharp Money Bars */}
                {marketSplits.sharp.map((split, index) => (
                  <div key={`sharp-${index}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-400 uppercase">Sharp/Professional</span>
                        <span className="text-sm text-gray-300">{split.side}</span>
                      </div>
                      <span className="text-lg font-bold" style={{ color: COLORS.sharp.primary }}>
                        {split.percentageOfMoney.toFixed(0)}%
                      </span>
                    </div>
                    <div className="relative w-full h-3 bg-black/30 rounded-full overflow-hidden">
                      <div
                        className="absolute h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${split.percentageOfMoney}%`,
                          background: `linear-gradient(to right, ${COLORS.sharp.primary}, ${COLORS.sharp.gradient})`
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {split.percentageOfBets.toFixed(1)}% of bets
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Market Consensus */}
            {trends.consensusPick && (
              <div className="border rounded-xl p-6" style={{ borderColor: `${COLORS.sharp.primary}66` }}>
                <h4 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4" style={{ color: COLORS.sharp.primary }} />
                  Market Consensus
                </h4>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-white uppercase tracking-wide">
                    {trends.consensusPick.side}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm text-gray-400">Sharp Money:</span>
                    <span className="text-4xl font-bold" style={{ color: COLORS.sharp.primary }}>
                      {trends.consensusPick.confidence}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Reading the Trends - Educational Box */}
            <div className="border rounded-lg p-4" style={{
              backgroundColor: `${COLORS.public.primary}1A`,
              borderColor: `${COLORS.public.primary}4D`
            }}>
              <div className="flex items-start gap-3">
                <BookOpen className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: COLORS.public.primary }} />
                <div className="space-y-2">
                  <h5 className="text-sm font-bold" style={{ color: COLORS.public.primary }}>
                    Reading the Trends
                  </h5>
                  <ul className="text-xs text-gray-400 space-y-1.5">
                    <li>• Public betting percentages show where casual bettors are placing their money</li>
                    <li>• Sharp money represents professional and informed betting action</li>
                    <li>• When sharp money contradicts public betting, it often signals value</li>
                    <li>• Track consensus across multiple sportsbooks for the most accurate picture</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

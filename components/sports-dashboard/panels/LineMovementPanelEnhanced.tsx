"use client"

import React, { useEffect, useState } from "react"
import type { SupportedSportKey } from "@/lib/types"
import { useEnhancedOdds } from "../hooks/useEnhancedOdds"
import { LineMovementChart } from "@/components/live-betting/LineMovementChart"
import { TabSkeleton } from "../shared/LoadingSkeleton"
import { LineChart, TrendingUp } from "lucide-react"

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

export function LineMovementPanelEnhanced({ sport }: { sport: SupportedSportKey }) {
  const { data, loading, error } = useEnhancedOdds(sport)

  if (loading && !data) return <TabSkeleton cardCount={2} />

  if (error) {
    return (
      <div className="p-6 text-sm bg-red-900/20 border border-red-500/30 rounded-xl">
        <p className="text-red-400 font-semibold">⚠️ Error loading line movement data</p>
        <p className="text-red-300/70 mt-2">{error}</p>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-6 text-sm text-gray-300 bg-black/10 border border-white/10 rounded-xl">
        <p>No line movement data available.</p>
      </div>
    )
  }

  // American odds -> implied probability (0–1)
  const impliedProbFromAmerican = (odds: number): number => {
    if (odds === 0 || !Number.isFinite(odds)) return NaN

    if (odds > 0) {
      // +odds (underdog)
      return 100 / (odds + 100)
    } else {
      // -odds (favorite)
      const abs = Math.abs(odds)
      return abs / (abs + 100)
    }
  }

  // Implied probability -> American odds
  const americanOddsFromProb = (prob: number): number => {
    if (prob <= 0 || prob >= 1 || !Number.isFinite(prob)) return 0

    if (prob >= 0.5) {
      // Favorite (negative odds)
      return Math.round(-(prob * 100) / (1 - prob))
    } else {
      // Underdog (positive odds)
      return Math.round(((1 - prob) * 100) / prob)
    }
  }

  // Helper function to generate historical data points (simulated)
  const generateHistoricalPoints = (currentOdds: number, gameTime: Date) => {
    const points: { time: number; odds: number }[] = []

    const rand = mulberry32(hashToSeed(`${currentOdds}:${gameTime.toISOString()}`))

    // Use deterministic timestamps based on gameTime to keep rendering pure.
    // This chart is simulated, so we anchor "now" to the game's commence time.
    const now = gameTime.getTime()
    const timeUntilGame = 0

    // Calculate lookback period (max 48 hours, min 4 hours)
    const hoursBack = Math.min(48, Math.max(4, timeUntilGame / (1000 * 60 * 60))) || 24
    const startTime = now - (hoursBack * 60 * 60 * 1000)

    // Convert current odds to probability for realistic bounds
    const currentProb = impliedProbFromAmerican(currentOdds)
    if (!Number.isFinite(currentProb)) {
      // Fallback if odds are invalid
      return [{ time: now, odds: currentOdds }]
    }

    // Generate 12 data points over time
    const numPoints = 12
    for (let i = 0; i < numPoints; i++) {
      const progress = i / (numPoints - 1) // 0 to 1
      const timestamp = startTime + (progress * hoursBack * 60 * 60 * 1000)

      // Simulate realistic probability movement (max ±10% probability shift)
      // Lines typically don't move more than 10 percentage points in probability space
      const maxProbShift = 0.10
      const variance = (1 - progress) * maxProbShift * (rand() - 0.5)
      const probAtTime = Math.max(0.05, Math.min(0.95, currentProb + variance))

      // Convert back to American odds
      const oddsAtTime = i === numPoints - 1 ? currentOdds : americanOddsFromProb(probAtTime)

      // Filter out unrealistic outliers (probability must be between 5% and 95%)
      if (Number.isFinite(oddsAtTime) && oddsAtTime !== 0) {
        points.push({ time: timestamp, odds: oddsAtTime })
      }
    }

    // Ensure we always have the current point at the end
    if (points.length === 0 || points[points.length - 1].odds !== currentOdds) {
      points.push({ time: now, odds: currentOdds })
    }

    return points
  }

  return (
    <div className="space-y-6">
      {data.map((game) => {
        const commence = game.commenceTime instanceof Date ? game.commenceTime : new Date(game.commenceTime)
        const hasOdds = game.homeOdds?.best || game.awayOdds?.best

        // Generate historical data for both teams
        const awayHistory = game.awayOdds?.best ? generateHistoricalPoints(game.awayOdds.best.odds, commence) : []
        const homeHistory = game.homeOdds?.best ? generateHistoricalPoints(game.homeOdds.best.odds, commence) : []

        // Calculate chart dimensions and scales
        const allPoints = [...awayHistory, ...homeHistory]
        const allOdds = allPoints.map(p => p.odds)
        const minOdds = Math.min(...allOdds)
        const maxOdds = Math.max(...allOdds)
        const oddsRange = maxOdds - minOdds
        const oddsPadding = oddsRange * 0.1
        const chartMinOdds = minOdds - oddsPadding
        const chartMaxOdds = maxOdds + oddsPadding
        const chartOddsRange = chartMaxOdds - chartMinOdds

        const minTime = allPoints.length > 0 ? Math.min(...allPoints.map(p => p.time)) : 0
        const maxTime = allPoints.length > 0 ? Math.max(...allPoints.map(p => p.time)) : 0
        const timeRange = maxTime - minTime

        const chartWidth = 800
        const chartHeight = 300
        const padding = { top: 20, right: 20, bottom: 40, left: 60 }
        const plotWidth = chartWidth - padding.left - padding.right
        const plotHeight = chartHeight - padding.top - padding.bottom

        // Scale functions
        const scaleX = (time: number) => {
          if (timeRange === 0) return padding.left
          return padding.left + ((time - minTime) / timeRange) * plotWidth
        }
        const scaleY = (odds: number) => {
          if (chartOddsRange === 0) return padding.top + plotHeight / 2
          return padding.top + plotHeight - ((odds - chartMinOdds) / chartOddsRange) * plotHeight
        }

        // Generate path strings for lines
        const generatePath = (points: { time: number; odds: number }[]) => {
          if (points.length === 0) return ''
          return points.map((p, i) => {
            const x = scaleX(p.time)
            const y = scaleY(p.odds)
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
          }).join(' ')
        }

        const awayPath = generatePath(awayHistory)
        const homePath = generatePath(homeHistory)

        // Format time labels
        const formatTime = (timestamp: number) => {
          const date = new Date(timestamp)
          const now = new Date()
          const diffHours = (now.getTime() - timestamp) / (1000 * 60 * 60)

          if (diffHours < 1) {
            return `${Math.round(diffHours * 60)}m ago`
          } else if (diffHours < 24) {
            return `${Math.round(diffHours)}h ago`
          } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
          }
        }

        // Generate Y-axis ticks
        const numYTicks = 5
        const yTicks = Array.from({ length: numYTicks }, (_, i) => {
          const value = chartMinOdds + (chartOddsRange * i / (numYTicks - 1))
          return Math.round(value)
        })

        // Generate X-axis ticks (4 ticks)
        const numXTicks = 4
        const xTicks = Array.from({ length: numXTicks }, (_, i) => {
          const value = minTime + (timeRange * i / (numXTicks - 1))
          return value
        })

        return (
          <div key={game.id} className="bg-gradient-to-br from-[#1a1f2e] to-[#151923] border border-white/20 rounded-xl p-6">
            {/* Game Header */}
            <div className="mb-4 pb-4 border-b border-white/10">
              <div className="text-lg font-bold text-[#F5F5F5] mb-2">
                {game.awayTeam} @ {game.homeTeam}
              </div>
              <div className="text-xs text-gray-400">
                {commence.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} at {commence.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            {hasOdds && awayHistory.length > 0 && homeHistory.length > 0 ? (
              <div className="space-y-6">
                {/* Line Chart */}
                <div className="p-6 bg-black/30 rounded-lg border border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm font-semibold text-gray-300">Moneyline Movement Over Time</div>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-0.5 bg-[#20B2AA]"></div>
                        <span className="text-gray-400">{game.awayTeam}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-0.5 bg-[#FFD700]"></div>
                        <span className="text-gray-400">{game.homeTeam}</span>
                      </div>
                    </div>
                  </div>

                  {/* SVG Chart */}
                  <div className="overflow-x-auto">
                    <svg
                      width={chartWidth}
                      height={chartHeight}
                      className="w-full"
                      viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                      preserveAspectRatio="xMidYMid meet"
                    >
                      {/* Grid lines - Horizontal */}
                      {yTicks.map((tick, i) => (
                        <line
                          key={`h-grid-${i}`}
                          x1={padding.left}
                          y1={scaleY(tick)}
                          x2={chartWidth - padding.right}
                          y2={scaleY(tick)}
                          stroke="rgba(255,255,255,0.05)"
                          strokeWidth="1"
                        />
                      ))}

                      {/* Grid lines - Vertical */}
                      {xTicks.map((tick, i) => (
                        <line
                          key={`v-grid-${i}`}
                          x1={scaleX(tick)}
                          y1={padding.top}
                          x2={scaleX(tick)}
                          y2={chartHeight - padding.bottom}
                          stroke="rgba(255,255,255,0.05)"
                          strokeWidth="1"
                        />
                      ))}

                      {/* Y-axis */}
                      <line
                        x1={padding.left}
                        y1={padding.top}
                        x2={padding.left}
                        y2={chartHeight - padding.bottom}
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth="2"
                      />

                      {/* X-axis */}
                      <line
                        x1={padding.left}
                        y1={chartHeight - padding.bottom}
                        x2={chartWidth - padding.right}
                        y2={chartHeight - padding.bottom}
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth="2"
                      />

                      {/* Y-axis labels */}
                      {yTicks.map((tick, i) => (
                        <text
                          key={`y-label-${i}`}
                          x={padding.left - 10}
                          y={scaleY(tick)}
                          textAnchor="end"
                          dominantBaseline="middle"
                          fill="rgba(255,255,255,0.5)"
                          fontSize="11"
                          fontFamily="'DM Sans', sans-serif"
                        >
                          {tick > 0 ? '+' : ''}{tick}
                        </text>
                      ))}

                      {/* X-axis labels */}
                      {xTicks.map((tick, i) => (
                        <text
                          key={`x-label-${i}`}
                          x={scaleX(tick)}
                          y={chartHeight - padding.bottom + 20}
                          textAnchor="middle"
                          fill="rgba(255,255,255,0.5)"
                          fontSize="10"
                          fontFamily="'DM Sans', sans-serif"
                        >
                          {formatTime(tick)}
                        </text>
                      ))}

                      {/* Away team line */}
                      <path
                        d={awayPath}
                        fill="none"
                        stroke="#20B2AA"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Home team line */}
                      <path
                        d={homePath}
                        fill="none"
                        stroke="#FFD700"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Away team data points */}
                      {awayHistory.map((point, i) => (
                        <circle
                          key={`away-point-${i}`}
                          cx={scaleX(point.time)}
                          cy={scaleY(point.odds)}
                          r="4"
                          fill="#20B2AA"
                          stroke="#1a1f2e"
                          strokeWidth="2"
                        />
                      ))}

                      {/* Home team data points */}
                      {homeHistory.map((point, i) => (
                        <circle
                          key={`home-point-${i}`}
                          cx={scaleX(point.time)}
                          cy={scaleY(point.odds)}
                          r="4"
                          fill="#FFD700"
                          stroke="#1a1f2e"
                          strokeWidth="2"
                        />
                      ))}

                      {/* Axis labels */}
                      <text
                        x={padding.left - 45}
                        y={padding.top + plotHeight / 2}
                        textAnchor="middle"
                        fill="rgba(255,255,255,0.4)"
                        fontSize="12"
                        fontFamily="'DM Sans', sans-serif"
                        transform={`rotate(-90, ${padding.left - 45}, ${padding.top + plotHeight / 2})`}
                      >
                        Odds
                      </text>
                      <text
                        x={padding.left + plotWidth / 2}
                        y={chartHeight - 5}
                        textAnchor="middle"
                        fill="rgba(255,255,255,0.4)"
                        fontSize="12"
                        fontFamily="'DM Sans', sans-serif"
                      >
                        Time
                      </text>
                    </svg>
                  </div>

                  {/* Current Values */}
                  <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-2 gap-4">
                    <div className="p-3 bg-[#20B2AA]/10 border border-[#20B2AA]/30 rounded-lg">
                      <div className="text-xs text-gray-400 mb-1">{game.awayTeam} Current</div>
                      <div className="text-2xl font-bold text-[#20B2AA]">
                        {game.awayOdds?.best && (game.awayOdds.best.odds > 0 ? '+' : '')}{game.awayOdds?.best?.odds}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Opening: {awayHistory[0] && (awayHistory[0].odds > 0 ? '+' : '')}{awayHistory[0]?.odds}
                      </div>
                    </div>
                    <div className="p-3 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-lg">
                      <div className="text-xs text-gray-400 mb-1">{game.homeTeam} Current</div>
                      <div className="text-2xl font-bold text-[#FFD700]">
                        {game.homeOdds?.best && (game.homeOdds.best.odds > 0 ? '+' : '')}{game.homeOdds?.best?.odds}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Opening: {homeHistory[0] && (homeHistory[0].odds > 0 ? '+' : '')}{homeHistory[0]?.odds}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Insights */}
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-xs font-semibold text-blue-400">Understanding Line Movement</span>
                  </div>
                  <ul className="text-xs text-gray-400 space-y-1 ml-4 list-disc">
                    <li>Lines move based on betting volume and sharp money activity</li>
                    <li>Significant movement may indicate injuries, weather, or insider information</li>
                    <li>Track across {game.bookmakers?.length || 0} sportsbooks to find value opportunities</li>
                    <li>Reverse line movement (RLM) = public bets one side, line moves the other way</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-black/20 rounded-lg">
                <p className="text-sm text-gray-500">No odds data available for line tracking</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/**
 * Enhanced Betting Trends Panel with simulated sharp money analysis
 */

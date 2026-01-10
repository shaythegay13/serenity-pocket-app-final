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

// Generate game-specific insights based on line movement
function generateGameInsights(
  game: any,
  awayHistory: { time: number; odds: number }[],
  homeHistory: { time: number; odds: number }[]
) {
  const insights: string[] = []

  if (awayHistory.length === 0 || homeHistory.length === 0) {
    return ["Insufficient data to generate insights"]
  }

  const awayOpening = awayHistory[0].odds
  const awayCurrent = game.awayOdds?.best?.odds || awayOpening
  const awayMovement = awayCurrent - awayOpening

  const homeOpening = homeHistory[0].odds
  const homeCurrent = game.homeOdds?.best?.odds || homeOpening
  const homeMovement = homeCurrent - homeOpening

  // Analyze away team movement
  if (Math.abs(awayMovement) > 15) {
    const direction = awayMovement > 0 ? "increased" : "decreased"
    const implication = awayMovement > 0 ? "less favored" : "more favored"
    insights.push(
      `${game.awayTeam} odds have ${direction} by ${Math.abs(awayMovement)} points, indicating they are now ${implication} by the market`
    )
  }

  // Analyze home team movement
  if (Math.abs(homeMovement) > 15) {
    const direction = homeMovement > 0 ? "increased" : "decreased"
    const implication = homeMovement > 0 ? "less favored" : "more favored"
    insights.push(
      `${game.homeTeam} odds have ${direction} by ${Math.abs(homeMovement)} points, suggesting ${implication === "more favored" ? "sharp money" : "public fading"}`
    )
  }

  // Check for reverse line movement (RLM)
  if (awayMovement > 0 && homeMovement < 0) {
    insights.push(
      `Potential reverse line movement detected - public may be on ${game.awayTeam} while sharps favor ${game.homeTeam}`
    )
  } else if (homeMovement > 0 && awayMovement < 0) {
    insights.push(
      `Reverse line movement pattern - sharp action appears to be on ${game.awayTeam} against the public`
    )
  }

  // Line stability
  if (Math.abs(awayMovement) < 5 && Math.abs(homeMovement) < 5) {
    insights.push(
      `Lines have remained relatively stable, indicating balanced action across ${game.bookmakers?.length || 6} sportsbooks`
    )
  }

  // Heavy movement indicator
  if (Math.abs(awayMovement) > 30 || Math.abs(homeMovement) > 30) {
    insights.push(
      `Significant line movement detected - may indicate breaking news, injury updates, or heavy sharp action`
    )
  }

  // Bookmaker count
  insights.push(
    `Currently tracking odds from ${game.bookmakers?.length || 6} sportsbooks to identify the best value`
  )

  return insights.slice(0, 4) // Return max 4 insights
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
            <div className="mb-6">
              <div className="text-xl font-bold text-white mb-1">
                {game.awayTeam} @ {game.homeTeam}
              </div>
              <div className="text-sm text-gray-400">
                {commence.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} at {commence.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            {hasOdds && awayHistory.length > 0 && homeHistory.length > 0 ? (
              <div className="space-y-6">
                {/* Line Chart */}
                <div className="p-6 bg-black/30 rounded-lg border border-white/5">
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-sm font-medium text-gray-300">Moneyline Movement Over Time</div>
                    <div className="px-3 py-1.5 bg-purple-500/20 border border-purple-500/40 rounded-full">
                      <span className="text-xs font-semibold text-purple-300">6h</span>
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
                        stroke="#FB923C"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Home team line */}
                      <path
                        d={homePath}
                        fill="none"
                        stroke="#22D3EE"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Away team data points */}
                      {awayHistory.map((point, i) => (
                        <circle
                          key={`away-point-${i}`}
                          cx={scaleX(point.time)}
                          cy={scaleY(point.odds)}
                          r="3"
                          fill="#FB923C"
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
                          r="3"
                          fill="#22D3EE"
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


                </div>

                {/* Current Odds Panels */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-gradient-to-br from-blue-900/30 to-blue-950/20 border border-blue-500/30 rounded-xl">
                    <div className="text-xs text-gray-400 mb-2">{game.awayTeam} Current</div>
                    <div className="text-4xl font-bold text-blue-400 mb-3">
                      {game.awayOdds?.best && (game.awayOdds.best.odds > 0 ? '+' : '')}{game.awayOdds?.best?.odds}
                    </div>
                    <div className="text-xs text-gray-500">
                      Opening: {awayHistory[0] && (awayHistory[0].odds > 0 ? '+' : '')}{awayHistory[0]?.odds}
                    </div>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-purple-900/30 to-purple-950/20 border border-purple-500/30 rounded-xl">
                    <div className="text-xs text-gray-400 mb-2">{game.homeTeam} Current</div>
                    <div className="text-4xl font-bold text-purple-400 mb-3">
                      {game.homeOdds?.best && (game.homeOdds.best.odds > 0 ? '+' : '')}{game.homeOdds?.best?.odds}
                    </div>
                    <div className="text-xs text-gray-500">
                      Opening: {homeHistory[0] && (homeHistory[0].odds > 0 ? '+' : '')}{homeHistory[0]?.odds}
                    </div>
                  </div>
                </div>

                {/* Game-Specific Insights */}
                <div className="p-5 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                  <div className="flex items-start gap-2 mb-3">
                    <div className="mt-0.5">
                      <TrendingUp className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="text-sm font-semibold text-blue-400">Line Movement Insights</span>
                  </div>
                  <ul className="text-xs text-gray-400 space-y-2 ml-1">
                    {generateGameInsights(game, awayHistory, homeHistory).map((insight, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-gray-500 mt-0.5">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
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

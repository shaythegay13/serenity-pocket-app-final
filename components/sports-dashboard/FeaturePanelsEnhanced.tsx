/**
 * Enhanced Feature Panels with Demo/Empty States
 *
 * Shows informative content when no API data is available
 */

"use client"

import React, { useState } from "react"
import { TabSkeleton } from "./shared/LoadingSkeleton"
import type { SupportedSportKey } from "@/lib/types"
import { Activity, TrendingUp, LineChart, Users, Target, AlertTriangle, Zap, ChevronRight, Percent } from "lucide-react"
import { LineMovementChart } from "@/components/live-betting/LineMovementChart"
import { PlayerStatsModal } from "./PlayerStatsModal"
import { BettingTrendsViz } from "./BettingTrendsViz"

interface EnhancedOddsGame {
  id: string
  homeTeam: string
  awayTeam: string
  commenceTime?: string | Date
  homeOdds?: {
    best?: {
      bookmaker: string
      odds: number
    }
    all?: Array<{
      bookmaker: string
      odds: number
    }>
  }
  awayOdds?: {
    best?: {
      bookmaker: string
      odds: number
    }
    all?: Array<{
      bookmaker: string
      odds: number
    }>
  }
  spread?: {
    home: {
      line: number
      best?: {
        bookmaker: string
        odds: number
      }
    }
    away: {
      line: number
      best?: {
        bookmaker: string
        odds: number
      }
    }
  }
  totals?: {
    over: {
      line: number
      best?: {
        bookmaker: string
        odds: number
      }
    }
    under: {
      line: number
      best?: {
        bookmaker: string
        odds: number
      }
    }
  }
  bookmakers?: string[]
  aiInsights?: {
    source: string
    narrative: string
    keyFactors?: string[]
    riskWarnings?: string[]
  }
}

/**
 * Enhanced Live Scores Panel with demo content
 */
export function LiveScoresPanelEnhanced({ sport, data, loading }: {
  sport: SupportedSportKey
  data?: EnhancedOddsGame[] | null
  loading?: boolean
}) {
  if (loading) return <TabSkeleton cardCount={3} />

  const gamesToShow = data?.slice(0, 3) || []
  if (gamesToShow.length === 0) {
    return (
      <div className="p-6 text-sm text-gray-300 bg-black/10 border border-white/10 rounded-xl">
        <p>No live games or AI research available for this sport right now.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {gamesToShow.map((game) => (
        <div key={game.id} className="p-5 bg-black/20 border border-white/10 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-[#F5F5F5]">
              {game.awayTeam} @ {game.homeTeam}
            </div>
          </div>
          {(game.homeOdds || game.awayOdds || game.spread || game.totals) ? (
            <div className="space-y-3 text-xs">
              {/* Moneyline */}
              {(game.homeOdds || game.awayOdds) && (
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-green-500/10 border border-green-500/40 text-green-300">
                    <Target className="w-3 h-3" />
                    <span className="font-semibold">Moneyline</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {game.awayOdds?.best && (
                      <div className="p-2 bg-black/30 rounded border border-white/5">
                        <div className="text-[10px] text-gray-400 mb-1">{game.awayTeam}</div>
                        <div className="font-semibold text-white">{game.awayOdds.best.odds > 0 ? '+' : ''}{game.awayOdds.best.odds}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{game.awayOdds.best.bookmaker}</div>
                      </div>
                    )}
                    {game.homeOdds?.best && (
                      <div className="p-2 bg-black/30 rounded border border-white/5">
                        <div className="text-[10px] text-gray-400 mb-1">{game.homeTeam}</div>
                        <div className="font-semibold text-white">{game.homeOdds.best.odds > 0 ? '+' : ''}{game.homeOdds.best.odds}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{game.homeOdds.best.bookmaker}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Spread */}
              {game.spread && (
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-blue-500/10 border border-blue-500/40 text-blue-300">
                    <TrendingUp className="w-3 h-3" />
                    <span className="font-semibold">Spread</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {game.spread.away.best && (
                      <div className="p-2 bg-black/30 rounded border border-white/5">
                        <div className="text-[10px] text-gray-400 mb-1">{game.awayTeam}</div>
                        <div className="font-semibold text-white">{game.spread.away.line > 0 ? '+' : ''}{game.spread.away.line} ({game.spread.away.best.odds > 0 ? '+' : ''}{game.spread.away.best.odds})</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{game.spread.away.best.bookmaker}</div>
                      </div>
                    )}
                    {game.spread.home.best && (
                      <div className="p-2 bg-black/30 rounded border border-white/5">
                        <div className="text-[10px] text-gray-400 mb-1">{game.homeTeam}</div>
                        <div className="font-semibold text-white">{game.spread.home.line > 0 ? '+' : ''}{game.spread.home.line} ({game.spread.home.best.odds > 0 ? '+' : ''}{game.spread.home.best.odds})</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{game.spread.home.best.bookmaker}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Totals (Over/Under) */}
              {game.totals && (
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-purple-500/10 border border-purple-500/40 text-purple-300">
                    <LineChart className="w-3 h-3" />
                    <span className="font-semibold">Total (O/U)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {game.totals.over.best && (
                      <div className="p-2 bg-black/30 rounded border border-white/5">
                        <div className="text-[10px] text-gray-400 mb-1">Over {game.totals.over.line}</div>
                        <div className="font-semibold text-white">{game.totals.over.best.odds > 0 ? '+' : ''}{game.totals.over.best.odds}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{game.totals.over.best.bookmaker}</div>
                      </div>
                    )}
                    {game.totals.under.best && (
                      <div className="p-2 bg-black/30 rounded border border-white/5">
                        <div className="text-[10px] text-gray-400 mb-1">Under {game.totals.under.line}</div>
                        <div className="font-semibold text-white">{game.totals.under.best.odds > 0 ? '+' : ''}{game.totals.under.best.odds}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{game.totals.under.best.bookmaker}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {game.bookmakers && game.bookmakers.length > 0 && (
                <div className="text-[10px] text-gray-500">
                  {game.bookmakers.length} bookmaker{game.bookmakers.length !== 1 ? 's' : ''} tracked
                </div>
              )}
            </div>
          ) : null}
          {game.aiInsights && (
            <div className="space-y-2 text-xs text-gray-300 mt-3">
              <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-[#20B2AA]/10 border border-[#20B2AA]/40 text-[#20B2AA] mb-1">
                <Zap className="w-3 h-3" />
                <span className="font-semibold">AI Live Context (Perplexity)</span>
              </div>
              <p className="text-gray-300">{game.aiInsights.narrative}</p>
              {game.aiInsights.keyFactors && game.aiInsights.keyFactors.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">Key Factors</div>
                  <ul className="list-disc list-inside space-y-0.5">
                    {game.aiInsights.keyFactors.map((f, idx) => (
                      <li key={idx}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}
              {game.aiInsights.riskWarnings && game.aiInsights.riskWarnings.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">Risk Warnings</div>
                  <ul className="list-disc list-inside space-y-0.5 text-red-300/80">
                    {game.aiInsights.riskWarnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          {!game.homeOdds && !game.awayOdds && !game.aiInsights && (
            <p className="text-xs text-gray-400">No odds or AI context available for this matchup yet.</p>
          )}
        </div>
      ))}
    </div>
  )
}

/**
 * Enhanced Odds Panel with demo content
 */
export function UpcomingGamesOddsPanelEnhanced({ sport, data, loading }: {
  sport: SupportedSportKey
  data?: EnhancedOddsGame[] | null
  loading?: boolean
}) {
  if (loading) return <TabSkeleton cardCount={3} />

  const gamesToShow = data?.slice(0, 3) || []
  if (gamesToShow.length === 0) {
    return (
      <div className="p-6 text-sm text-gray-300 bg-black/10 border border-white/10 rounded-xl">
        <p>No upcoming games or AI research available for this sport.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {gamesToShow.map((game) => (
        <div key={game.id} className="p-5 bg-black/20 border border-white/10 rounded-xl">
          <div className="flex items-baseline justify-between mb-2">
            <div className="text-sm font-semibold text-[#F5F5F5]">
              {game.awayTeam} @ {game.homeTeam}
            </div>
          </div>
          {game.homeOdds || game.awayOdds ? (
            <div className="space-y-2 text-xs">
              <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-green-500/10 border border-green-500/40 text-green-300 mb-1">
                <TrendingUp className="w-3 h-3" />
                <span className="font-semibold">Best Odds (RapidAPI)</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {game.awayOdds?.best && (
                  <div className="p-2 bg-black/30 rounded border border-white/5">
                    <div className="text-[10px] text-gray-400 mb-1">{game.awayTeam}</div>
                    <div className="font-semibold text-white">{game.awayOdds.best.odds > 0 ? '+' : ''}{game.awayOdds.best.odds}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{game.awayOdds.best.bookmaker}</div>
                  </div>
                )}
                {game.homeOdds?.best && (
                  <div className="p-2 bg-black/30 rounded border border-white/5">
                    <div className="text-[10px] text-gray-400 mb-1">{game.homeTeam}</div>
                    <div className="font-semibold text-white">{game.homeOdds.best.odds > 0 ? '+' : ''}{game.homeOdds.best.odds}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{game.homeOdds.best.bookmaker}</div>
                  </div>
                )}
              </div>
              {game.bookmakers && game.bookmakers.length > 0 && (
                <div className="text-[10px] text-gray-500">
                  {game.bookmakers.length} bookmaker{game.bookmakers.length !== 1 ? 's' : ''} tracked
                </div>
              )}
            </div>
          ) : null}
          {game.aiInsights && (
            <div className="space-y-2 text-xs text-gray-300 mt-3">
              <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-[#20B2AA]/10 border border-[#20B2AA]/40 text-[#20B2AA] mb-1">
                <Zap className="w-3 h-3" />
                <span className="font-semibold">AI Pregame Research (Perplexity)</span>
              </div>
              <p className="text-gray-300">{game.aiInsights.narrative}</p>
              {game.aiInsights.keyFactors && game.aiInsights.keyFactors.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">Key Factors</div>
                  <ul className="list-disc list-inside space-y-0.5">
                    {game.aiInsights.keyFactors.map((f, idx) => (
                      <li key={idx}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}
              {game.aiInsights.riskWarnings && game.aiInsights.riskWarnings.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">Risk Warnings</div>
                  <ul className="list-disc list-inside space-y-0.5 text-red-300/80">
                    {game.aiInsights.riskWarnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          {!game.homeOdds && !game.awayOdds && !game.aiInsights && (
            <p className="text-xs text-gray-400">No odds or AI research available for this matchup yet.</p>
          )}
        </div>
      ))}
    </div>
  )
}

/**
 * Enhanced Line Movement Panel with live graphs showing opening to current odds
 */
export function LineMovementPanelEnhanced({ sport, data, loading }: {
  sport: SupportedSportKey
  data?: EnhancedOddsGame[] | null
  loading?: boolean
}) {
  if (loading) return <TabSkeleton cardCount={2} />

  const gamesToShow = data?.slice(0, 3) || []
  if (gamesToShow.length === 0) {
    return (
      <div className="p-6 text-sm text-gray-300 bg-black/10 border border-white/10 rounded-xl">
        <p>No line movement data available for this sport.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {gamesToShow.map((game) => (
        <div key={game.id} className="bg-black/20 border border-white/10 rounded-xl overflow-hidden">
          <div className="p-4 bg-linear-to-r from-[#20B2AA]/10 to-transparent border-b border-white/10">
            <div className="text-sm font-semibold text-[#F5F5F5] flex items-center gap-2">
              <LineChart className="w-4 h-4 text-[#20B2AA]" />
              {game.awayTeam} @ {game.homeTeam}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Track how betting lines have moved from opening to current odds
            </div>
          </div>

          <div className="p-4">
            <LineMovementChart sport={sport} gameId={game.id} />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Enhanced Betting Trends Panel with demo content
 */
/**
 * Enhanced Team & Player Analytics Panel with clickable games
 */
export function TeamPlayerAnalyticsPanelEnhanced({ sport, data, loading }: {
  sport: SupportedSportKey
  data?: EnhancedOddsGame[] | null
  loading?: boolean
}) {
  const [selectedGame, setSelectedGame] = useState<{ id: string; homeTeam: string; awayTeam: string } | null>(null)

  if (loading) return <TabSkeleton cardCount={3} />

  const gamesToShow = data?.slice(0, 5) || []
  if (gamesToShow.length === 0) {
    return (
      <div className="p-6 text-sm text-gray-300 bg-black/10 border border-white/10 rounded-xl">
        <p>No team or player analytics available yet for this sport.</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        <div className="text-sm text-gray-400 mb-4 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Click on a game to view detailed team rosters and player statistics
        </div>

        {gamesToShow.map((game) => (
          <button
            key={game.id}
            onClick={() => setSelectedGame({ id: game.id, homeTeam: game.homeTeam, awayTeam: game.awayTeam })}
            className="w-full p-4 bg-black/20 border border-white/10 hover:border-[#20B2AA]/40 hover:bg-black/30 rounded-xl transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 text-left">
                <div className="text-sm font-semibold text-[#F5F5F5] group-hover:text-[#20B2AA] transition-colors flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {game.awayTeam} @ {game.homeTeam}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  View team rosters, player stats, and injury reports
                </div>

                {/* Show quick odds preview if available */}
                {(game.homeOdds?.best || game.awayOdds?.best) && (
                  <div className="flex gap-3 mt-2 text-xs">
                    {game.awayOdds?.best && (
                      <div className="px-2 py-1 bg-blue-500/10 border border-blue-500/30 rounded">
                        <span className="text-gray-400">{game.awayTeam}:</span>{' '}
                        <span className="font-semibold text-white">
                          {game.awayOdds.best.odds > 0 ? '+' : ''}{game.awayOdds.best.odds}
                        </span>
                      </div>
                    )}
                    {game.homeOdds?.best && (
                      <div className="px-2 py-1 bg-green-500/10 border border-green-500/30 rounded">
                        <span className="text-gray-400">{game.homeTeam}:</span>{' '}
                        <span className="font-semibold text-white">
                          {game.homeOdds.best.odds > 0 ? '+' : ''}{game.homeOdds.best.odds}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#20B2AA] group-hover:translate-x-1 transition-all" />
            </div>
          </button>
        ))}
      </div>

      {/* Player Stats Modal */}
      {selectedGame && (
        <PlayerStatsModal
          isOpen={!!selectedGame}
          onClose={() => setSelectedGame(null)}
          sport={sport}
          gameId={selectedGame.id}
          homeTeam={selectedGame.homeTeam}
          awayTeam={selectedGame.awayTeam}
        />
      )}
    </>
  )
}

export function BettingTrendsPanelEnhanced({ sport, data, loading }: {
  sport: SupportedSportKey
  data?: EnhancedOddsGame[] | null
  loading?: boolean
}) {
  if (loading) return <TabSkeleton cardCount={2} />

  const gamesToShow = data?.slice(0, 3) || []
  if (gamesToShow.length === 0) {
    return (
      <div className="p-6 text-sm text-gray-300 bg-black/10 border border-white/10 rounded-xl">
        <p>No betting trends data available for this sport.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {gamesToShow.map((game) => (
        <div key={game.id} className="bg-black/20 border border-white/10 rounded-xl overflow-hidden">
          <div className="p-4 bg-linear-to-r from-[#FFD700]/10 to-transparent border-b border-white/10">
            <div className="text-sm font-semibold text-[#F5F5F5] flex items-center gap-2">
              <Percent className="w-4 h-4 text-[#FFD700]" />
              {game.awayTeam} @ {game.homeTeam}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Public betting percentages vs. sharp money indicators
            </div>
          </div>

          <div className="p-4">
            <BettingTrendsViz
              sport={sport}
              gameId={game.id}
              homeTeam={game.homeTeam}
              awayTeam={game.awayTeam}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Live Game Card Component
 *
 * Displays real-time game score, status, and key information
 * with WebSocket updates every 5 seconds
 */

"use client"

import React from "react"
import { useLiveGame } from "@/lib/hooks/useWebSocket"
import type { SupportedSportKey } from "@/lib/types"
import { Activity, Clock, TrendingUp } from "lucide-react"

interface LiveGameCardProps {
  sport: SupportedSportKey
  gameId: string
  onClick?: () => void
}

export function LiveGameCard({ sport, gameId, onClick }: LiveGameCardProps) {
  const { data: game, loading, error, isConnected, lastUpdate } = useLiveGame(sport, gameId)

  if (loading) {
    return (
      <div className="bg-[#1a1f2e] border border-white/10 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-white/10 rounded mb-4" />
        <div className="h-24 bg-white/10 rounded mb-4" />
        <div className="h-4 bg-white/10 rounded w-1/2" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/40 rounded-xl p-6">
        <p className="text-sm text-red-300">Error loading game: {error}</p>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="bg-[#1a1f2e] border border-white/10 rounded-xl p-6">
        <p className="text-sm text-gray-400">No game data available</p>
      </div>
    )
  }

  const { status, homeTeam, awayTeam } = game

  return (
    <div
      className="bg-gradient-to-br from-[#1a1f2e] to-[#151923] border border-white/20 rounded-xl p-6 hover:border-[#20B2AA]/40 transition-all cursor-pointer relative overflow-hidden group"
      onClick={onClick}
    >
      {/* Live indicator */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {isConnected ? (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-red-500/20 border border-red-500/40 rounded-full">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-red-400">LIVE</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-500/20 border border-gray-500/40 rounded-full">
            <Activity className="w-3 h-3 text-gray-400" />
            <span className="text-xs font-semibold text-gray-400">POLLING</span>
          </div>
        )}
      </div>

      {/* Game status bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-400">
            {status.isFinal ? "FINAL" : `Q${status.period} - ${status.clock}`}
            {status.isOvertime && " (OT)"}
            {status.isHalftime && " (HT)"}
          </span>
        </div>
      </div>

      {/* Score display */}
      <div className="space-y-4 mb-6">
        {/* Away team */}
        <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg">
          <div className="flex items-center gap-3">
            {game.awayTeamLogo && (
              <img src={game.awayTeamLogo} alt={awayTeam} className="w-10 h-10" />
            )}
            <span className="text-lg font-bold text-[#F5F5F5]">{awayTeam}</span>
          </div>
          <div className="text-3xl font-bold text-[#20B2AA]">{status.awayScore}</div>
        </div>

        {/* Home team */}
        <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg">
          <div className="flex items-center gap-3">
            {game.homeTeamLogo && (
              <img src={game.homeTeamLogo} alt={homeTeam} className="w-10 h-10" />
            )}
            <span className="text-lg font-bold text-[#F5F5F5]">{homeTeam}</span>
          </div>
          <div className="text-3xl font-bold text-[#FFD700]">{status.homeScore}</div>
        </div>
      </div>

      {/* Last play */}
      {status.lastPlay && (
        <div className="p-3 bg-[#20B2AA]/10 border border-[#20B2AA]/30 rounded-lg mb-4">
          <div className="flex items-start gap-2">
            <TrendingUp className="w-4 h-4 text-[#20B2AA] mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-300 leading-relaxed">{status.lastPlay}</p>
          </div>
        </div>
      )}

      {/* Venue and weather */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-white/10">
        <span>{game.venue || "Unknown Venue"}</span>
        {game.weatherConditions && (
          <span>
            {game.weatherConditions.temperature}°F, {game.weatherConditions.conditions}
          </span>
        )}
      </div>

      {/* Last update timestamp */}
      {lastUpdate && (
        <div className="absolute bottom-2 right-4 text-xs text-gray-600">
          Updated {new Date(lastUpdate).toLocaleTimeString()}
        </div>
      )}

      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#20B2AA]/0 to-[#20B2AA]/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none" />
    </div>
  )
}

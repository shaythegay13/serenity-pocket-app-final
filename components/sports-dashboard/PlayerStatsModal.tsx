'use client'

import React, { useState, useEffect } from 'react'
import { X, TrendingUp, User, Users as UsersIcon, AlertCircle, Activity } from 'lucide-react'
import type { SupportedSportKey } from '@/lib/types'
import type { GamePlayerAnalytics, PlayerStats } from '@/lib/player-stats-api'

interface PlayerStatsModalProps {
  isOpen: boolean
  onClose: () => void
  sport: SupportedSportKey
  gameId: string
  homeTeam: string
  awayTeam: string
}

export function PlayerStatsModal({
  isOpen,
  onClose,
  sport,
  gameId,
  homeTeam,
  awayTeam
}: PlayerStatsModalProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<GamePlayerAnalytics | null>(null)
  const [activeTab, setActiveTab] = useState<'home' | 'away'>('home')

  useEffect(() => {
    if (!isOpen) return

    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        const url = `/api/player-analytics?sport=${sport}&gameId=${gameId}&homeTeam=${encodeURIComponent(homeTeam)}&awayTeam=${encodeURIComponent(awayTeam)}`
        const response = await fetch(url)
        const result = await response.json()

        if (result.success) {
          setAnalytics(result.data)
        } else {
          setError(result.error || 'Failed to load player analytics')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isOpen, sport, gameId, homeTeam, awayTeam])

  if (!isOpen) return null

  const currentRoster = activeTab === 'home' ? analytics?.homeRoster : analytics?.awayRoster
  const currentTeam = activeTab === 'home' ? homeTeam : awayTeam

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-[#1a1f2e] border border-white/20 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-linear-to-r from-[#20B2AA]/10 to-transparent">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#F5F5F5] flex items-center gap-2">
                <UsersIcon className="w-6 h-6 text-[#20B2AA]" />
                Team & Player Analytics
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {awayTeam} @ {homeTeam}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Team Tabs */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab('away')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'away'
                  ? 'bg-[#20B2AA] text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {awayTeam} (Away)
            </button>
            <button
              onClick={() => setActiveTab('home')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'home'
                  ? 'bg-[#20B2AA] text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {homeTeam} (Home)
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#20B2AA]"></div>
              <div className="text-center text-sm text-gray-400 max-w-md">
                <p className="font-semibold text-[#20B2AA] mb-1">Loading team rosters...</p>
                <p className="text-xs">
                  This may take 30-45 seconds due to API rate limits (4 requests/minute).
                  Subsequent loads will be instant from cache.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-900/20 border border-red-500/40 rounded-xl p-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-red-300 font-semibold mb-1">Data Unavailable</h3>
                <p className="text-sm text-red-200/80">Sorry, we are having difficulty accessing the data right now. Please come back later and try again.</p>
              </div>
            </div>
          )}

          {!loading && !error && currentRoster && (
            <div>
              {/* Team Summary */}
              <div className="bg-black/20 border border-white/10 rounded-xl p-4 mb-6">
                <h3 className="text-lg font-bold text-[#F5F5F5] mb-2">{currentTeam} Roster</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400">Total Players</div>
                    <div className="text-2xl font-bold text-[#20B2AA]">
                      {currentRoster.players.length}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">Active</div>
                    <div className="text-2xl font-bold text-green-400">
                      {currentRoster.players.filter(p => !p.injuryStatus?.isInjured).length}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">Injured</div>
                    <div className="text-2xl font-bold text-red-400">
                      {currentRoster.players.filter(p => p.injuryStatus?.isInjured).length}
                    </div>
                  </div>
                </div>
              </div>

              {/* Player List */}
              <div className="space-y-3">
                {currentRoster.players.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No player data available for this team</p>
                  </div>
                )}

                {currentRoster.players.map((player) => (
                  <div
                    key={player.playerId}
                    className="bg-black/20 border border-white/10 rounded-xl p-4 hover:bg-black/30 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      {/* Player Image */}
                      <div className="w-16 h-16 rounded-lg bg-linear-to-br from-[#20B2AA]/20 to-[#FFD700]/20 flex items-center justify-center shrink-0 overflow-hidden">
                        {player.imageUrl ? (
                          <img
                            src={player.imageUrl}
                            alt={player.playerName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-8 h-8 text-gray-400" />
                        )}
                      </div>

                      {/* Player Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h4 className="font-bold text-[#F5F5F5] text-lg">
                              {player.playerName}
                            </h4>
                            <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                              {player.position && (
                                <span className="px-2 py-0.5 bg-[#20B2AA]/20 border border-[#20B2AA]/40 rounded text-[#20B2AA] font-semibold">
                                  {player.position}
                                </span>
                              )}
                              {player.jerseyNumber && (
                                <span>#{player.jerseyNumber}</span>
                              )}
                              {player.nationality && (
                                <span>{player.nationality}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Player Stats Grid */}
                        <div className="grid grid-cols-3 gap-3 mt-3">
                          {player.age && (
                            <div>
                              <div className="text-xs text-gray-400">Age</div>
                              <div className="font-semibold text-white">{player.age}</div>
                            </div>
                          )}
                          {player.height && (
                            <div>
                              <div className="text-xs text-gray-400">Height</div>
                              <div className="font-semibold text-white">{player.height}</div>
                            </div>
                          )}
                          {player.weight && (
                            <div>
                              <div className="text-xs text-gray-400">Weight</div>
                              <div className="font-semibold text-white">{player.weight}</div>
                            </div>
                          )}
                        </div>

                        {/* Performance Stats */}
                        {player.stats && Object.keys(player.stats).length > 0 && (
                          <div className="mt-3 p-3 bg-black/30 rounded-lg">
                            <div className="flex items-center gap-2 text-xs font-semibold text-[#20B2AA] mb-2">
                              <Activity className="w-3 h-3" />
                              Season Stats
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-xs">
                              {player.stats.points && (
                                <div>
                                  <div className="text-gray-400">PTS</div>
                                  <div className="font-bold text-white">{player.stats.points}</div>
                                </div>
                              )}
                              {player.stats.rebounds && (
                                <div>
                                  <div className="text-gray-400">REB</div>
                                  <div className="font-bold text-white">{player.stats.rebounds}</div>
                                </div>
                              )}
                              {player.stats.assists && (
                                <div>
                                  <div className="text-gray-400">AST</div>
                                  <div className="font-bold text-white">{player.stats.assists}</div>
                                </div>
                              )}
                              {player.stats.fieldGoalPct && (
                                <div>
                                  <div className="text-gray-400">FG%</div>
                                  <div className="font-bold text-white">{player.stats.fieldGoalPct}%</div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Injury Status */}
                        {player.injuryStatus?.isInjured && (
                          <div className="mt-3 p-2 bg-red-900/20 border border-red-500/40 rounded text-xs text-red-300">
                            <strong>Injury:</strong> {player.injuryStatus.description || 'Status unknown'}
                            {player.injuryStatus.expectedReturn && (
                              <span className="ml-2">• Expected return: {player.injuryStatus.expectedReturn}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && !error && !currentRoster && (
            <div className="text-center py-12 text-gray-400">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No roster data available for {currentTeam}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/20">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

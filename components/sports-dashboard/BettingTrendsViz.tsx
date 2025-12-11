'use client'

import React, { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Users, DollarSign, AlertCircle, Zap } from 'lucide-react'
import type { SupportedSportKey } from '@/lib/types'

interface BettingSplit {
  side: string
  bets: number
  money: number
}

interface BettingTrendsData {
  gameId: string
  sport: string
  homeTeam: string
  awayTeam: string
  splits: {
    moneyline: { public: BettingSplit[]; sharp: BettingSplit[] }
    spread: { public: BettingSplit[]; sharp: BettingSplit[] }
    total: { public: BettingSplit[]; sharp: BettingSplit[] }
  }
  sharpMoneyIndicators: Array<{
    betType: string
    side: string
    confidence: string
    description: string
  }>
}

interface BettingTrendsVizProps {
  sport: SupportedSportKey
  gameId: string
  homeTeam: string
  awayTeam: string
}

export function BettingTrendsViz({ sport, gameId, homeTeam, awayTeam }: BettingTrendsVizProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<BettingTrendsData | null>(null)
  const [selectedMarket, setSelectedMarket] = useState<'moneyline' | 'spread' | 'total'>('spread')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/betting-trends?sport=${sport}&gameId=${gameId}`)
        const result = await response.json()

        if (result.success) {
          setData(result.data)
        } else {
          setError(result.error || 'Failed to load betting trends')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [sport, gameId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#20B2AA]"></div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-500/40 rounded-lg text-sm text-red-300">
        <AlertCircle className="w-4 h-4 inline mr-2" />
        Sorry, we are having difficulty accessing the data right now. Please come back later and try again.
      </div>
    )
  }

  const currentSplits = data.splits[selectedMarket]
  const publicHome = currentSplits.public.find(s => s.side === 'home' || s.side === 'over')
  const publicAway = currentSplits.public.find(s => s.side === 'away' || s.side === 'under')
  const sharpHome = currentSplits.sharp.find(s => s.side === 'home' || s.side === 'over')
  const sharpAway = currentSplits.sharp.find(s => s.side === 'away' || s.side === 'under')

  const homeLabel = selectedMarket === 'total' ? 'Over' : homeTeam
  const awayLabel = selectedMarket === 'total' ? 'Under' : awayTeam

  // Detect reverse line movement (public on one side, sharp on other)
  const hasReverseLineMovement =
    publicHome && publicAway && sharpHome && sharpAway &&
    ((publicHome.bets > 60 && sharpHome.money < 45) ||
     (publicAway.bets > 60 && sharpAway.money < 45))

  return (
    <div className="space-y-4">
      {/* Market Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setSelectedMarket('moneyline')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            selectedMarket === 'moneyline'
              ? 'bg-[#20B2AA] text-white'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          Moneyline
        </button>
        <button
          onClick={() => setSelectedMarket('spread')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            selectedMarket === 'spread'
              ? 'bg-[#20B2AA] text-white'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          Spread
        </button>
        <button
          onClick={() => setSelectedMarket('total')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            selectedMarket === 'total'
              ? 'bg-[#20B2AA] text-white'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          Total
        </button>
      </div>

      {/* Sharp Money Alert */}
      {hasReverseLineMovement && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/40 rounded-lg">
          <div className="flex items-start gap-2">
            <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <div className="font-semibold text-amber-300 mb-1">Reverse Line Movement Detected</div>
              <div className="text-amber-200/80">
                Public and sharp money are on opposite sides. This could indicate sharp value.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Betting Splits Visualization */}
      <div className="space-y-4">
        {/* Home/Over Side */}
        <div>
          <div className="text-sm font-semibold text-[#F5F5F5] mb-2">{homeLabel}</div>

          {/* Public Bets */}
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <div className="flex items-center gap-1 text-gray-400">
                <Users className="w-3 h-3" />
                Public Bets
              </div>
              <span className="font-semibold text-white">{publicHome?.bets || 0}%</span>
            </div>
            <div className="h-2 bg-black/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-blue-500 to-blue-400 transition-all duration-500"
                style={{ width: `${publicHome?.bets || 0}%` }}
              />
            </div>
          </div>

          {/* Public Money */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <div className="flex items-center gap-1 text-gray-400">
                <DollarSign className="w-3 h-3" />
                Public Money
              </div>
              <span className="font-semibold text-white">{publicHome?.money || 0}%</span>
            </div>
            <div className="h-2 bg-black/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-blue-600 to-blue-500 transition-all duration-500"
                style={{ width: `${publicHome?.money || 0}%` }}
              />
            </div>
          </div>

          {/* Sharp Money */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <div className="flex items-center gap-1 text-amber-400">
                <Zap className="w-3 h-3" />
                Sharp Money
              </div>
              <span className="font-semibold text-amber-300">{sharpHome?.money || 0}%</span>
            </div>
            <div className="h-2 bg-black/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-amber-500 to-amber-400 transition-all duration-500"
                style={{ width: `${sharpHome?.money || 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Away/Under Side */}
        <div>
          <div className="text-sm font-semibold text-[#F5F5F5] mb-2">{awayLabel}</div>

          {/* Public Bets */}
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <div className="flex items-center gap-1 text-gray-400">
                <Users className="w-3 h-3" />
                Public Bets
              </div>
              <span className="font-semibold text-white">{publicAway?.bets || 0}%</span>
            </div>
            <div className="h-2 bg-black/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-green-500 to-green-400 transition-all duration-500"
                style={{ width: `${publicAway?.bets || 0}%` }}
              />
            </div>
          </div>

          {/* Public Money */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <div className="flex items-center gap-1 text-gray-400">
                <DollarSign className="w-3 h-3" />
                Public Money
              </div>
              <span className="font-semibold text-white">{publicAway?.money || 0}%</span>
            </div>
            <div className="h-2 bg-black/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-green-600 to-green-500 transition-all duration-500"
                style={{ width: `${publicAway?.money || 0}%` }}
              />
            </div>
          </div>

          {/* Sharp Money */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <div className="flex items-center gap-1 text-amber-400">
                <Zap className="w-3 h-3" />
                Sharp Money
              </div>
              <span className="font-semibold text-amber-300">{sharpAway?.money || 0}%</span>
            </div>
            <div className="h-2 bg-black/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
                style={{ width: `${sharpAway?.money || 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="pt-3 border-t border-white/10">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Users className="w-3 h-3 text-blue-400" />
            <span className="text-gray-400">Public (# of bets)</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-3 h-3 text-amber-400" />
            <span className="text-gray-400">Sharp (professional)</span>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Data is estimated based on line movement patterns. For real-time betting percentages, premium data sources are required.
        </div>
      </div>
    </div>
  )
}

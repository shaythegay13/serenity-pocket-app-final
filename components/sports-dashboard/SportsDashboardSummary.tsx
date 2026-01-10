"use client"

import React, { useState, useEffect } from "react"
import { TrendingUp, Activity, Zap, Trophy } from "lucide-react"
import { storageHybrid as storage } from "@/lib/storage-hybrid"
import type { BetAnalysis, Trade } from "@/lib/types"

/**
 * SportsDashboardSummary Component
 * 
 * Shows key betting metrics at the top of the sports dashboard:
 * - Active bets count
 * - Today's edge percentage
 * - Live games count
 * - Current win streak
 */
export function SportsDashboardSummary() {
  const [activeBets, setActiveBets] = useState(0)
  const [todayEdge, setTodayEdge] = useState(0)
  const [liveGames, setLiveGames] = useState(0)
  const [winStreak, setWinStreak] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Get bet analyses for active bets and edge calculation
        const betAnalyses = await storage.getBetAnalyses()
        const trades = await storage.getTrades()
        
        // Calculate active bets (pending/unsettled)
        const activeBetsCount = betAnalyses.filter(bet => 
          bet.status === "pending" || bet.status === "open"
        ).length + trades.filter(trade => 
          trade.outcome === undefined || trade.outcome === null
        ).length
        
        // Calculate today's edge (win rate - 50%)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const todayBets = betAnalyses.filter(bet => 
          new Date(bet.timestamp) >= today && bet.status === "settled"
        )
        
        const todayTrades = trades.filter(trade => 
          new Date(trade.timestamp) >= today && trade.outcome !== undefined
        )
        
        const totalWins = todayBets.filter(bet => bet.result === "win").length + 
                         todayTrades.filter(trade => trade.outcome === "profit").length
        const totalBets = todayBets.length + todayTrades.length
        
        const edgePercentage = totalBets > 0 
          ? Math.round(((totalWins / totalBets) - 0.5) * 100)
          : 0
        
        // Calculate live games (this would come from your sports data API)
        // For now, we'll simulate with a reasonable number
        const liveGamesCount = Math.floor(Math.random() * 15) + 5 // 5-20 live games
        
        // Calculate win streak
        const allBets = [...betAnalyses, ...trades].sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        
        let currentStreak = 0
        for (const bet of allBets) {
          const isWin = bet.status === "settled" 
            ? bet.result === "win" 
            : bet.outcome === "profit"
          
          if (isWin) {
            currentStreak++
          } else {
            break
          }
        }
        
        setActiveBets(activeBetsCount)
        setTodayEdge(edgePercentage)
        setLiveGames(liveGamesCount)
        setWinStreak(currentStreak)
      } catch (error) {
        console.error('Error loading dashboard data:', error)
        // Set fallback values
        setActiveBets(0)
        setTodayEdge(0)
        setLiveGames(8)
        setWinStreak(0)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="px-4 md:px-6 py-4 bg-[#0B0E14] border-b border-white/5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white/5 rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-white/10 rounded mb-2"></div>
              <div className="h-6 bg-white/10 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 md:px-6 py-4 bg-[#0B0E14] border-b border-white/5">
      {/* Section Title */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-white mb-1">Highlights</h2>
        <p className="text-xs text-gray-400 uppercase tracking-wider">Your betting dashboard</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Active Bets */}
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="h-4 w-4 text-blue-400" />
            <span className="text-xs text-gray-400 uppercase tracking-wider">Active Bets</span>
          </div>
          <div className="text-2xl font-bold text-white">{activeBets}</div>
        </div>

        {/* Today's Edge */}
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-green-400" />
            <span className="text-xs text-gray-400 uppercase tracking-wider">Today's Edge</span>
          </div>
          <div className={`text-2xl font-bold ${todayEdge >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {todayEdge >= 0 ? '+' : ''}{todayEdge}%
          </div>
        </div>

        {/* Live Games */}
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-4 w-4 text-yellow-400" />
            <span className="text-xs text-gray-400 uppercase tracking-wider">Live Games</span>
          </div>
          <div className="text-2xl font-bold text-white">{liveGames}</div>
        </div>

        {/* Win Streak */}
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="h-4 w-4 text-purple-400" />
            <span className="text-xs text-gray-400 uppercase tracking-wider">Win Streak</span>
          </div>
          <div className="text-2xl font-bold text-white">{winStreak}</div>
        </div>
      </div>
    </div>
  )
}

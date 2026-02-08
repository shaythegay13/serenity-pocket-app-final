"use client"

import { useEffect, useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts"
import { TrendingUp, DollarSign, Target, BarChart3, Clock, CheckCircle2, XCircle, RefreshCw, Users } from "lucide-react"
import type { Trade, BetAnalysis } from "@/lib/types"
import type { ComprehensiveBet } from "@/lib/types/bet-tracking"
import { analyticsEvents, ANALYTICS_EVENTS } from "@/lib/events"
import { KPICardsGrid } from "./KPICards"
import { calculateBettingMetrics } from "./utils/calculations"
import type { UnifiedBet } from "./types"
import { storageHybrid as storage } from "@/lib/storage-hybrid"
import { toast } from "sonner"

interface PerformanceTabProps {
  trades: Trade[]
  unifiedBets?: UnifiedBet[]
  comprehensiveBets?: ComprehensiveBet[]
  onRefreshData?: () => void
  isRefreshing?: boolean
}

export function PerformanceTab({ trades, unifiedBets = [], comprehensiveBets: propComprehensiveBets = [], onRefreshData, isRefreshing }: PerformanceTabProps) {
  // Calculate metrics
  const metrics = useMemo(() => {
    if (unifiedBets.length > 0) {
      return calculateBettingMetrics(unifiedBets)
    }

    // Fallback to trades data
    const completed = trades.filter(t => t.outcome && t.actualReturn != null)
    const wins = completed.filter(t => t.outcome === 'profit')
    const losses = completed.filter(t => t.outcome === 'loss')
    const breakeven = completed.filter(t => t.outcome === 'breakeven')
    const totalStaked = completed.reduce((sum, t) => sum + (t.stake || 0), 0)
    const totalReturns = completed.reduce((sum, t) => sum + (t.actualReturn || 0), 0)
    const profit = totalReturns - totalStaked
    const roi = totalStaked > 0 ? (profit / totalStaked) * 100 : 0
    const winRate = completed.length > 0 ? (wins.length / completed.length) * 100 : 0

    // Calculate average expected value from completed trades
    const tradesWithEV = completed.filter(t => t.stake && t.stake > 0)
    const avgEV = tradesWithEV.length > 0 
      ? tradesWithEV.reduce((sum: number, trade: Trade) => {
          const profit = (trade.actualReturn || 0) - (trade.stake || 0)
          return sum + profit
        }, 0) / tradesWithEV.length
      : 0

    return {
      totalBets: trades.length,
      completedBets: completed.length,
      wins: wins.length,
      losses: losses.length,
      winRate,
      totalStaked,
      totalReturns,
      profit,
      roi,
      avgEV
    }
  }, [trades, unifiedBets])

  // State for pending bets (from both BetAnalysis and ComprehensiveBet)
  const [pendingBets, setPendingBets] = useState<BetAnalysis[]>([])
  const [pendingComprehensiveBets, setPendingComprehensiveBets] = useState<ComprehensiveBet[]>([])
  const [loadingPending, setLoadingPending] = useState(false)

  // Load pending bets on mount
  useEffect(() => {
    let isMounted = true

    const loadPendingBets = async () => {
      setLoadingPending(true)
      try {
        // Load from both BetAnalysis and ComprehensiveBet sources
        const [analyses, comprehensiveBets] = await Promise.all([
          storage.getBetAnalyses().catch(() => []),
          storage.getComprehensiveBets().catch(() => [])
        ])

        const pendingAnalyses = analyses.filter(bet => bet.outcome === 'pending')
        const pendingCompBets = comprehensiveBets.filter(bet => bet.outcome === 'pending')

        if (isMounted) {
          setPendingBets(pendingAnalyses)
          setPendingComprehensiveBets(pendingCompBets)
        }
      } catch (error) {
        console.error('Error loading pending bets:', error)
      } finally {
        if (isMounted) {
          setLoadingPending(false)
        }
      }
    }

    loadPendingBets()

    return () => { isMounted = false }
  }, [])

  // Handle bet outcome update (for BetAnalysis)
  const handleBetOutcome = async (betId: string, outcome: 'win' | 'loss' | 'push') => {
    try {
      const bet = pendingBets.find(b => b.id === betId)
      if (!bet) return

      // Calculate actual return based on outcome
      let actualReturn: number
      const odds = bet.odds ?? -110 // Default to -110 if undefined
      if (outcome === 'win') {
        actualReturn = bet.stake * (1 + (odds > 0 ? odds / 100 : 100 / Math.abs(odds)))
      } else if (outcome === 'push') {
        actualReturn = bet.stake
      } else {
        actualReturn = 0
      }

      // Update the bet
      await storage.updateBetAnalysis({
        ...bet,
        outcome,
        actualReturn
      })

      // Remove from pending bets
      setPendingBets(prev => prev.filter(b => b.id !== betId))

      toast.success(`Bet marked as ${outcome}!`)

      // Emit event to refresh analytics data
      analyticsEvents.emit(ANALYTICS_EVENTS.BETTING_DATA_SAVED)

      // Also trigger parent refresh if available
      if (onRefreshData) {
        onRefreshData()
      }
    } catch (error) {
      console.error('Error updating bet outcome:', error)
      toast.error('Failed to update bet outcome')
    }
  }

  // Handle comprehensive bet outcome update
  const handleComprehensiveBetOutcome = async (betId: string, outcome: 'win' | 'loss' | 'push') => {
    try {
      const bet = pendingComprehensiveBets.find(b => b.id === betId)
      if (!bet) return

      // Calculate actual return based on outcome
      let actualReturn: number
      const odds = bet.odds
      if (outcome === 'win') {
        actualReturn = bet.stake * (1 + (odds > 0 ? odds / 100 : 100 / Math.abs(odds)))
      } else if (outcome === 'push') {
        actualReturn = bet.stake
      } else {
        actualReturn = 0
      }

      const profitLoss = actualReturn - bet.stake

      // Update the bet
      await storage.updateComprehensiveBet({
        ...bet,
        outcome,
        actualReturn,
        profitLoss,
        completedAt: new Date()
      })

      // Remove from pending bets
      setPendingComprehensiveBets(prev => prev.filter(b => b.id !== betId))

      toast.success(`Bet marked as ${outcome}!`)

      // Emit event to refresh analytics data
      analyticsEvents.emit(ANALYTICS_EVENTS.BETTING_DATA_SAVED)

      // Also trigger parent refresh if available
      if (onRefreshData) {
        onRefreshData()
      }
    } catch (error) {
      console.error('Error updating comprehensive bet outcome:', error)
      toast.error('Failed to update bet outcome')
    }
  }

  // Calculate average stake
  const avgStake = useMemo(() => {
    const betsWithStake = trades.filter(t => t.stake && t.stake > 0)
    if (betsWithStake.length === 0) return 0
    return betsWithStake.reduce((sum, t) => sum + (t.stake || 0), 0) / betsWithStake.length
  }, [trades])

  // Outcome distribution
  const outcomeData = useMemo(() => {
    const wins = trades.filter(t => t.outcome === 'profit').length
    const losses = trades.filter(t => t.outcome === 'loss').length
    const breakeven = trades.filter(t => t.outcome === 'breakeven').length
    const pending = trades.filter(t => !t.outcome).length

    return [
      { name: 'Wins', value: wins, color: 'oklch(0.65 0.18 150)' },
      { name: 'Losses', value: losses, color: 'oklch(0.55 0.24 25)' },
      { name: 'Breakeven', value: breakeven, color: 'oklch(0.7 0.18 70)' },
      { name: 'Pending', value: pending, color: 'oklch(0.55 0.01 250)' }
    ].filter(item => item.value > 0)
  }, [trades])

  // Format sport key to display name (e.g., "basketball_nba" -> "NBA")
  const formatSportName = (sportKey: string): string => {
    if (!sportKey || sportKey === 'Unknown') return 'Unknown'

    // Common sport key mappings
    const sportNames: Record<string, string> = {
      'basketball_nba': 'NBA',
      'americanfootball_nfl': 'NFL',
      'baseball_mlb': 'MLB',
      'icehockey_nhl': 'NHL',
      'basketball_ncaab': 'NCAAB',
      'americanfootball_ncaaf': 'NCAAF',
      'soccer_epl': 'EPL',
      'soccer_mls': 'MLS',
      'soccer_champions_league': 'Champions League',
      'mma_ufc': 'UFC',
      'boxing': 'Boxing',
      'tennis_atp': 'ATP Tennis',
      'tennis_wta': 'WTA Tennis',
      'golf_pga': 'PGA Golf',
      'motorsports_f1': 'F1',
      'motorsports_nascar': 'NASCAR',
      'esports_lol': 'LoL',
      'esports_csgo': 'CS:GO',
    }

    return sportNames[sportKey] || sportKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  // Sport performance
  const sportPerformance = useMemo(() => {
    const sportMap = new Map<string, { wins: number; losses: number; pushes: number; pending: number; profit: number }>()
    const processedIds = new Set<string>()

    // Process trades
    trades.forEach(trade => {
      const sportKey = trade.sport || 'Unknown'
      const sport = formatSportName(sportKey)
      if (!sportMap.has(sport)) {
        sportMap.set(sport, { wins: 0, losses: 0, pushes: 0, pending: 0, profit: 0 })
      }
      const stats = sportMap.get(sport)!

      if (trade.outcome === 'profit') stats.wins++
      else if (trade.outcome === 'loss') stats.losses++
      else if (trade.outcome === 'breakeven') stats.pushes++
      else stats.pending++ // No outcome means pending

      // Only include profit for settled bets with actualReturn
      if (trade.actualReturn != null) {
        stats.profit += (trade.actualReturn || 0) - (trade.stake || 0)
      }

      // Track processed IDs to avoid double counting
      processedIds.add(trade.id)
    })

    // Also process comprehensive bets that might not be in trades
    propComprehensiveBets.forEach(bet => {
      if (processedIds.has(bet.id)) return
      processedIds.add(bet.id)

      const sport = formatSportName(bet.sport)
      if (!sportMap.has(sport)) {
        sportMap.set(sport, { wins: 0, losses: 0, pushes: 0, pending: 0, profit: 0 })
      }
      const stats = sportMap.get(sport)!

      if (bet.outcome === 'win') stats.wins++
      else if (bet.outcome === 'loss') stats.losses++
      else if (bet.outcome === 'push') stats.pushes++
      else stats.pending++ // pending or undefined

      if (bet.actualReturn != null) {
        stats.profit += (bet.actualReturn || 0) - (bet.stake || 0)
      }
    })

    return Array.from(sportMap.entries()).map(([sport, stats]) => ({
      sport,
      wins: stats.wins,
      losses: stats.losses,
      pushes: stats.pushes,
      pending: stats.pending,
      totalBets: stats.wins + stats.losses + stats.pushes + stats.pending,
      profit: stats.profit,
      winRate: stats.wins + stats.losses > 0
        ? (stats.wins / (stats.wins + stats.losses)) * 100
        : 0
    })).sort((a, b) => b.totalBets - a.totalBets) // Sort by total bets instead of profit
  }, [trades, propComprehensiveBets])

  // Team betting statistics - count bets on each team
  const teamStats = useMemo(() => {
    const teamMap = new Map<string, { bets: number; wins: number; losses: number; profit: number }>()
    const processedIds = new Set<string>()

    // Helper function to process a bet - only attribute to the team that was actually bet on
    const processBetTeams = (bet: ComprehensiveBet) => {
      if (processedIds.has(bet.id)) return
      processedIds.add(bet.id)

      const betProfit = bet.actualReturn != null ? (bet.actualReturn - bet.stake) : 0
      const isWin = bet.outcome === 'win'
      const isLoss = bet.outcome === 'loss'

      // Determine which team was actually bet on based on selection
      let selectedTeam: string | null = null

      if (bet.selection === 'home' && bet.homeTeam && bet.homeTeam !== "Unknown") {
        selectedTeam = bet.homeTeam
      } else if (bet.selection === 'away' && bet.awayTeam && bet.awayTeam !== "Unknown") {
        selectedTeam = bet.awayTeam
      } else if (bet.selection === 'over' || bet.selection === 'under') {
        // For totals, attribute to both teams as it's a matchup bet
        // But only count as 0.5 bets each to avoid inflating numbers
        const teams = [bet.homeTeam, bet.awayTeam].filter(t => t && t !== "Unknown")
        teams.forEach(team => {
          if (!teamMap.has(team)) {
            teamMap.set(team, { bets: 0, wins: 0, losses: 0, profit: 0 })
          }
          const stats = teamMap.get(team)!
          stats.bets += 0.5
          if (isWin) stats.wins += 0.5
          if (isLoss) stats.losses += 0.5
          stats.profit += betProfit / 2
        })
        return // Already processed
      }

      // For moneyline/spread bets on a specific team
      if (selectedTeam) {
        if (!teamMap.has(selectedTeam)) {
          teamMap.set(selectedTeam, { bets: 0, wins: 0, losses: 0, profit: 0 })
        }
        const stats = teamMap.get(selectedTeam)!
        stats.bets++
        if (isWin) stats.wins++
        if (isLoss) stats.losses++
        stats.profit += betProfit
      }
    }

    // Process comprehensive bets passed as props (all bets - settled and pending)
    propComprehensiveBets.forEach(processBetTeams)

    // Also process locally loaded pending bets
    pendingComprehensiveBets.forEach(processBetTeams)

    // Also process from unified bets if available
    unifiedBets.forEach(bet => {
      if (processedIds.has(bet.id)) return
      processedIds.add(bet.id)

      const selection = (bet as any).selection
      const homeTeam = (bet as any).homeTeam
      const awayTeam = (bet as any).awayTeam
      const betProfit = bet.actualReturn != null ? (bet.actualReturn - bet.stake) : 0
      const isWin = bet.outcome === 'win'
      const isLoss = bet.outcome === 'loss'

      let selectedTeam: string | null = null
      if (selection === 'home' && homeTeam && homeTeam !== "Unknown") {
        selectedTeam = homeTeam
      } else if (selection === 'away' && awayTeam && awayTeam !== "Unknown") {
        selectedTeam = awayTeam
      }

      if (selectedTeam) {
        if (!teamMap.has(selectedTeam)) {
          teamMap.set(selectedTeam, { bets: 0, wins: 0, losses: 0, profit: 0 })
        }
        const stats = teamMap.get(selectedTeam)!
        stats.bets++
        if (isWin) stats.wins++
        if (isLoss) stats.losses++
        stats.profit += betProfit
      }
    })

    // Sort by number of bets and return top 10
    // Round fractional values from totals bets (over/under split between teams)
    return Array.from(teamMap.entries())
      .map(([team, stats]) => ({
        team,
        bets: Math.round(stats.bets),
        wins: Math.round(stats.wins),
        losses: Math.round(stats.losses),
        profit: Math.round(stats.profit * 100) / 100,
        winRate: stats.wins + stats.losses > 0
          ? (stats.wins / (stats.wins + stats.losses)) * 100
          : 0
      }))
      .filter(t => t.bets > 0) // Only show teams with at least 1 bet
      .sort((a, b) => b.bets - a.bets)
      .slice(0, 10)
  }, [propComprehensiveBets, pendingComprehensiveBets, unifiedBets])

  // Cumulative profit over time
  const cumulativeProfit = useMemo(() => {
    const sorted = [...trades]
      .filter(t => t.outcome && t.actualReturn != null)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    let cumulative = 0
    return sorted.map(trade => {
      const tradeProfit = (trade.actualReturn || 0) - (trade.stake || 0)
      cumulative += tradeProfit
      return {
        date: new Date(trade.timestamp).toLocaleDateString(),
        profit: cumulative
      }
    })
  }, [trades])

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-foreground">Betting Performance</h3>
            <p className="text-muted-foreground">Track your betting results and settle pending bets</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefreshData}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </div>
      </div>

      {/* Pending Bets Section */}
      {(pendingBets.length > 0 || pendingComprehensiveBets.length > 0) && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-orange-500" />
            <h4 className="text-lg font-semibold text-foreground">Settle Pending Bets</h4>
            <Badge variant="secondary">{pendingBets.length + pendingComprehensiveBets.length} pending</Badge>
          </div>

          <div className="space-y-3">
            {/* Show pending comprehensive bets first */}
            {pendingComprehensiveBets.map(bet => (
              <Card key={bet.id} className="p-4 border-l-4 border-l-orange-500">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-foreground">
                      {bet.homeTeam === "Unknown" && bet.awayTeam === "Unknown" && bet.description
                        ? bet.description
                        : `${bet.awayTeam} vs ${bet.homeTeam} - ${bet.betType}`}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {bet.sport} • ${bet.stake.toFixed(2)} • {bet.odds > 0 ? '+' : ''}{bet.odds}
                    </div>
                    {bet.emotions.before.emotion && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Pre-bet emotion: {bet.emotions.before.emotion}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleComprehensiveBetOutcome(bet.id, 'win')}
                      className="gap-1"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Win
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleComprehensiveBetOutcome(bet.id, 'loss')}
                      className="gap-1"
                    >
                      <XCircle className="h-4 w-4" />
                      Loss
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleComprehensiveBetOutcome(bet.id, 'push')}
                    >
                      Push
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            {/* Show legacy pending bet analyses */}
            {pendingBets.map(bet => (
              <Card key={bet.id} className="p-4 border-l-4 border-l-orange-500">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-foreground">{bet.description || 'Unknown Bet'}</div>
                    <div className="text-sm text-muted-foreground">
                      {bet.sport} • ${bet.stake.toFixed(2)} • {(bet.odds ?? 0) > 0 ? '+' : ''}{bet.odds ?? 'N/A'}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleBetOutcome(bet.id, 'win')}
                      className="gap-1"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Win
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleBetOutcome(bet.id, 'loss')}
                      className="gap-1"
                    >
                      <XCircle className="h-4 w-4" />
                      Loss
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBetOutcome(bet.id, 'push')}
                    >
                      Push
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {(pendingBets.length + pendingComprehensiveBets.length) >= 5 && (
            <div className="mt-4 text-center">
              <Button variant="outline" size="sm">
                View All Pending Bets
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* KPI Cards */}
      <KPICardsGrid
        totalBets={metrics.totalBets}
        winRate={metrics.winRate}
        profit={metrics.profit}
        roi={metrics.roi}
        avgStake={avgStake}
        avgEV={metrics.avgEV}
      />

      {/* Outcome Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-primary" />
            <h4 className="font-semibold text-foreground">Outcome Distribution</h4>
          </div>
          {outcomeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={outcomeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {outcomeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'oklch(0.16 0.01 250)',
                    border: '1px solid oklch(0.18 0.01 250)',
                    borderRadius: '0.5rem',
                    color: 'oklch(0.98 0 0)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No bets recorded yet
            </div>
          )}
        </Card>

        {/* Cumulative Profit */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h4 className="font-semibold text-foreground">Cumulative Profit</h4>
          </div>
          {cumulativeProfit.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={cumulativeProfit}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.2 0.01 250)" />
                <XAxis
                  dataKey="date"
                  stroke="oklch(0.55 0.01 250)"
                  tick={{ fill: 'oklch(0.55 0.01 250)', fontSize: 12 }}
                />
                <YAxis
                  stroke="oklch(0.55 0.01 250)"
                  tick={{ fill: 'oklch(0.55 0.01 250)' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'oklch(0.16 0.01 250)',
                    border: '1px solid oklch(0.18 0.01 250)',
                    borderRadius: '0.5rem',
                    color: 'oklch(0.98 0 0)'
                  }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Profit']}
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="oklch(0.65 0.25 260)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No completed bets yet
            </div>
          )}
        </Card>
      </div>

      {/* Sport Performance */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h4 className="font-semibold text-foreground">Performance by Sport</h4>
        </div>
        {sportPerformance.length > 0 ? (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sportPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.2 0.01 250)" />
                <XAxis
                  dataKey="sport"
                  stroke="oklch(0.55 0.01 250)"
                  tick={{ fill: 'oklch(0.55 0.01 250)' }}
                />
                <YAxis
                  stroke="oklch(0.55 0.01 250)"
                  tick={{ fill: 'oklch(0.55 0.01 250)' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'oklch(0.16 0.01 250)',
                    border: '1px solid oklch(0.18 0.01 250)',
                    borderRadius: '0.5rem',
                    color: 'oklch(0.98 0 0)'
                  }}
                />
                <Legend />
                <Bar dataKey="wins" fill="oklch(0.65 0.18 150)" name="Wins" />
                <Bar dataKey="losses" fill="oklch(0.55 0.24 25)" name="Losses" />
              </BarChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sportPerformance.map(sport => (
                <Card key={sport.sport} className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h5 className="font-semibold text-foreground">{sport.sport}</h5>
                      <Badge variant="outline">{sport.totalBets} bets</Badge>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Win Rate:</span>
                        <Badge variant={sport.winRate >= 55 ? "default" : "secondary"}>
                          {sport.winRate.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Record:</span>
                        <span className="text-foreground">
                          {sport.wins}-{sport.losses}
                          {sport.pushes > 0 && `-${sport.pushes}P`}
                        </span>
                      </div>
                      {sport.pending > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Pending:</span>
                          <span className="text-orange-500">{sport.pending}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Profit:</span>
                        <span className={sport.profit >= 0 ? "text-success" : "text-destructive"}>
                          ${sport.profit.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            No sport data available yet
          </div>
        )}
      </Card>

      {/* Most Bet Teams */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-primary" />
          <h4 className="font-semibold text-foreground">Most Bet Teams</h4>
        </div>
        {teamStats.length > 0 ? (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={teamStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.2 0.01 250)" />
                <XAxis
                  type="number"
                  stroke="oklch(0.55 0.01 250)"
                  tick={{ fill: 'oklch(0.55 0.01 250)' }}
                />
                <YAxis
                  type="category"
                  dataKey="team"
                  stroke="oklch(0.55 0.01 250)"
                  tick={{ fill: 'oklch(0.55 0.01 250)', fontSize: 12 }}
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'oklch(0.16 0.01 250)',
                    border: '1px solid oklch(0.18 0.01 250)',
                    borderRadius: '0.5rem',
                    color: 'oklch(0.98 0 0)'
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'bets') return [value, 'Total Bets']
                    if (name === 'wins') return [value, 'Wins']
                    if (name === 'losses') return [value, 'Losses']
                    return [value, name]
                  }}
                />
                <Legend />
                <Bar dataKey="bets" fill="oklch(0.65 0.25 260)" name="Total Bets" />
              </BarChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamStats.slice(0, 6).map(team => (
                <Card key={team.team} className="p-4">
                  <div className="space-y-2">
                    <h5 className="font-semibold text-foreground truncate" title={team.team}>
                      {team.team}
                    </h5>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Bets:</span>
                        <Badge variant="outline">{team.bets}</Badge>
                      </div>
                      {(team.wins > 0 || team.losses > 0) && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Win Rate:</span>
                            <Badge variant={team.winRate >= 55 ? "default" : "secondary"}>
                              {team.winRate.toFixed(1)}%
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Record:</span>
                            <span className="text-foreground">{team.wins}-{team.losses}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Profit:</span>
                            <span className={team.profit >= 0 ? "text-success" : "text-destructive"}>
                              ${team.profit.toFixed(2)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            No team data available yet. Log bets with team names to see statistics.
          </div>
        )}
      </Card>
    </div>
  )
}

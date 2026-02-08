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
import { TrendingUp, DollarSign, Target, BarChart3, Clock, CheckCircle2, XCircle, RefreshCw } from "lucide-react"
import type { Trade, BetAnalysis } from "@/lib/types"
import type { ComprehensiveBet } from "@/lib/types/bet-tracking"
import { KPICardsGrid } from "./KPICards"
import { calculateBettingMetrics } from "./utils/calculations"
import type { UnifiedBet } from "./types"
import { storageHybrid as storage } from "@/lib/storage-hybrid"
import { toast } from "sonner"

interface PerformanceTabProps {
  trades: Trade[]
  unifiedBets?: UnifiedBet[]
  onRefreshData?: () => void
  isRefreshing?: boolean
}

export function PerformanceTab({ trades, unifiedBets = [], onRefreshData, isRefreshing }: PerformanceTabProps) {
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

      // Don't refresh immediately - let the user settle multiple bets if they want
      // The data will be refreshed when they navigate away and back, or they can manually refresh
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

  // Sport performance
  const sportPerformance = useMemo(() => {
    const sportMap = new Map<string, { wins: number; losses: number; profit: number }>()

    trades.forEach(trade => {
      const sport = trade.sport || 'Unknown'
      if (!sportMap.has(sport)) {
        sportMap.set(sport, { wins: 0, losses: 0, profit: 0 })
      }
      const stats = sportMap.get(sport)!
      if (trade.outcome === 'profit') stats.wins++
      if (trade.outcome === 'loss') stats.losses++
      
      // Only include profit for settled bets with actualReturn
      if (trade.actualReturn != null) {
        stats.profit += (trade.actualReturn || 0) - (trade.stake || 0)
      }
    })

    return Array.from(sportMap.entries()).map(([sport, stats]) => ({
      sport,
      wins: stats.wins,
      losses: stats.losses,
      profit: stats.profit,
      winRate: stats.wins + stats.losses > 0
        ? (stats.wins / (stats.wins + stats.losses)) * 100
        : 0
    })).sort((a, b) => b.profit - a.profit)
  }, [trades])

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
                      {bet.awayTeam} vs {bet.homeTeam} - {bet.betType}
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
                    <h5 className="font-semibold text-foreground">{sport.sport}</h5>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Win Rate:</span>
                        <Badge variant={sport.winRate >= 55 ? "default" : "secondary"}>
                          {sport.winRate.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Record:</span>
                        <span className="text-foreground">{sport.wins}-{sport.losses}</span>
                      </div>
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
    </div>
  )
}

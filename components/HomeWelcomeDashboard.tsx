"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  Zap,
  Brain,
  Trophy,
  Calendar,
  ArrowRight,
  Flame
} from "lucide-react"

interface QuickStat {
  label: string
  value: string | number
  trend?: "up" | "down"
  trendValue?: string
}

interface RecentBet {
  id: string
  title: string
  outcome?: "profit" | "loss" | "breakeven" | "pending"
  profit?: number
  timestamp: Date
}

export function HomeWelcomeDashboard() {
  const [userName, setUserName] = useState<string>("")
  const [emotionalScore, setEmotionalScore] = useState<number>(0)
  const [streak, setStreak] = useState<number>(0)
  const [quickStats, setQuickStats] = useState<QuickStat[]>([])
  const [recentBets, setRecentBets] = useState<RecentBet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDashboardData = () => {
      try {
        // Load user data
        const userData = JSON.parse(localStorage.getItem('serenity_user_data') || '{}')
        setUserName(userData.firstName || userData.name || 'User')

        // Load emotional score (calculate from recent logs)
        const emotionLogs = JSON.parse(localStorage.getItem('serenity_emotion_logs') || '[]')
        if (emotionLogs.length > 0) {
          // Simple score: count positive vs negative emotions in last 7 days
          const sevenDaysAgo = new Date()
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
          const recentLogs = emotionLogs.filter((log: any) =>
            new Date(log.timestamp) >= sevenDaysAgo
          )
          // Simplified emotional score (0-100)
          const positiveEmotions = ['happy', 'excited', 'confident', 'optimistic', 'grateful', 'proud']
          const positiveCount = recentLogs.filter((log: any) =>
            positiveEmotions.includes(log.emotion?.toLowerCase())
          ).length
          const score = recentLogs.length > 0
            ? Math.round((positiveCount / recentLogs.length) * 100)
            : 75
          setEmotionalScore(score)
        } else {
          setEmotionalScore(75)
        }

        // Calculate streak (consecutive days with emotion logs)
        const today = new Date().toDateString()
        let streakCount = 0
        let checkDate = new Date()
        while (true) {
          const dateStr = checkDate.toDateString()
          const hasLog = emotionLogs.some((log: any) =>
            new Date(log.timestamp).toDateString() === dateStr
          )
          if (!hasLog) break
          streakCount++
          checkDate.setDate(checkDate.getDate() - 1)
          if (streakCount > 365) break // Safety limit
        }
        setStreak(streakCount)

        // Load trades for stats
        const trades = JSON.parse(localStorage.getItem('serenity_trades') || '[]')
        const completedTrades = trades.filter((t: any) => t.outcome && t.outcome !== 'pending')
        const wins = completedTrades.filter((t: any) => t.outcome === 'profit')
        const winRate = completedTrades.length > 0
          ? ((wins.length / completedTrades.length) * 100).toFixed(1)
          : '0.0'

        // Calculate weekly P/L
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        const weeklyTrades = completedTrades.filter((t: any) =>
          new Date(t.timestamp) >= weekAgo
        )
        const weeklyPL = weeklyTrades.reduce((sum: number, t: any) => sum + (t.profit || 0), 0)

        setQuickStats([
          {
            label: 'Win Rate',
            value: `${winRate}%`,
            trend: parseFloat(winRate) >= 55 ? 'up' : parseFloat(winRate) <= 45 ? 'down' : undefined
          },
          {
            label: 'Weekly P/L',
            value: `$${weeklyPL.toFixed(2)}`,
            trend: weeklyPL > 0 ? 'up' : weeklyPL < 0 ? 'down' : undefined,
            trendValue: weeklyPL !== 0 ? `$${Math.abs(weeklyPL).toFixed(2)}` : undefined
          },
          {
            label: 'Total Bets',
            value: trades.length,
          }
        ])

        // Get last 3 bets
        const sortedTrades = trades
          .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 3)
        setRecentBets(sortedTrades.map((t: any) => ({
          id: t.id,
          title: t.title || 'Unnamed Bet',
          outcome: t.outcome,
          profit: t.profit,
          timestamp: new Date(t.timestamp)
        })))
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 60) return 'text-success'
    if (score >= 50) return 'text-warning'
    return 'text-destructive'
  }

  const getOutcomeColor = (outcome?: string) => {
    if (outcome === 'profit') return 'border-success/30 bg-success/5'
    if (outcome === 'loss') return 'border-destructive/30 bg-destructive/5'
    if (outcome === 'pending') return 'border-warning/30 bg-warning/5'
    return 'border-border'
  }

  const getOutcomeBadge = (outcome?: string) => {
    if (outcome === 'profit') return { text: 'Win', variant: 'default' as const }
    if (outcome === 'loss') return { text: 'Loss', variant: 'destructive' as const }
    if (outcome === 'pending') return { text: 'Pending', variant: 'secondary' as const }
    if (outcome === 'breakeven') return { text: 'Push', variant: 'secondary' as const }
    return { text: 'Unknown', variant: 'secondary' as const }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      {/* Welcome Header */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold text-foreground">
          Welcome back, {userName}!
        </h1>
        <div className="flex items-center justify-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">Emotional Wellness:</span>
            <span className={`text-lg font-bold ${getScoreColor(emotionalScore)}`}>
              {emotionalScore}/100
            </span>
          </div>
          {streak > 0 && (
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-warning" />
              <span className="text-sm text-muted-foreground">Streak:</span>
              <span className="text-lg font-bold text-warning">{streak} days</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickStats.map((stat, index) => (
          <Card key={index} className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold text-foreground">{stat.value}</h3>
                {stat.trend && (
                  <div className="flex items-center gap-1">
                    {stat.trend === 'up' ? (
                      <TrendingUp className="h-4 w-4 text-success" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-destructive" />
                    )}
                    {stat.trendValue && (
                      <span className={`text-sm ${stat.trend === 'up' ? 'text-success' : 'text-destructive'}`}>
                        {stat.trendValue}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Bets & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bets */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Recent Bets</h3>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/app/dashboard?tab=behavior">
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="space-y-3">
            {recentBets.length > 0 ? (
              recentBets.map((bet) => {
                const badge = getOutcomeBadge(bet.outcome)
                return (
                  <Card key={bet.id} className={`p-4 ${getOutcomeColor(bet.outcome)}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {bet.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {bet.timestamp.toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <Badge variant={badge.variant}>{badge.text}</Badge>
                        {bet.profit !== undefined && bet.outcome !== 'pending' && (
                          <span className={`text-sm font-semibold ${bet.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {bet.profit >= 0 ? '+' : ''}${bet.profit.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No bets yet</p>
                <p className="text-sm">Start tracking your bets to see them here</p>
              </div>
            )}
          </div>
        </Card>

        {/* Quick Insights */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Quick Insights</h3>
          </div>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-start gap-3">
                <Activity className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Emotional Trend</p>
                  <p className="text-xs text-muted-foreground">
                    {emotionalScore >= 60
                      ? "You're in a great emotional state for betting. Stay disciplined!"
                      : emotionalScore >= 50
                      ? "Your emotional wellness is moderate. Consider taking extra precautions."
                      : "Your emotional score is low. Consider taking a break from betting."}
                  </p>
                </div>
              </div>
            </div>

            {streak > 0 && (
              <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                <div className="flex items-start gap-3">
                  <Flame className="h-5 w-5 text-warning mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">Active Streak</p>
                    <p className="text-xs text-muted-foreground">
                      You've logged emotions for {streak} consecutive days. Keep it up!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
            <Link href="/app/dashboard?tab=analyze">
              <Zap className="h-6 w-6" />
              <span className="text-sm">Analyze Bet</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
            <Link href="/app/dashboard?tab=behavior">
              <Activity className="h-6 w-6" />
              <span className="text-sm">Check Emotion</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
            <Link href="/app/live-betting">
              <Target className="h-6 w-6" />
              <span className="text-sm">Sports Dashboard</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
            <Link href="/app/dashboard?tab=analytics">
              <TrendingUp className="h-6 w-6" />
              <span className="text-sm">View Analytics</span>
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  )
}

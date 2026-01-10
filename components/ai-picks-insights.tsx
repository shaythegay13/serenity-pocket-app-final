"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Target, TrendingUp, Sparkles } from "lucide-react"
import { storageHybrid as storage } from "@/lib/storage-hybrid"
import type { ComprehensiveBet } from "@/lib/types/bet-tracking"

interface AIPicksInsightsProps {
  refreshKey?: number
}

interface InsightMetrics {
  pickAccuracy: number // Percentage of wins in last 30 days
  roiThisMonth: number // ROI for current month
  picksGenerated: number // Total AI picks generated
}

export function AIPicksInsights({ refreshKey }: AIPicksInsightsProps) {
  const [metrics, setMetrics] = useState<InsightMetrics>({
    pickAccuracy: 0,
    roiThisMonth: 0,
    picksGenerated: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const calculateMetrics = async () => {
      try {
        setLoading(true)

        // Get all comprehensive bets from storage
        const allBets = await storage.getComprehensiveBets()

        // Filter for AI-generated picks (source === "tiltlab")
        const aiPicks = allBets.filter(bet => bet.source === "tiltlab")

        // Calculate Pick Accuracy (30 Days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const recentPicks = aiPicks.filter(bet => {
          const betDate = new Date(bet.timestamp)
          return betDate >= thirtyDaysAgo && bet.outcome && bet.outcome !== "pending"
        })

        const wins = recentPicks.filter(bet => bet.outcome === "win").length
        const pickAccuracy = recentPicks.length > 0
          ? (wins / recentPicks.length) * 100
          : 0

        // Calculate ROI This Month
        const now = new Date()
        const currentMonth = now.getMonth()
        const currentYear = now.getFullYear()

        const thisMonthPicks = aiPicks.filter(bet => {
          const betDate = new Date(bet.timestamp)
          return betDate.getMonth() === currentMonth &&
                 betDate.getFullYear() === currentYear &&
                 bet.outcome &&
                 bet.outcome !== "pending"
        })

        const totalStaked = thisMonthPicks.reduce((sum, bet) => sum + bet.stake, 0)
        const totalReturned = thisMonthPicks.reduce((sum, bet) => {
          return sum + (bet.actualReturn || 0)
        }, 0)

        const roiThisMonth = totalStaked > 0
          ? ((totalReturned - totalStaked) / totalStaked) * 100
          : 0

        // Calculate Total Picks Generated
        const picksGenerated = aiPicks.length

        setMetrics({
          pickAccuracy: Math.round(pickAccuracy * 10) / 10, // Round to 1 decimal
          roiThisMonth: Math.round(roiThisMonth * 10) / 10, // Round to 1 decimal
          picksGenerated
        })
      } catch (error) {
        console.error("Error calculating AI picks insights:", error)
      } finally {
        setLoading(false)
      }
    }

    calculateMetrics()
  }, [refreshKey])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-20 bg-muted rounded"></div>
          </Card>
        ))}
      </div>
    )
  }

  // Only show if there are AI picks generated
  if (metrics.picksGenerated === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Pick Accuracy (30 Days) */}
      <Card className="glass glass-hover">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/10">
              <Target className="h-6 w-6 text-purple-400" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold">
              {metrics.pickAccuracy.toFixed(1)}%
            </p>
            <p className="text-sm text-muted-foreground">
              Pick Accuracy (30 Days)
            </p>
          </div>
        </div>
      </Card>

      {/* ROI This Month */}
      <Card className="glass glass-hover">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10">
              <TrendingUp className="h-6 w-6 text-green-400" />
            </div>
          </div>
          <div className="space-y-1">
            <p className={`text-3xl font-bold ${
              metrics.roiThisMonth >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {metrics.roiThisMonth >= 0 ? '+' : ''}{metrics.roiThisMonth.toFixed(1)}%
            </p>
            <p className="text-sm text-muted-foreground">
              ROI This Month
            </p>
          </div>
        </div>
      </Card>

      {/* Picks Generated */}
      <Card className="glass glass-hover">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
              <Sparkles className="h-6 w-6 text-blue-400" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold">
              {metrics.picksGenerated}
            </p>
            <p className="text-sm text-muted-foreground">
              Picks Generated
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

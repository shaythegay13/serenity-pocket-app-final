"use client"

import { useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area
} from "recharts"
import { Activity, TrendingUp, Eye, EyeOff } from "lucide-react"
import type { EmotionLog, Trade } from "@/lib/types"
import type { EmotionOutcomePoint } from "./types"
import { EMOTION_SCORE_LOOKUP } from "./constants"

interface CorrelationTabProps {
  emotionLogs: EmotionLog[]
  trades: Trade[]
}

export function CorrelationTab({ emotionLogs, trades }: CorrelationTabProps) {
  const [showEmotionLine, setShowEmotionLine] = useState(true)
  const [showOutcomeLine, setShowOutcomeLine] = useState(true)

  // Group data by day and correlate emotion scores with betting outcomes
  const correlationData = useMemo((): EmotionOutcomePoint[] => {
    const dayMap = new Map<string, {
      emotions: number[]
      outcomes: number[]
      betCount: number
    }>()

    // Process emotion logs
    emotionLogs.forEach(log => {
      const day = new Date(log.timestamp).toLocaleDateString()
      if (!dayMap.has(day)) {
        dayMap.set(day, { emotions: [], outcomes: [], betCount: 0 })
      }
      const emotionScore = EMOTION_SCORE_LOOKUP[log.emotion.toLowerCase()] ?? 50
      dayMap.get(day)!.emotions.push(emotionScore)
    })

    // Process trades
    trades.forEach(trade => {
      const day = new Date(trade.timestamp).toLocaleDateString()
      if (!dayMap.has(day)) {
        dayMap.set(day, { emotions: [], outcomes: [], betCount: 0 })
      }
      const bucket = dayMap.get(day)!
      bucket.betCount++

      // Calculate outcome score: win = 100, push = 50, loss = 0
      if (trade.outcome === 'profit') {
        bucket.outcomes.push(100)
      } else if (trade.outcome === 'breakeven') {
        bucket.outcomes.push(50)
      } else if (trade.outcome === 'loss') {
        bucket.outcomes.push(0)
      }
    })

    // Convert to array and calculate averages
    const result: EmotionOutcomePoint[] = []
    const sortedDays = Array.from(dayMap.entries()).sort((a, b) =>
      new Date(a[0]).getTime() - new Date(b[0]).getTime()
    )

    sortedDays.forEach(([day, data]) => {
      const emotionScore = data.emotions.length > 0
        ? data.emotions.reduce((sum, val) => sum + val, 0) / data.emotions.length
        : undefined

      const outcomeScore = data.outcomes.length > 0
        ? data.outcomes.reduce((sum, val) => sum + val, 0) / data.outcomes.length
        : undefined

      result.push({
        day,
        emotionScore,
        outcomeScore,
        betActivity: data.betCount
      })
    })

    return result
  }, [emotionLogs, trades])

  // Calculate correlation coefficient
  const correlation = useMemo(() => {
    const pointsWithBoth = correlationData.filter(
      p => p.emotionScore !== undefined && p.outcomeScore !== undefined
    )

    if (pointsWithBoth.length < 2) return null

    const n = pointsWithBoth.length
    const sumX = pointsWithBoth.reduce((sum, p) => sum + (p.emotionScore || 0), 0)
    const sumY = pointsWithBoth.reduce((sum, p) => sum + (p.outcomeScore || 0), 0)
    const sumXY = pointsWithBoth.reduce((sum, p) => sum + (p.emotionScore || 0) * (p.outcomeScore || 0), 0)
    const sumX2 = pointsWithBoth.reduce((sum, p) => sum + Math.pow(p.emotionScore || 0, 2), 0)
    const sumY2 = pointsWithBoth.reduce((sum, p) => sum + Math.pow(p.outcomeScore || 0, 2), 0)

    const numerator = n * sumXY - sumX * sumY
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))

    return denominator === 0 ? 0 : numerator / denominator
  }, [correlationData])

  const getCorrelationInsight = (corr: number | null) => {
    if (corr === null) return { text: "Not enough data", color: "text-muted-foreground" }
    if (corr > 0.7) return { text: "Strong positive correlation", color: "text-success" }
    if (corr > 0.3) return { text: "Moderate positive correlation", color: "text-success" }
    if (corr > -0.3) return { text: "Weak correlation", color: "text-muted-foreground" }
    if (corr > -0.7) return { text: "Moderate negative correlation", color: "text-destructive" }
    return { text: "Strong negative correlation", color: "text-destructive" }
  }

  const insight = getCorrelationInsight(correlation)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-foreground">Emotion vs Outcome Correlation</h3>
          <p className="text-sm text-muted-foreground">
            Track how your emotional state correlates with betting outcomes
          </p>
        </div>
        {correlation !== null && (
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">
              {(correlation * 100).toFixed(1)}%
            </div>
            <div className={`text-sm ${insight.color}`}>
              {insight.text}
            </div>
          </div>
        )}
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <h4 className="font-semibold text-foreground">Daily Trends</h4>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={showEmotionLine ? "default" : "outline"}
              onClick={() => setShowEmotionLine(!showEmotionLine)}
            >
              {showEmotionLine ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
              Emotion
            </Button>
            <Button
              size="sm"
              variant={showOutcomeLine ? "default" : "outline"}
              onClick={() => setShowOutcomeLine(!showOutcomeLine)}
            >
              {showOutcomeLine ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
              Outcome
            </Button>
          </div>
        </div>

        {correlationData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={correlationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.2 0.01 250)" />
              <XAxis
                dataKey="day"
                stroke="oklch(0.55 0.01 250)"
                tick={{ fill: 'oklch(0.55 0.01 250)' }}
              />
              <YAxis
                stroke="oklch(0.55 0.01 250)"
                tick={{ fill: 'oklch(0.55 0.01 250)' }}
                domain={[0, 100]}
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
              {showEmotionLine && (
                <Line
                  type="monotone"
                  dataKey="emotionScore"
                  name="Emotion Score"
                  stroke="oklch(0.65 0.25 260)"
                  strokeWidth={2}
                  dot={{ fill: 'oklch(0.65 0.25 260)', r: 4 }}
                />
              )}
              {showOutcomeLine && (
                <Line
                  type="monotone"
                  dataKey="outcomeScore"
                  name="Outcome Score"
                  stroke="oklch(0.6 0.22 300)"
                  strokeWidth={2}
                  dot={{ fill: 'oklch(0.6 0.22 300)', r: 4 }}
                />
              )}
              <Area
                type="monotone"
                dataKey="betActivity"
                name="Bet Activity"
                fill="oklch(0.65 0.18 150)"
                fillOpacity={0.2}
                stroke="none"
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            <div className="text-center space-y-2">
              <Activity className="h-12 w-12 mx-auto opacity-50" />
              <p>No data available yet</p>
              <p className="text-sm">Start logging emotions and placing bets to see correlations</p>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h4 className="font-semibold text-foreground mb-3">Correlation Insights</h4>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">What this means:</strong> A positive correlation suggests that higher emotional scores (more positive emotions) tend to coincide with better betting outcomes. A negative correlation might indicate that certain emotional states lead to poor decision-making.
          </p>
          <p>
            <strong className="text-foreground">How to use this:</strong> If you notice a strong positive correlation, try to replicate the emotional conditions that lead to success. If there's a negative correlation, consider taking a break when you notice those emotional patterns.
          </p>
        </div>
      </Card>
    </div>
  )
}

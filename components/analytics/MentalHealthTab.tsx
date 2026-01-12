"use client"

import { useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts"
import { Brain, Activity, Smile, Frown, Meh, AlertTriangle, TrendingUp } from "lucide-react"
import type { EmotionLog } from "@/lib/types"
import { EMOTION_SCORE_LOOKUP } from "./constants"

interface MentalHealthTabProps {
  emotionLogs: EmotionLog[]
}

export function MentalHealthTab({ emotionLogs }: MentalHealthTabProps) {
  // Calculate mental health score over time
  const mentalHealthTimeline = useMemo(() => {
    const dayMap = new Map<string, number[]>()

    emotionLogs.forEach(log => {
      const day = new Date(log.timestamp).toLocaleDateString()
      if (!dayMap.has(day)) {
        dayMap.set(day, [])
      }
      const score = EMOTION_SCORE_LOOKUP[log.emotion.toLowerCase()] ?? 50
      dayMap.get(day)!.push(score)
    })

    const result = Array.from(dayMap.entries())
      .map(([day, scores]) => ({
        date: day,
        score: scores.reduce((sum, s) => sum + s, 0) / scores.length,
        count: scores.length
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return result
  }, [emotionLogs])

  // Current mental health score (last 7 days average)
  const currentScore = useMemo(() => {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentLogs = emotionLogs.filter(
      log => new Date(log.timestamp) >= sevenDaysAgo
    )

    if (recentLogs.length === 0) return null

    const sum = recentLogs.reduce((total, log) => {
      return total + (EMOTION_SCORE_LOOKUP[log.emotion.toLowerCase()] ?? 50)
    }, 0)

    return sum / recentLogs.length
  }, [emotionLogs])

  // Emotion frequency distribution
  const emotionDistribution = useMemo(() => {
    const emotionMap = new Map<string, number>()

    emotionLogs.forEach(log => {
      const emotion = log.emotion.toLowerCase()
      emotionMap.set(emotion, (emotionMap.get(emotion) || 0) + 1)
    })

    return Array.from(emotionMap.entries())
      .map(([emotion, count]) => ({
        emotion,
        count,
        score: EMOTION_SCORE_LOOKUP[emotion] ?? 50
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10) // Top 10 emotions
  }, [emotionLogs])

  // Betting phase emotions
  const phaseEmotions = useMemo(() => {
    const phaseMap = new Map<string, number[]>()

    emotionLogs.forEach(log => {
      const phase = log.phase || 'unknown'
      if (!phaseMap.has(phase)) {
        phaseMap.set(phase, [])
      }
      const score = EMOTION_SCORE_LOOKUP[log.emotion.toLowerCase()] ?? 50
      phaseMap.get(phase)!.push(score)
    })

    return Array.from(phaseMap.entries()).map(([phase, scores]) => ({
      phase,
      avgScore: scores.reduce((sum, s) => sum + s, 0) / scores.length,
      count: scores.length
    }))
  }, [emotionLogs])

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-success"
    if (score >= 50) return "text-warning"
    return "text-destructive"
  }

  const getScoreStatus = (score: number) => {
    if (score >= 70) return { icon: Smile, text: "Excellent", color: "success" }
    if (score >= 50) return { icon: Meh, text: "Moderate", color: "warning" }
    return { icon: Frown, text: "Needs Attention", color: "destructive" }
  }

  const status = currentScore ? getScoreStatus(currentScore) : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-foreground">Mental Health Tracking</h3>
          <p className="text-sm text-muted-foreground">
            Monitor your emotional wellness and identify patterns
          </p>
        </div>
        {currentScore !== null && status && (
          <div className="text-right">
            <div className={`text-3xl font-bold ${getScoreColor(currentScore)}`}>
              {currentScore.toFixed(1)}
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <status.icon className="h-4 w-4" />
              {status.text}
            </div>
          </div>
        )}
      </div>

      {/* Score Timeline */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-primary" />
          <h4 className="font-semibold text-foreground">Emotional Wellness Score Timeline</h4>
        </div>
        {mentalHealthTimeline.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={mentalHealthTimeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.2 0.01 250)" />
              <XAxis
                dataKey="date"
                stroke="oklch(0.55 0.01 250)"
                tick={{ fill: 'oklch(0.55 0.01 250)', fontSize: 12 }}
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
              <Line
                type="monotone"
                dataKey="score"
                name="Wellness Score"
                stroke="oklch(0.65 0.25 260)"
                strokeWidth={3}
                dot={{ fill: 'oklch(0.65 0.25 260)', r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[350px] flex items-center justify-center text-muted-foreground">
            <div className="text-center space-y-2">
              <Brain className="h-12 w-12 mx-auto opacity-50" />
              <p>No emotional data yet</p>
              <p className="text-sm">Start logging your emotions to track your wellness</p>
            </div>
          </div>
        )}
      </Card>

      {/* Emotion Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="h-5 w-5 text-primary" />
            <h4 className="font-semibold text-foreground">Top Emotions</h4>
          </div>
          {emotionDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={emotionDistribution} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.2 0.01 250)" />
                <XAxis type="number" stroke="oklch(0.55 0.01 250)" tick={{ fill: 'oklch(0.55 0.01 250)' }} />
                <YAxis
                  type="category"
                  dataKey="emotion"
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
                />
                <Bar dataKey="count" name="Frequency">
                  {emotionDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.score >= 70
                          ? 'oklch(0.65 0.18 150)'
                          : entry.score >= 50
                          ? 'oklch(0.7 0.18 70)'
                          : 'oklch(0.55 0.24 25)'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No emotion data available
            </div>
          )}
        </Card>

        {/* Phase Analysis */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h4 className="font-semibold text-foreground">Emotions by Betting Phase</h4>
          </div>
          {phaseEmotions.length > 0 ? (
            <div className="space-y-4">
              {phaseEmotions.map(phase => (
                <div key={phase.phase} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground capitalize">
                      {phase.phase}
                    </span>
                    <Badge
                      variant={
                        phase.avgScore >= 70
                          ? "default"
                          : phase.avgScore >= 50
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {phase.avgScore.toFixed(1)}
                    </Badge>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        phase.avgScore >= 70
                          ? 'bg-success'
                          : phase.avgScore >= 50
                          ? 'bg-warning'
                          : 'bg-destructive'
                      }`}
                      style={{ width: `${phase.avgScore}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {phase.count} emotion log{phase.count !== 1 ? 's' : ''}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No phase data available
            </div>
          )}
        </Card>
      </div>

      {/* Wellness Tips */}
      <Card className="p-6 border-warning/30 bg-warning/5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground">Mental Wellness Tips</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Scores below 50 may indicate increased risk-taking behavior</li>
              <li>• Consider taking a break when your wellness score drops significantly</li>
              <li>• Negative emotions before betting (pre-bet phase) are strong predictors of poor outcomes</li>
              <li>• Regular check-ins help maintain emotional awareness and control</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}

"use client"

import { useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Brain, Activity, Smile, Frown, Meh, AlertTriangle, TrendingUp, TrendingDown, Pause, Play, ThermometerSun } from "lucide-react"
import type { EmotionLog, UserData } from "@/lib/types"
import type { ComprehensiveBet } from "@/lib/types/bet-tracking"
import { EMOTION_SCORE_LOOKUP } from "./constants"
import { useEmotionalStability } from "@/lib/hooks/use-emotional-stability"

interface MentalHealthTabProps {
  emotionLogs: EmotionLog[]
  comprehensiveBets?: ComprehensiveBet[]
  userData: UserData
}

// Threshold for "ready to bet" post-bet state
const READY_TO_BET_THRESHOLD = 55

/**
 * Calculate the emotional score for a given emotion name
 */
function getEmotionScore(emotion: string): number {
  if (!emotion) return 50 // neutral default
  return EMOTION_SCORE_LOOKUP[emotion.toLowerCase()] ?? 50
}

// Date range options for tilt trend filtering
const DATE_RANGE_OPTIONS = [
  { value: "7", label: "Last 7 days" },
  { value: "14", label: "Last 14 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "all", label: "All time" },
] as const

export function MentalHealthTab({ emotionLogs, comprehensiveBets = [], userData }: MentalHealthTabProps) {
  // Use centralized emotional stability scoring for consistency across the app
  const { score: currentScore, loading: scoreLoading } = useEmotionalStability(userData)

  // Date range selection for tilt trend chart
  const [tiltDateRange, setTiltDateRange] = useState<string>("30")

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

  // Emotion frequency distribution
  const emotionDistribution = useMemo(() => {
    const emotionMap = new Map<string, number>()

    emotionLogs.forEach(log => {
      const emotion = log.emotion.toLowerCase()
      emotionMap.set(emotion, (emotionMap.get(emotion) || 0) + 1)
    })

    const distribution = Array.from(emotionMap.entries())
      .map(([emotion, count]) => ({
        emotion,
        count,
        score: EMOTION_SCORE_LOOKUP[emotion] ?? 50
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10) // Top 10 emotions

    return distribution
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

  // Emotion intensity distribution
  const intensityData = useMemo(() => {
    const intensityMap = new Map<number, number>()

    // Initialize 1-5 buckets to match current UI scale
    for (let i = 1; i <= 5; i++) {
      intensityMap.set(i, 0)
    }

    emotionLogs.forEach(log => {
      const intensity = Math.round(log.intensity)
      if (intensity >= 1 && intensity <= 5) {
        intensityMap.set(intensity, (intensityMap.get(intensity) || 0) + 1)
      } else if (intensity > 5) {
        // Fallback or legacy normalization: if we find 1-10 data, map it to 1-5
        const normalized = Math.min(5, Math.ceil(intensity / 2))
        intensityMap.set(normalized, (intensityMap.get(normalized) || 0) + 1)
      }
    })

    return Array.from(intensityMap.entries())
      .map(([intensity, count]) => ({
        intensity,
        count
      }))
      .sort((a, b) => a.intensity - b.intensity)
  }, [emotionLogs])

  // Filter to bets that have both before and after emotions (completed cycle)
  const completedBets = useMemo(() => {
    return comprehensiveBets.filter(bet =>
      bet.emotions?.before?.emotion &&
      bet.emotions?.after?.emotion &&
      bet.outcome &&
      bet.outcome !== "pending"
    )
  }, [comprehensiveBets])

  // Tilt change over time (daily averages, normalized to -1 to 1)
  const tiltTrend = useMemo(() => {
    if (completedBets.length === 0) return []

    // Filter by date range
    const now = new Date()
    const filteredBets = tiltDateRange === "all"
      ? completedBets
      : completedBets.filter(bet => {
          const betDate = new Date(bet.timestamp)
          const daysAgo = Math.floor((now.getTime() - betDate.getTime()) / (1000 * 60 * 60 * 24))
          return daysAgo <= parseInt(tiltDateRange)
        })

    if (filteredBets.length === 0) return []

    const dayMap = new Map<string, { deltas: number[]; beforeScores: number[]; afterScores: number[] }>()

    filteredBets.forEach(bet => {
      const day = new Date(bet.timestamp).toLocaleDateString()
      if (!dayMap.has(day)) {
        dayMap.set(day, { deltas: [], beforeScores: [], afterScores: [] })
      }

      const beforeScore = getEmotionScore(bet.emotions.before.emotion)
      const afterScore = getEmotionScore(bet.emotions.after.emotion)
      // Normalize delta to -1 to 1 range (scores are 0-100, max delta is 100)
      const delta = (afterScore - beforeScore) / 100

      const data = dayMap.get(day)!
      data.deltas.push(delta)
      data.beforeScores.push(beforeScore)
      data.afterScores.push(afterScore)
    })

    return Array.from(dayMap.entries())
      .map(([day, data]) => ({
        date: day,
        avgDelta: data.deltas.reduce((a, b) => a + b, 0) / data.deltas.length,
        avgBefore: data.beforeScores.reduce((a, b) => a + b, 0) / data.beforeScores.length,
        avgAfter: data.afterScores.reduce((a, b) => a + b, 0) / data.afterScores.length,
        betCount: data.deltas.length
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [completedBets, tiltDateRange])

  // Current "ready to bet" status based on most recent post-bet emotion
  const readinessStatus = useMemo(() => {
    if (completedBets.length === 0) return null

    const sortedBets = [...completedBets].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    const latestBet = sortedBets[0]
    const afterScore = getEmotionScore(latestBet.emotions.after.emotion)

    return {
      score: afterScore,
      emotion: latestBet.emotions.after.emotion,
      outcome: latestBet.outcome,
      readyToBet: afterScore >= READY_TO_BET_THRESHOLD,
      timestamp: latestBet.completedAt || latestBet.timestamp
    }
  }, [completedBets])

  // Overall tilt statistics
  const tiltStats = useMemo(() => {
    if (completedBets.length === 0) return null

    const allDeltas = completedBets.map(bet => {
      const beforeScore = getEmotionScore(bet.emotions.before.emotion)
      const afterScore = getEmotionScore(bet.emotions.after.emotion)
      return afterScore - beforeScore
    })

    const avgDelta = allDeltas.reduce((a, b) => a + b, 0) / allDeltas.length
    const worsening = allDeltas.filter(d => d < -10).length
    const improving = allDeltas.filter(d => d > 10).length

    return { avgDelta, worsening, improving, totalBets: completedBets.length }
  }, [completedBets])

  const getScoreColor = (score: number) => {
    if (score >= 60) return "text-success"
    if (score >= 50) return "text-warning"
    return "text-destructive"
  }

  const getScoreStatus = (score: number) => {
    if (score >= 60) return { icon: Smile, text: "Excellent", color: "success" }
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
        {scoreLoading ? (
          <div className="text-right">
            <div className="text-3xl font-bold text-muted-foreground">...</div>
            <div className="text-sm text-muted-foreground">Calculating</div>
          </div>
        ) : currentScore !== null && status && (
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

      {/* Post-Bet Readiness Status */}
      {readinessStatus && (
        <Card className={`p-6 ${readinessStatus.readyToBet
          ? 'bg-green-500/10 border-green-500/30'
          : 'bg-amber-500/10 border-amber-500/30'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {readinessStatus.readyToBet ? (
                <Play className="h-10 w-10 text-green-500" />
              ) : (
                <Pause className="h-10 w-10 text-amber-500" />
              )}
              <div>
                <h4 className="text-lg font-semibold text-foreground">
                  {readinessStatus.readyToBet ? "Ready to Continue Betting" : "Consider Taking a Break"}
                </h4>
                <p className="text-sm text-muted-foreground">
                  Last post-bet emotion: <span className="font-medium capitalize">{readinessStatus.emotion}</span>
                  {" "}(Score: {readinessStatus.score})
                </p>
              </div>
            </div>
            <Badge
              variant={readinessStatus.readyToBet ? "default" : "secondary"}
              className={readinessStatus.readyToBet ? "bg-green-500" : "bg-amber-500"}
            >
              Last: {readinessStatus.outcome?.toUpperCase()}
            </Badge>
          </div>
          {!readinessStatus.readyToBet && (
            <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">
              Your emotional state suggests waiting before placing another bet. Betting while tilted leads to poor decisions.
            </p>
          )}
        </Card>
      )}

      {/* Tilt Change Stats */}
      {tiltStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <ThermometerSun className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-xs text-muted-foreground mb-1">Avg Tilt Change</p>
            <p className={`text-2xl font-bold ${tiltStats.avgDelta > 5 ? 'text-green-500' : tiltStats.avgDelta < -5 ? 'text-red-500' : 'text-yellow-500'}`}>
              {tiltStats.avgDelta > 0 ? '+' : ''}{tiltStats.avgDelta.toFixed(1)}
            </p>
          </Card>
          <Card className="p-4 text-center">
            <TrendingDown className="h-6 w-6 mx-auto mb-2 text-red-500" />
            <p className="text-xs text-muted-foreground mb-1">Tilted More</p>
            <p className="text-2xl font-bold text-red-500">{tiltStats.worsening}</p>
            <p className="text-xs text-muted-foreground">bets</p>
          </Card>
          <Card className="p-4 text-center">
            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <p className="text-xs text-muted-foreground mb-1">Recovered</p>
            <p className="text-2xl font-bold text-green-500">{tiltStats.improving}</p>
            <p className="text-xs text-muted-foreground">bets</p>
          </Card>
          <Card className="p-4 text-center">
            <Activity className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <p className="text-xs text-muted-foreground mb-1">Completed Cycles</p>
            <p className="text-2xl font-bold text-blue-500">{tiltStats.totalBets}</p>
            <p className="text-xs text-muted-foreground">bets</p>
          </Card>
        </div>
      )}

      {/* Tilt Change Over Time */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ThermometerSun className="h-5 w-5 text-primary" />
            <h4 className="font-semibold text-foreground">Tilt Change Over Time</h4>
          </div>
          <Select value={tiltDateRange} onValueChange={setTiltDateRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_RANGE_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {tiltTrend.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={tiltTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.2 0.01 250)" />
                <XAxis
                  dataKey="date"
                  stroke="oklch(0.55 0.01 250)"
                  tick={{ fill: 'oklch(0.55 0.01 250)', fontSize: 12 }}
                />
                <YAxis
                  stroke="oklch(0.55 0.01 250)"
                  tick={{ fill: 'oklch(0.55 0.01 250)' }}
                  domain={[-1, 1]}
                  ticks={[-1, -0.5, 0, 0.5, 1]}
                  tickFormatter={(value) => value.toFixed(1)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'oklch(0.16 0.01 250)',
                    border: '1px solid oklch(0.18 0.01 250)',
                    borderRadius: '0.5rem',
                    color: 'oklch(0.98 0 0)'
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'Tilt Change') {
                      const formatted = value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2)
                      const label = value > 0 ? '(improved)' : value < 0 ? '(worse)' : '(neutral)'
                      return [`${formatted} ${label}`, name]
                    }
                    return [value.toFixed(2), name]
                  }}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="avgDelta"
                  name="Tilt Change"
                  stroke="oklch(0.65 0.25 260)"
                  strokeWidth={3}
                  dot={{ fill: 'oklch(0.65 0.25 260)', r: 5 }}
                  activeDot={{ r: 7, fill: 'oklch(0.75 0.25 260)' }}
                />
                {/* Reference line at 0 */}
                <Line
                  type="monotone"
                  dataKey={() => 0}
                  name="Neutral"
                  stroke="oklch(0.4 0.01 250)"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  dot={false}
                  legendType="none"
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Scale: -1 (max tilt) to +1 (max recovery) • 0 = no change
            </p>
          </>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <div className="text-center space-y-2">
              <ThermometerSun className="h-12 w-12 mx-auto opacity-50" />
              <p>No tilt data for this period</p>
              <p className="text-sm">Complete bets with before/after emotions to track tilt changes</p>
            </div>
          </div>
        )}
      </Card>

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
              <BarChart data={emotionDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.2 0.01 250)" />
                <XAxis dataKey="emotion" stroke="oklch(0.55 0.01 250)" tick={{ fill: 'oklch(0.55 0.01 250)', fontSize: 12 }} />
                <YAxis stroke="oklch(0.55 0.01 250)" tick={{ fill: 'oklch(0.55 0.01 250)' }} />
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
                        entry.score >= 60
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
            <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
              <p>No emotion data available</p>
              {emotionLogs.length > 0 && (
                <p className="text-sm mt-2">
                  Found {emotionLogs.length} emotion logs but couldn't process distribution
                </p>
              )}
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
                        phase.avgScore >= 60
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
                      className={`h-2 rounded-full transition-all ${phase.avgScore >= 60
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

      {/* Emotion Intensity Distribution */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-primary" />
          <h4 className="font-semibold text-foreground">Emotion Intensity Distribution</h4>
        </div>
        {intensityData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={intensityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.2 0.01 250)" />
              <XAxis
                dataKey="intensity"
                stroke="oklch(0.55 0.01 250)"
                label={{ value: 'Intensity (1-5)', position: 'insideBottom', offset: -5, fill: 'oklch(0.55 0.01 250)' }}
              />
              <YAxis
                stroke="oklch(0.55 0.01 250)"
                label={{ value: 'Frequency', angle: -90, position: 'insideLeft', fill: 'oklch(0.55 0.01 250)' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'oklch(0.16 0.01 250)',
                  border: '1px solid oklch(0.18 0.01 250)',
                  borderRadius: '0.5rem',
                  color: 'oklch(0.98 0 0)'
                }}
              />
              <Bar dataKey="count" name="Frequency" fill="oklch(0.7 0.18 70)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No intensity data available
          </div>
        )}
      </Card>

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

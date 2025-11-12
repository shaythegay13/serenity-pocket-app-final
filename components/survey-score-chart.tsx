"use client"

import { Card } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { TrendingDown, Activity } from "lucide-react"

interface SurveyScoreChartProps {
  history: Array<{
    date: string
    score: number
  }>
}

export function SurveyScoreChart({ history }: SurveyScoreChartProps) {
  // If no history, show a message
  if (!history || history.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Addiction Rate Over Time</h3>
        </div>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No survey history yet. Take the survey to track your progress.</p>
        </div>
      </Card>
    )
  }

  // Prepare data for the chart
  const chartData = history.map((entry) => ({
    date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: entry.score,
  }))

  // Calculate trend
  const firstScore = history[0]?.score || 0
  const lastScore = history[history.length - 1]?.score || 0
  const trend = lastScore - firstScore
  const trendPercentage = firstScore > 0 ? ((trend / firstScore) * 100).toFixed(1) : '0'

  // Get color based on score level
  const getScoreColor = (score: number) => {
    if (score <= 16) return "#10b981" // Green for low
    if (score <= 33) return "#f59e0b" // Yellow for medium
    return "#ef4444" // Red for high
  }

  const averageScore = history.reduce((acc, curr) => acc + curr.score, 0) / history.length

  return (
    <Card className="p-4 sm:p-6">
      <div className="space-y-4">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Activity className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Addiction Rate Over Time</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Track how your gambling risk score changes as you use the app
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-xs text-muted-foreground mb-1">Current Score</p>
            <p className="text-2xl font-bold" style={{ color: getScoreColor(lastScore) }}>
              {lastScore}/50
            </p>
          </div>
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-xs text-muted-foreground mb-1">Average</p>
            <p className="text-2xl font-bold text-foreground">
              {averageScore.toFixed(1)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-xs text-muted-foreground mb-1">Change</p>
            <p className={`text-2xl font-bold ${trend < 0 ? 'text-green-600' : trend > 0 ? 'text-red-600' : 'text-gray-600'}`}>
              {trend > 0 ? '+' : ''}{trend}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-xs text-muted-foreground mb-1">Surveys</p>
            <p className="text-2xl font-bold text-foreground">
              {history.length}
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis
                domain={[0, 50]}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              {/* Reference lines for risk levels */}
              <ReferenceLine
                y={16}
                stroke="#10b981"
                strokeDasharray="3 3"
                label={{ value: 'Low Risk', position: 'insideTopRight', fill: '#10b981', fontSize: 10 }}
              />
              <ReferenceLine
                y={33}
                stroke="#f59e0b"
                strokeDasharray="3 3"
                label={{ value: 'Medium Risk', position: 'insideTopRight', fill: '#f59e0b', fontSize: 10 }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Insight */}
        <div className="p-4 rounded-lg bg-blue/5 border border-blue/20">
          <div className="flex items-start gap-2">
            <TrendingDown className={`h-5 w-5 mt-0.5 ${trend < 0 ? 'text-green-600' : 'text-muted-foreground'}`} />
            <div>
              <h4 className="font-semibold text-foreground mb-1">Progress Insight</h4>
              <p className="text-sm text-muted-foreground">
                {trend < 0 ? (
                  <>Great progress! Your addiction risk has decreased by {Math.abs(trend)} points. Keep using the app to maintain these positive changes.</>
                ) : trend > 0 ? (
                  <>Your score has increased by {trend} points. This might indicate you're going through a challenging period. Keep logging your emotions and identifying biases to help manage your gambling behavior.</>
                ) : (
                  <>Your score has remained stable. Continue your mindful betting practices to see improvements over time.</>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

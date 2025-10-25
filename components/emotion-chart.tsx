"use client"

import { Card } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { EmotionLog } from "@/lib/types"

interface EmotionChartProps {
  logs: EmotionLog[]
}

export function EmotionChart({ logs }: EmotionChartProps) {
  if (logs.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">Not enough data to display chart</p>
      </Card>
    )
  }

  // Count emotions by category
  const emotionCounts: Record<string, number> = {}
  logs.forEach((log) => {
    emotionCounts[log.emotion] = (emotionCounts[log.emotion] || 0) + 1
  })

  const data = Object.entries(emotionCounts)
    .map(([emotion, count]) => ({
      emotion,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Most Common Emotions</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="emotion" className="text-xs" />
          <YAxis />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
          />
          <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}

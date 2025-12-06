"use client"

import { Card } from "@/components/ui/card"
import type { EmotionLog } from "@/lib/types"
import { calculateEmotionalStability } from "@/lib/emotional-scoring"

interface WeeklyStabilityReportProps {
  logs: EmotionLog[]
}

export function WeeklyStabilityReport({ logs }: WeeklyStabilityReportProps) {
  const days = [...Array(7)].map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    d.setHours(0, 0, 0, 0)
    const next = new Date(d)
    next.setDate(d.getDate() + 1)

    const dayLogs = logs.filter(l => {
      const t = new Date(l.timestamp)
      return t >= d && t < next
    })

    const { score } = calculateEmotionalStability(dayLogs)
    return { label: d.toLocaleDateString(undefined, { weekday: 'short' }), score }
  })

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold text-foreground mb-4">Weekly Stability Report</h3>
      <div className="grid grid-cols-7 gap-3 items-end h-32">
        {days.map((day, idx) => (
          <div key={idx} className="flex flex-col items-center gap-2">
            <div
              className="w-full rounded bg-primary/60 border border-primary/40 shadow-sm"
              style={{ height: `${Math.max(15, Math.min(100, day.score))}%` }}
              title={`${day.label}: ${Math.round(day.score)}%`}
            />
            <span className="text-xs text-muted-foreground">{day.label}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

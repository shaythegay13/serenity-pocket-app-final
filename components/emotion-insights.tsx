"use client"

import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Activity } from "lucide-react"
import type { EmotionLog } from "@/lib/types"

interface EmotionInsightsProps {
  logs: EmotionLog[]
}

export function EmotionInsights({ logs }: EmotionInsightsProps) {
  if (logs.length === 0) {
    return null
  }

  // Calculate insights
  const emotionCounts: Record<string, number> = {}
  const phaseCounts = { before: 0, during: 0, after: 0 }
  let totalIntensity = 0

  logs.forEach((log) => {
    emotionCounts[log.emotion] = (emotionCounts[log.emotion] || 0) + 1
    phaseCounts[log.phase]++
    totalIntensity += log.intensity
  })

  const mostCommonEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]
  const avgIntensity = (totalIntensity / logs.length).toFixed(1)
  const mostCommonPhase = Object.entries(phaseCounts).sort((a, b) => b[1] - a[1])[0]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Most Common</p>
            <p className="text-lg font-semibold text-foreground">{mostCommonEmotion[0]}</p>
            <p className="text-xs text-muted-foreground">{mostCommonEmotion[1]} times</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-teal/10">
            <Activity className="h-5 w-5 text-teal" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Avg Intensity</p>
            <p className="text-lg font-semibold text-foreground">{avgIntensity} / 5</p>
            <p className="text-xs text-muted-foreground">Emotional strength</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue/10">
            <TrendingDown className="h-5 w-5 text-blue" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Common Phase</p>
            <p className="text-lg font-semibold text-foreground capitalize">{mostCommonPhase[0]}</p>
            <p className="text-xs text-muted-foreground">{mostCommonPhase[1]} logs</p>
          </div>
        </div>
      </Card>
    </div>
  )
}

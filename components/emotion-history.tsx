"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { EmotionLog } from "@/lib/types"
import { format } from "date-fns"

interface EmotionHistoryProps {
  logs: EmotionLog[]
}

const emotionColors: Record<string, string> = {
  joy: "bg-amber-100 text-amber-700 border border-amber-300",
  fear: "bg-purple-100 text-purple-700 border border-purple-300",
  anger: "bg-red-100 text-red-700 border border-red-300",
  sadness: "bg-blue-100 text-blue-700 border border-blue-300",
  surprise: "bg-teal-100 text-teal-700 border border-teal-300",
  disgust: "bg-green-100 text-green-700 border border-green-300",
}

const phaseLabels = {
  before: "Before Trade",
  during: "During Trade",
  after: "After Trade",
}

export function EmotionHistory({ logs }: EmotionHistoryProps) {
  if (logs.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">No emotion logs yet. Start tracking your emotions!</p>
      </Card>
    )
  }

  // Sort logs by timestamp, most recent first
  const sortedLogs = [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return (
    <div className="space-y-3">
      {sortedLogs.slice(0, 10).map((log) => (
        <Card key={log.id} className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="font-semibold">
                  {log.emotion}
                </Badge>
                <Badge variant="secondary">{phaseLabels[log.phase]}</Badge>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(log.timestamp), "MMM d, yyyy 'at' h:mm a")}
                </span>
              </div>
              {log.context && <p className="text-sm text-muted-foreground">{log.context}</p>}
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="text-sm font-medium text-foreground">Intensity</div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className={`w-2 h-6 rounded-sm ${level <= log.intensity ? "bg-primary" : "bg-muted"}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

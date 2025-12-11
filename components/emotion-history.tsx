"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { EmotionLog, Trade } from "@/lib/types"
import { storageHybrid as storage } from "@/lib/storage-hybrid"
import { format } from "date-fns"

interface EmotionHistoryProps {
  logs: EmotionLog[]
  trades: Trade[]
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
  before: "Before Betting",
  during: "During Betting",
  after: "After Betting",
}

export function EmotionHistory({ logs, trades }: EmotionHistoryProps) {
  const [titles, setTitles] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    for (const t of trades) {
      if (t.title) map[t.id] = t.title
    }
    return map
  })
  const [editing, setEditing] = useState<string | null>(null)

  if (trades.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          No bets tracked yet. Once you use the Behavior tracker before/during/after betting, your emotional timelines will appear here.
        </p>
      </Card>
    )
  }

  // Sort trades by timestamp, most recent first
  const sortedTrades = [...trades].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return (
    <div className="space-y-4">
      {sortedTrades.slice(0, 10).map((trade) => {
        // Find related emotion logs for this trade
        const preBetLog = logs.find(log => log.phase === 'before' &&
          Math.abs(new Date(log.timestamp).getTime() - new Date(trade.timestamp).getTime()) < 60000)
        const duringBetLog = logs.find(log => log.phase === 'during' &&
          new Date(log.timestamp).getTime() > new Date(trade.timestamp).getTime())
        const postBetLog = logs.find(log => log.phase === 'after' &&
          new Date(log.timestamp).getTime() > new Date(trade.timestamp).getTime())

        const defaultTitle = `${format(new Date(trade.timestamp), "MMM d, yyyy 'at' h:mm a")}${trade.sport ? ` — ${trade.sport}` : ''}`
        const displayTitle = titles[trade.id] || trade.title || defaultTitle

        return (
          <Card key={trade.id} className="p-5 border-2">
            <div className="space-y-4">
              {/* Bet Header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 pb-3 border-b">
                <div>
                  {editing === trade.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        className="h-8"
                        value={titles[trade.id] ?? displayTitle}
                        onChange={(e) => setTitles((prev) => ({ ...prev, [trade.id]: e.target.value }))}
                      />
                      <Button
                        size="sm"
                        onClick={async () => {
                          const newTitle = titles[trade.id] || defaultTitle
                          await storage.updateTrade(trade.id, { title: newTitle })
                          setEditing(null)
                        }}
                      >
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                    </div>
                  ) : (
                    <>
                      <h4 className="font-semibold text-foreground text-lg">{displayTitle}</h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>{format(new Date(trade.timestamp), "MMM d, yyyy 'at' h:mm a")}</span>
                        {trade.sport && (
                          <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px]">
                            {trade.sport}
                          </span>
                        )}
                        {trade.outcome && (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-muted">
                            Outcome: {trade.outcome === 'profit' ? 'Win' : trade.outcome === 'loss' ? 'Loss' : 'Breakeven'}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
                {editing !== trade.id && (
                  <Button size="sm" variant="ghost" className="text-xs self-start md:self-auto" onClick={() => setEditing(trade.id)}>
                    Edit title
                  </Button>
                )}
              </div>

              {/* Mini intensity chart: before / during / after */}
              <div className="space-y-1">
                <p className="text-[11px] text-muted-foreground">Emotional intensity (0-5)</p>
                <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
                  {/* Before segment */}
                  <div
                    className="h-full bg-emerald-400/80"
                    style={{ width: `${((preBetLog?.intensity || 0) / 5) * 100}%` }}
                  />
                  {/* During segment */}
                  <div
                    className="h-full bg-amber-400/80"
                    style={{ width: `${((duringBetLog?.intensity || 0) / 5) * 100}%` }}
                  />
                  {/* After segment */}
                  <div
                    className="h-full bg-sky-400/80"
                    style={{ width: `${((postBetLog?.intensity || 0) / 5) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Before</span>
                  <span>During</span>
                  <span>After</span>
                </div>
              </div>

              {/* Emotion Timeline: always render all three phases so partial histories are visible */}
              <div className="grid gap-3 md:grid-cols-3 text-sm">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                    Before bet
                  </p>
                  {preBetLog ? (
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{preBetLog.emotion}</p>
                      <p className="text-xs text-muted-foreground">Intensity: {preBetLog.intensity}/5</p>
                      {preBetLog.context && (
                        <p className="text-xs text-muted-foreground line-clamp-3">{preBetLog.context}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No pre-bet emotion logged for this bet.</p>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
                    During bet
                  </p>
                  {duringBetLog ? (
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{duringBetLog.emotion}</p>
                      <p className="text-xs text-muted-foreground">Intensity: {duringBetLog.intensity}/5</p>
                      {duringBetLog.context && (
                        <p className="text-xs text-muted-foreground line-clamp-3">{duringBetLog.context}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No in-play emotion logged for this bet.</p>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-sky-400" />
                    After bet
                  </p>
                  {postBetLog ? (
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{postBetLog.emotion}</p>
                      <p className="text-xs text-muted-foreground">Intensity: {postBetLog.intensity}/5</p>
                      {postBetLog.context && (
                        <p className="text-xs text-muted-foreground line-clamp-3">{postBetLog.context}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No post-bet emotion logged yet.</p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

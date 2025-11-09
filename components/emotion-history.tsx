"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { EmotionLog, Trade } from "@/lib/types"
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
  if (trades.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">No bets tracked yet. Start tracking your emotions!</p>
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

        return (
          <Card key={trade.id} className="p-5 border-2">
            <div className="space-y-4">
              {/* Bet Header */}
              <div className="flex items-center justify-between pb-3 border-b">
                <div>
                  <h4 className="font-semibold text-foreground text-lg">Bet #{trade.id.slice(-6)}</h4>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(trade.timestamp), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
                {trade.outcome && (
                  <Badge variant={trade.outcome === 'profit' ? 'default' : trade.outcome === 'loss' ? 'destructive' : 'secondary'}>
                    {trade.outcome}
                  </Badge>
                )}
              </div>

              {/* Pre-Bet Emotion */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Pre-Betting</p>
                <div className="flex items-center justify-between gap-4 pl-3 border-l-4 border-amber">
                  <div className="flex-1">
                    <Badge variant="outline" className="font-semibold mb-1">
                      {trade.preTradeEmotion}
                    </Badge>
                    {trade.biasesIdentified && trade.biasesIdentified.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {trade.biasesIdentified.map((bias, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{bias}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`w-2 h-6 rounded-sm ${level <= trade.preTradeIntensity ? "bg-amber" : "bg-muted"}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* During-Bet Emotion (if exists) */}
              {duringBetLog && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">During Betting</p>
                  <div className="flex items-center justify-between gap-4 pl-3 border-l-4 border-teal">
                    <div className="flex-1">
                      <Badge variant="outline" className="font-semibold">
                        {duringBetLog.emotion}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`w-2 h-6 rounded-sm ${level <= duringBetLog.intensity ? "bg-teal" : "bg-muted"}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Post-Bet Emotion (if exists) */}
              {trade.postTradeEmotion ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Post-Betting</p>
                  <div className="flex items-center justify-between gap-4 pl-3 border-l-4 border-purple">
                    <div className="flex-1">
                      <Badge variant="outline" className="font-semibold">
                        {trade.postTradeEmotion}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`w-2 h-6 rounded-sm ${level <= (trade.postTradeIntensity || 0) ? "bg-purple" : "bg-muted"}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Post-Betting</p>
                  <div className="pl-3 border-l-4 border-muted">
                    <p className="text-sm text-muted-foreground italic">Not completed yet</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )
      })}
    </div>
  )
}

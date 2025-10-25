"use client"

import React from "react"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Trade } from "@/lib/types"
import { format } from "date-fns"
import { TrendingUp, TrendingDown, Minus, ChevronRight } from "lucide-react"

interface TradeHistoryProps {
  trades: Trade[]
  onSelectTrade: (trade: Trade) => void
}

export function TradeHistory({ trades, onSelectTrade }: TradeHistoryProps) {
  if (trades.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">No trades logged yet. Start your first pre-trade entry!</p>
      </Card>
    )
  }

  const sortedTrades = [...trades].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return (
    <div className="space-y-3">
      {sortedTrades.map((trade) => {
        const isComplete = !!trade.outcome
        const outcomeIcon = trade.outcome === "profit" ? TrendingUp : trade.outcome === "loss" ? TrendingDown : Minus
        const outcomeColor =
          trade.outcome === "profit" ? "text-green-600" : trade.outcome === "loss" ? "text-red-600" : "text-blue-600"

        return (
          <Card
            key={trade.id}
            className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => onSelectTrade(trade)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">{trade.preTradeEmotion}</Badge>
                  {isComplete ? (
                    <Badge className={outcomeColor}>
                      {outcomeIcon && React.createElement(outcomeIcon, { className: "h-3 w-3 mr-1 inline" })}
                      {trade.outcome}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Pending Close</Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(trade.timestamp), "MMM d, yyyy")}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{trade.reasoning}</p>
                {trade.biasesIdentified.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {trade.biasesIdentified.slice(0, 3).map((bias) => (
                      <Badge key={bias} variant="outline" className="text-xs">
                        {bias}
                      </Badge>
                    ))}
                    {trade.biasesIdentified.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{trade.biasesIdentified.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Card>
        )
      })}
    </div>
  )
}

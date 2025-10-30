"use client"

import { Card } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import type { Trade } from "@/lib/types"

interface TradePerformanceChartProps {
  trades: Trade[]
}

export function TradePerformanceChart({ trades }: TradePerformanceChartProps) {
  const completedTrades = trades.filter((t) => t.outcome)
  const openTrades = trades.filter((t) => !t.outcome)

  if (completedTrades.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Trade Journal Activity</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-3xl font-bold text-primary">{trades.length}</p>
            <p className="text-sm text-muted-foreground">Total Entries</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-blue/5 border border-blue/20">
            <p className="text-3xl font-bold text-blue">{openTrades.length}</p>
            <p className="text-sm text-muted-foreground">Open Trades</p>
          </div>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Complete post-trade reflections to see outcome performance data
        </p>
      </Card>
    )
  }

  const outcomes = {
    profit: completedTrades.filter((t) => t.outcome === "profit").length,
    loss: completedTrades.filter((t) => t.outcome === "loss").length,
    breakeven: completedTrades.filter((t) => t.outcome === "breakeven").length,
  }

  const data = [
    { name: "Profit", value: outcomes.profit, color: "#10b981" },
    { name: "Loss", value: outcomes.loss, color: "#ef4444" },
    { name: "Breakeven", value: outcomes.breakeven, color: "#3b82f6" },
  ].filter((d) => d.value > 0)

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Trade Outcomes</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{outcomes.profit}</p>
          <p className="text-xs text-muted-foreground">Profitable</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-red-600">{outcomes.loss}</p>
          <p className="text-xs text-muted-foreground">Losses</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{outcomes.breakeven}</p>
          <p className="text-xs text-muted-foreground">Breakeven</p>
        </div>
      </div>
    </Card>
  )
}

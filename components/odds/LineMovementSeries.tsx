"use client"

import { Card } from "@/components/ui/card"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts"

export type LinePoint = { time: string; home?: number; away?: number }

interface Props {
  title?: string
  points: LinePoint[]
}

export function LineMovementSeries({ title = "Line Movement", points }: Props) {
  return (
    <Card className="p-4">
      <p className="text-sm font-semibold text-foreground mb-3">{title}</p>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
            <XAxis dataKey="time" tick={{ fontSize: 10 }} interval={Math.max(0, Math.floor(points.length / 5))} />
            <YAxis tick={{ fontSize: 10 }} domain={["dataMin", "dataMax"]} />
            <Tooltip formatter={(v: any) => (typeof v === "number" && v > 0 ? `+${v}` : v)} />
            <Line type="monotone" dataKey="home" stroke="#22c55e" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="away" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

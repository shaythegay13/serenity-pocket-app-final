"use client"

import { Card } from "@/components/ui/card"

interface LineMovementMiniProps {
  points: Array<{ time: Date; price: number }>
}

export function LineMovementMini({ points }: LineMovementMiniProps) {
  const min = Math.min(...points.map(p => p.price))
  const max = Math.max(...points.map(p => p.price))
  const range = Math.max(1, max - min)

  return (
    <Card className="p-3">
      <p className="text-sm font-semibold mb-2">Line Movement</p>
      <div className="h-16 w-full relative bg-muted rounded">
        {points.slice(0, 8).map((p, i) => {
          const left = (i / Math.max(1, points.length - 1)) * 100
          const norm = (p.price - min) / range
          const top = (1 - norm) * 100
          return (
            <div
              key={i}
              className="absolute w-1 h-1 bg-blue-500 rounded-full"
              style={{ left: `${left}%`, top: `${top}%`, transform: "translate(-50%, -50%)" }}
              title={`${p.price}`}
            />
          )
        })}
      </div>
    </Card>
  )
}

"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SemiCircleGaugeProps {
  value: number // 0-100
  size?: number
  strokeWidth?: number
  className?: string
  showValue?: boolean
  label?: string
}

export function SemiCircleGauge({
  value,
  size = 180,
  strokeWidth = 12,
  className,
  showValue = true,
  label,
}: SemiCircleGaugeProps) {
  const radius = (size - strokeWidth) / 2
  const centerX = size / 2
  const centerY = size / 2

  // Create semi-circle path (180 degrees)
  const circumference = Math.PI * radius // Half of full circle
  const offset = circumference - (value / 100) * circumference

  // Color based on value
  const getColor = () => {
    if (value >= 70) return "stroke-green-500"
    if (value >= 40) return "stroke-yellow-500"
    return "stroke-red-500"
  }

  const getGlowColor = () => {
    if (value >= 70) return "drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]"
    if (value >= 40) return "drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]"
    return "drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]"
  }

  return (
    <div className={cn("relative inline-flex items-end justify-center", className)}>
      <svg
        width={size}
        height={size / 2 + 40}
        className="overflow-visible"
        style={{ filter: getGlowColor() }}
      >
        {/* Background arc */}
        <path
          d={`M ${strokeWidth / 2} ${centerY}
              A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${centerY}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="text-muted/20"
        />
        {/* Progress arc */}
        <path
          d={`M ${strokeWidth / 2} ${centerY}
              A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${centerY}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(
            "transition-all duration-1000 ease-out origin-center",
            getColor()
          )}
          style={{ transformBox: "fill-box" }}
        />
      </svg>
      {showValue && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <span className="text-4xl font-bold tabular-nums">{Math.round(value)}</span>
          {label && <span className="text-sm text-muted-foreground">{label}</span>}
        </div>
      )}
    </div>
  )
}

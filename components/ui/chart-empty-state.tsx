"use client"

import * as React from "react"
import { TrendingUp, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChartEmptyStateProps {
  message?: string
  className?: string
}

export function ChartEmptyState({
  message = "No data available at this time",
  className
}: ChartEmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-6", className)}>
      {/* Grayed-out placeholder graphic */}
      <div className="relative mb-6">
        <div className="relative w-48 h-32 opacity-20">
          {/* Simplified line chart placeholder */}
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 192 128"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Grid lines */}
            <line x1="0" y1="32" x2="192" y2="32" stroke="currentColor" strokeWidth="1" opacity="0.3" />
            <line x1="0" y1="64" x2="192" y2="64" stroke="currentColor" strokeWidth="1" opacity="0.3" />
            <line x1="0" y1="96" x2="192" y2="96" stroke="currentColor" strokeWidth="1" opacity="0.3" />

            {/* Vertical grid */}
            <line x1="48" y1="0" x2="48" y2="128" stroke="currentColor" strokeWidth="1" opacity="0.2" />
            <line x1="96" y1="0" x2="96" y2="128" stroke="currentColor" strokeWidth="1" opacity="0.2" />
            <line x1="144" y1="0" x2="144" y2="128" stroke="currentColor" strokeWidth="1" opacity="0.2" />

            {/* Placeholder line 1 (wavy trend) */}
            <path
              d="M 8 80 Q 40 60, 72 70 T 136 65 T 184 75"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              opacity="0.4"
            />

            {/* Placeholder line 2 (another trend) */}
            <path
              d="M 8 90 Q 40 95, 72 85 T 136 80 T 184 70"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              opacity="0.3"
            />
          </svg>
        </div>

        {/* Animated clock icon overlay */}
        <div className="absolute -top-2 -right-2 bg-background rounded-full p-2 border border-border">
          <Clock className="h-6 w-6 text-muted-foreground animate-pulse" />
        </div>
      </div>

      {/* Message */}
      <p className="text-sm text-muted-foreground text-center max-w-md leading-relaxed">
        {message}
      </p>
    </div>
  )
}

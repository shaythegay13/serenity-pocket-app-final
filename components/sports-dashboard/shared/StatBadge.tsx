import React from "react"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

/**
 * StatBadge Props Interface
 */
export interface StatBadgeProps {
  /** Badge label (e.g., "Line", "Total", "Implied") */
  label: string
  /** Badge value (e.g., "-6.5", "48.5", "62%") */
  value: string | number
  /** Optional trend indicator */
  trend?: "up" | "down" | "neutral"
  /** Optional color theme */
  color?: "teal" | "gold" | "green" | "red" | "gray"
  /** Optional className for additional styling */
  className?: string
}

/**
 * Color configuration for stat badges
 */
const colorClasses = {
  teal: "bg-teal-500/10 text-teal-400 border-teal-500/30",
  gold: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  green: "bg-green-500/10 text-green-400 border-green-500/30",
  red: "bg-red-500/10 text-red-400 border-red-500/30",
  gray: "bg-gray-500/10 text-gray-400 border-gray-500/30"
}

/**
 * Trend icon configuration
 */
const trendIcons = {
  up: { icon: TrendingUp, color: "text-green-400" },
  down: { icon: TrendingDown, color: "text-red-400" },
  neutral: { icon: Minus, color: "text-gray-400" }
}

/**
 * StatBadge Component
 * 
 * Small inline badge for displaying sports statistics with optional trend indicators.
 * Used inside GameCard and other components for quick stat visualization.
 * 
 * Features:
 * - Label + value display
 * - Optional trend arrows (↑ green / ↓ red / — gray)
 * - Color theming (teal, gold, green, red, gray)
 * - Compact, readable design
 * 
 * @example
 * <StatBadge label="Line" value="-6.5" color="teal" />
 * <StatBadge label="Implied" value="62%" color="gold" />
 * <StatBadge label="Trend" value="OVER" trend="up" color="green" />
 */
export function StatBadge({
  label,
  value,
  trend,
  color = "gray",
  className = ""
}: StatBadgeProps) {
  const colorClass = colorClasses[color] || colorClasses.gray
  const TrendIcon = trend ? trendIcons[trend].icon : null
  const trendColor = trend ? trendIcons[trend].color : ""

  return (
    <div
      className={`
        inline-flex items-center gap-1.5
        px-2.5 py-1
        rounded-md
        border
        text-xs font-medium
        ${colorClass}
        ${className}
      `}
      role="status"
      aria-label={`${label}: ${value}${trend ? `, trending ${trend}` : ""}`}
    >
      {/* Trend Icon (if provided) */}
      {TrendIcon && (
        <TrendIcon 
          className={`h-3.5 w-3.5 ${trendColor}`}
          aria-hidden="true"
        />
      )}

      {/* Label */}
      <span className="opacity-80">
        {label}:
      </span>

      {/* Value */}
      <span className="font-semibold">
        {value}
      </span>
    </div>
  )
}

StatBadge.displayName = "StatBadge"

/**
 * StatBadgeGroup Component
 * 
 * Container for grouping multiple StatBadge components with consistent spacing.
 * Handles responsive wrapping and gap management.
 * 
 * @example
 * <StatBadgeGroup>
 *   <StatBadge label="Spread" value="-6.5" color="teal" />
 *   <StatBadge label="Total" value="48.5" color="gold" />
 *   <StatBadge label="O/U" value="OVER" trend="up" color="green" />
 * </StatBadgeGroup>
 */
export function StatBadgeGroup({ children }: { children: React.ReactNode }) {
  return (
    <div 
      className="flex flex-wrap gap-2"
      role="group"
      aria-label="Game statistics"
    >
      {children}
    </div>
  )
}

StatBadgeGroup.displayName = "StatBadgeGroup"

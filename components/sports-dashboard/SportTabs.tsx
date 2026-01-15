import React from "react"
import type { SupportedSportKey } from "@/lib/types"

/**
 * Sport configuration interface
 */
export interface Sport {
  /** Unique identifier (matches SupportedSportKey) */
  id: SupportedSportKey
  /** Display label for tab */
  label: string
}

/**
 * SportTabs Props Interface
 */
export interface SportTabsProps {
  /** Currently active sport ID */
  activeSport: SupportedSportKey
  /** Callback when sport tab is clicked */
  onSportChange: (sportId: SupportedSportKey) => void
  /** Array of available sports */
  sports?: Sport[]
}

/**
 * Default sports configuration with icons (Databallr style)
 */
const DEFAULT_SPORTS: Array<Sport & { icon: string }> = [
  { id: "americanfootball_nfl", label: "NFL", icon: "🏈" },
  { id: "basketball_nba", label: "NBA", icon: "🏀" },
  { id: "baseball_mlb", label: "MLB", icon: "⚾" },
  { id: "icehockey_nhl", label: "NHL", icon: "🏒" }
]

/**
 * SportTabs Component
 * 
 * Horizontal tab navigation for switching between sports.
 * Features smooth transitions, active state highlighting, and responsive scrolling.
 * 
 * Visual design:
 * - Active tab: Teal underline + bold text
 * - Inactive: Muted gray text
 * - Hover: Underline appears, text brightens
 * - Smooth 200ms transitions
 * - Mobile: Horizontal scroll (no wrapping)
 * 
 * @example
 * <SportTabs
 *   activeSport="basketball_nba"
 *   onSportChange={(id) => console.log('Sport changed:', id)}
 * />
 */
export function SportTabs({
  activeSport,
  onSportChange,
  sports = DEFAULT_SPORTS
}: SportTabsProps) {
  return (
    <nav
      className="px-4 md:px-6 pb-3"
      role="navigation"
      aria-label="Sports navigation"
    >
      <div
        className="flex items-center gap-2 overflow-x-auto scrollbar-hide"
        style={{
          scrollbarWidth: "none", // Firefox
          msOverflowStyle: "none" // IE/Edge
        }}
      >
        {sports.map((sport) => {
          const isActive = activeSport === sport.id
          const sportWithIcon = sport as Sport & { icon?: string }
          return (
            <button
              key={sport.id}
              onClick={() => onSportChange(sport.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm
                transition-all duration-300 whitespace-nowrap min-w-[44px] min-h-[44px]
                ${isActive
                  ? 'bg-primary/20 text-primary border-2 border-primary/50 shadow-[0_0_20px_rgba(var(--primary),0.3)]'
                  : 'bg-muted text-muted-foreground border border-border hover:border-secondary/30 hover:text-secondary'
                }
              `}
              role="tab"
              aria-selected={isActive}
              aria-label={`View ${sport.label} data`}
            >
              {sportWithIcon.icon && <span className="text-lg">{sportWithIcon.icon}</span>}
              <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{sport.label}</span>
            </button>
          )
        })}
      </div>

      {/* Hide scrollbar with CSS for webkit browsers */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </nav>
  )
}

SportTabs.displayName = "SportTabs"

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
 * Default sports configuration
 */
const DEFAULT_SPORTS: Sport[] = [
  { id: "americanfootball_nfl", label: "NFL" },
  { id: "basketball_nba", label: "NBA" },
  { id: "baseball_mlb", label: "MLB" },
  { id: "icehockey_nhl", label: "NHL" }
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
      className="border-b border-white/10 bg-[#1b212c]"
      role="navigation"
      aria-label="Sports navigation"
    >
      <div
        className="flex overflow-x-auto scrollbar-hide px-6 gap-8"
        style={{
          scrollbarWidth: "none", // Firefox
          msOverflowStyle: "none" // IE/Edge
        }}
      >
        {sports.map((sport) => {
          const isActive = activeSport === sport.id

          return (
            <button
              key={sport.id}
              onClick={() => onSportChange(sport.id)}
              className={`relative py-4 text-sm font-medium transition-all duration-200 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-[#1b212c] ${isActive ? "text-[#F5F5F5] font-bold" : "text-gray-400 hover:text-gray-200"}`}
              role="tab"
              aria-selected={isActive}
              aria-current={isActive ? "page" : undefined}
              aria-label={`View ${sport.label} data`}
            >
              {/* Tab Label */}
              <span className="relative z-10">{sport.label}</span>

              {/* Active Underline */}
              {isActive && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#20B2AA] transition-all duration-200"
                  aria-hidden="true"
                />
              )}

              {/* Hover Underline (shows for inactive tabs) */}
              {!isActive && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-400 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity duration-200"
                  aria-hidden="true"
                />
              )}
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

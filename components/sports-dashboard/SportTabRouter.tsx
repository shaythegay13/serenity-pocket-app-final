"use client"

import React from "react"
import { TabSkeleton } from "./shared/LoadingSkeleton"
import type { SupportedSportKey } from "@/lib/types"

// Direct imports instead of dynamic to avoid potential infinite loops
import NFLTab from "./tabs/NFLTab"
import NBATab from "./tabs/NBATab"
import MLBTab from "./tabs/MLBTab"
import NHLTab from "./tabs/NHLTab"

/**
 * SportTabRouter Props Interface
 */
export interface SportTabRouterProps {
  /** Currently active sport ID */
  activeSport: SupportedSportKey
  /** User data for subscription-based features */
  userData?: {
    subscriptionTier?: string
  }
}

/**
 * SportTabRouter Component
 * 
 * Simplified router that renders the appropriate sport tab based on activeSport.
 * Uses direct imports instead of dynamic imports to avoid potential infinite loops.
 */
export function SportTabRouter({ activeSport, userData }: SportTabRouterProps) {
  // Memoize the sport check to prevent unnecessary re-renders
  const isValidSport = React.useMemo(() => 
    ["americanfootball_nfl", "basketball_nba", "baseball_mlb", "icehockey_nhl"].includes(activeSport),
    [activeSport]
  )

  if (!isValidSport) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4 p-6">
          <p className="text-muted-foreground text-lg">
            Sport not found: {activeSport}
          </p>
          <p className="text-muted-foreground/70 text-sm">
            Please select a valid sport from the navigation
          </p>
        </div>
      </div>
    )
  }

  // Use a switch statement for cleaner conditional rendering
  const renderTab = () => {
    switch (activeSport) {
      case "americanfootball_nfl":
        return <NFLTab userData={userData} />
      case "basketball_nba":
        return <NBATab userData={userData} />
      case "baseball_mlb":
        return <MLBTab userData={userData} />
      case "icehockey_nhl":
        return <NHLTab userData={userData} />
      default:
        return null
    }
  }

  return (
    <div role="tabpanel" aria-label={`${activeSport} content`}>
      {renderTab()}
    </div>
  )
}

SportTabRouter.displayName = "SportTabRouter"

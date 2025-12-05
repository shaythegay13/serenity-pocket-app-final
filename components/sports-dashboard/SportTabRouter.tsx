"use client"

import React, { Suspense } from "react"
import dynamic from "next/dynamic"
import { TabSkeleton } from "./shared/LoadingSkeleton"
import type { SupportedSportKey } from "@/lib/types"

/**
 * SportTabRouter Props Interface
 */
export interface SportTabRouterProps {
  /** Currently active sport ID */
  activeSport: SupportedSportKey
}

/**
 * Dynamically import sport tab components with lazy loading
 * This enables code splitting and improves initial load performance
 */
const NFLTab = dynamic(() => import("./tabs/NFLTab"), {
  loading: () => <TabSkeleton cardCount={9} />,
  ssr: false
})

const NBATab = dynamic(() => import("./tabs/NBATab"), {
  loading: () => <TabSkeleton cardCount={9} />,
  ssr: false
})

const MLBTab = dynamic(() => import("./tabs/MLBTab"), {
  loading: () => <TabSkeleton cardCount={9} />,
  ssr: false
})

const NHLTab = dynamic(() => import("./tabs/NHLTab"), {
  loading: () => <TabSkeleton cardCount={9} />,
  ssr: false
})

/**
 * SportTabRouter Component
 * 
 * Dynamic router that renders the appropriate sport tab based on activeSport.
 * Uses Next.js dynamic imports for code splitting and lazy loading.
 * Each tab is loaded only when needed, improving performance.
 * 
 * Features:
 * - Lazy-loaded tab components
 * - Suspense boundaries with skeleton fallbacks
 * - Only one tab rendered at a time
 * - Automatic code splitting per sport
 * 
 * @example
 * <SportTabRouter activeSport="basketball_nba" />
 */
export function SportTabRouter({ activeSport }: SportTabRouterProps) {
  return (
    <Suspense fallback={<TabSkeleton cardCount={9} />}>
      <div role="tabpanel" aria-label={`${activeSport} content`}>
        {activeSport === "americanfootball_nfl" && <NFLTab />}
        {activeSport === "basketball_nba" && <NBATab />}
        {activeSport === "baseball_mlb" && <MLBTab />}
        {activeSport === "icehockey_nhl" && <NHLTab />}
        
        {/* Fallback for unknown sport */}
        {!["americanfootball_nfl", "basketball_nba", "baseball_mlb", "icehockey_nhl"].includes(activeSport) && (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center space-y-4 p-6">
              <p className="text-gray-400 text-lg">
                Sport not found: {activeSport}
              </p>
              <p className="text-gray-500 text-sm">
                Please select a valid sport from the navigation
              </p>
            </div>
          </div>
        )}
      </div>
    </Suspense>
  )
}

SportTabRouter.displayName = "SportTabRouter"

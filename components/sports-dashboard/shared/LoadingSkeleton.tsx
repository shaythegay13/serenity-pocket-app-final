import React from "react"

/**
 * FeatureCardSkeleton
 * 
 * Loading placeholder for FeatureCard component.
 * Matches exact height/width with gentle pulsing animation.
 * 
 * Note: This is re-exported from FeatureCard.tsx for convenience,
 * but defined here as the canonical implementation.
 */
export function FeatureCardSkeleton() {
  return (
    <div
      className="
        bg-[#2d3748] rounded-xl p-5
        border border-white/10
        h-full flex flex-col
        animate-pulse
      "
      role="status"
      aria-label="Loading feature card"
    >
      {/* Icon Skeleton */}
      <div className="h-10 w-10 bg-white/10 rounded-lg mb-4" />

      {/* Title Skeleton */}
      <div className="h-6 bg-white/10 rounded w-3/4 mb-2" />

      {/* Description Skeleton - 2 Lines */}
      <div className="space-y-2 grow mb-4">
        <div className="h-4 bg-white/10 rounded w-full" />
        <div className="h-4 bg-white/10 rounded w-5/6" />
      </div>

      {/* Explore Link Skeleton */}
      <div className="h-4 bg-white/10 rounded w-20 ml-auto" />

      <span className="sr-only">Loading...</span>
    </div>
  )
}

/**
 * TabSkeleton
 * 
 * Full-page loading skeleton showing 6-9 feature cards in a grid.
 * Used while lazy-loading sport tab components.
 * 
 * @param cardCount - Number of skeleton cards to display (default: 9)
 * 
 * @example
 * <Suspense fallback={<TabSkeleton />}>
 *   <NFLTab />
 * </Suspense>
 */
export function TabSkeleton({ cardCount = 9 }: { cardCount?: number }) {
  return (
    <div
      className="
        grid 
        grid-cols-1 
        md:grid-cols-2 
        lg:grid-cols-3 
        gap-6 
        p-6
        min-h-screen
      "
      role="status"
      aria-label="Loading sports tab"
    >
      {Array.from({ length: cardCount }).map((_, index) => (
        <FeatureCardSkeleton key={`tab-skeleton-${index}`} />
      ))}
      <span className="sr-only">Loading sports data...</span>
    </div>
  )
}

/**
 * GameCardSkeleton
 * 
 * Loading placeholder for GameCard component.
 * Shows team names, odds, and stats areas as pulsing placeholders.
 */
export function GameCardSkeleton() {
  return (
    <div
      className="
        bg-[#2d3748] rounded-xl p-5
        border border-white/10
        animate-pulse
      "
      role="status"
      aria-label="Loading game card"
    >
      <div className="flex flex-col md:flex-row justify-between gap-4">
        {/* Left Column - Teams & Time */}
        <div className="flex-1 space-y-3">
          {/* Away Team */}
          <div className="h-6 bg-white/10 rounded w-3/4" />
          {/* Home Team */}
          <div className="h-6 bg-white/10 rounded w-2/3" />
          {/* Game Time */}
          <div className="h-4 bg-white/10 rounded w-1/2" />
        </div>

        {/* Right Column - Odds & Stats */}
        <div className="flex-1 space-y-3">
          {/* Main Odds */}
          <div className="h-8 bg-white/10 rounded w-full" />
          {/* Stat Badges */}
          <div className="flex gap-2">
            <div className="h-6 bg-white/10 rounded w-20" />
            <div className="h-6 bg-white/10 rounded w-20" />
            <div className="h-6 bg-white/10 rounded w-20" />
          </div>
        </div>
      </div>

      <span className="sr-only">Loading game data...</span>
    </div>
  )
}

/**
 * StatBadgeSkeleton
 * 
 * Loading placeholder for StatBadge component.
 * Small inline skeleton for stat display areas.
 */
export function StatBadgeSkeleton() {
  return (
    <div
      className="inline-block h-6 w-20 bg-white/10 rounded animate-pulse"
      role="status"
      aria-label="Loading stat"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

import React from "react"
import { FeatureCardSkeleton } from "./FeatureCard"

/**
 * FeatureCardGrid Props Interface
 */
export interface FeatureCardGridProps {
  /** Child FeatureCard components to display in grid */
  children?: React.ReactNode
  /** Loading state - shows skeleton cards if true */
  isLoading?: boolean
  /** Number of skeleton cards to show when loading (default: 6) */
  skeletonCount?: number
}

/**
 * FeatureCardGrid Component
 * 
 * Responsive grid container for FeatureCard components.
 * Adapts from 3 columns (desktop) → 2 (tablet) → 1 (mobile).
 * 
 * Grid breakpoints:
 * - Mobile (<768px): 1 column
 * - Tablet (768px-1024px): 2 columns  
 * - Desktop (>1024px): 3 columns
 * 
 * @example
 * <FeatureCardGrid isLoading={false}>
 *   <FeatureCard title="Live Odds" ... />
 *   <FeatureCard title="Player Props" ... />
 * </FeatureCardGrid>
 */
export function FeatureCardGrid({
  children,
  isLoading = false,
  skeletonCount = 6
}: FeatureCardGridProps) {
  // Show skeleton grid during loading
  if (isLoading) {
    return (
      <div
        className="
          grid 
          grid-cols-1 
          md:grid-cols-2 
          lg:grid-cols-3 
          gap-6 
          p-6
        "
        role="status"
        aria-label="Loading feature cards"
      >
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <FeatureCardSkeleton key={`skeleton-${index}`} />
        ))}
        <span className="sr-only">Loading content...</span>
      </div>
    )
  }

  // Render actual content
  return (
    <div
      className="
        grid 
        grid-cols-1 
        md:grid-cols-2 
        lg:grid-cols-3 
        gap-6 
        p-6
      "
    >
      {children}
    </div>
  )
}

FeatureCardGrid.displayName = "FeatureCardGrid"

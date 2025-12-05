/**
 * Sports Dashboard Components
 * 
 * Central export file for all Sports Dashboard components.
 * Import these components when building pages or features.
 */

// Main Dashboard
export { SportsDashboard } from "./SportsDashboard"
export { SportTabRouter } from "./SportTabRouter"
export { SportTabs } from "./SportTabs"
export type { Sport, SportTabsProps } from "./SportTabs"
export type { SportTabRouterProps } from "./SportTabRouter"

// Shared UI Components
export { FeatureCard, FeatureCardSkeleton } from "./shared/FeatureCard"
export { FeatureCardGrid } from "./shared/FeatureCardGrid"
export { GameCard } from "./shared/GameCard"
export { StatBadge, StatBadgeGroup } from "./shared/StatBadge"

export type { FeatureCardProps } from "./shared/FeatureCard"
export type { FeatureCardGridProps } from "./shared/FeatureCardGrid"
export type { GameData, GameCardProps } from "./shared/GameCard"
export type { StatBadgeProps } from "./shared/StatBadge"

// Loading Skeletons
export {
  FeatureCardSkeleton as LoadingFeatureCard,
  TabSkeleton,
  GameCardSkeleton,
  StatBadgeSkeleton
} from "./shared/LoadingSkeleton"

// Sport Tabs (use lazy loading via SportTabRouter instead of direct imports)
// export { default as NFLTab } from "./tabs/NFLTab"
// export { default as NBATab } from "./tabs/NBATab"
// export { default as MLBTab } from "./tabs/MLBTab"
// export { default as NHLTab } from "./tabs/NHLTab"

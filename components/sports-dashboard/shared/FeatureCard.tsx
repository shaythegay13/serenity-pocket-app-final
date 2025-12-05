import React from "react"
import { ArrowRight } from "lucide-react"

/**
 * FeatureCard Props Interface
 * Matches databallr.com design system
 */
export interface FeatureCardProps {
  /** Icon component or element (40x40px, teal colored) */
  icon: React.ReactNode
  /** Card title - white, bold, font-semibold */
  title: string
  /** Description text - muted gray, max 2 lines with ellipsis */
  description: string
  /** Optional badge shown in top-right corner */
  badge?: string
  /** Optional click handler for card interaction */
  onClick?: () => void
  /** Loading state - shows skeleton instead of content */
  isLoading?: boolean
}

/**
 * FeatureCard Component
 * 
 * Dark-themed feature card matching databallr.com aesthetic.
 * Features icon, title, description, optional badge, and explore link.
 * Hover effects include shadow growth and subtle lift animation.
 * 
 * @example
 * <FeatureCard
 *   icon={<TrendingUp className="h-10 w-10" />}
 *   title="Live Odds"
 *   description="Compare lines across DraftKings, FanDuel, and more"
 *   badge="LIVE"
 *   onClick={() => console.log('clicked')}
 * />
 */
export const FeatureCard = React.memo<FeatureCardProps>(({
  icon,
  title,
  description,
  badge,
  onClick,
  isLoading = false
}) => {
  // Show skeleton during loading
  if (isLoading) {
    return <FeatureCardSkeleton />
  }

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault()
          onClick()
        }
      }}
      aria-label={`${title}: ${description}`}
      className={`
        group relative
        bg-[#2d3748] rounded-xl p-5
        border border-white/10
        transition-all duration-250 ease-out
        ${onClick ? "cursor-pointer hover:shadow-lg hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-[#1b212c]" : ""}
        h-full flex flex-col
      `}
    >
      {/* Badge - Top Right Corner */}
      {badge && (
        <div className="absolute top-4 right-4">
          <span 
            className="px-2 py-1 text-xs font-medium bg-white/10 rounded-full text-gray-300"
            aria-label={`Badge: ${badge}`}
          >
            {badge}
          </span>
        </div>
      )}

      {/* Icon - Left Side, 40x40px, Teal */}
      <div 
        className="text-[#20B2AA] mb-4"
        aria-hidden="true"
      >
        <div className="h-10 w-10">
          {icon}
        </div>
      </div>

      {/* Title - White, Bold, Semibold */}
      <h3 className="text-[#F5F5F5] font-semibold text-lg mb-2 tracking-tight">
        {title}
      </h3>

      {/* Description - Muted Gray, Max 2 Lines with Ellipsis */}
      <p className="text-gray-400 text-sm leading-relaxed mb-4 grow line-clamp-2">
        {description}
      </p>

      {/* Explore Link - Bottom Right, Teal Text with Arrow */}
      {onClick && (
        <div className="flex items-center justify-end mt-auto">
          <span className="text-sm font-medium text-[#20B2AA] group-hover:text-teal-300 transition-colors duration-200 flex items-center gap-1">
            Explore
            <ArrowRight 
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" 
              aria-hidden="true"
            />
          </span>
        </div>
      )}

      {/* Hover Glow Effect - Subtle Enhancement */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/0 group-hover:from-white/5 group-hover:to-white/0 transition-all duration-300 pointer-events-none rounded-xl"
        aria-hidden="true"
      />
    </div>
  )
})

FeatureCard.displayName = "FeatureCard"

/**
 * FeatureCardSkeleton
 * 
 * Loading placeholder matching FeatureCard dimensions.
 * Uses Tailwind's animate-pulse for gentle pulsing effect.
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

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
        bg-[#161B22] rounded-xl p-5 border border-white/5
        transition-all duration-300 h-full flex flex-col
        hover:border-[#00FF41]/30 hover:shadow-[0_0_20px_rgba(0,255,65,0.15)]
        ${onClick ? 'cursor-pointer' : ''}
      `}
    >
      {/* Badge - Top Right Corner */}
      {badge && (
        <div className="absolute top-4 right-4">
          <span
            className="px-2 py-1 text-[9px] font-bold bg-[#00FF41]/20 rounded-full text-[#00FF41] border border-[#00FF41]/30 uppercase tracking-wider"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
            aria-label={`Badge: ${badge}`}
          >
            {badge}
          </span>
        </div>
      )}

      {/* Icon - Left Side, 40x40px, Electric Green */}
      <div
        className="text-[#00FF41] mb-4"
        aria-hidden="true"
      >
        <div className="h-10 w-10">
          {icon}
        </div>
      </div>

      {/* Title - White, Bold, Semibold */}
      <h3 className="text-white font-semibold text-lg mb-2">
        {title}
      </h3>

      {/* Description - Muted Gray, Max 2 Lines with Ellipsis */}
      <p className="text-gray-400 text-sm leading-relaxed mb-3 grow line-clamp-2">
        {description}
      </p>

      {/* Explore Link - Bottom Right, Cyber Blue Text with Arrow */}
      {onClick && (
        <div className="flex items-center justify-end mt-auto">
          <span className="text-sm font-medium text-[#00D1FF] group-hover:text-[#00FF41] transition-colors duration-200 flex items-center gap-1">
            Explore
            <ArrowRight
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
              aria-hidden="true"
            />
          </span>
        </div>
      )}

      {/* Hover Glow Effect - Databallr Enhancement */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-[#00FF41]/0 to-[#00FF41]/0 group-hover:from-[#00FF41]/5 group-hover:to-transparent transition-all duration-300 pointer-events-none rounded-xl"
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
        bg-[#161B22] rounded-xl p-5
        border border-white/5
        h-full flex flex-col
        animate-pulse
      "
      role="status"
      aria-label="Loading feature card"
    >
      {/* Icon Skeleton */}
      <div className="h-10 w-10 bg-[#00FF41]/10 rounded-lg mb-4" />

      {/* Title Skeleton */}
      <div className="h-6 bg-white/10 rounded w-3/4 mb-2" />

      {/* Description Skeleton - 2 Lines */}
      <div className="space-y-2 grow mb-4">
        <div className="h-4 bg-white/10 rounded w-full" />
        <div className="h-4 bg-white/10 rounded w-5/6" />
      </div>

      {/* Explore Link Skeleton */}
      <div className="h-4 bg-[#00D1FF]/20 rounded w-20 ml-auto" />

      <span className="sr-only">Loading...</span>
    </div>
  )
}

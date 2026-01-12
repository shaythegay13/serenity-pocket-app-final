import React from "react"
import { StatBadge, StatBadgeGroup } from "./StatBadge"
import { Clock, Zap, CheckCircle, TrendingUp } from "lucide-react"

/**
 * GameData Interface
 * Comprehensive game/matchup data structure
 */
export interface GameData {
  /** Unique game identifier */
  id: string
  /** Sport key (e.g., 'basketball_nba') */
  sport: string
  /** Home team name */
  homeTeam: string
  /** Away team name */
  awayTeam: string
  /** Game start time (ISO string or Date) */
  gameTime: string | Date
  /** Spread line (e.g., -6.5) */
  spread?: number
  /** Total points line (e.g., 48.5) */
  total?: number
  /** Moneyline odds */
  moneyline?: {
    home: number
    away: number
  }
  /** Additional stats to display */
  stats?: {
    label: string
    value: string | number
    trend?: "up" | "down" | "neutral"
    color?: "teal" | "gold" | "green" | "red" | "gray"
  }[]
  /** Live score (if game in progress) */
  liveScore?: {
    home: number
    away: number
  }
  /** Game status */
  status: "LIVE" | "UPCOMING" | "COMPLETED" | "POSTPONED"
}

/**
 * GameCard Props Interface
 */
export interface GameCardProps {
  /** Game data to display */
  game: GameData
  /** Sport identifier */
  sport: string
  /** Optional click handler */
  onClick?: () => void
  /** Optional className for additional styling */
  className?: string
  /** User subscription tier for bet button routing */
  subscriptionTier?: string
  /** Optional bet button click handler */
  onBetClick?: (game: GameData) => void
}

/**
 * Status badge configuration
 */
const statusConfig = {
  LIVE: {
    label: "LIVE",
    bgColor: "bg-red-500/20",
    textColor: "text-red-400",
    borderColor: "border-red-500/40",
    icon: Zap
  },
  UPCOMING: {
    label: "UPCOMING",
    bgColor: "bg-gray-500/20",
    textColor: "text-gray-400",
    borderColor: "border-gray-500/40",
    icon: Clock
  },
  COMPLETED: {
    label: "FINAL",
    bgColor: "bg-blue-500/20",
    textColor: "text-blue-400",
    borderColor: "border-blue-500/40",
    icon: CheckCircle
  },
  POSTPONED: {
    label: "POSTPONED",
    bgColor: "bg-yellow-500/20",
    textColor: "text-yellow-400",
    borderColor: "border-yellow-500/40",
    icon: Clock
  }
}

/**
 * Format game time for display
 */
function formatGameTime(gameTime: string | Date): string {
  const date = typeof gameTime === "string" ? new Date(gameTime) : gameTime
  
  const now = new Date()
  const diff = date.getTime() - now.getTime()
  const hours = Math.abs(diff / (1000 * 60 * 60))

  // If within 24 hours, show time only
  if (hours < 24) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    })
  }

  // Otherwise show date + time
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  })
}

/**
 * GameCard Component
 * 
 * Displays game/matchup information with teams, odds, stats, and status.
 * Responsive layout adapts from 2-column (desktop) to 1-column (mobile).
 * 
 * Features:
 * - Teams and game time on left
 * - Odds and stats on right
 * - Status badge (LIVE/UPCOMING/COMPLETED)
 * - Live scores when applicable
 * - Hover effects with shadow
 * - Clickable for drill-down
 * 
 * @example
 * <GameCard
 *   game={{
 *     id: "123",
 *     sport: "basketball_nba",
 *     homeTeam: "Lakers",
 *     awayTeam: "Warriors",
 *     gameTime: "2024-03-15T19:00:00Z",
 *     spread: -6.5,
 *     total: 225.5,
 *     status: "UPCOMING"
 *   }}
 *   sport="basketball_nba"
 *   onClick={() => console.log('Game clicked')}
 * />
 */
export function GameCard({
  game,
  sport,
  onClick,
  className = "",
  subscriptionTier = "free",
  onBetClick
}: GameCardProps) {
  const statusInfo = statusConfig[game.status] || statusConfig.UPCOMING
  const StatusIcon = statusInfo.icon

  const handleBetClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    console.log('Bet button clicked!', { game, subscriptionTier })
    
    // Map internal sport keys to human-readable names
    const sportNames: Record<string, string> = {
      'basketball_nba': 'NBA',
      'americanfootball_nfl': 'NFL',
      'baseball_mlb': 'MLB',
      'icehockey_nhl': 'NHL'
    }
    
    // Create comprehensive game data for TiltLab
    const gameData = {
      awayTeam: game.awayTeam,
      homeTeam: game.homeTeam,
      sport: game.sport,
      sportName: sportNames[game.sport] || game.sport.replace(/_/g, ' ').toUpperCase(),
      odds: game.moneyline || {
        home: game.spread || 0,
        away: game.spread ? -(game.spread) : 0
      },
      commenceTime: game.gameTime,
      // Add team records (placeholder - should be fetched from API)
      homeRecord: "0-0", // TODO: Fetch actual team records
      awayRecord: "0-0", // TODO: Fetch actual team records
      source: 'game-card' // Track where this came from
    }
    
    // Store in both sessionStorage and localStorage for compatibility
    sessionStorage.setItem('pendingBetGame', JSON.stringify(gameData))
    localStorage.setItem('pendingBetAnalysis', JSON.stringify({
      sport: gameData.sport,
      homeTeam: gameData.homeTeam,
      awayTeam: gameData.awayTeam,
      homeRecord: gameData.homeRecord,
      awayRecord: gameData.awayRecord,
      bestHomeOdds: gameData.odds.home,
      bestAwayOdds: gameData.odds.away,
      defaultStake: 50,
      sportName: gameData.sportName
    }))
    localStorage.setItem('aiAdvisorFromLiveOdds', 'true') // Use existing flag
    
    // Navigate to AI Picks tab
    window.location.href = "/?tab=ai-picks"
    
    if (onBetClick) {
      onBetClick(game)
    }
  }

  const canBet = subscriptionTier !== "free" && game.status !== "COMPLETED" && game.status !== "POSTPONED"

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
      className={`
        bg-[#2d3748] rounded-xl p-5
        border border-white/10
        transition-all duration-250 ease-out
        ${onClick ? "cursor-pointer hover:shadow-lg hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-[#1b212c]" : ""}
        ${className}
      `}
      aria-label={`Game: ${game.awayTeam} at ${game.homeTeam}, ${formatGameTime(game.gameTime)}`}
    >
      {/* Status Badge - Top Right */}
      <div className="flex justify-between items-start mb-4">
        <div className="opacity-0" /> {/* Spacer */}
        <div
          className={`
            flex items-center gap-1.5
            px-2.5 py-1
            rounded-md
            text-xs font-bold
            border
            ${statusInfo.bgColor}
            ${statusInfo.textColor}
            ${statusInfo.borderColor}
          `}
        >
          <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{statusInfo.label}</span>
        </div>
      </div>

      {/* Main Content - Responsive 2-column → 1-column */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        {/* Left Column - Teams & Time */}
        <div className="flex-1 space-y-2">
          {/* Away Team */}
          <div className="flex items-center justify-between">
            <span className="text-[#F5F5F5] font-bold text-lg">
              {game.awayTeam}
            </span>
            {game.liveScore && (
              <span className="text-[#20B2AA] font-bold text-xl ml-2">
                {game.liveScore.away}
              </span>
            )}
          </div>

          {/* Home Team */}
          <div className="flex items-center justify-between">
            <span className="text-[#F5F5F5] font-bold text-lg">
              {game.homeTeam}
            </span>
            {game.liveScore && (
              <span className="text-[#20B2AA] font-bold text-xl ml-2">
                {game.liveScore.home}
              </span>
            )}
          </div>

          {/* Game Time */}
          <div className="text-gray-400 text-sm flex items-center gap-1.5 mt-2">
            <Clock className="h-4 w-4" aria-hidden="true" />
            <span>{formatGameTime(game.gameTime)}</span>
          </div>
        </div>

        {/* Right Column - Odds & Stats */}
        <div className="flex-1 space-y-3">
          {/* Primary Odds Display */}
          {(game.spread || game.total || game.moneyline) && (
            <div className="flex flex-col gap-2">
              {game.spread !== undefined && (
                <div className="text-center md:text-right">
                  <span className="text-gray-400 text-xs block mb-1">Spread</span>
                  <span className="text-[#20B2AA] font-bold text-2xl">
                    {game.spread > 0 ? "+" : ""}{game.spread}
                  </span>
                </div>
              )}
              {game.total !== undefined && (
                <div className="text-center md:text-right">
                  <span className="text-gray-400 text-xs block mb-1">Total</span>
                  <span className="text-[#FFD700] font-bold text-2xl">
                    {game.total}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Stat Badges */}
          {game.stats && game.stats.length > 0 && (
            <StatBadgeGroup>
              {game.stats.slice(0, 4).map((stat, index) => (
                <StatBadge
                  key={`${game.id}-stat-${index}`}
                  label={stat.label}
                  value={stat.value}
                  trend={stat.trend}
                  color={stat.color || "gray"}
                />
              ))}
            </StatBadgeGroup>
          )}
        </div>
      </div>

      {/* Bet Button - Bottom */}
      {canBet && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <button
            onClick={handleBetClick}
            className="w-full bg-linear-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 cursor-pointer pointer-events-auto min-h-[48px] text-base"
            style={{ minHeight: '48px', padding: '16px 24px' }}
          >
            <TrendingUp className="h-5 w-5 shrink-0" />
            <span className="font-semibold">Bet on This Game</span>
          </button>
        </div>
      )}
    </div>
  )
}

GameCard.displayName = "GameCard"

/**
 * Live Betting Dashboard Type Definitions
 *
 * Comprehensive types for real-time sports betting data including:
 * - Live game data with scores and play-by-play
 * - Multi-sportsbook odds comparison
 * - Historical line movement tracking
 * - Betting trends and sharp money analysis
 */

import type { SupportedSportKey } from "../types"

// ============================================================================
// LIVE GAME DATA
// ============================================================================

export interface LiveGameStatus {
  period: number // Quarter (NFL/NBA), Inning (MLB), Period (NHL)
  clock: string // Time remaining in current period
  isHalftime?: boolean
  isOvertime?: boolean
  isFinal: boolean
  homeScore: number
  awayScore: number
  lastPlay?: string // Most recent play description
}

export interface PlayerLiveStats {
  playerId: string
  playerName: string
  position: string
  points?: number
  rebounds?: number
  assists?: number
  passingYards?: number
  rushingYards?: number
  touchdowns?: number
  goals?: number
  saves?: number
  hits?: number
  runs?: number
  strikeouts?: number
}

export interface LiveGameData {
  gameId: string
  sport: SupportedSportKey
  homeTeam: string
  awayTeam: string
  homeTeamLogo?: string
  awayTeamLogo?: string
  status: LiveGameStatus
  venue?: string
  weatherConditions?: {
    temperature: number
    conditions: string
    windSpeed: number
    windDirection: string
    precipitation: number
  }
  homeTeamStats?: PlayerLiveStats[]
  awayTeamStats?: PlayerLiveStats[]
  lastUpdated: Date
}

// ============================================================================
// LIVE ODDS DATA
// ============================================================================

export type BetType = "moneyline" | "spread" | "total" | "prop"

export interface OddsValue {
  value: number // American odds format (-110, +150, etc.)
  decimal?: number // European decimal format
  fractional?: string // UK fractional format
  point?: number // Spread or total point value
}

export interface BookmakerOdds {
  bookmaker: string
  bookmakerId: string
  lastUpdate: Date
  moneyline?: {
    home: OddsValue
    away: OddsValue
  }
  spread?: {
    home: OddsValue & { point: number }
    away: OddsValue & { point: number }
  }
  total?: {
    over: OddsValue & { point: number }
    under: OddsValue & { point: number }
  }
}

export interface LiveOddsData {
  gameId: string
  sport: SupportedSportKey
  homeTeam: string
  awayTeam: string
  commenceTime: Date
  bookmakers: BookmakerOdds[]
  bestOdds?: {
    moneyline: {
      home: { bookmaker: string; odds: OddsValue }
      away: { bookmaker: string; odds: OddsValue }
    }
    spread: {
      home: { bookmaker: string; odds: OddsValue & { point: number } }
      away: { bookmaker: string; odds: OddsValue & { point: number } }
    }
    total: {
      over: { bookmaker: string; odds: OddsValue & { point: number } }
      under: { bookmaker: string; odds: OddsValue & { point: number } }
    }
  }
  lastUpdated: Date
}

// ============================================================================
// LINE MOVEMENT DATA
// ============================================================================

export interface LineMovementSnapshot {
  timestamp: Date
  bookmaker: string
  betType: BetType
  side: "home" | "away" | "over" | "under"
  odds: OddsValue
}

export interface LineMovementData {
  gameId: string
  sport: SupportedSportKey
  homeTeam: string
  awayTeam: string
  commenceTime: Date
  movements: {
    moneyline: {
      home: LineMovementSnapshot[]
      away: LineMovementSnapshot[]
    }
    spread: {
      home: LineMovementSnapshot[]
      away: LineMovementSnapshot[]
    }
    total: {
      over: LineMovementSnapshot[]
      under: LineMovementSnapshot[]
    }
  }
  opening?: {
    moneyline?: { home: OddsValue; away: OddsValue }
    spread?: { home: OddsValue & { point: number }; away: OddsValue & { point: number } }
    total?: { over: OddsValue & { point: number }; under: OddsValue & { point: number } }
  }
  consensus?: {
    moneyline?: { home: OddsValue; away: OddsValue }
    spread?: { home: OddsValue & { point: number }; away: OddsValue & { point: number } }
    total?: { over: OddsValue & { point: number }; under: OddsValue & { point: number } }
  }
  lastUpdated: Date
}

// ============================================================================
// BETTING TRENDS DATA
// ============================================================================

export type BettorType = "public" | "sharp" | "professional"

export interface BettingSplit {
  side: "home" | "away" | "over" | "under"
  percentageOfBets: number // % of total bets placed
  percentageOfMoney: number // % of total money wagered
  bettorType: BettorType
}

export interface SharpMoneyIndicator {
  side: "home" | "away" | "over" | "under"
  betType: BetType
  confidence: "low" | "medium" | "high" | "extreme"
  percentage: number // % of sharp money on this side
  lineMovement: {
    direction: "towards" | "away" | "neutral"
    magnitude: number // How much the line has moved
  }
  reverseLineMovement?: boolean // Line moving opposite to public money (sharp indicator)
}

export interface BettingTrendsData {
  gameId: string
  sport: SupportedSportKey
  homeTeam: string
  awayTeam: string
  commenceTime: Date
  splits: {
    moneyline: {
      public: BettingSplit[]
      sharp: BettingSplit[]
    }
    spread: {
      public: BettingSplit[]
      sharp: BettingSplit[]
    }
    total: {
      public: BettingSplit[]
      sharp: BettingSplit[]
    }
  }
  sharpMoneyIndicators: SharpMoneyIndicator[]
  consensusPick?: {
    betType: BetType
    side: "home" | "away" | "over" | "under"
    confidence: number // 0-100
  }
  steamMoves?: {
    // Rapid line movement indicating sharp action
    betType: BetType
    side: "home" | "away" | "over" | "under"
    timestamp: Date
    oddsChange: number
    triggeredBy: "sharp" | "injury" | "weather" | "news"
  }[]
  lastUpdated: Date
}

// ============================================================================
// COMBINED DASHBOARD DATA
// ============================================================================

export interface LiveBettingDashboardData {
  liveGame?: LiveGameData
  liveOdds: LiveOddsData
  lineMovement: LineMovementData
  bettingTrends: BettingTrendsData
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface LiveDataAPIResponse<T> {
  success: boolean
  data: T
  source: string
  timestamp: Date
  error?: string
  cached?: boolean
  cacheAge?: number // milliseconds
}

export interface WebSocketMessage<T> {
  event: "live-game" | "odds-update" | "line-movement" | "betting-trends" | "connection" | "error"
  gameId?: string
  sport?: SupportedSportKey
  data: T
  timestamp: Date
}

// ============================================================================
// DATA SOURCE CONFIGURATION
// ============================================================================

export interface DataSourceConfig {
  provider: "odds-api" | "oddsjam" | "sportradar" | "sportsdata"
  apiKey: string
  enabled: boolean
  priority: number // Lower = higher priority
  rateLimitPerMinute: number
  endpoints: {
    liveGames?: string
    liveOdds?: string
    lineMovement?: string
    bettingTrends?: string
  }
}

export interface CacheConfig {
  liveGames: number // milliseconds
  liveOdds: number
  lineMovement: number
  bettingTrends: number
}

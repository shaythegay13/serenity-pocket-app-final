import type { SupportedSportKey, GameBetMarketType } from "../types"

export interface ComprehensiveBet {
  id: string
  timestamp: Date

  // Core bet details
  sport: SupportedSportKey
  league?: string
  homeTeam: string
  awayTeam: string
  gameDate: Date
  betType: GameBetMarketType

  // Bet specifics
  selection: "home" | "away" | "over" | "under" | "draw" | "other"
  line?: number // Spread points, total points, etc.
  odds: number // American odds
  stake: number

  // Emotions timeline
  emotions: {
    before: {
      emotion: string
      intensity: number
      timestamp: Date
      triggers?: string[]
    }
    during?: {
      emotion: string
      intensity: number
      timestamp: Date
    }
    after: {
      emotion: string
      intensity: number
      timestamp: Date
      reflection?: string
    }
  }

  // Psychological factors
  biasesIdentified: string[]
  confidenceLevel: number // 1-10
  reasoning: string
  isLiveBet: boolean
  isChasingLoss: boolean
  isFavoriteTeam: boolean

  // Outcome tracking
  outcome?: "win" | "loss" | "push" | "pending"
  actualReturn?: number
  profitLoss?: number

  // AI analysis
  aiRecommendation?: string
  expectedValue?: number
  probabilityEstimate?: number
  riskLevel?: "low" | "medium" | "high"

  // Metadata
  source: "tiltlab" | "bet-analyzer" | "manual"
  sportsbook?: string
  completedAt?: Date

  // Original description (fallback when team parsing fails)
  description?: string
}

export interface BetPerformanceMetrics {
  totalBets: number
  wins: number
  losses: number
  pushes: number
  pending: number

  winRate: number
  totalStaked: number
  totalReturned: number
  profitLoss: number
  roi: number

  averageStake: number
  averageOdds: number
  expectedValue: number

  // By sport
  performanceBySport: Record<string, Partial<BetPerformanceMetrics>>

  // By bet type
  performanceByBetType: Record<string, Partial<BetPerformanceMetrics>>

  // By emotion
  performanceByEmotion: Record<string, Partial<BetPerformanceMetrics>>

  // Time-based metrics
  dailyProfitLoss: Record<string, number>
  weeklyProfitLoss: Record<string, number>
  monthlyProfitLoss: Record<string, number>
}

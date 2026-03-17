// Shared AI-related types for PlayMind Labs
import type { PlayerPropLine } from './player-props'

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH"

// ============================================================================
// Market Schema Enums
// ============================================================================

/** Which portion of the game a bet covers */
export type TimeFrame =
  | 'full_game'
  | 'first_half' | 'second_half'
  | 'first_quarter' | 'second_quarter' | 'third_quarter' | 'fourth_quarter'
  | 'first_period' | 'second_period' | 'third_period'
  | 'first_set' | 'second_set' | 'third_set'

/** Whether the line is the primary book line, an alternate, or a milestone */
export type VariantType = 'base_line' | 'alt_line' | 'milestone'

/** Which level of the game hierarchy the market targets */
export type MarketLevel = 'game' | 'team' | 'player' | 'future'

export interface UserPsychologySnapshot {
  currentEmotion: string
  currentEmotionIntensity?: number // 0-10
  lastOutcome?: string
  emotionalTriggers?: string
  recentHistorySummary?: string
  recentBets?: Array<{
    outcome: "win" | "loss" | "push" | "pending"
    stake: number
    odds: number
    timestamp?: string
  }>
  riskTolerance: "conservative" | "moderate" | "aggressive"
  weeklyBudget: number
  favoriteTeam?: string
  underdogBiasTeam?: string
  // Additional psychology flags for TiltLab analysis
  isChasingLoss?: boolean
  isFavoriteTeam?: boolean
  isLiveBet?: boolean
  confidenceLevel?: number // 0-100
  notes?: string
}

export interface GameIdentifier {
  league: string
  date?: string // ISO date
  teamA: string
  teamB: string
}

export interface CurrentGameContext {
  gameId?: string
  league: string
  startTime?: string
  homeTeam: string
  awayTeam: string
  currentOdds: {
    moneylineHome?: number
    moneylineAway?: number
    spread?: number
    spreadHomeOdds?: number
    spreadAwayOdds?: number
    totalPoints?: number
    totalOverOdds?: number
    totalUnderOdds?: number
  }
  // Average/consensus odds across all bookmakers for true EV calculation via line shopping
  averageOdds?: {
    moneylineHome?: number
    moneylineAway?: number
    spreadHomeOdds?: number
    spreadAwayOdds?: number
    totalOverOdds?: number
    totalUnderOdds?: number
  }
  spreadLines?: {
    home: number
    away: number
  }
  totalLine?: number
  impliedProbabilities?: {
    home?: number
    away?: number
  }
  keyInjuries?: string[]
  weather?: string
  teamForm?: {
    homeRecent?: string[]
    awayRecent?: string[]
  }
  pace?: string
  homeAwaySplits?: string
  narrativeContext?: string
}

export interface HistoricalFeatureVector {
  league: string
  teamA: string
  teamB: string
  lookbackGames: number
  // Simplified placeholder; real implementation would mirror SageMaker schema
  numericFeatures: number[]
  categoricalFeatures?: string[]
  // Optional derived stats for higher-level models (e.g., SageMaker CSV builder)
  // These are purely additive and safe for callers that ignore them.
  derivedStats?: {
    homeOffenseRating?: number
    awayOffenseRating?: number
    homeDefenseRating?: number
    awayDefenseRating?: number
    homePpg?: number
    awayPpg?: number
    homeFgPct?: number
    awayFgPct?: number
  }
}

export interface ModelPrediction {
  winProbabilityHome: number // 0-1
  winProbabilityAway: number // 0-1
  expectedValueMoneylineHome?: number
  expectedValueMoneylineAway?: number
  expectedValueSpread?: number
  expectedValueTotal?: number
  modelConfidence: number // 0-1
  riskScore: number // 0-1
  primaryMarket?: string // "moneyline", "spread", or "total"
}

export interface UserPsychProfile {
  riskTolerance: "conservative" | "moderate" | "aggressive"
  weeklyBudget: number
}

export interface BetRiskAssessment {
  ev: number
  riskCategory: RiskLevel
  suggestedMaxStakeFraction: number // 0-1 of weekly budget
  flags: string[]
}

/**
 * EV Validation Result
 * Based on industry standards: +1-5% typical sharp edges
 * Sources: Pinnacle, OddsJam, professional betting forums
 *
 * Typical ranges:
 * - Typical profitable +EV: +1% to +5% (most common 1-3%)
 * - Strong +EV: +3% to +5%
 * - Above +5%: Rare, flag as high-variance/risky
 * - Negative EV: -2% to -10% common for losers; below -10% extreme
 */
export interface EVValidation {
  ev: number
  evPercentage: number
  isRealistic: boolean
  flag: string
  category: 'high-variance' | 'strong-edge' | 'solid-value' | 'marginal' | 'near-fair' | 'negative-ev'
}

export interface PickerRecommendationItem {
  gameId?: string
  teams: string
  startTime?: string
  betType: string
  line: string
  odds: number
  emotionalAlignment: number // 0-100
  confidence?: number // 0-100
  suggestedStakeFraction: number
  suggestedStakeAbsolute?: number
  riskLevel: RiskLevel
  numericRisk?: {
    ev: number
    evPercentage?: number
  }
  shortExplanation: string
  // Indicates if this pick is the recommended side for this game/bet-type
  // Used by frontend for badge display (decoupled from EV sign)
  isRecommended?: boolean
  // EV validation result with realistic assessment
  evValidation?: EVValidation

  // Player prop fields for SGP and player-level betting
  playerId?: string           // External player ID
  playerName?: string         // Display name (e.g., "Patrick Mahomes")
  playerTeam?: string         // Team abbreviation (e.g., "KC")
  playerPosition?: string     // Position (e.g., "QB", "WR", "PG")
  propCategory?: PropCategory // Typed category for correlations
  propStat?: string           // Specific stat (e.g., "passing_yards", "receptions")
  propLine?: number           // Numeric line (e.g., 250.5)
  propDirection?: 'over' | 'under' // Over/under selection
}

export interface PickerReasoningInput {
  user: UserPsychologySnapshot
  games: Array<{
    id?: string
    context: CurrentGameContext
    features: HistoricalFeatureVector
    prediction: ModelPrediction
    sportsResearch?: {
      dataSource: string
      researchTimestamp: string
      homeTeam: {
        name?: string
        currentForm?: string
        strengths: string[]
        recentForm: string[]
      }
      awayTeam: {
        name?: string
        currentForm?: string
        strengths: string[]
        recentForm: string[]
      }
      headToHead: {
        totalMatches: number
        homeWins: number
        awayWins: number
        draws: number
      } | null
      keyFactors: string[]
      expertPrediction: {
        winner: string
        confidence: number
        reasoning: string
        riskFactors: string[]
      }
    } | null
    playerPropLines?: PlayerPropLine[]
  }>
}

export interface PickerReasoningOutput {
  recommendations: PickerRecommendationItem[]
}

export interface BetAnalyzerReasoningInput {
  user: UserPsychologySnapshot
  game: {
    id?: string
    context: CurrentGameContext
    features: HistoricalFeatureVector
    prediction: ModelPrediction
  }
  bet: {
    type: string
    stake: number
    odds: number
    slipText?: string
    selection?: string // "home", "away", "over", "under"
    line?: number // Spread or total line
    // Player prop context (populated when betType === 'Player Prop')
    playerName?: string
    playerTeam?: string
    propStat?: string
    propLine?: number
    propDirection?: 'over' | 'under'
    propCategory?: string
  }
}

export interface BetAnalyzerReasoningOutput {
  betSafetyCategory: "DISCOURAGED" | "CAUTION" | "REASONABLE" | "PREFERRED"
  stakeRecommendation: {
    amount: number
    fractionOfBudget: number
    explanation: string
  }
  psychologyFlags: string[]
  emotionalAlignment: number
  summary: string
  detailedExplanation: string
  numericRisk?: {
    ev: number
    evPercentage?: number
  }
  responsibleGamblingReminder?: string
}

// Parlay-related types

// Player prop category for correlation detection
export type PropCategory =
  | 'passing' | 'rushing' | 'receiving' | 'defense' | 'touchdown'  // NFL
  | 'scoring' | 'rebounding' | 'playmaking' | 'combined'           // NBA
  | 'pitching' | 'hitting'                                          // MLB
  | 'goaltending' | 'skating'                                       // NHL
  | 'performance' | 'other'

// Extended leg type with persistence and tracking fields
export interface ParlayLeg {
  pickId: string
  gameId?: string
  teams: string
  betType: string
  line: string
  odds: number
  confidence?: number
  aiWinProbability?: number
  // Persistence fields for parlay tracking
  sport?: string
  league?: string
  selection?: string          // "home" | "away" | "over" | "under"
  outcome?: 'won' | 'lost' | 'void' | 'push' | 'pending'
  settledAt?: string

  // Player prop fields for SGP and player-level betting
  playerId?: string           // External player ID (e.g., from TheOddsAPI)
  playerName?: string         // Display name (e.g., "Patrick Mahomes")
  playerTeam?: string         // Team abbreviation (e.g., "KC")
  playerPosition?: string     // Position (e.g., "QB", "WR", "PG")
  propCategory?: PropCategory // Typed category for correlations
  propStat?: string           // Specific stat (e.g., "passing_yards", "receptions")
  propLine?: number           // Numeric line (e.g., 250.5)
  propDirection?: 'over' | 'under' // Over/under selection

  // Team prop fields (team totals, team stats)
  teamPropTeam?: string                  // Which team (e.g., "LAL")
  teamPropStat?: string                  // Stat key (e.g., "team_total_points")
  teamPropDirection?: 'over' | 'under'   // Over/under selection

  // Market schema fields
  timeFrame?: TimeFrame     // Which portion of the game
  variantType?: VariantType // base_line, alt_line, or milestone
  marketLevel?: MarketLevel // game, team, player, or future
}

/**
 * Type guard to check if a parlay leg is a player prop
 */
export function isPlayerPropLeg(leg: ParlayLeg): boolean {
  return Boolean(leg.playerId && leg.propStat)
}

// Parlay outcome status
export type ParlayOutcome = 'pending' | 'won' | 'lost' | 'void' | 'push'

// Parlay type flag
export type ParlayType = 'classic' | 'sgp' | 'sgp_plus' | 'teaser' | 'system' | 'round_robin'

/**
 * Full parlay domain model for tracking user-built or recommended parlays.
 * Stores legs, odds, emotional context at creation, and settlement data.
 */
export interface Parlay {
  id: string
  userId?: string
  anonymousSessionId?: string
  createdAt: string
  type: ParlayType
  legs: ParlayLeg[]
  stake: number
  totalOddsAmerican: number
  totalOddsDecimal: number
  impliedProbability: number
  // AI-estimated combined probability (product of leg probs, assuming independence)
  // TODO: Hook for future correlation modeling
  trueProbability?: number
  projectedEV?: number
  riskScore?: number              // 0-1, variance/tilt proxy
  kellyStakeFraction?: number
  outcome: ParlayOutcome
  actualPayout?: number
  settledAt?: string
  // Emotional context at creation time from most recent emotion check-in
  emotionAtCreation?: string
  emotionIntensityAtCreation?: number
  // Tilt signal tags inferred from leg combinations
  // e.g. "chasing_losses", "laddering", "cross_sport_mashup", "same_player_stacking"
  tiltSignals?: string[]
  // Back-reference for emotion check-in linkage
  emotionCheckInId?: string
  // Cash-out support (stub until sportsbook API integration)
  supportsCashOut?: boolean
  cashOutOffer?: import('../cashout-utils').CashOutOffer
}

/**
 * SmartSlip parlay recommendation shape returned by the picker API.
 * Contains pre-computed odds, EV, and risk analysis for a recommended parlay.
 */
export interface ParlayRecommendation {
  legs: ParlayLeg[]
  totalOddsAmerican: number
  totalOddsDecimal: number
  impliedProbability: number
  trueProbability: number
  projectedEV: number
  evPercentage: number
  riskScore: number
  suggestedStake: number
  parlayType: ParlayType
  // "core" = 2-3 tight legs with strong edges; "lotto" = 4+ legs with capped stake
  category: 'core' | 'lotto'
  correlationWarnings: CorrelationWarning[]
  summary: string
}

export interface CorrelationWarning {
  type: 'same-game' | 'same-team' | 'excessive-legs'
  severity: 'low' | 'medium' | 'high'
  message: string
  affectedLegs: string[]
}

// ============================================================================
// Teaser Types
// ============================================================================

/** A single leg in a teaser bet (spread or total only) */
export interface TeaserLeg {
  pickId: string
  gameId?: string
  teams: string
  betType: 'spread' | 'total'         // Only spread/total eligible for teasers
  originalLine: number                 // Line before teaser point adjustment
  adjustedLine: number                 // Line after teaser points applied
  selection: 'home' | 'away' | 'over' | 'under'
  odds?: number                        // Not per-leg; derived from payout table
  sport: string
  aiWinProbability?: number            // Optional per-leg probability estimate
}

/** A fully resolved teaser recommendation with payout-table odds and EV */
export interface TeaserRecommendation {
  legs: TeaserLeg[]
  teaserSize: number                   // 6, 6.5, 7, 10 for NFL; 5, 6 for NBA
  teaserOddsAmerican: number           // From payout table
  trueProbability: number              // Combined true win probability
  projectedEV: number                  // Expected value in dollars
  evPercentage: number                 // EV as % of stake
  suggestedStake: number
  sport: string
  summary: string
}

// ============================================================================
// Futures Types
// ============================================================================

export type FuturesCategory =
  | 'championship' | 'division' | 'conference' | 'award' | 'season_stat'

export type FuturesSubject = 'team' | 'player'

export interface FutureMarket {
  id: string
  sport: string
  seasonId: string
  tournamentId?: string
  category: FuturesCategory
  subject: FuturesSubject
  selection: string
  odds: number
  impliedProbability: number
  fairProbability?: number
  bookmaker: string
  settlementDate: string
  isOpen: boolean
  variantType: 'base_line'
  marketLevel: 'future'
}

export interface FuturesRecommendation {
  market: FutureMarket
  confidence: number              // 0-100
  evPercentage: number
  suggestedStake: number
  suggestedStakeFraction: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  reasoning: string
  settlementHorizonDays: number
  subject: FuturesSubject
}

// ============================================================================
// System / Round-Robin Types
// ============================================================================

/** Configuration for a K-of-N system or round-robin bet */
export interface SystemBetConfig {
  type: 'system' | 'round_robin'
  totalLegs: number           // N — total legs in the pool
  requiredWinners: number     // K — how many must win for a payout
  combinationCount: number    // C(N, K) — precomputed
}

/** Full system bet recommendation with all combinations pre-computed */
export interface SystemBetRecommendation {
  config: SystemBetConfig
  legs: ParlayLeg[]
  combinations: ParlayLeg[][]          // All C(N,K) sub-parlays
  totalStake: number                   // stakePerCombination × combinationCount
  stakePerCombination: number
  minOddsAmerican: number              // Lowest single combination payout
  maxOddsAmerican: number              // Highest single combination payout
  expectedReturn: number
  evPercentage: number
  correlationWarnings: CorrelationWarning[]
  summary: string
}

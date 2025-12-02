// Shared AI-related types for Serenity Pocket

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH"

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

export interface PickerRecommendationItem {
  gameId?: string
  teams: string
  startTime?: string
  betType: string
  line: string
  odds: number
  emotionalAlignment: number // 0-100
  suggestedStakeFraction: number
  suggestedStakeAbsolute?: number
  riskLevel: RiskLevel
  shortExplanation: string
}

export interface PickerReasoningInput {
  user: UserPsychologySnapshot
  games: Array<{
    id?: string
    context: CurrentGameContext
    features: HistoricalFeatureVector
    prediction: ModelPrediction
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
  summary: string
  detailedExplanation: string
  responsibleGamblingReminder?: string
}

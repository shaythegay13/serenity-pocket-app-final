export interface SurveyData {
  score?: number
  level?: string
  answers?: Record<string, string>
  completedAt?: string
  // Demographic fields from onboarding
  ageRange?: string
  region?: string
  occupation?: string
  educationLevel?: string
  incomeRange?: string
  employmentStatus?: string
  maritalStatus?: string
  ethnicity?: string
  bettingFrequency?: string
  typicalBetAmount?: string
  // Profile fields
  name?: string
  email?: string
  userType?: string
  experience?: string
  primaryGoal?: string
  weeklyActivity?: string
  referralSource?: string
}

export interface SubscriptionTier {
  id: "free" | "premium" | "premium_plus" | "elite"
  name: string
  displayName: string
  price: number
  interval: "month" | "year"
  features: string[]
  description: string
}

export interface UserData {
  name: string
  username?: string
  email?: string
  level: number
  xp: number
  xpToNextLevel: number
  emotionalAwarenessStreak: number
  biasRecognitionScore: number
  mindfulDecisionPercentage: number
  totalTrades: number
  mindfulTrades: number
  serenityTokens: number
  dailyRings: {
    emotionalAwareness: number // 0-100
    biasRecognition: number // 0-100
    mindfulness: number // 0-100
  }
  lastRingReset: Date
  perfectDays: number
  longestStreak: number
  totalEmotionsLogged: number
  totalBiasesIdentified: number
  totalJournalsCompleted: number
  totalModulesCompleted: number
  totalBreathingExercises: number
  mostProductiveDay: number
  surveyData?: SurveyData
  subscriptionTier?: "free" | "premium" | "premium_plus" | "elite"
  subscriptionStatus?: "active" | "inactive" | "canceled" | "past_due"
  subscriptionStartedAt?: string
  subscriptionEndsAt?: string
  lastEmotionCheckIn?: Date
  // Profile & Demographics
  age?: number
  gender?: string
  location?: string
  bettingExperience?: string
  educationLevel?: string
  incomeRange?: string
  employmentStatus?: string
  maritalStatus?: string
  ethnicity?: string
  bettingFrequency?: string
  typicalBetAmount?: string
  // Onboarding tracking
  onboardingComplete?: boolean
  biographyComplete?: boolean
  emotionTrackComplete?: boolean
  biography?: string
  pendingEmotionTradeId?: string // Trade ID waiting for post-bet emotion
  demographicsComplete?: boolean // Track if user completed demographics for XP bonus
  unlockedRewards?: string[] // IDs of rewards unlocked with tokens
  selectedBadgeFrame?: string // Currently selected badge frame
  selectedThemeColor?: string // Currently selected theme color
  // Safety & preferences
  cooldownEnabled?: boolean
  behaviorNudgesEnabled?: boolean
  dailyBetLimit?: number
  maxStakeLimit?: number
  weeklyBankroll?: number
}

export interface EmotionLog {
  id: string
  timestamp: Date
  emotion: string
  intensity: number
  context: string
  phase: "before" | "during" | "after"
  tradeId?: string
}

/**
 * Trade interface for tracking user trading behavior.
 *
 * NOTE: This interface uses two different outcome formats for historical compatibility:
 * - `outcome`: Legacy format ("profit" | "loss" | "breakeven") - user-centric terminology
 * - `result`: Standard sports betting format ("win" | "loss" | "push") - for dashboard compatibility
 *
 * Use `result` for new code when possible, as it aligns with BetAnalysis and ComprehensiveBet interfaces.
 */
export interface Trade {
  id: string
  timestamp: Date
  title?: string
  sport?: string
  preTradeEmotion: string
  preTradeIntensity: number
  biasesIdentified: string[]
  confidenceLevel: number
  reasoning: string
  /** @deprecated Use `result` instead for consistency with other bet interfaces */
  outcome?: "profit" | "loss" | "breakeven"
  postTradeEmotion?: string
  postTradeIntensity?: number
  reflection?: string
  emotionalImpact?: number
  stake?: number
  actualReturn?: number
  status?: "pending" | "open" | "settled"
  /** Preferred outcome field - aligns with BetAnalysis and ComprehensiveBet */
  result?: "win" | "loss" | "push"
}

export interface GameLineRecord {
  id: string
  sport: string
  league?: string
  homeTeam: string
  awayTeam: string
  commenceTime: string
  sportsbook?: string
  markets: any[]
  homeScore?: number
  awayScore?: number
  finalStatus?: string
  createdAt?: string
  updatedAt?: string
}

export type AIServiceType = "ai_picker" | "ai_bet_analyzer"

export interface AIServiceUsage {
  id: string
  userId: string
  serviceType: AIServiceType
  weekStartDate: string
  tierAtTimeOfUse?: string
  requestMetadata?: Record<string, any>
  createdAt: string
}

export interface BiasProfile {
  confirmationBias: number
  lossAversion: number
  anchoringBias: number
  recencyBias: number
  overconfidenceBias: number
  herdMentality: number
}

export interface BiasQuizHistory {
  id: string
  timestamp: Date
  profile: BiasProfile
  averageScore: number // Average across all biases
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
  unlockedAt?: Date
  progress: number
  maxProgress: number
  category: "streak" | "bias-buster" | "behavior-change" | "learning"
}

export interface Challenge {
  id: string
  title: string
  description: string
  progress: number
  maxProgress: number
  xpReward: number
  expiresAt: Date
}

export interface BetAnalysis {
  id: string
  timestamp: Date
  // Keep "straight" for backward compatibility but also support richer
  // bet categories so we can track separate behaviors and insights.
  betType:
  | "straight"
  | "moneyline"
  | "spread"
  | "total"
  | "parlay"
  | "prop"
  | "future"
  | "live"
  description: string
  stake: number
  odds?: number
  sport?: string
  emotionalState: string
  emotionalIntensity: number
  biasWarnings: string[]
  aiRecommendation?: string
  expectedValue?: number
  probabilityEstimate?: number
  outcome?: "win" | "loss" | "push" | "pending"
  actualReturn?: number
  // Add status and result for compatibility with dashboard
  status?: "pending" | "open" | "settled"
  result?: "win" | "loss" | "push"
}

export interface TiltAlert {
  id: string
  timestamp: Date
  severity: "low" | "medium" | "high" | "critical"
  triggers: string[]
  recommendation: string
  cooldownSuggested: boolean
}

// ============================================================================
// Outcome Type Helpers
// ============================================================================

/** Standard bet outcome types used in BetAnalysis and ComprehensiveBet */
export type BetOutcome = "win" | "loss" | "push" | "pending"

/** Legacy trade outcome types (deprecated, use BetOutcome instead) */
export type TradeOutcome = "profit" | "loss" | "breakeven"

/**
 * Convert legacy trade outcome to standard bet outcome
 */
export function tradeOutcomeToBetOutcome(outcome: TradeOutcome | undefined): BetOutcome | undefined {
  if (!outcome) return undefined
  switch (outcome) {
    case "profit": return "win"
    case "loss": return "loss"
    case "breakeven": return "push"
    default: return undefined
  }
}

/**
 * Convert standard bet outcome to legacy trade outcome
 */
export function betOutcomeToTradeOutcome(outcome: BetOutcome | undefined): TradeOutcome | undefined {
  if (!outcome) return undefined
  switch (outcome) {
    case "win": return "profit"
    case "loss": return "loss"
    case "push":
    case "pending": return "breakeven"
    default: return undefined
  }
}

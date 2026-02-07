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
  trialDays?: number
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

// ============================================================================
// Anchored Inference System - Emotional State Types
// ============================================================================

/**
 * EmotionalState with arousal/valence dimensions
 *
 * Based on Russell's Circumplex Model of Affect:
 * - Arousal: activation level (0 = calm/sleepy, 1 = excited/alert)
 * - Valence: emotional direction (-1 = negative, 0 = neutral, +1 = positive)
 *
 * Combined with tilt level for betting-specific risk assessment.
 */
export interface EmotionalState {
  /** Unique identifier */
  id: string
  /** When this emotional state was recorded */
  timestamp: Date
  /** Tilt level from 0 (calm) to 1 (full tilt) - betting-specific measure */
  tiltLevel: number
  /** Arousal/activation level from 0 (low energy) to 1 (high energy) */
  arousal: number
  /** Valence from -1 (negative) to +1 (positive) */
  valence: number
  /** Optional: the raw emotion name that was converted */
  sourceEmotion?: string
  /** Optional: original intensity (1-10) before conversion */
  sourceIntensity?: number
  /** Optional: context or trigger for this emotional state */
  context?: string
  /** Optional: associated trade/bet ID */
  tradeId?: string
}

/**
 * Mapping of common emotions to arousal/valence coordinates
 * Based on psychological research on emotion dimensions
 */
export const EMOTION_AROUSAL_VALENCE_MAP: Record<string, { arousal: number; valence: number }> = {
  // High arousal, positive valence
  excited: { arousal: 0.9, valence: 0.8 },
  elated: { arousal: 0.85, valence: 0.9 },
  happy: { arousal: 0.6, valence: 0.8 },
  confident: { arousal: 0.7, valence: 0.7 },
  enthusiastic: { arousal: 0.8, valence: 0.7 },

  // Low arousal, positive valence
  calm: { arousal: 0.2, valence: 0.5 },
  relaxed: { arousal: 0.15, valence: 0.6 },
  content: { arousal: 0.3, valence: 0.6 },
  peaceful: { arousal: 0.1, valence: 0.5 },
  grateful: { arousal: 0.4, valence: 0.8 },

  // High arousal, negative valence
  angry: { arousal: 0.9, valence: -0.8 },
  frustrated: { arousal: 0.8, valence: -0.6 },
  anxious: { arousal: 0.8, valence: -0.5 },
  stressed: { arousal: 0.85, valence: -0.6 },
  fearful: { arousal: 0.9, valence: -0.7 },
  panicked: { arousal: 1.0, valence: -0.9 },

  // Low arousal, negative valence
  sad: { arousal: 0.2, valence: -0.7 },
  depressed: { arousal: 0.1, valence: -0.8 },
  bored: { arousal: 0.1, valence: -0.3 },
  tired: { arousal: 0.05, valence: -0.2 },
  hopeless: { arousal: 0.15, valence: -0.9 },

  // Neutral/mixed states
  neutral: { arousal: 0.3, valence: 0.0 },
  focused: { arousal: 0.6, valence: 0.2 },
  curious: { arousal: 0.5, valence: 0.3 },
  surprised: { arousal: 0.7, valence: 0.0 },
}

/**
 * Convert an emotion name and intensity to arousal/valence coordinates
 */
export function emotionToArousalValence(
  emotion: string,
  intensity: number = 5
): { arousal: number; valence: number } {
  const normalized = emotion.toLowerCase().trim()
  const mapping = EMOTION_AROUSAL_VALENCE_MAP[normalized]

  if (!mapping) {
    // Default to neutral with slight negative valence for unknown emotions
    return { arousal: 0.5, valence: 0.0 }
  }

  // Scale arousal/valence by intensity (1-10 scale)
  const intensityFactor = intensity / 10
  return {
    arousal: mapping.arousal * intensityFactor + (1 - intensityFactor) * 0.3,
    valence: mapping.valence * intensityFactor
  }
}

/**
 * Calculate tilt level from arousal/valence
 * High tilt = high arousal + negative valence (e.g., angry, frustrated, anxious)
 */
export function calculateTiltFromArousalValence(arousal: number, valence: number): number {
  // Tilt is highest when arousal is high and valence is negative
  // Formula: tilt = arousal * (1 - valence) / 2
  // This gives max tilt (1.0) when arousal=1 and valence=-1
  const tilt = arousal * (1 - valence) / 2
  return Math.min(1, Math.max(0, tilt))
}

/**
 * Convert an EmotionLog to an EmotionalState
 */
export function emotionLogToEmotionalState(log: EmotionLog): EmotionalState {
  const { arousal, valence } = emotionToArousalValence(log.emotion, log.intensity)
  const tiltLevel = calculateTiltFromArousalValence(arousal, valence)

  return {
    id: log.id,
    timestamp: log.timestamp,
    tiltLevel,
    arousal,
    valence,
    sourceEmotion: log.emotion,
    sourceIntensity: log.intensity,
    context: log.context,
    tradeId: log.tradeId
  }
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
  /**
   * Whether this bet was placed live/in-play
   * Live betting is a significant risk factor associated with impulsivity
   */
  isLiveBet?: boolean
  /** Time in seconds between this bet and the previous bet (for sequence analysis) */
  timeSincePreviousBet?: number
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
  /**
   * Whether this bet was placed live/in-play
   * Live betting is a significant risk factor associated with impulsivity
   */
  isLiveBet?: boolean
  /** Time in seconds between this bet and the previous bet (for sequence analysis) */
  timeSincePreviousBet?: number
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
/**
 * Supported sport keys used across the application.
 * Values should match the keys in SUPPORTED_SPORTS in lib/sports-config.ts.
 */
export type SupportedSportKey =
  | "basketball_nba"
  | "americanfootball_nfl"
  | "baseball_mlb"
  | "icehockey_nhl"
  | "basketball_ncaab"
  | "americanfootball_ncaaf"
  | "soccer_epl"
  | "soccer_mls"
  | "soccer_champions_league"
  | "mma_ufc"
  | "boxing"
  | "tennis_atp"
  | "tennis_wta"
  | "golf_pga"
  | "motorsports_f1"
  | "motorsports_nascar"
  | "esports_lol"
  | "esports_csgo"

/**
 * Standardized bet market types.
 */
export type GameBetMarketType = "moneyline" | "spread" | "total" | "parlay" | "prop" | "future" | "live"

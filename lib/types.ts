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

export type SupportedSportKey =
  | "basketball_nba"
  | "americanfootball_nfl"
  | "baseball_mlb"
  | "icehockey_nhl"

export type GameBetMarketType =
  | "moneyline"
  | "spread" // spread / run line / puck line
  | "total" // over/under
  | "parlay"
  | "prop"
  | "future"
  | "live"

export interface GameMarketSnapshot {
  id: string
  marketType: GameBetMarketType
  // Side or orientation of the bet: team side, total side, etc.
  side?: "home" | "away" | "over" | "under" | "draw" | "other"
  // Numeric line when applicable (spread points, total points, etc.)
  line?: number
  // American odds for this outcome at the time of snapshot
  price: number
  // Optional human-readable label, e.g. "LeBron 25+ points" or "Division winner"
  label?: string
  // Optional book name for this specific quote if different from parent record
  sportsbook?: string
}

export interface GameLineRecord {
  id: string // stable ID per game/event (can be odds API event id)
  sport: SupportedSportKey
  league?: string
  homeTeam: string
  awayTeam: string
  // Scheduled start time at the moment this record was captured
  commenceTime: string
  // Primary sportsbook for this snapshot (best line or reference book)
  sportsbook?: string
  // Collection of markets captured for this game at or near this time
  markets: GameMarketSnapshot[]
  // Final outcome (filled once game is over)
  homeScore?: number
  awayScore?: number
  finalStatus?: "scheduled" | "in_progress" | "final" | "canceled" | "postponed"
  // Timestamps for audit/history
  createdAt: string
  updatedAt: string
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

export interface Trade {
  id: string
  timestamp: Date
  title?: string
  sport?: string
  betType?: "moneyline" | "spread" | "total" | "parlay" | "prop" | "future" | "live"
  preTradeEmotion: string
  preTradeIntensity: number
  biasesIdentified: string[]
  confidenceLevel: number
  reasoning: string
  outcome?: "profit" | "loss" | "breakeven"
  postTradeEmotion?: string
  postTradeIntensity?: number
  reflection?: string
  emotionalImpact?: number
  stake?: number
  odds?: number
  actualReturn?: number
  // Add status and result for compatibility with dashboard
  status?: "pending" | "open" | "settled"
  result?: "win" | "loss" | "push"
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
  sport: string
  description: string
  odds: number
  stake: number
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

export interface OddsComparison {
  sportsbook: string
  odds: number
  link?: string
}

export interface LiveOddsData {
  id: string
  sport: string
  event: string
  eventTime: Date
  betType: string
  comparisons: OddsComparison[]
  bestOdds: number
  bestSportsbook: string
}

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
  name: string
  price: number
  interval: "month" | "year"
  features: string[]
}

export interface UserData {
  name: string
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
  subscriptionTier?: "free" | "pro" | "elite" | "master"
  lastEmotionCheckIn?: Date
  // Onboarding tracking
  onboardingComplete?: boolean
  biographyComplete?: boolean
  emotionTrackComplete?: boolean
  biography?: string
  pendingEmotionTradeId?: string // Trade ID waiting for post-bet emotion
  demographicsComplete?: boolean // Track if user completed demographics for XP bonus
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

export interface SurveyData {
  name: string
  email: string
  userType: "sports-bettor" | "day-trader" | "both"
  experience: "beginner" | "intermediate" | "advanced"
  primaryGoal: string
  weeklyActivity: string
  referralSource: string
  referralOther?: string
  // Optional demographics
  ageRange?: string
  region?: string
  occupation?: string
  completedAt?: string
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

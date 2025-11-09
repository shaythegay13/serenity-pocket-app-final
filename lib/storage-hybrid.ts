import { supabase } from "./supabase"
import { database } from "./database"
import type { UserData, EmotionLog, Trade, Achievement, BiasProfile, BiasQuizHistory, Challenge } from "./types"
import { migrateChallengeTerminology } from "./migrate-challenges"

const STORAGE_KEYS = {
  USER_DATA: "serenity_user_data",
  EMOTION_LOGS: "serenity_emotion_logs",
  TRADES: "serenity_trades",
  BIAS_PROFILE: "serenity_bias_profile",
  BIAS_HISTORY: "serenity_bias_history",
  ACHIEVEMENTS: "serenity_achievements",
  CHALLENGES: "serenity_challenges",
  LAST_CHECK_IN: "serenity_last_check_in",
}

// Hybrid storage that uses Supabase for authenticated users and localStorage as fallback
export const storageHybrid = {
  // Get current user ID
  async getCurrentUserId(): Promise<string | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user?.id || null
  },

  // User Data Operations
  async getUserData(): Promise<UserData> {
    const userId = await this.getCurrentUserId()
    
    if (userId) {
      // Try to fetch from database
      let userData = await database.getUserProfile(userId)
      
      if (!userData) {
        // Create new profile if doesn't exist
        const defaultData = getDefaultUserData()
        await database.createUserProfile(userId, defaultData)
        userData = defaultData
      }
      
      return userData
    }
    
    // Fallback to localStorage
    if (typeof window === "undefined") return getDefaultUserData()
    const data = localStorage.getItem(STORAGE_KEYS.USER_DATA)
    return data ? JSON.parse(data) : getDefaultUserData()
  },

  async setUserData(data: UserData): Promise<void> {
    const userId = await this.getCurrentUserId()
    
    if (userId) {
      await database.updateUserProfile(userId, data)
    }
    
    // Also save to localStorage as cache
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data))
    }
  },

  // Emotion Logs Operations
  async getEmotionLogs(): Promise<EmotionLog[]> {
    const userId = await this.getCurrentUserId()
    
    if (userId) {
      return await database.getEmotionLogs(userId)
    }
    
    // Fallback to localStorage
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(STORAGE_KEYS.EMOTION_LOGS)
    return data ? JSON.parse(data) : []
  },

  async addEmotionLog(log: EmotionLog): Promise<void> {
    const userId = await this.getCurrentUserId()
    
    if (userId) {
      await database.addEmotionLog(userId, log)
    }
    
    // Also save to localStorage
    if (typeof window !== "undefined") {
      const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.EMOTION_LOGS) || "[]")
      logs.push(log)
      localStorage.setItem(STORAGE_KEYS.EMOTION_LOGS, JSON.stringify(logs))
    }
  },

  // Trades Operations
  async getTrades(): Promise<Trade[]> {
    const userId = await this.getCurrentUserId()
    
    if (userId) {
      return await database.getTrades(userId)
    }
    
    // Fallback to localStorage
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(STORAGE_KEYS.TRADES)
    return data ? JSON.parse(data) : []
  },

  async addTrade(trade: Trade): Promise<void> {
    const userId = await this.getCurrentUserId()
    
    if (userId) {
      await database.addTrade(userId, trade)
    }
    
    // Also save to localStorage
    if (typeof window !== "undefined") {
      const trades = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRADES) || "[]")
      trades.push(trade)
      localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify(trades))
    }
  },

  async updateTrade(tradeId: string, updates: Partial<Trade>): Promise<void> {
    const userId = await this.getCurrentUserId()
    
    // Try to update in database if user is logged in
    if (userId) {
      try {
        await database.updateTrade(userId, tradeId, updates)
      } catch (error) {
        // If database update fails (e.g., trade not synced yet), continue with localStorage
        console.warn("Database update failed, updating localStorage only:", error)
      }
    }
    
    // Always update localStorage
    if (typeof window !== "undefined") {
      const trades = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRADES) || "[]")
      const index = trades.findIndex((t: Trade) => t.id === tradeId)
      if (index !== -1) {
        trades[index] = { ...trades[index], ...updates }
        localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify(trades))
      }
    }
  },

  // Bias Profile Operations
  async getBiasProfile(): Promise<BiasProfile> {
    const userId = await this.getCurrentUserId()
    
    if (userId) {
      let profile = await database.getBiasProfile(userId)
      if (!profile) {
        profile = getDefaultBiasProfile()
        await database.upsertBiasProfile(userId, profile)
      }
      return profile
    }
    
    // Fallback to localStorage
    if (typeof window === "undefined") return getDefaultBiasProfile()
    const data = localStorage.getItem(STORAGE_KEYS.BIAS_PROFILE)
    return data ? JSON.parse(data) : getDefaultBiasProfile()
  },

  async setBiasProfile(profile: BiasProfile): Promise<void> {
    const userId = await this.getCurrentUserId()
    
    // Try to save to database if user is logged in
    if (userId) {
      try {
        await database.upsertBiasProfile(userId, profile)
      } catch (error) {
        // If database save fails, continue with localStorage
        console.warn("Database save failed, using localStorage only:", error)
      }
    }
    
    // Always save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.BIAS_PROFILE, JSON.stringify(profile))
    }
    
    // Save to history
    await this.addBiasQuizHistory(profile)
  },

  async getBiasQuizHistory(): Promise<BiasQuizHistory[]> {
    const userId = await this.getCurrentUserId()
    
    if (userId) {
      return await database.getBiasQuizHistory(userId)
    }
    
    // Fallback to localStorage for non-authenticated users
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(STORAGE_KEYS.BIAS_HISTORY)
    return data ? JSON.parse(data) : []
  },

  async addBiasQuizHistory(profile: BiasProfile): Promise<void> {
    const userId = await this.getCurrentUserId()
    
    // Save to database if user is logged in
    if (userId) {
      try {
        await database.addBiasQuizHistory(userId, profile)
      } catch (error) {
        console.warn("Failed to save bias history to database:", error)
        // Continue to save locally as fallback
      }
    }
    
    // Also save to localStorage as backup
    if (typeof window !== "undefined") {
      const history = await this.getBiasQuizHistory()
      const avgScore = Object.values(profile).reduce((a, b) => a + b, 0) / 6
      
      const newEntry: BiasQuizHistory = {
        id: Date.now().toString(),
        timestamp: new Date(),
        profile,
        averageScore: Math.round(avgScore)
      }
      
      history.push(newEntry)
      const trimmedHistory = history.slice(-20)
      localStorage.setItem(STORAGE_KEYS.BIAS_HISTORY, JSON.stringify(trimmedHistory))
    }
  },

  // Achievements Operations
  async getAchievements(): Promise<Achievement[]> {
    const userId = await this.getCurrentUserId()
    
    if (userId) {
      const achievements = await database.getAchievements(userId)
      if (achievements.length === 0) {
        const defaultAchievements = getDefaultAchievements()
        await database.upsertAchievements(userId, defaultAchievements)
        return defaultAchievements
      }
      return achievements
    }
    
    // Fallback to localStorage
    if (typeof window === "undefined") return getDefaultAchievements()
    const data = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS)
    return data ? JSON.parse(data) : getDefaultAchievements()
  },

  async setAchievements(achievements: Achievement[]): Promise<void> {
    const userId = await this.getCurrentUserId()
    
    if (userId) {
      await database.upsertAchievements(userId, achievements)
    }
    
    // Also save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achievements))
    }
  },

  // Challenges Operations
  async getChallenges(): Promise<Challenge[]> {
    const userId = await this.getCurrentUserId()
    
    if (userId) {
      let challenges = await database.getChallenges(userId)
      if (challenges.length === 0) {
        const defaultChallenges = getDefaultChallenges()
        await database.upsertChallenges(userId, defaultChallenges)
        return defaultChallenges
      }
      // Migrate existing challenges to update terminology
      challenges = migrateChallengeTerminology(challenges)
      await database.upsertChallenges(userId, challenges)
      return challenges
    }
    
    // Fallback to localStorage
    if (typeof window === "undefined") return getDefaultChallenges()
    const data = localStorage.getItem(STORAGE_KEYS.CHALLENGES)
    let challenges = data ? JSON.parse(data) : getDefaultChallenges()
    // Migrate existing challenges
    challenges = migrateChallengeTerminology(challenges)
    localStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(challenges))
    return challenges
  },

  async setChallenges(challenges: Challenge[]): Promise<void> {
    const userId = await this.getCurrentUserId()
    
    if (userId) {
      await database.upsertChallenges(userId, challenges)
    }
    
    // Also save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(challenges))
    }
  },

  // Last Check-in Operations
  async getLastCheckIn(): Promise<Date | null> {
    const userId = await this.getCurrentUserId()
    
    if (userId) {
      const userData = await database.getUserProfile(userId)
      return userData?.lastRingReset || null
    }
    
    // Fallback to localStorage
    if (typeof window === "undefined") return null
    const data = localStorage.getItem(STORAGE_KEYS.LAST_CHECK_IN)
    return data ? new Date(data) : null
  },

  async setLastCheckIn(date: Date): Promise<void> {
    const userId = await this.getCurrentUserId()
    
    if (userId) {
      await database.setLastCheckIn(userId, date)
    }
    
    // Also save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.LAST_CHECK_IN, date.toISOString())
    }
  },
}

// Default data generators
function getDefaultUserData(): UserData {
  return {
    name: "Trader",
    level: 1,
    xp: 0,
    xpToNextLevel: 500,
    emotionalAwarenessStreak: 0,
    biasRecognitionScore: 0,
    mindfulDecisionPercentage: 0,
    totalTrades: 0,
    mindfulTrades: 0,
    serenityTokens: 0,
    dailyRings: {
      emotionalAwareness: 0,
      biasRecognition: 0,
      mindfulness: 0,
    },
    lastRingReset: new Date(),
    perfectDays: 0,
    longestStreak: 0,
    totalEmotionsLogged: 0,
    totalBiasesIdentified: 0,
    totalJournalsCompleted: 0,
    totalModulesCompleted: 0,
    totalBreathingExercises: 0,
    mostProductiveDay: 0,
  }
}

function getDefaultBiasProfile(): BiasProfile {
  return {
    confirmationBias: 50,
    lossAversion: 50,
    anchoringBias: 50,
    recencyBias: 50,
    overconfidenceBias: 50,
    herdMentality: 50,
  }
}

function getDefaultAchievements(): Achievement[] {
  return [
    // Streak Badges
    {
      id: "7-day-streak",
      name: "7-Day Mindfulness Streak",
      description: "Log emotions for 7 consecutive days",
      icon: "🔥",
      unlocked: false,
      progress: 0,
      maxProgress: 7,
      category: "streak",
    },
    {
      id: "30-day-streak",
      name: "30-Day Emotion Logger",
      description: "Maintain a 30-day emotion tracking streak",
      icon: "⭐",
      unlocked: false,
      progress: 0,
      maxProgress: 30,
      category: "streak",
    },
    {
      id: "60-day-streak",
      name: "60-Day Dedication",
      description: "Keep your streak alive for 60 days",
      icon: "💎",
      unlocked: false,
      progress: 0,
      maxProgress: 60,
      category: "streak",
    },
    {
      id: "100-day-streak",
      name: "100-Day Zen Master",
      description: "Achieve 100 consecutive days of practice",
      icon: "🏆",
      unlocked: false,
      progress: 0,
      maxProgress: 100,
      category: "streak",
    },

    // Bias Buster Badges
    {
      id: "anchoring-awareness",
      name: "Anchoring Awareness",
      description: "Identify anchoring bias 10 times",
      icon: "⚓",
      unlocked: false,
      progress: 0,
      maxProgress: 10,
      category: "bias-buster",
    },
    {
      id: "fomo-fighter",
      name: "FOMO Fighter",
      description: "Resist impulsive FOMO decisions 5 times",
      icon: "🛡️",
      unlocked: false,
      progress: 0,
      maxProgress: 5,
      category: "bias-buster",
    },
    {
      id: "loss-aversion-victor",
      name: "Loss Aversion Victor",
      description: "Recognize loss aversion bias 15 times",
      icon: "💪",
      unlocked: false,
      progress: 0,
      maxProgress: 15,
      category: "bias-buster",
    },
    {
      id: "confirmation-crusher",
      name: "Confirmation Bias Crusher",
      description: "Catch confirmation bias 20 times",
      icon: "🎯",
      unlocked: false,
      progress: 0,
      maxProgress: 20,
      category: "bias-buster",
    },
    {
      id: "recency-defender",
      name: "Recency Bias Defender",
      description: "Identify recency bias 10 times",
      icon: "🔍",
      unlocked: false,
      progress: 0,
      maxProgress: 10,
      category: "bias-buster",
    },

    // Behavior Change Badges
    {
      id: "pause-champion",
      name: "Pause Champion",
      description: "Use the pause feature 50 times",
      icon: "⏸️",
      unlocked: false,
      progress: 0,
      maxProgress: 50,
      category: "behavior-change",
    },
    {
      id: "reflection-master",
      name: "Reflection Master",
      description: "Complete 25 detailed decision journals",
      icon: "📝",
      unlocked: false,
      progress: 0,
      maxProgress: 25,
      category: "behavior-change",
    },
    {
      id: "pattern-breaker",
      name: "Pattern Breaker",
      description: "Avoid emotional trading 5 times",
      icon: "⚡",
      unlocked: false,
      progress: 0,
      maxProgress: 5,
      category: "behavior-change",
    },
    {
      id: "cool-head",
      name: "Cool Head Award",
      description: "Use breathing exercises 10 times during volatility",
      icon: "🧘",
      unlocked: false,
      progress: 0,
      maxProgress: 10,
      category: "behavior-change",
    },

    // Learning Badges
    {
      id: "knowledge-seeker",
      name: "Knowledge Seeker",
      description: "Complete 5 educational modules",
      icon: "📚",
      unlocked: false,
      progress: 0,
      maxProgress: 5,
      category: "learning",
    },
    {
      id: "behavioral-scholar",
      name: "Behavioral Scholar",
      description: "Finish 15 educational modules",
      icon: "🎓",
      unlocked: false,
      progress: 0,
      maxProgress: 15,
      category: "learning",
    },
    {
      id: "psychology-master",
      name: "Psychology Master",
      description: "Complete all available educational content",
      icon: "🧠",
      unlocked: false,
      progress: 0,
      maxProgress: 30,
      category: "learning",
    },
  ]
}

function getDefaultChallenges(): Challenge[] {
  const today = new Date()
  const weekEnd = new Date(today)
  weekEnd.setDate(today.getDate() + (7 - today.getDay()))

  return [
    {
      id: "pause-challenge",
      title: "Pause Before Betting",
      description: "Take a 3-second pause before 5 bets this week",
      progress: 0,
      maxProgress: 5,
      xpReward: 50,
      expiresAt: weekEnd,
    },
    {
      id: "emotion-log-challenge",
      title: "Daily Emotion Check",
      description: "Log your emotions 7 days in a row",
      progress: 0,
      maxProgress: 7,
      xpReward: 75,
      expiresAt: weekEnd,
    },
  ]
}

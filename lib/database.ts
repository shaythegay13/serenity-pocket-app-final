import { supabase } from "./supabase"
import type { UserData, EmotionLog, Trade, BiasProfile, Achievement, Challenge } from "./types"

// Database service layer for Supabase operations
export const database = {
  // User Profile Operations
  async getUserProfile(userId: string): Promise<UserData | null> {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single()

      if (error) {
        if (error.code === "PGRST116") return null // No rows returned
        throw error
      }

      return data ? mapDbToUserData(data) : null
    } catch (error) {
      console.error("Error fetching user profile:", error)
      return null
    }
  },

  async createUserProfile(userId: string, userData: Partial<UserData>): Promise<void> {
    try {
      const { error } = await supabase.from("user_profiles").insert({
        id: userId,
        name: userData.name || "Trader",
        level: userData.level || 1,
        xp: userData.xp || 0,
        xp_to_next_level: userData.xpToNextLevel || 500,
        emotional_awareness_streak: userData.emotionalAwarenessStreak || 0,
        bias_recognition_score: userData.biasRecognitionScore || 0,
        mindful_decision_percentage: userData.mindfulDecisionPercentage || 0,
        total_trades: userData.totalTrades || 0,
        mindful_trades: userData.mindfulTrades || 0,
        serenity_tokens: userData.serenityTokens || 0,
        daily_rings: userData.dailyRings || { emotionalAwareness: 0, biasRecognition: 0, mindfulness: 0 },
        last_ring_reset: userData.lastRingReset || new Date().toISOString(),
        perfect_days: userData.perfectDays || 0,
        longest_streak: userData.longestStreak || 0,
        total_emotions_logged: userData.totalEmotionsLogged || 0,
        total_biases_identified: userData.totalBiasesIdentified || 0,
        total_journals_completed: userData.totalJournalsCompleted || 0,
        total_modules_completed: userData.totalModulesCompleted || 0,
        total_breathing_exercises: userData.totalBreathingExercises || 0,
        most_productive_day: userData.mostProductiveDay || 0,
      })

      if (error) throw error
    } catch (error) {
      console.error("Error creating user profile:", error)
      throw error
    }
  },

  async updateUserProfile(userId: string, updates: Partial<UserData>): Promise<void> {
    try {
      const dbUpdates: any = {}
      
      if (updates.name !== undefined) dbUpdates.name = updates.name
      if (updates.level !== undefined) dbUpdates.level = updates.level
      if (updates.xp !== undefined) dbUpdates.xp = updates.xp
      if (updates.xpToNextLevel !== undefined) dbUpdates.xp_to_next_level = updates.xpToNextLevel
      if (updates.emotionalAwarenessStreak !== undefined) dbUpdates.emotional_awareness_streak = updates.emotionalAwarenessStreak
      if (updates.biasRecognitionScore !== undefined) dbUpdates.bias_recognition_score = updates.biasRecognitionScore
      if (updates.mindfulDecisionPercentage !== undefined) dbUpdates.mindful_decision_percentage = updates.mindfulDecisionPercentage
      if (updates.totalTrades !== undefined) dbUpdates.total_trades = updates.totalTrades
      if (updates.mindfulTrades !== undefined) dbUpdates.mindful_trades = updates.mindfulTrades
      if (updates.serenityTokens !== undefined) dbUpdates.serenity_tokens = updates.serenityTokens
      if (updates.dailyRings !== undefined) dbUpdates.daily_rings = updates.dailyRings
      if (updates.lastRingReset !== undefined) dbUpdates.last_ring_reset = updates.lastRingReset
      if (updates.perfectDays !== undefined) dbUpdates.perfect_days = updates.perfectDays
      if (updates.longestStreak !== undefined) dbUpdates.longest_streak = updates.longestStreak
      if (updates.totalEmotionsLogged !== undefined) dbUpdates.total_emotions_logged = updates.totalEmotionsLogged
      if (updates.totalBiasesIdentified !== undefined) dbUpdates.total_biases_identified = updates.totalBiasesIdentified
      if (updates.totalJournalsCompleted !== undefined) dbUpdates.total_journals_completed = updates.totalJournalsCompleted
      if (updates.totalModulesCompleted !== undefined) dbUpdates.total_modules_completed = updates.totalModulesCompleted
      if (updates.totalBreathingExercises !== undefined) dbUpdates.total_breathing_exercises = updates.totalBreathingExercises
      if (updates.mostProductiveDay !== undefined) dbUpdates.most_productive_day = updates.mostProductiveDay

      const { error } = await supabase
        .from("user_profiles")
        .update(dbUpdates)
        .eq("id", userId)

      if (error) throw error
    } catch (error) {
      console.error("Error updating user profile:", error)
      throw error
    }
  },

  async setLastCheckIn(userId: string, date: Date): Promise<void> {
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({ last_check_in: date.toISOString() })
        .eq("id", userId)

      if (error) throw error
    } catch (error) {
      console.error("Error setting last check-in:", error)
    }
  },

  // Emotion Logs Operations
  async getEmotionLogs(userId: string): Promise<EmotionLog[]> {
    try {
      const { data, error } = await supabase
        .from("emotion_logs")
        .select("*")
        .eq("user_id", userId)
        .order("timestamp", { ascending: false })

      if (error) throw error

      return (data || []).map(mapDbToEmotionLog)
    } catch (error) {
      console.error("Error fetching emotion logs:", error)
      return []
    }
  },

  async addEmotionLog(userId: string, log: Omit<EmotionLog, "id">): Promise<void> {
    try {
      const { error } = await supabase.from("emotion_logs").insert({
        user_id: userId,
        emotion: log.emotion,
        intensity: log.intensity,
        notes: log.context || "",
        timestamp: log.timestamp,
      })

      if (error) throw error
    } catch (error) {
      console.error("Error adding emotion log:", error)
      throw error
    }
  },

  // Trades Operations
  async getTrades(userId: string): Promise<Trade[]> {
    try {
      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", userId)
        .order("timestamp", { ascending: false })

      if (error) throw error

      return (data || []).map(mapDbToTrade)
    } catch (error) {
      console.error("Error fetching trades:", error)
      return []
    }
  },

  async addTrade(userId: string, trade: Omit<Trade, "id">): Promise<void> {
    try {
      const { error } = await supabase.from("trades").insert({
        user_id: userId,
        asset: "",
        type: "long",
        entry_price: 0,
        position_size: 0,
        pre_trade_emotion: trade.preTradeEmotion || "",
        pre_trade_confidence: trade.confidenceLevel || 0,
        pre_trade_notes: trade.reasoning || "",
        biases_identified: trade.biasesIdentified || [],
        outcome: trade.outcome,
        post_trade_emotion: trade.postTradeEmotion,
        post_trade_notes: trade.reflection,
        timestamp: trade.timestamp,
      })

      if (error) throw error
    } catch (error) {
      console.error("Error adding trade:", error)
      throw error
    }
  },

  async updateTrade(userId: string, tradeId: string, updates: Partial<Trade>): Promise<void> {
    try {
      const dbUpdates: any = {}
      
      if (updates.outcome !== undefined) dbUpdates.outcome = updates.outcome
      if (updates.postTradeEmotion !== undefined) dbUpdates.post_trade_emotion = updates.postTradeEmotion
      if (updates.postTradeIntensity !== undefined) dbUpdates.post_trade_intensity = updates.postTradeIntensity
      if (updates.reflection !== undefined) dbUpdates.post_trade_notes = updates.reflection
      if (updates.emotionalImpact !== undefined) dbUpdates.emotional_impact = updates.emotionalImpact

      const { error } = await supabase
        .from("trades")
        .update(dbUpdates)
        .eq("id", tradeId)
        .eq("user_id", userId)

      if (error) throw error
    } catch (error) {
      console.error("Error updating trade:", error)
      throw error
    }
  },

  // Achievements Operations
  async getAchievements(userId: string): Promise<Achievement[]> {
    try {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .eq("user_id", userId)

      if (error) throw error

      return (data || []).map(mapDbToAchievement)
    } catch (error) {
      console.error("Error fetching achievements:", error)
      return []
    }
  },

  async upsertAchievements(userId: string, achievements: Achievement[]): Promise<void> {
    try {
      const dbAchievements = achievements.map((a) => ({
        id: a.id,
        user_id: userId,
        name: a.name,
        description: a.description,
        icon: a.icon,
        unlocked: a.unlocked,
        progress: a.progress,
        max_progress: a.maxProgress,
        category: a.category,
        unlocked_at: a.unlockedAt,
      }))

      const { error } = await supabase
        .from("achievements")
        .upsert(dbAchievements, { onConflict: "user_id,id" })

      if (error) throw error
    } catch (error) {
      console.error("Error upserting achievements:", error)
      throw error
    }
  },

  // Bias Profile Operations
  async getBiasProfile(userId: string): Promise<BiasProfile | null> {
    try {
      const { data, error } = await supabase
        .from("bias_profiles")
        .select("*")
        .eq("user_id", userId)
        .single()

      if (error) {
        if (error.code === "PGRST116") return null
        throw error
      }

      return data ? mapDbToBiasProfile(data) : null
    } catch (error) {
      console.error("Error fetching bias profile:", error)
      return null
    }
  },

  async upsertBiasProfile(userId: string, profile: BiasProfile): Promise<void> {
    try {
      const { error } = await supabase.from("bias_profiles").upsert({
        user_id: userId,
        confirmation_bias: profile.confirmationBias,
        loss_aversion: profile.lossAversion,
        anchoring_bias: profile.anchoringBias,
        recency_bias: profile.recencyBias,
        overconfidence_bias: profile.overconfidenceBias,
        herd_mentality: profile.herdMentality,
      })

      if (error) throw error
    } catch (error) {
      console.error("Error upserting bias profile:", error)
      throw error
    }
  },

  // Challenges Operations
  async getChallenges(userId: string): Promise<Challenge[]> {
    try {
      const { data, error } = await supabase
        .from("challenges")
        .select("*")
        .eq("user_id", userId)

      if (error) throw error

      return (data || []).map(mapDbToChallenge)
    } catch (error) {
      console.error("Error fetching challenges:", error)
      return []
    }
  },

  async upsertChallenges(userId: string, challenges: Challenge[]): Promise<void> {
    try {
      const dbChallenges = challenges.map((c) => ({
        id: c.id,
        user_id: userId,
        title: c.title,
        description: c.description,
        progress: c.progress,
        max_progress: c.maxProgress,
        xp_reward: c.xpReward,
        expires_at: c.expiresAt,
      }))

      const { error } = await supabase
        .from("challenges")
        .upsert(dbChallenges, { onConflict: "user_id,id" })

      if (error) throw error
    } catch (error) {
      console.error("Error upserting challenges:", error)
      throw error
    }
  },
}

// Mapping functions to convert between database and application models
function mapDbToUserData(dbData: any): UserData {
  return {
    name: dbData.name,
    level: dbData.level,
    xp: dbData.xp,
    xpToNextLevel: dbData.xp_to_next_level,
    emotionalAwarenessStreak: dbData.emotional_awareness_streak,
    biasRecognitionScore: dbData.bias_recognition_score,
    mindfulDecisionPercentage: dbData.mindful_decision_percentage,
    totalTrades: dbData.total_trades,
    mindfulTrades: dbData.mindful_trades,
    serenityTokens: dbData.serenity_tokens,
    dailyRings: dbData.daily_rings,
    lastRingReset: new Date(dbData.last_ring_reset),
    perfectDays: dbData.perfect_days,
    longestStreak: dbData.longest_streak,
    totalEmotionsLogged: dbData.total_emotions_logged,
    totalBiasesIdentified: dbData.total_biases_identified,
    totalJournalsCompleted: dbData.total_journals_completed,
    totalModulesCompleted: dbData.total_modules_completed,
    totalBreathingExercises: dbData.total_breathing_exercises,
    mostProductiveDay: dbData.most_productive_day,
  }
}

function mapDbToEmotionLog(dbData: any): EmotionLog {
  return {
    id: dbData.id,
    emotion: dbData.emotion,
    intensity: dbData.intensity,
    context: dbData.notes || "",
    phase: "before" as const,
    timestamp: new Date(dbData.timestamp),
  }
}

function mapDbToTrade(dbData: any): Trade {
  return {
    id: dbData.id,
    timestamp: new Date(dbData.timestamp),
    preTradeEmotion: dbData.pre_trade_emotion || "",
    preTradeIntensity: dbData.pre_trade_intensity || 0,
    biasesIdentified: dbData.biases_identified || [],
    confidenceLevel: dbData.pre_trade_confidence || 0,
    reasoning: dbData.pre_trade_notes || "",
    outcome: dbData.outcome,
    postTradeEmotion: dbData.post_trade_emotion,
    postTradeIntensity: dbData.post_trade_intensity,
    reflection: dbData.post_trade_notes,
    emotionalImpact: dbData.emotional_impact,
  }
}

function mapDbToAchievement(dbData: any): Achievement {
  return {
    id: dbData.id,
    name: dbData.name,
    description: dbData.description,
    icon: dbData.icon,
    unlocked: dbData.unlocked,
    progress: dbData.progress,
    maxProgress: dbData.max_progress,
    category: dbData.category,
    unlockedAt: dbData.unlocked_at,
  }
}

function mapDbToBiasProfile(dbData: any): BiasProfile {
  return {
    confirmationBias: dbData.confirmation_bias,
    lossAversion: dbData.loss_aversion,
    anchoringBias: dbData.anchoring_bias,
    recencyBias: dbData.recency_bias,
    overconfidenceBias: dbData.overconfidence_bias,
    herdMentality: dbData.herd_mentality,
  }
}

function mapDbToChallenge(dbData: any): Challenge {
  return {
    id: dbData.id,
    title: dbData.title,
    description: dbData.description,
    progress: dbData.progress,
    maxProgress: dbData.max_progress,
    xpReward: dbData.xp_reward,
    expiresAt: new Date(dbData.expires_at),
  }
}

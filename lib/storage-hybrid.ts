import { supabase } from "./supabase"
import type {
  UserData,
  EmotionLog,
  Trade,
  Achievement,
  BiasProfile,
  BiasQuizHistory,
  Challenge,
  BetAnalysis,
  GameLineRecord,
} from "./types"

const STORAGE_KEYS = {
  USER_DATA: "serenity_user_data",
  EMOTION_LOGS: "serenity_emotion_logs",
  TRADES: "serenity_trades",
  BIAS_PROFILE: "serenity_bias_profile",
  BIAS_HISTORY: "serenity_bias_history",
  ACHIEVEMENTS: "serenity_achievements",
  CHALLENGES: "serenity_challenges",
  LAST_CHECK_IN: "serenity_last_check_in",
  BET_ANALYSES: "serenity_bet_analyses",
  GAME_LINES: "serenity_game_lines",
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

  // Bet Analyses Operations
  async getBetAnalyses(): Promise<BetAnalysis[]> {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(STORAGE_KEYS.BET_ANALYSES)
    return data ? JSON.parse(data) : []
  },

  async addBetAnalysis(bet: BetAnalysis): Promise<void> {
    if (typeof window === "undefined") return
    const data = localStorage.getItem(STORAGE_KEYS.BET_ANALYSES)
    const list: BetAnalysis[] = data ? JSON.parse(data) : []
    list.push(bet)
    localStorage.setItem(STORAGE_KEYS.BET_ANALYSES, JSON.stringify(list))
  },

  async updateBetAnalysis(updated: BetAnalysis): Promise<void> {
    if (typeof window === "undefined") return
    const data = localStorage.getItem(STORAGE_KEYS.BET_ANALYSES)
    const list: BetAnalysis[] = data ? JSON.parse(data) : []
    const idx = list.findIndex(b => b.id === updated.id)
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updated }
      localStorage.setItem(STORAGE_KEYS.BET_ANALYSES, JSON.stringify(list))
    }
  },

  // Game Line / Result History Operations
  // These mirror other hybrid methods: use Supabase when a user is logged in,
  // and fall back to localStorage for anonymous users or offline scenarios.

  async getGameLines(): Promise<GameLineRecord[]> {
    const userId = await this.getCurrentUserId()

    if (userId) {
      try {
        const { data, error } = await supabase
          .from("game_lines")
          .select("*")
          .eq("user_id", userId)
          .order("commence_time", { ascending: false })
          .limit(1000)

        if (error) {
          console.error("Error fetching game lines from Supabase:", error)
        } else if (data) {
          return data.map((row: any): GameLineRecord => ({
            id: row.id,
            sport: row.sport,
            league: row.league ?? undefined,
            homeTeam: row.home_team,
            awayTeam: row.away_team,
            commenceTime: row.commence_time,
            sportsbook: row.sportsbook ?? undefined,
            markets: Array.isArray(row.markets) ? row.markets : [],
            homeScore: row.home_score ?? undefined,
            awayScore: row.away_score ?? undefined,
            finalStatus: row.final_status ?? undefined,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          }))
        }
      } catch (err) {
        console.error("Exception fetching game lines from Supabase:", err)
      }
    }

    if (typeof window === "undefined") return []
    const data = localStorage.getItem(STORAGE_KEYS.GAME_LINES)
    return data ? (JSON.parse(data) as GameLineRecord[]) : []
  },

  async upsertGameLine(record: GameLineRecord): Promise<void> {
    const userId = await this.getCurrentUserId()

    if (userId) {
      try {
        const { error } = await supabase
          .from("game_lines")
          .upsert({
            id: record.id,
            user_id: userId,
            sport: record.sport,
            league: record.league ?? null,
            home_team: record.homeTeam,
            away_team: record.awayTeam,
            commence_time: record.commenceTime,
            sportsbook: record.sportsbook ?? null,
            markets: record.markets,
            home_score: record.homeScore ?? null,
            away_score: record.awayScore ?? null,
            final_status: record.finalStatus ?? null,
            created_at: record.createdAt,
            updated_at: record.updatedAt,
          })

        if (error) {
          console.error("Error upserting game line in Supabase:", error)
        }
      } catch (err) {
        console.error("Exception upserting game line in Supabase:", err)
      }
    }

    if (typeof window !== "undefined") {
      const raw = localStorage.getItem(STORAGE_KEYS.GAME_LINES)
      const list: GameLineRecord[] = raw ? JSON.parse(raw) : []
      const idx = list.findIndex(g => g.id === record.id)
      if (idx === -1) {
        list.push(record)
      } else {
        list[idx] = record
      }
      localStorage.setItem(STORAGE_KEYS.GAME_LINES, JSON.stringify(list))
    }
  },

  async bulkUpsertGameLines(records: GameLineRecord[]): Promise<void> {
    if (!records.length) return

    const userId = await this.getCurrentUserId()

    if (userId) {
      try {
        const payload = records.map(r => ({
          id: r.id,
          user_id: userId,
          sport: r.sport,
          league: r.league ?? null,
          home_team: r.homeTeam,
          away_team: r.awayTeam,
          commence_time: r.commenceTime,
          sportsbook: r.sportsbook ?? null,
          markets: r.markets,
          home_score: r.homeScore ?? null,
          away_score: r.awayScore ?? null,
          final_status: r.finalStatus ?? null,
          created_at: r.createdAt,
          updated_at: r.updatedAt,
        }))

        const { error } = await supabase.from("game_lines").upsert(payload)
        if (error) {
          console.error("Error bulk upserting game lines in Supabase:", error)
        }
      } catch (err) {
        console.error("Exception bulk upserting game lines in Supabase:", err)
      }
    }

    if (typeof window !== "undefined") {
      const raw = localStorage.getItem(STORAGE_KEYS.GAME_LINES)
      const existing: GameLineRecord[] = raw ? JSON.parse(raw) : []
      const map = new Map<string, GameLineRecord>()

      for (const r of existing) {
        map.set(r.id, r)
      }
      for (const r of records) {
        map.set(r.id, r)
      }

      localStorage.setItem(STORAGE_KEYS.GAME_LINES, JSON.stringify(Array.from(map.values())))
    }
  },

  // User Data Operations
  async getUserData(): Promise<UserData> {
    const userId = await this.getCurrentUserId()

    if (userId) {
      // Try to fetch from database
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle()

      if (!data) {
        // No profile row yet – create a minimal one so the rest of the app has a stable shape
        const defaultData = getDefaultUserData()
        const { error: insertError } = await supabase
          .from("user_profiles")
          .insert({
            id: userId,
            name: defaultData.name,
          })

        if (insertError) {
          console.error("Error creating user profile:", {
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint,
            code: insertError.code,
          })
        }

        return defaultData
      }

      if (error) {
        console.warn("Error fetching user profile, falling back to defaults:", {
          message: (error as any).message,
          details: (error as any).details,
          hint: (error as any).hint,
          code: (error as any).code,
        })
      }

      // Convert snake_case DB fields to camelCase
      const profile: UserData = {
        name: data.name,
        email: data.email,
        level: data.level,
        xp: data.xp,
        xpToNextLevel: data.xp_to_next_level,
        emotionalAwarenessStreak: data.emotional_awareness_streak,
        biasRecognitionScore: data.bias_recognition_score,
        mindfulDecisionPercentage: data.mindful_decision_percentage,
        totalTrades: data.total_trades,
        mindfulTrades: data.mindful_trades,
        serenityTokens: data.serenity_tokens,
        dailyRings: data.daily_rings,
        lastRingReset: new Date(data.last_ring_reset),
        perfectDays: data.perfect_days,
        longestStreak: data.longest_streak,
        totalEmotionsLogged: data.total_emotions_logged,
        totalBiasesIdentified: data.total_biases_identified,
        totalJournalsCompleted: data.total_journals_completed,
        totalModulesCompleted: data.total_modules_completed,
        totalBreathingExercises: data.total_breathing_exercises,
        mostProductiveDay: data.most_productive_day,
        subscriptionTier: data.subscription_tier || 'free',
        subscriptionStatus: data.subscription_status,
        subscriptionStartedAt: data.subscription_started_at,
        subscriptionEndsAt: data.subscription_ends_at,
        username: data.username,
        age: data.age,
        gender: data.gender,
        location: data.location,
        bettingExperience: data.betting_experience,
        educationLevel: data.education_level,
        incomeRange: data.income_range,
        employmentStatus: data.employment_status,
        maritalStatus: data.marital_status,
        ethnicity: data.ethnicity,
        bettingFrequency: data.betting_frequency,
        typicalBetAmount: data.typical_bet_amount,
      }

      // Merge local cached preferences (e.g., safety settings) if present
      if (typeof window !== 'undefined') {
        try {
          const cached = localStorage.getItem("serenity_user_data")
          if (cached) {
            const parsed = JSON.parse(cached) as Partial<UserData>
            if (parsed) {
              if (parsed.cooldownEnabled !== undefined) (profile as any).cooldownEnabled = parsed.cooldownEnabled
              if (parsed.behaviorNudgesEnabled !== undefined) (profile as any).behaviorNudgesEnabled = parsed.behaviorNudgesEnabled
              if (parsed.dailyBetLimit !== undefined) (profile as any).dailyBetLimit = parsed.dailyBetLimit as any
              if (parsed.maxStakeLimit !== undefined) (profile as any).maxStakeLimit = parsed.maxStakeLimit as any
            }
          }
        } catch {}
      }

      return profile
    }

    // Fallback to localStorage
    if (typeof window === "undefined") return getDefaultUserData()
    const data = localStorage.getItem(STORAGE_KEYS.USER_DATA)
    return data ? JSON.parse(data) : getDefaultUserData()
  },

  async setUserData(data: UserData): Promise<void> {
    try {
      const userId = await this.getCurrentUserId()

      if (!userId) {
        console.error('❌ No user ID found, cannot update profile')
        return
      }

      // Build a safe update payload limited to stable columns
      const updateData: any = {
        id: userId,
        name: data.name,
      }

      // Add email if present
      if (data.email !== undefined) {
        updateData.email = data.email || null
      }

      // Add subscription fields if present
      if (data.subscriptionTier !== undefined) {
        updateData.subscription_tier = data.subscriptionTier
      }
      if (data.subscriptionStatus !== undefined) {
        updateData.subscription_status = data.subscriptionStatus
      }
      if (data.subscriptionStartedAt !== undefined) {
        updateData.subscription_started_at = data.subscriptionStartedAt
      }
      if (data.subscriptionEndsAt !== undefined) {
        updateData.subscription_ends_at = data.subscriptionEndsAt
      }

      // Add profile and demographic fields if present
      // Convert empty strings to null for optional fields
      if (data.username !== undefined) {
        updateData.username = data.username || null
      }
      if (data.age !== undefined) {
        // Ensure age is either a valid number >= 18 or null
        updateData.age = (data.age && data.age >= 18) ? data.age : null
      }
      if (data.gender !== undefined) {
        updateData.gender = data.gender || null
      }
      if (data.location !== undefined) {
        updateData.location = data.location || null
      }
      if (data.bettingExperience !== undefined) {
        updateData.betting_experience = data.bettingExperience || null
      }
      if (data.educationLevel !== undefined) {
        updateData.education_level = data.educationLevel || null
      }
      if (data.incomeRange !== undefined) {
        updateData.income_range = data.incomeRange || null
      }
      if (data.employmentStatus !== undefined) {
        updateData.employment_status = data.employmentStatus || null
      }
      if (data.maritalStatus !== undefined) {
        updateData.marital_status = data.maritalStatus || null
      }
      if (data.ethnicity !== undefined) {
        updateData.ethnicity = data.ethnicity || null
      }
      if (data.bettingFrequency !== undefined) {
        updateData.betting_frequency = data.bettingFrequency || null
      }
      if (data.typicalBetAmount !== undefined) {
        updateData.typical_bet_amount = data.typicalBetAmount || null
      }

      console.log('📝 Attempting to update user profile with data:', updateData)
      
      const { data: result, error } = await supabase
        .from("user_profiles")
        .upsert(updateData)
        .select()

      if (error) {
        console.error("❌ Error updating user profile:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: error
        })
      } else {
        console.log('✅ User profile updated successfully:', result)
      }

      // Also save to localStorage as cache
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data))
      }
    } catch (err) {
      console.error('❌ Exception in setUserData:', err)
      throw err
    }
  },

  // Emotion Logs Operations
  async getEmotionLogs(): Promise<EmotionLog[]> {
    const userId = await this.getCurrentUserId()

    if (userId) {
      const { data, error } = await supabase
        .from("emotion_logs")
        .select("*")
        .eq("user_id", userId)
        .order("timestamp", { ascending: false })

      if (error) {
        console.error("Error fetching emotion logs:", error)
        return []
      }

      // Convert DB format to app format
      return (data || []).map(log => ({
        id: log.id,
        timestamp: new Date(log.timestamp),
        emotion: log.emotion,
        intensity: log.intensity,
        context: log.notes || "",
        phase: log.phase,
        tradeId: undefined, // Not stored in current schema
      }))
    }

    // Fallback to localStorage
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(STORAGE_KEYS.EMOTION_LOGS)
    return data ? JSON.parse(data) : []
  },

  async addEmotionLog(log: EmotionLog): Promise<void> {
    const userId = await this.getCurrentUserId()

    if (userId) {
      const { error } = await supabase
        .from("emotion_logs")
        .insert({
          user_id: userId,
          emotion: log.emotion,
          intensity: log.intensity,
          notes: log.context,
          phase: log.phase,
          timestamp: log.timestamp.toISOString(),
        })

      if (error) {
        console.error("Error adding emotion log:", error)
      }
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
      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", userId)
        .order("timestamp", { ascending: false })

      if (error) {
        console.error("Error fetching trades:", error)
        return []
      }

      // Convert DB format to app format
      return (data || []).map(trade => ({
        id: trade.id,
        timestamp: new Date(trade.timestamp),
        preTradeEmotion: trade.pre_trade_emotion || "",
        preTradeIntensity: trade.pre_trade_intensity || 3,
        biasesIdentified: trade.biases_identified || [],
        confidenceLevel: trade.pre_trade_confidence || 50,
        reasoning: trade.pre_trade_notes || "",
        outcome: trade.outcome,
        postTradeEmotion: trade.post_trade_emotion,
        postTradeIntensity: trade.post_trade_intensity,
        reflection: trade.post_trade_notes,
        emotionalImpact: trade.emotional_impact,
      }))
    }

    // Fallback to localStorage
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(STORAGE_KEYS.TRADES)
    return data ? JSON.parse(data) : []
  },

  async addTrade(trade: Trade): Promise<void> {
    const userId = await this.getCurrentUserId()

    if (userId) {
      // Generate a proper UUID for the database (don't use the timestamp-based ID)
      const { error } = await supabase
        .from("trades")
        .insert({
          // Let Supabase generate the UUID automatically by not including 'id'
          user_id: userId,
          asset: "Unknown", // Not in Trade type but required by schema
          type: "Unknown", // Not in Trade type but required by schema
          entry_price: 0, // Not in Trade type but required by schema
          position_size: 0, // Not in Trade type but required by schema
          pre_trade_emotion: trade.preTradeEmotion,
          pre_trade_intensity: trade.preTradeIntensity,
          pre_trade_confidence: trade.confidenceLevel,
          pre_trade_notes: trade.reasoning,
          biases_identified: trade.biasesIdentified,
          outcome: trade.outcome,
          post_trade_emotion: trade.postTradeEmotion,
          post_trade_intensity: trade.postTradeIntensity,
          post_trade_notes: trade.reflection,
          emotional_impact: trade.emotionalImpact,
          timestamp: trade.timestamp.toISOString(),
        })

      if (error) {
        console.error("Error adding trade:", error)
      }
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
        const dbUpdates: any = {}

        if (updates.preTradeEmotion !== undefined) dbUpdates.pre_trade_emotion = updates.preTradeEmotion
        if (updates.preTradeIntensity !== undefined) dbUpdates.pre_trade_intensity = updates.preTradeIntensity
        if (updates.biasesIdentified !== undefined) dbUpdates.biases_identified = updates.biasesIdentified
        if (updates.confidenceLevel !== undefined) dbUpdates.pre_trade_confidence = updates.confidenceLevel
        if (updates.reasoning !== undefined) dbUpdates.pre_trade_notes = updates.reasoning
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

        if (error) {
          console.warn("Database update failed, updating localStorage only:", error)
        }
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
      const { data, error } = await supabase
        .from("bias_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle()

      // If we found a profile, return it
      if (data) {
        return {
          confirmationBias: data.confirmation_bias,
          lossAversion: data.loss_aversion,
          anchoringBias: data.anchoring_bias,
          recencyBias: data.recency_bias,
          overconfidenceBias: data.overconfidence_bias,
          herdMentality: data.herd_mentality,
        }
      }

      // If no profile exists, create one using upsert (handles duplicates gracefully)
      const defaultProfile = getDefaultBiasProfile()
      const { error: upsertError } = await supabase
        .from("bias_profiles")
        .upsert({
          user_id: userId,
          confirmation_bias: defaultProfile.confirmationBias,
          loss_aversion: defaultProfile.lossAversion,
          anchoring_bias: defaultProfile.anchoringBias,
          recency_bias: defaultProfile.recencyBias,
          overconfidence_bias: defaultProfile.overconfidenceBias,
          herd_mentality: defaultProfile.herdMentality,
        }, {
          onConflict: 'user_id'
        })

      if (upsertError) {
        console.error("Error creating bias profile:", upsertError)
      }

      return defaultProfile
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
        const { error } = await supabase
          .from("bias_profiles")
          .upsert({
            user_id: userId,
            confirmation_bias: profile.confirmationBias,
            loss_aversion: profile.lossAversion,
            anchoring_bias: profile.anchoringBias,
            recency_bias: profile.recencyBias,
            overconfidence_bias: profile.overconfidenceBias,
            herd_mentality: profile.herdMentality,
          })

        if (error) {
          console.warn("Database save failed, using localStorage only:", error)
        }
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
      const { data, error } = await supabase
        .from("bias_quiz_history")
        .select("*")
        .eq("user_id", userId)
        .order("timestamp", { ascending: false })
        .limit(20)

      if (error) {
        console.error("Error fetching bias quiz history:", error)
        return []
      }

      return (data || []).map(entry => ({
        id: entry.id,
        timestamp: new Date(entry.timestamp),
        profile: {
          confirmationBias: entry.confirmation_bias,
          lossAversion: entry.loss_aversion,
          anchoringBias: entry.anchoring_bias,
          recencyBias: entry.recency_bias,
          overconfidenceBias: entry.overconfidence_bias,
          herdMentality: entry.herd_mentality,
        },
        averageScore: entry.average_score,
      }))
    }

    // Fallback to localStorage for non-authenticated users
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(STORAGE_KEYS.BIAS_HISTORY)
    return data ? JSON.parse(data) : []
  },

  async addBiasQuizHistory(profile: BiasProfile): Promise<void> {
    const userId = await this.getCurrentUserId()
    const avgScore = Object.values(profile).reduce((a, b) => a + b, 0) / 6

    // Save to database if user is logged in
    if (userId) {
      try {
        const { error } = await supabase
          .from("bias_quiz_history")
          .insert({
            user_id: userId,
            timestamp: new Date().toISOString(),
            confirmation_bias: profile.confirmationBias,
            loss_aversion: profile.lossAversion,
            anchoring_bias: profile.anchoringBias,
            recency_bias: profile.recencyBias,
            overconfidence_bias: profile.overconfidenceBias,
            herd_mentality: profile.herdMentality,
            average_score: Math.round(avgScore),
          })

        if (error) {
          console.warn("Failed to save bias history to database:", error)
          // Continue to save locally as fallback
        }
      } catch (error) {
        console.warn("Failed to save bias history to database:", error)
        // Continue to save locally as fallback
      }
    }

    // Also save to localStorage as backup
    if (typeof window !== "undefined") {
      const history = await this.getBiasQuizHistory()

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
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .eq("user_id", userId)

      if (error) {
        console.error("Error fetching achievements:", error)
        const defaultAchievements = getDefaultAchievements()

        // Try to create default achievements
        const { error: insertError } = await supabase
          .from("achievements")
          .insert(
            defaultAchievements.map(achievement => ({
              id: achievement.id,
              user_id: userId,
              name: achievement.name,
              description: achievement.description,
              icon: achievement.icon,
              progress: achievement.progress,
              max_progress: achievement.maxProgress,
              category: achievement.category,
              unlocked: achievement.unlocked,
              unlocked_at: achievement.unlockedAt?.toISOString(),
            }))
          )

        if (insertError) {
          console.error("Error creating achievements:", insertError)
        }

        return defaultAchievements
      }

      if (!data || data.length === 0) {
        const defaultAchievements = getDefaultAchievements()

        // Create default achievements
        const { error: insertError } = await supabase
          .from("achievements")
          .insert(
            defaultAchievements.map(achievement => ({
              id: achievement.id,
              user_id: userId,
              name: achievement.name,
              description: achievement.description,
              icon: achievement.icon,
              progress: achievement.progress,
              max_progress: achievement.maxProgress,
              category: achievement.category,
              unlocked: achievement.unlocked,
              unlocked_at: achievement.unlockedAt?.toISOString(),
            }))
          )

        if (insertError) {
          console.error("Error creating achievements:", insertError)
        }

        return defaultAchievements
      }

      return data.map(achievement => ({
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        unlocked: achievement.unlocked,
        unlockedAt: achievement.unlocked_at ? new Date(achievement.unlocked_at) : undefined,
        progress: achievement.progress,
        maxProgress: achievement.max_progress,
        category: achievement.category,
      }))
    }

    // Fallback to localStorage
    if (typeof window === "undefined") return getDefaultAchievements()
    const data = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS)
    return data ? JSON.parse(data) : getDefaultAchievements()
  },

  async setAchievements(achievements: Achievement[]): Promise<void> {
    const userId = await this.getCurrentUserId()

    if (userId) {
      const { error } = await supabase
        .from("achievements")
        .upsert(
          achievements.map(achievement => ({
            id: achievement.id,
            user_id: userId,
            name: achievement.name,
            description: achievement.description,
            icon: achievement.icon,
            progress: achievement.progress,
            max_progress: achievement.maxProgress,
            category: achievement.category,
            unlocked: achievement.unlocked,
            unlocked_at: achievement.unlockedAt?.toISOString(),
          }))
        )

      if (error) {
        console.error("Error updating achievements:", error)
      }
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
      const { data, error } = await supabase
        .from("challenges")
        .select("*")
        .eq("user_id", userId)

      if (error) {
        console.error("Error fetching challenges:", {
          message: (error as any).message,
          details: (error as any).details,
          hint: (error as any).hint,
          code: (error as any).code,
        })
        const defaultChallenges = getDefaultChallenges()

        // Try to create default challenges
        const { error: insertError } = await supabase
          .from("challenges")
          .insert(
            defaultChallenges.map(challenge => ({
              // Let the database generate the primary key ID to avoid type mismatches
              user_id: userId,
              title: challenge.title,
              description: challenge.description,
              progress: challenge.progress,
              max_progress: challenge.maxProgress,
              xp_reward: challenge.xpReward,
              expires_at: challenge.expiresAt.toISOString(),
            }))
          )

        if (insertError) {
          console.error("Error creating challenges:", {
            message: (insertError as any).message,
            details: (insertError as any).details,
            hint: (insertError as any).hint,
            code: (insertError as any).code,
          })
        }

        return defaultChallenges
      }

      if (!data || data.length === 0) {
        const defaultChallenges = getDefaultChallenges()

        // Create default challenges
        const { error: insertError } = await supabase
          .from("challenges")
          .insert(
            defaultChallenges.map(challenge => ({
              // Let the database generate the primary key ID to avoid type mismatches
              user_id: userId,
              title: challenge.title,
              description: challenge.description,
              progress: challenge.progress,
              max_progress: challenge.maxProgress,
              xp_reward: challenge.xpReward,
              expires_at: challenge.expiresAt.toISOString(),
            }))
          )

        if (insertError) {
          console.error("Error creating challenges:", {
            message: (insertError as any).message,
            details: (insertError as any).details,
            hint: (insertError as any).hint,
            code: (insertError as any).code,
          })
        }

        return defaultChallenges
      }

      // Note: Migration logic for challenge terminology has been applied.
      // If you need to re-apply migrations, add the logic here.
      const challenges = data.map(challenge => ({
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        progress: challenge.progress,
        maxProgress: challenge.max_progress,
        xpReward: challenge.xp_reward,
        expiresAt: new Date(challenge.expires_at),
      }))

      return challenges
    }

    // Fallback to localStorage
    if (typeof window === "undefined") return getDefaultChallenges()
    const data = localStorage.getItem(STORAGE_KEYS.CHALLENGES)
    const challenges = data ? JSON.parse(data) : getDefaultChallenges()
    // Note: Migration logic for challenge terminology has been applied.
    // If you need to re-apply migrations to localStorage, add the logic here.
    return challenges
  },

  async setChallenges(challenges: Challenge[]): Promise<void> {
    const userId = await this.getCurrentUserId()

    if (userId) {
      const { error } = await supabase
        .from("challenges")
        .upsert(
          challenges.map(challenge => ({
            id: challenge.id,
            user_id: userId,
            title: challenge.title,
            description: challenge.description,
            progress: challenge.progress,
            max_progress: challenge.maxProgress,
            xp_reward: challenge.xpReward,
            expires_at: challenge.expiresAt.toISOString(),
          }))
        )

      if (error) {
        console.error("Error updating challenges:", error)
      }
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
      const { data, error } = await supabase
        .from("user_profiles")
        .select("last_ring_reset")
        .eq("id", userId)
        .single()

      if (error || !data) {
        return null
      }

      return data.last_ring_reset ? new Date(data.last_ring_reset) : null
    }

    // Fallback to localStorage
    if (typeof window === "undefined") return null
    const data = localStorage.getItem(STORAGE_KEYS.LAST_CHECK_IN)
    return data ? new Date(data) : null
  },

  async setLastCheckIn(date: Date): Promise<void> {
    const userId = await this.getCurrentUserId()

    if (userId) {
      const { error } = await supabase
        .from("user_profiles")
        .update({ last_ring_reset: date.toISOString() })
        .eq("id", userId)

      if (error) {
        console.error("Error updating last check-in:", error)
      }
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

// Extend storageHybrid with bet analysis methods
// @ts-ignore - Adding methods dynamically
storageHybrid.addBetAnalysis = async function(analysis: BetAnalysis): Promise<void> {
  const userId = await this.getCurrentUserId()

  if (userId) {
    try {
      const { error } = await supabase
        .from("bet_analyses")
        .insert({
          user_id: userId,
          bet_type: analysis.betType,
          sport: analysis.sport,
          description: analysis.description,
          odds: analysis.odds,
          stake: analysis.stake,
          emotional_state: analysis.emotionalState,
          emotional_intensity: analysis.emotionalIntensity,
          bias_warnings: analysis.biasWarnings,
          ai_recommendation: analysis.aiRecommendation,
          expected_value: analysis.expectedValue,
          probability_estimate: analysis.probabilityEstimate,
          outcome: analysis.outcome,
          actual_return: analysis.actualReturn,
          timestamp: analysis.timestamp.toISOString(),
        })

      if (error) {
        console.error("Error saving bet analysis:", error)
      }
    } catch (error) {
      console.error("Error saving bet analysis:", error)
    }
  }

  // Also save to localStorage as backup
  if (typeof window !== "undefined") {
    const analyses = JSON.parse(localStorage.getItem("bet_analyses") || "[]")
    analyses.push(analysis)
    // Keep only last 50 analyses
    const trimmed = analyses.slice(-50)
    localStorage.setItem("bet_analyses", JSON.stringify(trimmed))
  }
}

// @ts-ignore - Adding methods dynamically
storageHybrid.updateBetAnalysis = async function(analysis: BetAnalysis): Promise<void> {
  const userId = await this.getCurrentUserId()

  if (userId && analysis.id) {
    try {
      const { error } = await supabase
        .from("bet_analyses")
        .update({
          outcome: analysis.outcome,
          actual_return: analysis.actualReturn,
        })
        .eq("id", analysis.id)
        .eq("user_id", userId)

      if (error) {
        console.error("Error updating bet analysis:", error)
      }
    } catch (error) {
      console.error("Error updating bet analysis:", error)
    }
  }

  // Also update in localStorage
  if (typeof window !== "undefined") {
    const analyses = JSON.parse(localStorage.getItem("bet_analyses") || "[]")
    const index = analyses.findIndex((a: BetAnalysis) => a.id === analysis.id)
    if (index !== -1) {
      analyses[index] = analysis
      localStorage.setItem("bet_analyses", JSON.stringify(analyses))
    }
  }
}

// @ts-ignore - Adding methods dynamically
storageHybrid.getBetAnalyses = async function(): Promise<BetAnalysis[]> {
  const userId = await this.getCurrentUserId()

  if (userId) {
    try {
      const { data, error } = await supabase
        .from("bet_analyses")
        .select("*")
        .eq("user_id", userId)
        .order("timestamp", { ascending: false })
        .limit(50)

      if (data && !error) {
        return data.map((row: any) => ({
          id: row.id,
          timestamp: new Date(row.timestamp),
          betType: row.bet_type,
          sport: row.sport,
          description: row.description,
          odds: row.odds,
          stake: row.stake,
          emotionalState: row.emotional_state,
          emotionalIntensity: row.emotional_intensity,
          biasWarnings: row.bias_warnings || [],
          aiRecommendation: row.ai_recommendation,
          expectedValue: row.expected_value,
          probabilityEstimate: row.probability_estimate,
          outcome: row.outcome,
          actualReturn: row.actual_return,
        }))
      }
    } catch (error) {
      console.error("Error fetching bet analyses:", error)
    }
  }

  // Fallback to localStorage
  if (typeof window !== "undefined") {
    const data = localStorage.getItem("bet_analyses")
    return data ? JSON.parse(data) : []
  }

  return []
}

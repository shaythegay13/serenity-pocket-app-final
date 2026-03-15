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
  AIServiceUsage,
} from "./types"
import type { ComprehensiveBet } from "./types/bet-tracking"
import type { Parlay } from "./types/ai-models"

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
  COMPREHENSIVE_BETS: "serenity_comprehensive_bets",
  GAME_LINES: "serenity_game_lines",
  AI_USAGE: "serenity_ai_service_usage",
  PARLAYS: "serenity_parlays",
}

// Hybrid storage that uses Supabase for authenticated users and localStorage as fallback
export const storageHybrid: {
  // Get current user ID
  getCurrentUserId(): Promise<string | null>

  // Bet Analyses Operations
  getBetAnalyses(): Promise<BetAnalysis[]>
  addBetAnalysis(bet: BetAnalysis): Promise<void>
  updateBetAnalysis(bet: BetAnalysis): Promise<void>

  // Comprehensive Bet Operations
  getComprehensiveBets(): Promise<ComprehensiveBet[]>
  addComprehensiveBet(bet: ComprehensiveBet): Promise<void>
  updateComprehensiveBet(updated: ComprehensiveBet): Promise<void>
  saveComprehensiveBets(bets: ComprehensiveBet[]): Promise<void>

  // Trade Operations
  getTrades(): Promise<Trade[]>
  addTrade(trade: Trade): Promise<void>
  updateTrade(tradeId: string, updates: Partial<Trade>): Promise<void>

  // Bias Profile Operations
  getBiasProfile(): Promise<BiasProfile | null>
  setBiasProfile(profile: BiasProfile): Promise<void>

  // Bias History Operations
  getBiasHistory(): Promise<BiasQuizHistory[]>
  addBiasHistory(history: BiasQuizHistory): Promise<void>
  getBiasQuizHistory(): Promise<BiasQuizHistory[]>
  addBiasQuizHistory(history: BiasQuizHistory): Promise<void>

  // Achievement Operations
  getAchievements(): Promise<Achievement[]>
  updateAchievements(achievements: Achievement[]): Promise<void>

  // Challenge Operations
  getChallenges(): Promise<Challenge[]>
  updateChallenges(challenges: Challenge[]): Promise<void>
  setChallenges(challenges: Challenge[]): Promise<void>

  // Emotion Log Operations
  getEmotionLogs(): Promise<EmotionLog[]>
  addEmotionLog(log: EmotionLog): Promise<void>

  // User Data Operations
  getUserData(): Promise<UserData | null>
  setUserData(data: UserData): Promise<void>

  // Game Lines Operations
  getGameLines(): Promise<GameLineRecord[]>
  setGameLines(lines: GameLineRecord[]): Promise<void>
  upsertGameLine(line: GameLineRecord): Promise<void>
  bulkUpsertGameLines(lines: GameLineRecord[]): Promise<void>

  // AI Service Usage Operations
  getAIServiceUsage(): Promise<AIServiceUsage[]>

  // Check-in Operations
  getLastCheckIn(): Promise<Date | null>
  setLastCheckIn(date: Date): Promise<void>

  // Daily Rings Operations
  updateDailyRingsForEmotion(): Promise<void>

  // Parlay Operations
  getParlays(): Promise<Parlay[]>
  addParlay(parlay: Parlay): Promise<void>
  updateParlay(parlay: Parlay): Promise<void>
  getParlayById(id: string): Promise<Parlay | null>
} = {
  // Get current user ID from cached session (fast, no network call)
  async getCurrentUserId(): Promise<string | null> {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session?.user?.id || null
  },

  // Bet Analyses Operations
  async getBetAnalyses(): Promise<BetAnalysis[]> {
    const userId = await this.getCurrentUserId()

    if (userId) {
      try {
        const { data, error } = await supabase
          .from("bet_analyses")
          .select("*")
          .eq("user_id", userId)
          .order("timestamp", { ascending: false })
          .limit(1000)

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
      const data = localStorage.getItem(STORAGE_KEYS.BET_ANALYSES)
      return data ? JSON.parse(data, (key, value) => {
        if (key === 'timestamp') return new Date(value)
        return value
      }) : []
    }

    return []
  },

  async addBetAnalysis(analysis: BetAnalysis): Promise<void> {
    const userId = await this.getCurrentUserId()

    console.log('addBetAnalysis: userId =', userId)

    if (userId) {
      try {
        // Helper to sanitize numeric values - NaN becomes null for nullable DECIMAL columns
        const sanitizeNumber = (val: any): number | null => {
          if (val === null || val === undefined) return null
          const num = typeof val === 'number' ? val : parseFloat(val)
          return isNaN(num) ? null : num
        }

        // Build payload with required fields, sanitizing all numeric values
        // NOTE: Do NOT include 'id' - database column is UUID type with auto-generation
        const payload: Record<string, any> = {
          // id is omitted - let database generate UUID with uuid_generate_v4()
          user_id: userId,
          bet_type: analysis.betType || 'straight',
          sport: analysis.sport || 'general',
          description: analysis.description || '',
          odds: sanitizeNumber(analysis.odds),
          stake: sanitizeNumber(analysis.stake),
          emotional_state: analysis.emotionalState || 'neutral',
          emotional_intensity: Math.round(analysis.emotionalIntensity ?? 5), // Must be INTEGER
          bias_warnings: analysis.biasWarnings || [], // PostgreSQL text[] array
          ai_recommendation: analysis.aiRecommendation || '',
          expected_value: sanitizeNumber(analysis.expectedValue),
          probability_estimate: sanitizeNumber(analysis.probabilityEstimate),
          outcome: analysis.outcome || 'pending',
          actual_return: sanitizeNumber(analysis.actualReturn),
          timestamp: analysis.timestamp.toISOString(),
        }

        // Include is_live_bet - column exists in schema
        if (typeof (analysis as any).isLiveBet === 'boolean') {
          payload.is_live_bet = (analysis as any).isLiveBet
        }

        console.log('addBetAnalysis: Attempting insert with payload:', JSON.stringify(payload, null, 2))
        console.log('addBetAnalysis: Full analysis object:', JSON.stringify(analysis, (key, value) =>
          value instanceof Date ? value.toISOString() : value
          , 2))

        const { data, error, status, statusText } = await supabase
          .from("bet_analyses")
          .insert(payload)
          .select()

        if (error) {
          // Log detailed error info - Supabase errors can have non-enumerable properties
          console.error("Error saving bet analysis to Supabase:", {
            status,
            statusText,
            errorString: String(error),
            errorJSON: JSON.stringify(error),
            code: error?.code,
            message: error?.message,
            details: error?.details,
            hint: error?.hint,
            // Try to get all properties including non-enumerable ones
            allProps: Object.getOwnPropertyNames(error).reduce((acc, key) => {
              acc[key] = (error as any)[key]
              return acc
            }, {} as Record<string, any>)
          })

          // Status 403 = RLS policy violation, 404 = table not found, 400 = bad request
          if (status === 403) {
            console.error("⚠️ RLS Policy Error: Check that bet_analyses table has INSERT policy for authenticated users")
          } else if (status === 404) {
            console.error("⚠️ Table not found: bet_analyses table may not exist in Supabase")
          } else if (status === 400) {
            console.error("⚠️ Bad Request: Schema mismatch or invalid data")
          }

          // Continue without throwing - data saved to localStorage as backup
          console.log("📦 Bet analysis saved to localStorage as backup")
        } else {
          console.log('✅ Successfully saved bet analysis to Supabase:', data)
        }
      } catch (error) {
        console.error("Exception while saving bet analysis:", error)
      }
    } else {
      console.warn('⚠️ No user ID found, skipping Supabase insert. Saving to localStorage only.')
    }

    // Also save to localStorage as backup
    if (typeof window !== "undefined") {
      const analyses = JSON.parse(localStorage.getItem(STORAGE_KEYS.BET_ANALYSES) || "[]")
      analyses.push(analysis)
      // Keep only last 50 analyses
      const trimmed = analyses.slice(-50)
      localStorage.setItem(STORAGE_KEYS.BET_ANALYSES, JSON.stringify(trimmed))
    }
  },

  async updateBetAnalysis(analysis: BetAnalysis): Promise<void> {
    const userId = await this.getCurrentUserId()

    if (userId && analysis.id) {
      try {
        const { error } = await supabase
          .from("bet_analyses")
          .update({
            outcome: analysis.outcome,
            actual_return: analysis.actualReturn,
            stake: analysis.stake,
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
      const analyses = JSON.parse(localStorage.getItem(STORAGE_KEYS.BET_ANALYSES) || "[]")
      const index = analyses.findIndex((a: BetAnalysis) => a.id === analysis.id)
      if (index !== -1) {
        analyses[index] = analysis
        localStorage.setItem(STORAGE_KEYS.BET_ANALYSES, JSON.stringify(analyses))
      }
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

  async setGameLines(lines: GameLineRecord[]): Promise<void> {
    // Alias for bulkUpsertGameLines for backward compatibility
    return this.bulkUpsertGameLines(lines)
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
        const { data: authUserRes } = await supabase.auth.getUser()
        const userEmail = authUserRes.user?.email || null

        const defaultData = getDefaultUserData()
        const { error: insertError } = await supabase
          .from("user_profiles")
          .insert({
            id: userId,
            name: defaultData.name,
            email: userEmail, // Ensure email is populated on creation
          })

        if (insertError) {
          console.error("Error creating user profile:", {
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint,
            code: insertError.code,
          })
        }

        return { ...defaultData, email: userEmail || undefined }
      }

      if (error) {
        console.warn("Error fetching user profile, falling back to defaults:", {
          message: (error as any).message,
          details: (error as any).details,
          hint: (error as any).hint,
          code: (error as any).code,
        })
      }

      // Check if email is missing and try to sync it from auth
      if (!data.email) {
        const { data: authUserRes } = await supabase.auth.getUser()
        if (authUserRes.user?.email) {
          console.log('🔄 Syncing missing email to profile:', authUserRes.user.email)
          await supabase
            .from("user_profiles")
            .update({ email: authUserRes.user.email })
            .eq("id", userId)
          data.email = authUserRes.user.email
        }
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
        surveyData: data.survey_data, // Add survey data from database
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
        } catch (err) {
          console.warn('[StorageHybrid] Failed to parse cached user data from localStorage:', err)
        }
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
        // Still update local cache so anonymous users don't lose progress.
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data))
        }
        return
      }

      // Build a safe update payload limited to stable columns
      const updateData: any = {
        id: userId,
        name: data.name,
      }

      if (data.level !== undefined) updateData.level = data.level
      if (data.xp !== undefined) updateData.xp = data.xp
      if (data.xpToNextLevel !== undefined) updateData.xp_to_next_level = data.xpToNextLevel
      if (data.emotionalAwarenessStreak !== undefined) updateData.emotional_awareness_streak = data.emotionalAwarenessStreak
      if (data.biasRecognitionScore !== undefined) updateData.bias_recognition_score = data.biasRecognitionScore
      if (data.mindfulDecisionPercentage !== undefined) updateData.mindful_decision_percentage = data.mindfulDecisionPercentage
      if (data.totalTrades !== undefined) updateData.total_trades = data.totalTrades
      if (data.mindfulTrades !== undefined) updateData.mindful_trades = data.mindfulTrades
      if (data.serenityTokens !== undefined) updateData.serenity_tokens = data.serenityTokens
      if (data.dailyRings !== undefined) updateData.daily_rings = data.dailyRings
      if (data.lastRingReset !== undefined) {
        const dateValue =
          data.lastRingReset instanceof Date
            ? data.lastRingReset
            : new Date(data.lastRingReset as any)
        // Only set if the date is valid
        if (!isNaN(dateValue.getTime())) {
          updateData.last_ring_reset = dateValue.toISOString()
        }
      }
      if (data.perfectDays !== undefined) updateData.perfect_days = data.perfectDays
      if (data.longestStreak !== undefined) updateData.longest_streak = data.longestStreak
      if (data.totalEmotionsLogged !== undefined) updateData.total_emotions_logged = data.totalEmotionsLogged
      if (data.totalBiasesIdentified !== undefined) updateData.total_biases_identified = data.totalBiasesIdentified
      if (data.totalJournalsCompleted !== undefined) updateData.total_journals_completed = data.totalJournalsCompleted
      if (data.totalModulesCompleted !== undefined) updateData.total_modules_completed = data.totalModulesCompleted
      if (data.totalBreathingExercises !== undefined) updateData.total_breathing_exercises = data.totalBreathingExercises
      if (data.mostProductiveDay !== undefined) updateData.most_productive_day = data.mostProductiveDay
      if (data.lastEmotionCheckIn !== undefined) {
        // NOTE: The Supabase user_profiles table does not have a `last_emotion_check_in` column.
        // Persist this recency marker locally only.
        const dateValue =
          data.lastEmotionCheckIn instanceof Date
            ? data.lastEmotionCheckIn
            : new Date(data.lastEmotionCheckIn as any)
        // Only set if the date is valid
        if (!isNaN(dateValue.getTime()) && typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEYS.LAST_CHECK_IN, dateValue.toISOString())
        }
      }

      // Add email if present
      if (data.email !== undefined) {
        updateData.email = data.email || null
      } else {
        // Try to get email from auth if not provided in data but we're updating
        const { data: authUserRes } = await supabase.auth.getUser()
        if (authUserRes.user?.email) {
          updateData.email = authUserRes.user.email
        }
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

      const extractMissingColumn = (msg: string): string | null => {
        const m = msg.match(/Could not find the '([^']+)' column/i)
        return m?.[1] ?? null
      }

      let payload: any = { ...updateData }
      let result: any = null
      let error: any = null
      let status: number | null = null

      for (let attempt = 0; attempt < 6; attempt++) {
        const resp = await supabase
          .from("user_profiles")
          .upsert(payload, { onConflict: "id" })
          .select()
          .maybeSingle()

        result = resp.data
        error = resp.error
        status = resp.status

        const msg = error && typeof (error as any).message === "string" ? (error as any).message : ""
        const missing = error && (error as any).code === "PGRST204" ? extractMissingColumn(msg) : null

        if (missing && Object.prototype.hasOwnProperty.call(payload, missing)) {
          delete payload[missing]
          continue
        }

        break
      }

      if (error) {
        const { data: sessionData } = await supabase.auth.getSession()
        const { data: userDataRes, error: getUserError } = await supabase.auth.getUser()

        // Some error fields can be non-enumerable; include own property names to avoid logging `{}`.
        const rawError = (() => {
          try {
            return JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error)))
          } catch {
            return error
          }
        })()

        const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim()
        const supabaseHost = (() => {
          try {
            return supabaseUrl ? new URL(supabaseUrl).host : undefined
          } catch {
            return undefined
          }
        })()

        const debugPayload = {
          status,
          code: (error as any).code,
          message: (error as any).message,
          details: (error as any).details,
          hint: (error as any).hint,
          rawError,
          authed: !!sessionData.session?.user,
          sessionUserId: sessionData.session?.user?.id,
          getUserError: getUserError
            ? {
              name: getUserError.name,
              message: getUserError.message,
            }
            : null,
          getUserId: userDataRes.user?.id,
          attemptedUserId: userId,
          supabaseHost,
        }

        // Log both object and JSON string to ensure the console doesn't collapse to `{}`.
        console.error("❌ Error updating user profile:", debugPayload)
        try {
          console.error("❌ Error updating user profile (json):", JSON.stringify(debugPayload))
        } catch {
          // ignore
        }
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
        .order("timestamp", { ascending: true })

      const supabaseLogs: EmotionLog[] = !error && data
        ? data.map((log: any): EmotionLog => ({
          id: log.id,
          timestamp: new Date(log.timestamp),
          emotion: log.emotion,
          intensity: log.intensity,
          context: log.notes || "",
          phase: log.phase,
          tradeId: undefined,
        }))
        : []

      if (error) {
        console.error("Error fetching emotion logs from Supabase, falling back to localStorage:", error)
      }

      let localLogs: EmotionLog[] = []
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem(STORAGE_KEYS.EMOTION_LOGS)
        if (cached) {
          try {
            const parsed = JSON.parse(cached) as any[]
            if (Array.isArray(parsed)) {
              localLogs = parsed
                .filter(Boolean)
                .map((log: any): EmotionLog => ({
                  id: String(log.id ?? ""),
                  timestamp: new Date(log.timestamp),
                  emotion: String(log.emotion ?? ""),
                  intensity: Number(log.intensity ?? 0),
                  context: String(log.context ?? ""),
                  phase: log.phase,
                  tradeId: log.tradeId,
                }))
            }
          } catch (err) {
            console.warn('[StorageHybrid] Failed to parse emotion logs from localStorage:', err)
          }
        }
      }

      const merged = [...supabaseLogs, ...localLogs]
      const deduped = new Map<string, EmotionLog>()
      for (const l of merged) {
        if (!l || !l.timestamp || !l.emotion) continue
        // Use ID as primary key, fallback to composite key for deduplication
        const key = l.id || `${l.timestamp.getTime()}|${l.emotion}|${l.intensity}|${l.phase}`
        deduped.set(key, l)
      }
      return Array.from(deduped.values()).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
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

    // Update daily rings and user stats
    await this.updateDailyRingsForEmotion()
  },

  // Trades Operations
  async getTrades(): Promise<Trade[]> {
    const userId = await this.getCurrentUserId()

    if (userId) {
      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", userId)
        .order("timestamp", { ascending: true })

      const supabaseTrades: Trade[] = !error && data
        ? (data || []).map(trade => ({
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
        : []

      if (error) {
        console.error("Error fetching trades:", error)
      }

      let localTrades: Trade[] = []
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem(STORAGE_KEYS.TRADES)
        if (cached) {
          try {
            const parsed = JSON.parse(cached) as any[]
            if (Array.isArray(parsed)) {
              localTrades = parsed
                .filter(Boolean)
                .map((t: any): Trade => ({
                  id: String(t.id ?? ""),
                  timestamp: new Date(t.timestamp),
                  title: t.title,
                  sport: t.sport,
                  preTradeEmotion: String(t.preTradeEmotion ?? ""),
                  preTradeIntensity: Number(t.preTradeIntensity ?? 3),
                  biasesIdentified: Array.isArray(t.biasesIdentified) ? t.biasesIdentified : [],
                  confidenceLevel: Number(t.confidenceLevel ?? 50),
                  reasoning: String(t.reasoning ?? ""),
                  outcome: t.outcome,
                  postTradeEmotion: t.postTradeEmotion,
                  postTradeIntensity: t.postTradeIntensity,
                  reflection: t.reflection,
                  emotionalImpact: t.emotionalImpact,
                }))
            }
          } catch (err) {
            console.warn('[StorageHybrid] Failed to parse trades from localStorage:', err)
          }
        }
      }

      const merged = [...supabaseTrades, ...localTrades]
      const deduped = new Map<string, Trade>()
      for (const t of merged) {
        if (!t || !t.timestamp) continue
        const key = `${t.timestamp.getTime()}|${t.preTradeEmotion}|${t.preTradeIntensity}|${t.outcome}|${t.postTradeEmotion}`
        deduped.set(key, t)
      }
      return Array.from(deduped.values()).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
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
    const historyEntry: BiasQuizHistory = {
      id: Date.now().toString(),
      timestamp: new Date(),
      profile,
      averageScore: Math.round(Object.values(profile).reduce((a, b) => a + b, 0) / 6)
    }
    await this.addBiasQuizHistory(historyEntry)
  },

  async getBiasHistory(): Promise<BiasQuizHistory[]> {
    // Alias for getBiasQuizHistory for backward compatibility
    return this.getBiasQuizHistory()
  },

  async addBiasHistory(history: BiasQuizHistory): Promise<void> {
    // Alias for addBiasQuizHistory for backward compatibility
    return this.addBiasQuizHistory(history)
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

  async addBiasQuizHistory(history: BiasQuizHistory): Promise<void> {
    const userId = await this.getCurrentUserId()

    // Save to database if user is logged in
    if (userId) {
      try {
        const { error } = await supabase
          .from("bias_quiz_history")
          .insert({
            user_id: userId,
            timestamp: history.timestamp.toISOString(),
            confirmation_bias: history.profile.confirmationBias,
            loss_aversion: history.profile.lossAversion,
            anchoring_bias: history.profile.anchoringBias,
            recency_bias: history.profile.recencyBias,
            overconfidence_bias: history.profile.overconfidenceBias,
            herd_mentality: history.profile.herdMentality,
            average_score: history.averageScore
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
      const currentHistory = await this.getBiasQuizHistory()
      currentHistory.push(history)
      const trimmedHistory = currentHistory.slice(-20)
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

  async updateAchievements(achievements: Achievement[]): Promise<void> {
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

  async updateChallenges(challenges: Challenge[]): Promise<void> {
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

  // Alias for updateChallenges for backward compatibility
  async setChallenges(challenges: Challenge[]): Promise<void> {
    return this.updateChallenges(challenges)
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

  // Update daily rings for emotion logging
  async updateDailyRingsForEmotion(): Promise<void> {
    const userData = await this.getUserData()
    if (!userData) return

    // Check if rings need to be reset (new day)
    const now = new Date()
    const lastReset = userData.lastRingReset || new Date(0)

    if (now.toDateString() !== lastReset.toDateString()) {
      // Reset rings for new day
      await this.setUserData({
        ...userData,
        dailyRings: {
          emotionalAwareness: 0,
          biasRecognition: 0,
          mindfulness: 0,
        },
        lastRingReset: now,
      })
      return
    }

    // Update emotional awareness ring (increment by 25% per emotion check-in, max 100%)
    const currentEmotionalAwareness = userData.dailyRings?.emotionalAwareness ?? 0
    const newEmotionalAwareness = Math.min(100, currentEmotionalAwareness + 25)

    // Update mindfulness ring (using the old mindfulness field for journal completion)
    const currentMindfulness = userData.dailyRings?.mindfulness ?? 0
    const newMindfulness = Math.min(100, currentMindfulness + 25)

    await this.setUserData({
      ...userData,
      dailyRings: {
        ...userData.dailyRings,
        emotionalAwareness: newEmotionalAwareness,
        mindfulness: newMindfulness,
      },
    })
  },

  // Comprehensive Bet Tracking Methods
  async getComprehensiveBets(): Promise<ComprehensiveBet[]> {
    const userId = await this.getCurrentUserId()

    if (userId) {
      try {
        const { data, error } = await supabase
          .from("comprehensive_bets")
          .select("*")
          .eq("user_id", userId)
          .order("timestamp", { ascending: false })
          .limit(1000)

        if (data && !error) {
          return data.map((row: any) => ({
            id: row.id,
            timestamp: new Date(row.timestamp),
            sport: row.sport,
            league: row.league,
            homeTeam: row.home_team,
            awayTeam: row.away_team,
            gameDate: new Date(row.game_date),
            betType: row.bet_type,
            selection: row.selection,
            line: row.line,
            odds: row.odds,
            stake: row.stake,
            emotions: {
              before: row.emotions?.before ? {
                ...row.emotions.before,
                timestamp: new Date(row.emotions.before.timestamp)
              } : { emotion: "", intensity: 0, timestamp: new Date() },
              during: row.emotions?.during ? {
                ...row.emotions.during,
                timestamp: new Date(row.emotions.during.timestamp)
              } : undefined,
              after: row.emotions?.after ? {
                ...row.emotions.after,
                timestamp: new Date(row.emotions.after.timestamp)
              } : { emotion: "", intensity: 0, timestamp: new Date() }
            },
            biasesIdentified: row.biases_identified || [],
            confidenceLevel: row.confidence_level,
            reasoning: row.reasoning,
            isLiveBet: row.is_live_bet,
            isChasingLoss: row.is_chasing_loss,
            isFavoriteTeam: row.is_favorite_team,
            outcome: row.outcome,
            actualReturn: row.actual_return,
            profitLoss: row.profit_loss,
            aiRecommendation: row.ai_recommendation,
            expectedValue: row.expected_value,
            probabilityEstimate: row.probability_estimate,
            riskLevel: row.risk_level,
            source: row.source,
            sportsbook: row.sportsbook,
            completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
          }))
        }
      } catch (error) {
        console.error("Error fetching comprehensive bets:", error)
      }
    }

    if (typeof window === "undefined") return []

    const data = localStorage.getItem(STORAGE_KEYS.COMPREHENSIVE_BETS)
    if (!data) return []

    try {
      return JSON.parse(data).map((bet: any) => ({
        ...bet,
        timestamp: new Date(bet.timestamp),
        gameDate: new Date(bet.gameDate),
        completedAt: bet.completedAt ? new Date(bet.completedAt) : undefined,
        emotions: {
          ...bet.emotions,
          before: {
            ...bet.emotions.before,
            timestamp: new Date(bet.emotions.before.timestamp)
          },
          during: bet.emotions.during ? {
            ...bet.emotions.during,
            timestamp: new Date(bet.emotions.during.timestamp)
          } : undefined,
          after: {
            ...bet.emotions.after,
            timestamp: new Date(bet.emotions.after.timestamp)
          }
        }
      }))
    } catch (e) {
      console.error("Error parsing comprehensive bets", e)
      return []
    }
  },

  async addComprehensiveBet(bet: ComprehensiveBet): Promise<void> {
    const userId = await this.getCurrentUserId()

    if (userId) {
      try {
        const { error } = await supabase
          .from("comprehensive_bets")
          .insert({
            id: bet.id,
            user_id: userId,
            timestamp: bet.timestamp.toISOString(),
            sport: bet.sport,
            league: bet.league,
            home_team: bet.homeTeam,
            away_team: bet.awayTeam,
            game_date: bet.gameDate.toISOString(),
            bet_type: bet.betType,
            selection: bet.selection,
            line: bet.line,
            odds: bet.odds,
            stake: bet.stake,
            emotions: bet.emotions,
            biases_identified: bet.biasesIdentified,
            confidence_level: bet.confidenceLevel,
            reasoning: bet.reasoning,
            is_live_bet: bet.isLiveBet,
            is_chasing_loss: bet.isChasingLoss,
            is_favorite_team: bet.isFavoriteTeam,
            outcome: bet.outcome,
            actual_return: bet.actualReturn,
            profit_loss: bet.profitLoss,
            ai_recommendation: bet.aiRecommendation,
            expected_value: bet.expectedValue,
            probability_estimate: bet.probabilityEstimate,
            risk_level: bet.riskLevel,
            source: bet.source,
            sportsbook: bet.sportsbook,
            completed_at: bet.completedAt?.toISOString(),
            // Market schema fields (betting engine expansion)
            time_frame: bet.timeFrame ?? null,
            variant_type: bet.variantType ?? null,
            market_level: bet.marketLevel ?? null,
            season_id: bet.seasonId ?? null,
            tournament_id: bet.tournamentId ?? null,
            supports_cash_out: bet.supportsCashOut ?? false,
            cash_out_offer: bet.cashOutOffer ?? null,
          })

        if (error) {
          console.error("Error adding comprehensive bet:", error)
        }
      } catch (error) {
        console.error("Exception adding comprehensive bet:", error)
      }
    }

    if (typeof window === "undefined") return

    const localData = localStorage.getItem(STORAGE_KEYS.COMPREHENSIVE_BETS)
    let localBets: any[] = localData ? JSON.parse(localData) : []
    // Simple check to avoid duplicates if ID exists
    if (!localBets.find((b: any) => b.id === bet.id)) {
      localBets.push(bet)
      if (localBets.length > 50) localBets = localBets.slice(-50)
      localStorage.setItem(STORAGE_KEYS.COMPREHENSIVE_BETS, JSON.stringify(localBets))
    }
  },

  async updateComprehensiveBet(updated: ComprehensiveBet): Promise<void> {
    const userId = await this.getCurrentUserId()

    if (userId) {
      try {
        const { error } = await supabase
          .from("comprehensive_bets")
          .update({
            outcome: updated.outcome,
            actual_return: updated.actualReturn,
            profit_loss: updated.profitLoss,
            completed_at: updated.completedAt?.toISOString(),
            emotions: updated.emotions,
            stake: updated.stake,
            odds: updated.odds,
            reasoning: updated.reasoning,
            risk_level: updated.riskLevel
          })
          .eq("id", updated.id)
          .eq("user_id", userId)

        if (error) {
          console.error("Error updating comprehensive bet:", error)
        }
      } catch (error) {
        console.error("Exception updating comprehensive bet:", error)
      }
    }

    if (typeof window === "undefined") return

    const localData = localStorage.getItem(STORAGE_KEYS.COMPREHENSIVE_BETS)
    if (localData) {
      try {
        let localBets: any[] = JSON.parse(localData)
        const idx = localBets.findIndex((b: any) => b.id === updated.id)
        if (idx !== -1) {
          localBets[idx] = { ...localBets[idx], ...updated }
          localStorage.setItem(STORAGE_KEYS.COMPREHENSIVE_BETS, JSON.stringify(localBets))
        }
      } catch (e) {
        console.error("Error updating local comprehensive bet", e)
      }
    }
  },

  async saveComprehensiveBets(bets: ComprehensiveBet[]): Promise<void> {
    const userId = await this.getCurrentUserId()

    if (userId) {
      try {
        // For each bet, upsert to database
        for (const bet of bets) {
          const { error } = await supabase
            .from("comprehensive_bets")
            .upsert({
              id: bet.id,
              user_id: userId,
              timestamp: bet.timestamp.toISOString(),
              sport: bet.sport,
              league: bet.league,
              home_team: bet.homeTeam,
              away_team: bet.awayTeam,
              game_date: bet.gameDate.toISOString(),
              bet_type: bet.betType,
              selection: bet.selection,
              line: bet.line,
              odds: bet.odds,
              stake: bet.stake,
              emotions: bet.emotions,
              biases_identified: bet.biasesIdentified,
              confidence_level: bet.confidenceLevel,
              reasoning: bet.reasoning,
              is_live_bet: bet.isLiveBet,
              is_chasing_loss: bet.isChasingLoss,
              is_favorite_team: bet.isFavoriteTeam,
              outcome: bet.outcome,
              actual_return: bet.actualReturn,
              profit_loss: bet.profitLoss,
              ai_recommendation: bet.aiRecommendation,
              expected_value: bet.expectedValue,
              probability_estimate: bet.probabilityEstimate,
              risk_level: bet.riskLevel,
              source: bet.source,
              sportsbook: bet.sportsbook,
              completed_at: bet.completedAt?.toISOString(),
            }, { onConflict: 'id' })

          if (error) {
            console.error("Error saving comprehensive bet:", error)
          }
        }
      } catch (error) {
        console.error("Exception saving comprehensive bets:", error)
      }
    }

    // Also save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.COMPREHENSIVE_BETS, JSON.stringify(bets))
    }
  },

  // AI Service Usage
  async getAIServiceUsage(): Promise<AIServiceUsage[]> {
    const userId = await this.getCurrentUserId()

    if (userId) {
      try {
        const ninetyDaysAgo = new Date()
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

        const { data, error } = await supabase
          .from("ai_service_usage")
          .select("*")
          .eq("user_id", userId)
          .gte("created_at", ninetyDaysAgo.toISOString())
          .order("created_at", { ascending: true })

        if (error) {
          console.error("Error fetching AI service usage:", error)
        } else if (data) {
          const mapped = (data || []).map((row: any): AIServiceUsage => ({
            id: row.id,
            userId: row.user_id,
            serviceType: row.service_type,
            weekStartDate: row.week_start_date,
            tierAtTimeOfUse: row.tier_at_time_of_use ?? undefined,
            requestMetadata: row.request_metadata ?? undefined,
            createdAt: row.created_at,
          }))

          if (typeof window !== "undefined") {
            try {
              localStorage.setItem(STORAGE_KEYS.AI_USAGE, JSON.stringify(mapped))
            } catch (err) {
              console.warn('[StorageHybrid] Failed to cache AI usage to localStorage:', err)
            }
          }

          return mapped
        }
      } catch (err) {
        console.error("Exception fetching AI service usage:", err)
      }
    }

    if (typeof window === "undefined") return []
    const cached = localStorage.getItem(STORAGE_KEYS.AI_USAGE)
    return cached ? (JSON.parse(cached) as AIServiceUsage[]) : []
  },

  // =========================================================================
  // Parlay Operations
  // =========================================================================

  async getParlays(): Promise<Parlay[]> {
    const userId = await this.getCurrentUserId()

    if (userId) {
      try {
        // Fetch parlays with their legs from Supabase
        const { data, error } = await supabase
          .from("parlays")
          .select("*, parlay_legs(*)")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(500)

        if (data && !error) {
          return data.map((row: any): Parlay => ({
            id: row.id,
            userId: row.user_id,
            anonymousSessionId: row.anonymous_session_id,
            createdAt: row.created_at,
            type: row.type || 'classic',
            legs: (row.parlay_legs || [])
              .sort((a: any, b: any) => (a.leg_order || 0) - (b.leg_order || 0))
              .map((leg: any) => ({
                pickId: leg.pick_id || leg.id,
                gameId: leg.game_id,
                teams: leg.teams,
                betType: leg.bet_type,
                line: leg.line || 'N/A',
                odds: leg.odds,
                confidence: leg.confidence,
                aiWinProbability: leg.ai_win_probability,
                sport: leg.sport,
                league: leg.league,
                selection: leg.selection,
                outcome: leg.outcome || 'pending',
                settledAt: leg.settled_at,
              })),
            stake: parseFloat(row.stake) || 0,
            totalOddsAmerican: row.total_odds_american,
            totalOddsDecimal: parseFloat(row.total_odds_decimal) || 1,
            impliedProbability: parseFloat(row.implied_probability) || 0,
            trueProbability: row.true_probability ? parseFloat(row.true_probability) : undefined,
            projectedEV: row.projected_ev ? parseFloat(row.projected_ev) : undefined,
            riskScore: row.risk_score ? parseFloat(row.risk_score) : undefined,
            kellyStakeFraction: row.kelly_stake_fraction ? parseFloat(row.kelly_stake_fraction) : undefined,
            outcome: row.outcome || 'pending',
            actualPayout: row.actual_payout ? parseFloat(row.actual_payout) : undefined,
            settledAt: row.settled_at,
            emotionAtCreation: row.emotion_at_creation,
            emotionIntensityAtCreation: row.emotion_intensity_at_creation,
            tiltSignals: row.tilt_signals,
            emotionCheckInId: row.emotion_check_in_id,
          }))
        }

        if (error) {
          console.error("Error fetching parlays from Supabase:", error)
        }
      } catch (err) {
        console.error("Exception fetching parlays:", err)
      }
    }

    // Fallback to localStorage
    if (typeof window !== "undefined") {
      const data = localStorage.getItem(STORAGE_KEYS.PARLAYS)
      return data ? JSON.parse(data) : []
    }
    return []
  },

  async addParlay(parlay: Parlay): Promise<void> {
    const userId = await this.getCurrentUserId()

    if (userId) {
      try {
        // Insert the parlay header row
        const { error: parlayError } = await supabase
          .from("parlays")
          .insert({
            id: parlay.id,
            user_id: userId,
            anonymous_session_id: parlay.anonymousSessionId || null,
            type: parlay.type || 'classic',
            stake: parlay.stake,
            total_odds_american: parlay.totalOddsAmerican,
            total_odds_decimal: parlay.totalOddsDecimal,
            implied_probability: parlay.impliedProbability,
            true_probability: parlay.trueProbability || null,
            projected_ev: parlay.projectedEV || null,
            risk_score: parlay.riskScore || null,
            kelly_stake_fraction: parlay.kellyStakeFraction || null,
            outcome: parlay.outcome || 'pending',
            actual_payout: parlay.actualPayout || null,
            emotion_at_creation: parlay.emotionAtCreation || null,
            emotion_intensity_at_creation: parlay.emotionIntensityAtCreation || null,
            tilt_signals: parlay.tiltSignals || null,
            emotion_check_in_id: parlay.emotionCheckInId || null,
            created_at: parlay.createdAt,
            settled_at: parlay.settledAt || null,
            supports_cash_out: parlay.supportsCashOut ?? false,
            cash_out_offer: parlay.cashOutOffer ?? null,
          })

        if (parlayError) {
          console.error("Error inserting parlay to Supabase:", parlayError)
        } else {
          // Insert legs as separate rows
          const legRows = parlay.legs.map((leg, index) => ({
            parlay_id: parlay.id,
            pick_id: leg.pickId,
            game_id: leg.gameId || null,
            teams: leg.teams,
            bet_type: leg.betType,
            line: leg.line || 'N/A',
            odds: leg.odds,
            confidence: leg.confidence || null,
            ai_win_probability: leg.aiWinProbability || null,
            sport: leg.sport || null,
            league: leg.league || null,
            selection: leg.selection || null,
            outcome: leg.outcome || 'pending',
            settled_at: leg.settledAt || null,
            leg_order: index,
            // Market schema fields
            time_frame: (leg as any).timeFrame ?? null,
            variant_type: (leg as any).variantType ?? null,
            market_level: (leg as any).marketLevel ?? null,
          }))

          const { error: legsError } = await supabase
            .from("parlay_legs")
            .insert(legRows)

          if (legsError) {
            console.error("Error inserting parlay legs to Supabase:", legsError)
          } else {
            console.log("✅ Parlay saved to Supabase:", parlay.id)
          }
        }
      } catch (err) {
        console.error("Exception saving parlay:", err)
      }
    }

    // Also save to localStorage as backup
    if (typeof window !== "undefined") {
      const parlays: Parlay[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PARLAYS) || "[]")
      parlays.push(parlay)
      // Keep only last 100 parlays in localStorage
      const trimmed = parlays.slice(-100)
      localStorage.setItem(STORAGE_KEYS.PARLAYS, JSON.stringify(trimmed))
    }
  },

  async updateParlay(parlay: Parlay): Promise<void> {
    const userId = await this.getCurrentUserId()

    if (userId && parlay.id) {
      try {
        // Update the parlay header (includes repriced odds from push settlement)
        const { error } = await supabase
          .from("parlays")
          .update({
            outcome: parlay.outcome,
            actual_payout: parlay.actualPayout || null,
            total_odds_american: parlay.totalOddsAmerican,
            total_odds_decimal: parlay.totalOddsDecimal,
            settled_at: parlay.settledAt || null,
            emotion_check_in_id: parlay.emotionCheckInId || null,
            tilt_signals: parlay.tiltSignals || null,
          })
          .eq("id", parlay.id)
          .eq("user_id", userId)

        if (error) {
          console.error("Error updating parlay in Supabase:", error)
        }

        // Update individual leg outcomes in parallel
        const legUpdates = parlay.legs.map(async (leg) => {
          if (leg.outcome && leg.outcome !== 'pending') {
            return supabase
              .from("parlay_legs")
              .update({
                outcome: leg.outcome,
                settled_at: leg.settledAt || null,
              })
              .eq("parlay_id", parlay.id)
              .eq("pick_id", leg.pickId)
          }
          return Promise.resolve()
        })

        await Promise.all(legUpdates)
      } catch (err) {
        console.error("Exception updating parlay:", err)
      }
    }

    // Also update in localStorage
    if (typeof window !== "undefined") {
      const parlays: Parlay[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PARLAYS) || "[]")
      const index = parlays.findIndex((p: Parlay) => p.id === parlay.id)
      if (index !== -1) {
        parlays[index] = parlay
        localStorage.setItem(STORAGE_KEYS.PARLAYS, JSON.stringify(parlays))
      }
    }
  },

  async getParlayById(id: string): Promise<Parlay | null> {
    const parlays = await this.getParlays()
    return parlays.find((p: Parlay) => p.id === id) || null
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
    subscriptionTier: 'free',
    subscriptionStatus: 'active',
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

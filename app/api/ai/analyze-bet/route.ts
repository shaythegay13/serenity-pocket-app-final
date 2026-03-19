import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"
import { analyzeScenario, type BetScenario } from "@/lib/ai-bet-advisor"
import { isEnhancedAIAvailable, getEnhancedBetAnalysis } from "@/lib/ai-service"
import { fetchEnhancedLiveOdds } from "@/lib/enhanced-odds-api"
import { fetchLiveOddsUpdate, buildLiveContext } from "@/lib/services/live-odds-service"
import type { LiveOddsUpdate } from "@/lib/services/live-odds-service"
import { predictGameOutcomes, scoreUserBet } from "@/lib/services/sagemakerSportsModel"
import { analyzeUserBet } from "@/lib/services/gemini-reasoner"
import {
  validateParlayLegs,
  calculateSGPOdds,
  calculateCombinedOdds,
  calculateParlayEV,
  calculateParlayEVPercentage,
  detectCorrelations,
  detectSGPCorrelationPairs,
  americanToDecimal,
  decimalToAmerican,
} from "@/lib/parlay-utils"
import type { ParlayLeg } from "@/lib/types/ai-models"
import type {
  BetAnalyzerReasoningInput,
  BetAnalyzerReasoningOutput,
  CurrentGameContext,
  FormatType,
  MatchParticipant,
  HistoricalFeatureVector,
  ModelPrediction,
  UserPsychologySnapshot,
  UserPsychProfile,
} from "@/lib/types/ai-models"
import { checkDecisionUsage, recordDecisionUsage, deductDecisionCredit } from "@/lib/ai-usage-tracker"
import { TILTLAB_SPORT_MAPPING, detectMatchFormat, normalizeSportKey } from "@/lib/sports-config"
import { execFile } from "child_process"
import { promisify } from "util"

const execFileAsync = promisify(execFile)

export const maxDuration = 60

/**
 * AI Bet Analysis API Route
 * Requires a paid subscription tier (Premium or higher)
 * Uses enhanced Gemini analysis when available
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseServer

    const authHeader = request.headers.get("authorization") || ""
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : undefined

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check AI-guided decision balance (1 decision = SmartSlip + TiltLab full flow)
    const usageCheck = await checkDecisionUsage(supabase, user.id)

    if (!usageCheck.canUse) {
      return NextResponse.json(
        {
          error: usageCheck.reason || "No AI-guided decisions remaining",
          upgrade_required: usageCheck.weeklyLimit === 0,
          usage_limit_reached: usageCheck.weeklyLimit > 0,
          current_tier: usageCheck.tier,
          current_usage: {
            used: usageCheck.usedThisWeek,
            limit: usageCheck.weeklyLimit,
            remaining: usageCheck.remaining,
            purchased_credits: usageCheck.purchasedCredits,
            total_available: usageCheck.totalAvailable,
          },
          marketplace_url: '/marketplace',
        },
        { status: 403 }
      )
    }

    // Parse request body
    const payload: BetScenario = await request.json()

    // Validate required fields
    if (!payload.sport || !payload.betType || !payload.betAmount || !payload.budget) {
      return NextResponse.json(
        { error: "Missing required fields: sport, betType, betAmount, budget" },
        { status: 400 }
      )
    }

    // Fetch user's emotional stability score from DB (the same score shown on the front end)
    let userEmotionalStabilityScore = 50
    try {
      const { data: userProfileData } = await supabase
        .from('user_profiles')
        .select('emotional_stability')
        .eq('id', user.id)
        .single()
      if (typeof userProfileData?.emotional_stability === 'number') {
        userEmotionalStabilityScore = userProfileData.emotional_stability
      }
    } catch (e) {
      console.warn('[TiltLab PsychPicker] Could not fetch emotional stability, using default', e)
    }

    // --- Psychology Model Selection (Integrated from SlipAnalyzer Logic) ---
    try {
      const emotionalScore = userEmotionalStabilityScore
      const riskTolerance = inferRiskToleranceFromScenario(payload)

      // Sanitize inputs to prevent command injection
      const sanitizedScore = Number.isFinite(emotionalScore) ? Math.round(emotionalScore) : 75
      const validTolerances = ['conservative', 'moderate', 'aggressive']
      const sanitizedTolerance = validTolerances.includes(riskTolerance) ? riskTolerance : 'moderate'

      const { stdout } = await execFileAsync("python", ["psych_model_picker.py", String(sanitizedScore), sanitizedTolerance])

      // Validate JSON parsing
      let psychResult
      try {
        psychResult = JSON.parse(stdout.trim())
      } catch (parseError) {
        console.warn(" [TiltLab PsychPicker] Invalid JSON response, using defaults")
        throw parseError
      }

      payload.psychModel = psychResult.model_id
      payload.psychMultiplier = psychResult.params?.max_stake_multiplier || 1.0

      if (process.env.NODE_ENV !== "production") {
        console.log(` [TiltLab PsychPicker] Selected: ${payload.psychModel} (Multiplier: ${payload.psychMultiplier})`)
      }
    } catch (e) {
      console.warn(" [TiltLab PsychPicker] Script failed, falling back to defaults", e)
      payload.psychModel = "growth_optimizer_v3"
      payload.psychMultiplier = 1.0
    }

    // Run built-in AI analysis as a baseline (now with psych awareness)
    const analysis = analyzeScenario(payload)

    // --- New 2-layer engine: odds sourcing + heuristic + Gemini ---
    let enhancedAnalysis: any = null
    let usedEnhancedAI = false

    try {
      const { effectiveOdds, oddsSource } = await getEffectiveOdds(payload)
      let activeOdds = effectiveOdds

      if (effectiveOdds === null || Number.isNaN(effectiveOdds)) {
        return NextResponse.json({
          success: false,
          error: "Could not source real-time odds for this matchup. Please enter odds manually or try again later.",
          usedEnhancedAI: false
        }, { status: 400 })
      }

      const sportKey = mapHumanSportToKey(payload.sport)
      const homeTeam = payload.favoriteTeam || payload.underdogTeam || "Home"
      const awayTeam = payload.underdogTeam || payload.favoriteTeam || "Away"

      const leagueKey = sportKey || payload.sport

      // 1) Build context + features from available odds and payload
      let context: CurrentGameContext | null = null
      let features: HistoricalFeatureVector | null = null
      let prediction: ModelPrediction | null = null
      let usedSageMaker = false

      const impliedFromOdds = (o: number): number => {
        if (!o || Number.isNaN(o)) return 0.5
        if (o > 0) return 100 / (o + 100)
        return Math.abs(o) / (Math.abs(o) + 100)
      }

      context = {
        league: leagueKey,
        homeTeam,
        awayTeam,
        currentOdds: {
          moneylineHome: effectiveOdds,
          moneylineAway: undefined,
        },
        impliedProbabilities: {
          home: impliedFromOdds(effectiveOdds),
        },
        // Include user-provided context for better analysis
        keyInjuries: payload.injuries ? [payload.injuries] : undefined,
        weather: payload.weather || undefined,
        teamForm: {
          homeRecent: payload.favoriteRecord ? [payload.favoriteRecord] : undefined,
          awayRecent: payload.underdogRecord ? [payload.underdogRecord] : undefined,
        },
        narrativeContext: `Favorite: ${payload.favoriteTeam || 'Unknown'} (${payload.favoriteRecord || 'N/A'}), Underdog: ${payload.underdogTeam || 'Unknown'} (${payload.underdogRecord || 'N/A'}). Bet type: ${payload.betType}. Selection: ${payload.selection}.`,
        // Match format routing — drives EV model selection and UI rendering
        formatType: detectMatchFormat(
          `${homeTeam} vs ${awayTeam}`,
          normalizeSportKey(leagueKey)
        ) as FormatType,
        participants: (() => {
          const fmt = detectMatchFormat('', normalizeSportKey(leagueKey))
          if (fmt === 'FIELD_LEADERBOARD') return null
          const pType: 'team' | 'player' = fmt === 'PLAYER_VS_PLAYER' ? 'player' : 'team'
          const parts: MatchParticipant[] = []
          if (homeTeam) parts.push({ type: pType, id: homeTeam, name: homeTeam, home: true })
          if (awayTeam && awayTeam !== homeTeam) parts.push({ type: pType, id: awayTeam, name: awayTeam, home: false })
          return parts.length ? parts : null
        })(),
      }

      features = {
        league: leagueKey,
        teamA: homeTeam,
        teamB: awayTeam,
        lookbackGames: 10,
        numericFeatures: [impliedFromOdds(effectiveOdds), effectiveOdds],
        categoricalFeatures: [leagueKey, payload.betType],
      }

      // 1.5) Live betting: refresh odds from TheOddsAPI when isLiveBet is true
      if (payload.isLiveBet && context) {
        const gameId = (payload as any).gameId as string | undefined
        if (gameId) {
          const liveUpdate: LiveOddsUpdate | null = await fetchLiveOddsUpdate(gameId, leagueKey)
          if (liveUpdate) {
            const sel = payload.selection
            if (sel === 'home') activeOdds = liveUpdate.odds.moneyline.home
            else if (sel === 'away') activeOdds = liveUpdate.odds.moneyline.away
            else if (sel === 'over') activeOdds = liveUpdate.odds.totals.over.odds
            else if (sel === 'under') activeOdds = liveUpdate.odds.totals.under.odds
            // Refresh context with live market prices
            context.currentOdds.moneylineHome = liveUpdate.odds.moneyline.home
            context.currentOdds.moneylineAway = liveUpdate.odds.moneyline.away
            context.currentOdds.spreadHomeOdds = liveUpdate.odds.spread.home.odds
            context.currentOdds.spreadAwayOdds = liveUpdate.odds.spread.away.odds
            context.currentOdds.totalOverOdds = liveUpdate.odds.totals.over.odds
            context.currentOdds.totalUnderOdds = liveUpdate.odds.totals.under.odds
            context.narrativeContext = `[${buildLiveContext(liveUpdate)}] ${context.narrativeContext ?? ''}`
          } else {
            context.narrativeContext = `[LIVE BET] ${context.narrativeContext ?? ''}`
          }
        } else {
          context.narrativeContext = `[LIVE BET] ${context.narrativeContext ?? ''}`
        }
      }

      // 2) Heuristic numeric prediction and risk scoring
      try {
        const smStartedAt = Date.now()
        if (process.env.NODE_ENV !== "production") {
          console.log("🤖 [TiltLab Analyze Bet] Heuristic model: starting")
        }
        prediction = await predictGameOutcomes(features)
        usedSageMaker = true

        if (process.env.NODE_ENV !== "production") {
          console.log(`🤖 [TiltLab Analyze Bet] Heuristic model: done in ${Date.now() - smStartedAt}ms`)
        }
      } catch (e) {
        console.warn("[TiltLab Analyze Bet] Heuristic model prediction failed", e)
        prediction = {
          winProbabilityHome: 0.5,
          winProbabilityAway: 0.5,
          modelConfidence: 0.5,
          riskScore: 0.5,
        }
      }

      let betRiskAssessment: Awaited<ReturnType<typeof scoreUserBet>> | null = null

      try {
        const userProfile: UserPsychProfile = {
          riskTolerance: inferRiskToleranceFromScenario(payload),
          weeklyBudget: payload.budget,
        }

        betRiskAssessment = await scoreUserBet({
          features,
          prediction,
          betType: payload.betType,
          stake: payload.betAmount,
          odds: effectiveOdds,
          userProfile,
        })
      } catch (e) {
        console.warn("[TiltLab Analyze Bet] scoreUserBet failed", e)
      }

      // 3) Gemini reasoning layer
      const userSnapshot: UserPsychologySnapshot = {
        currentEmotion: payload.currentEmotion || "neutral",
        currentEmotionIntensity: payload.currentEmotionIntensity ?? 5,
        riskTolerance: inferRiskToleranceFromScenario(payload),
        weeklyBudget: payload.budget,
        lastOutcome: payload.lastOutcome,
        emotionalTriggers: payload.emotionalTriggers,
        recentHistorySummary: payload.history,
        // Include additional psychology flags
        isChasingLoss: payload.isChasingLoss,
        isFavoriteTeam: payload.isFavoriteTeam,
        isLiveBet: payload.isLiveBet,
        confidenceLevel: payload.confidenceLevel,
        notes: payload.notes,
      }

      const baseInput: BetAnalyzerReasoningInput = {
        user: userSnapshot,
        game: {
          id: undefined,
          context,
          features,
          prediction,
        },
        bet: {
          type: payload.betType,
          stake: payload.betAmount,
          odds: activeOdds,
          slipText: payload.bettingSlip,
          selection: payload.selection,
          line: payload.line,
          // Player prop context forwarded from SmartSlip so Gemini can analyze the specific prop
          playerName: payload.playerName,
          playerTeam: payload.playerTeam,
          propStat: payload.propStat,
          propLine: payload.propLine,
          propDirection: payload.propDirection,
          propCategory: payload.propCategory,
        },
      }

      let reasoning: BetAnalyzerReasoningOutput
      let usedGemini = false

      if (isEnhancedAIAvailable()) {
        try {
          const geminiStartedAt = Date.now()
          if (process.env.NODE_ENV !== "production") {
            console.log(" [TiltLab Analyze Bet] Gemini: starting")
          }
          reasoning = await analyzeUserBet(baseInput)
          usedGemini = true

          if (process.env.NODE_ENV !== "production") {
            console.log(` [TiltLab Analyze Bet] Gemini: done in ${Date.now() - geminiStartedAt}ms`)
          }
        } catch (e) {
          console.error("[TiltLab Analyze Bet] Gemini reasoning failed; continuing with heuristic-only analysis", e)
          reasoning = {
            betSafetyCategory: "CAUTION",
            stakeRecommendation: {
              amount: payload.betAmount,
              fractionOfBudget: payload.budget ? payload.betAmount / payload.budget : 0,
              explanation: "Base recommendation from rule-based advisor.",
            },
            psychologyFlags: [],
            emotionalAlignment: 50,
            summary: (analysis as any).recommendation.reason,
            detailedExplanation: (analysis as any).recommendation.reason,
            responsibleGamblingReminder: undefined,
          }
        }
      } else {
        if (process.env.NODE_ENV !== "production") {
          console.log(" [TiltLab Analyze Bet] Gemini: skipped (not configured)")
        }
        reasoning = {
          betSafetyCategory: "CAUTION",
          stakeRecommendation: {
            amount: payload.betAmount,
            fractionOfBudget: payload.budget ? payload.betAmount / payload.budget : 0,
            explanation: "Base recommendation from rule-based advisor.",
          },
          psychologyFlags: [],
          emotionalAlignment: 50,
          summary: (analysis as any).recommendation.reason,
          detailedExplanation: (analysis as any).recommendation.reason,
          responsibleGamblingReminder: undefined,
        }
      }

      // Adapt new engine output into the existing enhanced shape expected by AIBetAdvisor
      const refinedRecommendation = mapSafetyCategoryToUnifiedRecommendation(
        reasoning.betSafetyCategory,
      )

      // Derive a confidence score (rough heuristic from riskCategory + modelConfidence)
      const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
      const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

      const modelConf = clamp01(prediction?.modelConfidence ?? 0.5)
      let confidenceScore = Math.round(modelConf * 100)

      if (betRiskAssessment?.riskCategory === "HIGH") confidenceScore -= 20
      else if (betRiskAssessment?.riskCategory === "LOW") confidenceScore += 10

      const stakeFraction = payload.budget ? payload.betAmount / payload.budget : 0
      if (stakeFraction > 0.1) confidenceScore -= 10
      else if (stakeFraction <= 0.03) confidenceScore += 5

      confidenceScore = clamp(confidenceScore, 45, 90)

      const keyInsights: string[] = []
      if (betRiskAssessment?.flags?.length) {
        keyInsights.push(...betRiskAssessment.flags)
      }
      if (reasoning.psychologyFlags?.length) {
        keyInsights.push(...reasoning.psychologyFlags)
      }
      if (reasoning.summary) {
        keyInsights.unshift(reasoning.summary)
      }

      enhancedAnalysis = {
        refinedRecommendation,
        confidenceScore,
        enhancedReasoning: reasoning.detailedExplanation || reasoning.summary,
        keyInsights,
        oddsSource,
        numericRisk: betRiskAssessment,
        emotionalAlignment: reasoning.emotionalAlignment,
        meta: {
          usedSageMaker,
          usedGemini,
        },
      }

      // Also nudge the base recommendation toward the refined one
      analysis.recommendation.recommendation = refinedRecommendation
      analysis.recommendation.confidence = confidenceScore
      analysis.recommendation.reason = reasoning.summary || analysis.recommendation.reason

      usedEnhancedAI = usedGemini
    } catch (engineError) {
      console.error("[TiltLab Analyze Bet] New 3-layer engine failed, falling back to legacy enhanced analysis:", engineError)

      // Legacy enhanced flow (still backed by Gemini via lib/aws-bedrock.ts)
      if (isEnhancedAIAvailable()) {
        try {
          console.log("🤖 Running legacy enhanced AI analysis with Gemini...")

          let sportsDbContext:
            | { favoriteTeamForm?: string[]; underdogTeamForm?: string[] }
            | undefined
          try {
            if (payload.favoriteTeam || payload.underdogTeam) {
              const { searchTeams, getTeamRecentForm } = await import("@/lib/thesportsdb")

              const getForm = async (teamName: string) => {
                const teams = await searchTeams(teamName)
                if (teams.length > 0) {
                  const form = await getTeamRecentForm(teams[0].idTeam)
                  return form?.last5 || []
                }
                return []
              }

              const [favForm, dogForm] = await Promise.all([
                payload.favoriteTeam
                  ? getForm(payload.favoriteTeam)
                  : Promise.resolve([]),
                payload.underdogTeam
                  ? getForm(payload.underdogTeam)
                  : Promise.resolve([]),
              ])
              sportsDbContext = {
                favoriteTeamForm: favForm,
                underdogTeamForm: dogForm,
              }
            }
          } catch (e) {
            console.warn("[Analyze Bet] Failed to load TheSportsDB context:", e)
          }

          const legacyEnhanced = await getEnhancedBetAnalysis({
            ...payload,
            builtInAnalysis: {
              analyticalInsights: analysis.analytical.insights,
              emotionalRisk: analysis.recommendation.emotionalAnalysis.emotionalRisk,
              emotionalFactors: analysis.recommendation.emotionalAnalysis
                .emotionalFactors,
              safetySignals: analysis.safety.signals.map((s) => s.label),
              recommendation: analysis.recommendation.recommendation,
              confidence: analysis.recommendation.confidence,
            },
            sportsDbContext,
          })

          enhancedAnalysis = legacyEnhanced
          usedEnhancedAI = true

          analysis.recommendation.recommendation = legacyEnhanced.refinedRecommendation
          analysis.recommendation.confidence = legacyEnhanced.confidenceScore
          analysis.recommendation.reason = legacyEnhanced.enhancedReasoning

        } catch (enhancedError) {
          // Continue with baseline analysis if enhanced AI fails
        }
      }
    }

    // Log analysis for tracking
    await supabase.from("ai_analysis_logs").insert({
      user_id: user.id,
      sport: payload.sport,
      bet_type: payload.betType,
      bet_amount: payload.betAmount,
      recommendation: analysis.recommendation.recommendation,
      risk_level: analysis.safety.risk,
      confidence: analysis.recommendation.confidence,
      emotional_risk: analysis.recommendation.emotionalAnalysis.emotionalRisk,
      emotional_state: analysis.recommendation.emotionalAnalysis.emotionalState,
      created_at: new Date().toISOString(),
    })

    // Consume 1 AI-guided decision (full SmartSlip + TiltLab flow complete)
    await recordDecisionUsage(supabase, user.id, {
      sport: payload.sport,
      betType: payload.betType,
      betAmount: payload.betAmount,
      recommendation: analysis.recommendation.recommendation,
      usedEnhancedAI,
    })
    await deductDecisionCredit(supabase, user.id)

    // --- Parlay-specific analysis (when structured legs are provided) ---
    let parlayAnalysis: any = null
    if (payload.betType === 'Parlay' && payload.parlayLegs && payload.parlayLegs.length >= 2) {
      try {
        const legs: ParlayLeg[] = payload.parlayLegs.map((leg, i) => ({
          pickId: leg.pickId || `leg-${i}`,
          gameId: leg.gameId,
          teams: leg.teams,
          betType: leg.betType,
          line: leg.line,
          odds: leg.odds,
          aiWinProbability: leg.aiWinProbability,
          sport: leg.sport,
        }))

        const validation = validateParlayLegs(legs, payload.parlayType)
        const correlationWarnings = detectCorrelations(legs)

        let combinedDecimalOdds: number
        let sgpCorrelationWarnings: any[] = []
        let effectiveTax = 0

        if (validation.detectedType === 'sgp' || validation.detectedType === 'sgp_plus') {
          const sgpResult = calculateSGPOdds(legs)
          combinedDecimalOdds = sgpResult.odds
          sgpCorrelationWarnings = sgpResult.correlationWarnings
          effectiveTax = sgpResult.effectiveTax
        } else {
          combinedDecimalOdds = calculateCombinedOdds(legs)
        }

        const combinedAmericanOdds = decimalToAmerican(combinedDecimalOdds)
        const impliedProbability = 1 / combinedDecimalOdds
        const ev = calculateParlayEV(legs, payload.betAmount)
        const evPercentage = calculateParlayEVPercentage(legs)

        parlayAnalysis = {
          type: validation.detectedType,
          declaredType: payload.parlayType || 'auto',
          legCount: legs.length,
          validation: {
            isValid: validation.isValid,
            errors: validation.errors,
            warnings: validation.warnings,
          },
          odds: {
            american: Math.round(combinedAmericanOdds),
            decimal: combinedDecimalOdds,
          },
          impliedProbability: (impliedProbability * 100).toFixed(2),
          ev: {
            absolute: ev.toFixed(2),
            percentage: evPercentage.toFixed(2),
          },
          sgp: (validation.detectedType === 'sgp' || validation.detectedType === 'sgp_plus') ? {
            effectiveTax: (effectiveTax * 100).toFixed(1) + '%',
            correlationPairs: sgpCorrelationWarnings.map(w => ({
              message: w.message,
              severity: w.severity,
              extraTax: (w.extraTax * 100).toFixed(0) + '%',
            })),
          } : null,
          correlationWarnings: correlationWarnings.map(w => ({
            type: w.type,
            severity: w.severity,
            message: w.message,
          })),
          legs: legs.map((leg, i) => ({
            leg: i + 1,
            teams: leg.teams,
            betType: leg.betType,
            odds: leg.odds,
            impliedProb: ((1 / americanToDecimal(leg.odds)) * 100).toFixed(1) + '%',
            aiProb: leg.aiWinProbability ? (leg.aiWinProbability * 100).toFixed(1) + '%' : null,
          })),
        }

        if (process.env.NODE_ENV !== 'production') {
          console.log(`🎯 [TiltLab] Parlay analysis: ${validation.detectedType}, ${legs.length} legs, ${combinedAmericanOdds > 0 ? '+' : ''}${Math.round(combinedAmericanOdds)} odds, EV: ${evPercentage.toFixed(1)}%`)
        }
      } catch (parlayErr) {
        console.warn('[TiltLab] Parlay analysis failed, continuing without it:', parlayErr)
      }
    }

    return NextResponse.json({
      success: true,
      analysis,
      enhanced: enhancedAnalysis,
      usedEnhancedAI,
      parlayAnalysis,
    })
  } catch (error) {
    console.error("AI analysis error:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to analyze bet scenario",
      enhanced: null,
      usedEnhancedAI: false,
    })
  }
}

function parseAmericanOdds(odds?: string | number | null): number | null {
  if (odds == null) return null
  if (typeof odds === "number") {
    if (!Number.isFinite(odds) || odds === 0) return null
    return Math.round(odds)
  }
  const cleaned = odds.trim()
  if (!cleaned) return null
  const match = cleaned.match(/^[+-]?\d+$/)
  if (!match) return null
  const val = parseInt(cleaned, 10)
  if (!Number.isFinite(val) || val === 0) return null
  return val
}

function mapHumanSportToKey(sport: string): string {
  // Use centralized mapping if available
  if (TILTLAB_SPORT_MAPPING[sport]) {
    return TILTLAB_SPORT_MAPPING[sport]
  }

  const key = sport.toLowerCase()
  if (key.includes("nba") || key.includes("basketball")) return "basketball_nba"
  if (key.includes("nfl") || key.includes("football")) return "americanfootball_nfl"
  if (key.includes("mlb") || key.includes("baseball")) return "baseball_mlb"
  if (key.includes("nhl") || key.includes("hockey")) return "icehockey_nhl"

  // Try to find by partial match in the mapping
  const entry = Object.entries(TILTLAB_SPORT_MAPPING).find(([name]) =>
    name.toLowerCase().includes(key) || key.includes(name.toLowerCase())
  )

  if (entry) return entry[1]

  return sport
}

async function getEffectiveOdds(payload: BetScenario): Promise<{
  effectiveOdds: number
  oddsSource: "user" | "api"
}> {
  // 1) User-input odds
  const userOdds = parseAmericanOdds(payload.odds)
  if (userOdds != null) {
    return { effectiveOdds: userOdds, oddsSource: "user" }
  }

  const sportKey = mapHumanSportToKey(payload.sport)

  // 2) API odds via enhanced odds abstraction
  try {
    const apiResult = await fetchEnhancedLiveOdds(sportKey, "auto")
    if (apiResult.success && Array.isArray(apiResult.data) && apiResult.data.length > 0) {
      const fav = payload.favoriteTeam?.toLowerCase()
      const dog = payload.underdogTeam?.toLowerCase()

      const match = apiResult.data.find((g: any) => {
        const home = (g.homeTeam || g.home_team || "").toLowerCase()
        const away = (g.awayTeam || g.away_team || "").toLowerCase()
        if (fav && dog) {
          return (
            (home.includes(fav) && away.includes(dog)) ||
            (home.includes(dog) && away.includes(fav))
          )
        }
        return false
      })

      if (match) {
        const homeTeam = (match.homeTeam || match.home_team) as string
        const awayTeam = (match.awayTeam || match.away_team) as string
        const isFavHome = fav && homeTeam.toLowerCase().includes(fav)

        const bestHome = match.homeOdds?.best?.odds
        const bestAway = match.awayOdds?.best?.odds

        const chosen = isFavHome ? bestHome ?? bestAway : bestAway ?? bestHome
        const apiOdds = typeof chosen === "number" ? chosen : null

        if (apiOdds != null && Number.isFinite(apiOdds) && apiOdds !== 0) {
          return { effectiveOdds: Math.round(apiOdds), oddsSource: "api" }
        }
      }
    }
  } catch (e) {
    console.warn("[TiltLab Analyze Bet] Failed to source odds from APIs:", e)
  }

  // 4) No odds found - throw error to indicate failure
  throw new Error("Could not source odds from user input or APIs")
}

function inferRiskToleranceFromScenario(payload: BetScenario):
  | "conservative"
  | "moderate"
  | "aggressive" {
  const amt = Number(payload.betAmount) || 0
  const budget = Number(payload.budget) || 0
  const fraction = budget > 0 ? amt / budget : 0

  if (fraction >= 0.2) return "aggressive"
  if (fraction <= 0.05) return "conservative"
  return "moderate"
}

function mapSafetyCategoryToUnifiedRecommendation(
  cat: BetAnalyzerReasoningOutput["betSafetyCategory"],
): "PLACE BET" | "DON'T PLACE BET" | "PROCEED WITH CAUTION" {
  if (cat === "PREFERRED") return "PLACE BET"
  if (cat === "DISCOURAGED") return "DON'T PLACE BET"
  return "PROCEED WITH CAUTION"
}


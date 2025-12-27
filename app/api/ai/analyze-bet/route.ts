import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"
import { analyzeScenario, type BetScenario } from "@/lib/ai-bet-advisor"
import { isEnhancedAIAvailable, getEnhancedBetAnalysis } from "@/lib/aws-bedrock"
import { fetchTeamRecentResults } from "@/lib/sports-data-api"
import { fetchEnhancedLiveOdds } from "@/lib/enhanced-odds-api"
import { getCurrentGameContext } from "@/lib/services/perplexitySportsResearcher"
import { predictGameOutcomes, scoreUserBet } from "@/lib/services/sagemakerSportsModel"
import { analyzeUserBet } from "@/lib/services/bedrockClaudeReasoner"
import type {
  BetAnalyzerReasoningInput,
  BetAnalyzerReasoningOutput,
  CurrentGameContext,
  HistoricalFeatureVector,
  ModelPrediction,
  UserPsychologySnapshot,
  UserPsychProfile,
} from "@/lib/types/ai-models"
import { isPerplexityAvailable } from "@/lib/perplexity"
import { checkAIServiceUsage, recordAIServiceUsage } from "@/lib/ai-usage-tracker"

/**
 * AI Bet Analysis API Route
 * Requires Elite subscription tier
 * Uses enhanced Claude analysis via AWS Bedrock when available
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

    // Check AI service usage limits (tier-based + purchased credits)
    const usageCheck = await checkAIServiceUsage(supabase, user.id, 'ai_bet_analyzer')

    if (!usageCheck.canUse) {
      return NextResponse.json(
        {
          error: usageCheck.reason || "TiltLab usage limit reached",
          upgrade_required: usageCheck.limit === 0,
          usage_limit_reached: usageCheck.limit > 0,
          current_usage: {
            used: usageCheck.usedThisWeek,
            limit: usageCheck.limit,
            remaining: usageCheck.remaining,
            purchased_credits: usageCheck.purchasedCredits,
            total_available: usageCheck.totalAvailable
          },
          marketplace_url: '/marketplace'
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

    // Run built-in AI analysis as a baseline
    const analysis = analyzeScenario(payload)

    // --- New 3-layer engine: odds sourcing + Perplexity + SageMaker + Claude ---
    let enhancedAnalysis: any = null
    let usedEnhancedAI = false

    try {
      const { effectiveOdds, oddsSource } = await getEffectiveOdds(payload)

      const sportKey = mapHumanSportToKey(payload.sport)
      const homeTeam = payload.favoriteTeam || payload.underdogTeam || "Home"
      const awayTeam = payload.underdogTeam || payload.favoriteTeam || "Away"

      const leagueKey = sportKey || payload.sport

      // 1) Build context + features using Perplexity where possible
      let context: CurrentGameContext | null = null
      let features: HistoricalFeatureVector | null = null
      let prediction: ModelPrediction | null = null
      let usedPerplexity = false
      let usedSageMaker = false

      try {
        if (isPerplexityAvailable()) {
          const [ctx, feats] = await Promise.all([
            getCurrentGameContext({ league: leagueKey, teamA: homeTeam, teamB: awayTeam }),
            // Historical features are optional here; can be extended later
            Promise.resolve<HistoricalFeatureVector | null>(null),
          ])

          if (ctx) context = ctx
          if (feats) features = feats
          if (ctx || feats) usedPerplexity = true
        }
      } catch (e) {
        console.warn("[Elite Analyze Bet] Perplexity research failed", e)
      }

      // Fallback context if Perplexity missing
      if (!context) {
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
        }
      }

      // Fallback features if Perplexity missing
      if (!features) {
        const impliedFromOdds = (o: number): number => {
          if (!o || Number.isNaN(o)) return 0.5
          if (o > 0) return 100 / (o + 100)
          return Math.abs(o) / (Math.abs(o) + 100)
        }

        features = {
          league: leagueKey,
          teamA: homeTeam,
          teamB: awayTeam,
          lookbackGames: 10,
          numericFeatures: [impliedFromOdds(effectiveOdds), effectiveOdds],
          categoricalFeatures: [leagueKey, payload.betType],
        }
      }

      // 2) SageMaker numeric prediction and risk scoring
      try {
        prediction = await predictGameOutcomes(features)
        usedSageMaker = true
      } catch (e) {
        console.warn("[Elite Analyze Bet] SageMaker prediction failed", e)
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
          betType: payload.betType,
          stake: payload.betAmount,
          odds: effectiveOdds,
          userProfile,
        })
      } catch (e) {
        console.warn("[Elite Analyze Bet] scoreUserBet failed", e)
      }

      // 3) Claude reasoning layer
      const userSnapshot: UserPsychologySnapshot = {
        currentEmotion: payload.currentEmotion || "neutral",
        currentEmotionIntensity: undefined,
        riskTolerance: inferRiskToleranceFromScenario(payload),
        weeklyBudget: payload.budget,
        lastOutcome: payload.lastOutcome,
        emotionalTriggers: payload.emotionalTriggers,
        recentHistorySummary: payload.history,
      }

      const baseInput: BetAnalyzerReasoningInput = {
        user: userSnapshot,
        game: {
          id: undefined,
          context,
          features,
          prediction: prediction!,
        },
        bet: {
          type: payload.betType,
          stake: payload.betAmount,
          odds: effectiveOdds,
          slipText: payload.bettingSlip,
        },
      }

      let reasoning: BetAnalyzerReasoningOutput

      try {
        reasoning = await analyzeUserBet(baseInput)
      } catch (e) {
        console.error("[Elite Analyze Bet] Claude reasoning failed, falling back to legacy enhanced route", e)
        reasoning = {
          betSafetyCategory: "CAUTION",
          stakeRecommendation: {
            amount: payload.betAmount,
            fractionOfBudget: payload.budget ? payload.betAmount / payload.budget : 0,
            explanation: "Base recommendation from rule-based advisor.",
          },
          psychologyFlags: [],
          summary: analysis.recommendation.reason,
          detailedExplanation: analysis.recommendation.reason,
          responsibleGamblingReminder: undefined,
        }
      }

      // Adapt new engine output into the existing enhanced shape expected by AIBetAdvisor
      const refinedRecommendation = mapSafetyCategoryToUnifiedRecommendation(
        reasoning.betSafetyCategory,
      )

      // Derive a confidence score (rough heuristic from riskCategory + modelConfidence)
      let confidenceScore = 70
      if (betRiskAssessment?.riskCategory === "HIGH") confidenceScore = 55
      else if (betRiskAssessment?.riskCategory === "LOW") confidenceScore = 80

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
        meta: {
          usedPerplexity,
          usedSageMaker,
          usedClaude: true,
        },
      }

      // Also nudge the base recommendation toward the refined one
      analysis.recommendation.recommendation = refinedRecommendation
      analysis.recommendation.confidence = confidenceScore
      analysis.recommendation.reason = reasoning.summary || analysis.recommendation.reason

      usedEnhancedAI = true
    } catch (engineError) {
      console.error("[Elite Analyze Bet] New 3-layer engine failed, falling back to legacy enhanced analysis:", engineError)

      // Legacy enhanced flow with Claude via getEnhancedBetAnalysis
      if (isEnhancedAIAvailable()) {
        try {
          console.log("🤖 Running legacy enhanced AI analysis with Claude...")

          let sportsDbContext:
            | { favoriteTeamForm?: string[]; underdogTeamForm?: string[] }
            | undefined
          try {
            if (payload.favoriteTeam || payload.underdogTeam) {
              const [favForm, dogForm] = await Promise.all([
                payload.favoriteTeam
                  ? fetchTeamRecentResults(payload.favoriteTeam, 5)
                  : Promise.resolve([]),
                payload.underdogTeam
                  ? fetchTeamRecentResults(payload.underdogTeam, 5)
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

          console.log("✅ Legacy enhanced AI analysis completed")
        } catch (enhancedError) {
          console.error(
            "⚠️  Legacy enhanced AI failed, continuing with baseline analysis:",
            enhancedError,
          )
        }
      } else {
        console.log("ℹ️  Enhanced AI not available, using baseline analysis only")
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

    // Record AI service usage
    await recordAIServiceUsage(supabase, user.id, 'ai_bet_analyzer', {
      sport: payload.sport,
      betType: payload.betType,
      betAmount: payload.betAmount,
      recommendation: analysis.recommendation.recommendation,
      usedEnhancedAI
    })

    return NextResponse.json({
      success: true,
      analysis,
      enhanced: enhancedAnalysis,
      usedEnhancedAI,
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
  const key = sport.toLowerCase()
  if (key.includes("nba")) return "basketball_nba"
  if (key.includes("nfl")) return "americanfootball_nfl"
  if (key.includes("mlb")) return "baseball_mlb"
  if (key.includes("nhl")) return "icehockey_nhl"
  return sport
}

async function getEffectiveOdds(payload: BetScenario): Promise<{
  effectiveOdds: number
  oddsSource: "user" | "api" | "perplexity" | "default"
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
    console.warn("[Elite Analyze Bet] Failed to source odds from APIs:", e)
  }

  // 3) Perplexity approximate odds via current game context
  try {
    if (isPerplexityAvailable() && (payload.favoriteTeam || payload.underdogTeam)) {
      const homeTeam = payload.favoriteTeam || payload.underdogTeam
      const awayTeam = payload.underdogTeam || payload.favoriteTeam
      const ctx = await getCurrentGameContext({
        league: sportKey,
        teamA: homeTeam,
        teamB: awayTeam,
      })

      if (ctx?.currentOdds?.moneylineHome || ctx?.currentOdds?.moneylineAway) {
        const approx = ctx.currentOdds.moneylineHome ?? ctx.currentOdds.moneylineAway
        if (typeof approx === "number" && Number.isFinite(approx) && approx !== 0) {
          return { effectiveOdds: Math.round(approx), oddsSource: "perplexity" }
        }
      }
    }
  } catch (e) {
    console.warn("[Elite Analyze Bet] Failed to source odds from Perplexity:", e)
  }

  // 4) Default fallback odds with explicit low-confidence marker
  const fallback = -110
  return { effectiveOdds: fallback, oddsSource: "default" }
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


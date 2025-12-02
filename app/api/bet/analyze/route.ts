import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { getCurrentGameContext, getHistoricalGameFeatures } from "@/lib/services/perplexitySportsResearcher"
import { scoreUserBet } from "@/lib/services/sagemakerSportsModel"
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
import {
  buildFeaturesCsv,
  type SerenityFeatureInput,
} from "@/lib/services/serenityFeatureBuilder"
import { predictSerenityBet } from "@/lib/services/sagemakerSerenityCsv"

function computeRecentWinRate(form?: string[]): number | undefined {
  if (!form || form.length === 0) return undefined
  let wins = 0
  let total = 0
  for (const r of form) {
    if (r === "W") {
      wins += 1
      total += 1
    } else if (r === "L" || r === "D") {
      total += 1
    }
  }
  if (total === 0) return undefined
  return wins / total
}

interface BetAnalyzeRequestBody {
  sport: string
  league?: string
  homeTeam: string
  awayTeam: string
  odds: number
  betType: string
  stake: number
  weeklyBudget: number
  riskTolerance: "conservative" | "moderate" | "aggressive"
  emotionalState: string
  emotionalIntensity?: number
  slipText?: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Subscription tier (Elite only)
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("subscription_tier")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    if (profile.subscription_tier !== "elite") {
      return NextResponse.json(
        {
          error: "This feature requires an Elite subscription",
          upgrade_required: true,
          current_tier: profile.subscription_tier,
        },
        { status: 403 },
      )
    }

    const body = (await request.json().catch(() => null)) as BetAnalyzeRequestBody | null

    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const {
      sport,
      league,
      homeTeam,
      awayTeam,
      odds,
      betType,
      stake,
      weeklyBudget,
      riskTolerance,
      emotionalState,
      emotionalIntensity,
      slipText,
    } = body

    if (!sport || !homeTeam || !awayTeam || !odds || !betType || !stake || !weeklyBudget) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: sport, homeTeam, awayTeam, odds, betType, stake, weeklyBudget",
        },
        { status: 400 },
      )
    }

    if (weeklyBudget <= 0 || stake <= 0) {
      return NextResponse.json(
        { error: "Stake and weeklyBudget must be positive numbers" },
        { status: 400 },
      )
    }

    const leagueKey = league || sport

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
          getHistoricalGameFeatures({
            league: leagueKey,
            teamA: homeTeam,
            teamB: awayTeam,
            lookbackGames: 10,
          }),
        ])

        if (ctx) context = ctx
        if (feats) features = feats
        if (ctx || feats) usedPerplexity = true
      }
    } catch (e) {
      console.warn("[Bet Analyze] Perplexity research failed", e)
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
          moneylineHome: odds,
          moneylineAway: undefined,
        },
        impliedProbabilities: {
          home: impliedFromOdds(odds),
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
        numericFeatures: [impliedFromOdds(odds), odds],
        categoricalFeatures: [leagueKey, betType],
      }
    }

    // 2) Serenity SageMaker numeric prediction over CSV (pLoss, pPush, pWin)
    let serenityProbs: { pLoss: number; pPush: number; pWin: number } = {
      pLoss: 0.33,
      pPush: 0.34,
      pWin: 0.33,
    }

    const supportedSerenityBetTypes = new Set<
      "moneyline" | "spread" | "over_under" | "parlay" | "teaser" | "prop" | "futures"
    >(["moneyline", "spread", "over_under", "parlay", "teaser", "prop", "futures"])

    if (supportedSerenityBetTypes.has(betType as any)) {
      try {
        const impliedFromOdds = (o: number): number => {
          if (!o || Number.isNaN(o)) return 0.5
          if (o > 0) return 100 / (o + 100)
          return Math.abs(o) / (Math.abs(o) + 100)
        }

        const contextImpliedHome =
          context.impliedProbabilities?.home ?? impliedFromOdds(odds)
        const contextImpliedAway = context.impliedProbabilities?.away

        const homeForm = context.teamForm?.homeRecent
        const awayForm = context.teamForm?.awayRecent

        const homeWinPct = computeRecentWinRate(homeForm)
        const awayWinPct = computeRecentWinRate(awayForm)

        let favoriteWinPct: number | undefined
        let underdogWinPct: number | undefined

        if (
          typeof contextImpliedHome === "number" &&
          typeof contextImpliedAway === "number"
        ) {
          if (contextImpliedHome >= contextImpliedAway) {
            favoriteWinPct = homeWinPct
            underdogWinPct = awayWinPct
          } else {
            favoriteWinPct = awayWinPct
            underdogWinPct = homeWinPct
          }
        } else {
          favoriteWinPct = homeWinPct
          underdogWinPct = awayWinPct
        }

        const last5WinRate = homeWinPct ?? awayWinPct

        const hasKeyInjuries = (context.keyInjuries?.length ?? 0) > 0

        const weatherText = context.weather?.toLowerCase() || ""
        const badWeather = /rain|snow|wind|storm/.test(weatherText)

        const derived = features?.derivedStats

        let favoritePpg: number | undefined
        let underdogPpg: number | undefined
        let favoriteFgPct: number | undefined
        let underdogFgPct: number | undefined
        let favoriteDefRating: number | undefined
        let underdogDefRating: number | undefined

        if (
          typeof contextImpliedHome === "number" &&
          typeof contextImpliedAway === "number" &&
          derived
        ) {
          const homeIsFavorite = contextImpliedHome >= contextImpliedAway
          if (homeIsFavorite) {
            favoritePpg = derived.homePpg
            underdogPpg = derived.awayPpg
            favoriteFgPct = derived.homeFgPct
            underdogFgPct = derived.awayFgPct
            favoriteDefRating = derived.homeDefenseRating
            underdogDefRating = derived.awayDefenseRating
          } else {
            favoritePpg = derived.awayPpg
            underdogPpg = derived.homePpg
            favoriteFgPct = derived.awayFgPct
            underdogFgPct = derived.homeFgPct
            favoriteDefRating = derived.awayDefenseRating
            underdogDefRating = derived.homeDefenseRating
          }
        } else if (derived) {
          favoritePpg = derived.homePpg
          underdogPpg = derived.awayPpg
          favoriteFgPct = derived.homeFgPct
          underdogFgPct = derived.awayFgPct
          favoriteDefRating = derived.homeDefenseRating
          underdogDefRating = derived.awayDefenseRating
        }

        const featureInput: SerenityFeatureInput = {
          sport: (leagueKey as any) || "basketball_nba",
          betType: (betType as any) || "moneyline",
          betAmount: stake,
          budget: weeklyBudget,

          favoriteWinPct,
          underdogWinPct,
          hasKeyInjuries,
          badWeather,
          isParlay: betType === "parlay",

          emotionalRisk:
            riskTolerance === "conservative"
              ? "low"
              : riskTolerance === "aggressive"
              ? "high"
              : "moderate",
          emotionalState:
            emotionalState === "positive" ||
            emotionalState === "negative" ||
            emotionalState === "dangerous"
              ? (emotionalState as any)
              : "neutral",

          chasingBehavior: false,
          highFrequencyBetting: false,
          recentLoss: false,
          recentWin: false,

          favoritePpg,
          underdogPpg,
          favoriteFgPct,
          underdogFgPct,
          favoriteDefRating,
          underdogDefRating,
          homeAdvantage: true,

          oddsAmerican: odds,
          impliedProbability: impliedFromOdds(odds),
          confidenceScore: 0.6,

          safetyRisk: "moderate",
          userExperience: "intermediate",

          emotionalIntensity:
            typeof emotionalIntensity === "number" ? emotionalIntensity : 5,

          biasOverconfidence: false,
          biasRecency: false,
          biasLossAversion: false,
          biasConfirmation: false,

          last5WinRate: typeof last5WinRate === "number" ? last5WinRate : 0.5,
          userAgeBucket: "26_35",
        }

        const csvRow = buildFeaturesCsv(featureInput)
        serenityProbs = await predictSerenityBet(csvRow)

        console.log("[Bet Analyze] Serenity SageMaker prediction succeeded", serenityProbs)

        // Map multiclass output into the generic ModelPrediction shape used by Claude
        const pWin = serenityProbs.pWin
        const pLoss = serenityProbs.pLoss
        const pPush = serenityProbs.pPush

        const norm = pWin + pLoss + pPush || 1
        const nWin = pWin / norm
        const nLoss = pLoss / norm

        prediction = {
          winProbabilityHome: nWin,
          winProbabilityAway: nLoss,
          modelConfidence: 1 - pPush,
          riskScore: nLoss,
        }

        usedSageMaker = true
      } catch (e) {
        console.warn("[Bet Analyze] Serenity SageMaker prediction failed", e)
        prediction = {
          winProbabilityHome: 0.5,
          winProbabilityAway: 0.5,
          modelConfidence: 0.5,
          riskScore: 0.5,
        }
      }
    } else {
      console.warn(
        "[Bet Analyze] Bet type not supported by Serenity SageMaker, skipping numeric prediction:",
        betType,
      )
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
        riskTolerance,
        weeklyBudget,
      }

      betRiskAssessment = await scoreUserBet({
        features,
        betType,
        stake,
        odds,
        userProfile,
      })
    } catch (e) {
      console.warn("[Bet Analyze] scoreUserBet failed", e)
    }

    // 3) Claude reasoning layer
    const userSnapshot: UserPsychologySnapshot = {
      currentEmotion: emotionalState || "neutral",
      currentEmotionIntensity:
        typeof emotionalIntensity === "number" ? emotionalIntensity : undefined,
      riskTolerance,
      weeklyBudget,
      recentHistorySummary: "",
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
        type: betType,
        stake,
        odds,
        slipText,
      },
    }

    let reasoning: BetAnalyzerReasoningOutput

    try {
      reasoning = await analyzeUserBet(baseInput)
    } catch (e) {
      console.error("[Bet Analyze] Claude reasoning failed", e)
      return NextResponse.json(
        { error: "Failed to generate AI bet analysis" },
        { status: 502 },
      )
    }

    // TODO: log to ai_analysis_logs or a dedicated table if desired

    return NextResponse.json({
      success: true,
      analysis: reasoning,
      probs: serenityProbs,
      numericRisk: betRiskAssessment,
      meta: {
        usedPerplexity,
        usedSageMaker,
        usedClaude: true,
        league: leagueKey,
        sport,
      },
    })
  } catch (error) {
    console.error("[Bet Analyze] FATAL ERROR:", error)
    return NextResponse.json(
      { error: "Failed to analyze bet" },
      { status: 500 },
    )
  }
}

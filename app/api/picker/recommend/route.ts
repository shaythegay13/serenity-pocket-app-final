import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"
import { fetchEnhancedLiveOdds } from "@/lib/enhanced-odds-api"
import { getCurrentGameContext, getHistoricalGameFeatures } from "@/lib/services/perplexitySportsResearcher"
import { generatePickerRecommendations } from "@/lib/services/bedrockClaudeReasoner"
import type {
  CurrentGameContext,
  HistoricalFeatureVector,
  ModelPrediction,
  PickerReasoningInput,
  PickerReasoningOutput,
  UserPsychologySnapshot,
} from "@/lib/types/ai-models"
import { isPerplexityAvailable } from "@/lib/perplexity"
import { isEnhancedAIAvailable } from "@/lib/aws-bedrock"
import {
  buildFeaturesCsv,
  type SerenityFeatureInput,
} from "@/lib/services/serenityFeatureBuilder"
import { predictSerenityBet } from "@/lib/services/sagemakerSerenityCsv"
import { checkAIServiceUsage, recordAIServiceUsage } from "@/lib/ai-usage-tracker"

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

interface PickerRequestBody {
  sport?: string
  emotionalScore?: number
  riskTolerance?: "conservative" | "moderate" | "aggressive"
  weeklyBudget?: number
  currentEmotion?: string
  currentEmotionIntensity?: number
}

function oddsToImpliedProb(odds: number): number {
  if (!Number.isFinite(odds) || odds === 0) return 0.5
  if (odds > 0) return 100 / (odds + 100)
  return Math.abs(odds) / (Math.abs(odds) + 100)
}

function buildFallbackRecommendations(args: {
  games: Array<{ id?: string; context: CurrentGameContext }>
  riskTolerance: "conservative" | "moderate" | "aggressive"
  weeklyBudget: number
  emotionalScore?: number
}): PickerReasoningOutput {
  const minImplied =
    args.riskTolerance === "conservative"
      ? 0.6
      : args.riskTolerance === "moderate"
        ? 0.55
        : 0.5

  const stakeFraction =
    args.riskTolerance === "aggressive"
      ? 0.08
      : args.riskTolerance === "conservative"
        ? 0.04
        : 0.06

  const alignment =
    typeof args.emotionalScore === "number" && Number.isFinite(args.emotionalScore)
      ? Math.max(0, Math.min(100, Math.round(args.emotionalScore)))
      : 70

  const picks = args.games
    .map((g) => {
      const ctx = g.context
      const homeOdds = ctx.currentOdds?.moneylineHome
      const awayOdds = ctx.currentOdds?.moneylineAway

      if (typeof homeOdds !== "number" || typeof awayOdds !== "number") return null

      const homeImplied = oddsToImpliedProb(homeOdds)
      const awayImplied = oddsToImpliedProb(awayOdds)

      const homeIsFav = homeImplied >= awayImplied
      const implied = homeIsFav ? homeImplied : awayImplied

      if (implied < minImplied) return null

      const pickTeam = homeIsFav ? ctx.homeTeam : ctx.awayTeam
      const odds = homeIsFav ? homeOdds : awayOdds

      const suggestedStakeAbsolute = Math.max(5, Math.round(args.weeklyBudget * stakeFraction))
      const riskLevel =
        args.riskTolerance === "conservative" ? "LOW" : args.riskTolerance === "aggressive" ? "HIGH" : "MEDIUM"

      const item = {
        gameId: g.id,
        teams: `${ctx.awayTeam} @ ${ctx.homeTeam}`,
        startTime: ctx.startTime,
        betType: "moneyline",
        line: `${pickTeam} ML`,
        odds,
        emotionalAlignment: alignment,
        confidence: Math.max(0, Math.min(100, Math.round(implied * 100))),
        suggestedStakeFraction: stakeFraction,
        suggestedStakeAbsolute,
        riskLevel,
        shortExplanation:
          "Fallback pick based on available odds and your risk preference. Consider this informational only and verify lines before betting.",
      }

      return item
    })
    .filter(Boolean) as PickerReasoningOutput["recommendations"]

  return { recommendations: picks.slice(0, 3) }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseServer

    const authHeader = request.headers.get("authorization") || ""
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : undefined

    // Authentication using JWT access token
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check AI service usage limits (tier-based + purchased credits)
    const usageCheck = await checkAIServiceUsage(supabase, user.id, 'ai_picker')

    if (!usageCheck.canUse) {
      return NextResponse.json(
        {
          error: usageCheck.reason || "AI Picker usage limit reached",
          upgrade_required: usageCheck.limit === 0, // No tier access at all
          usage_limit_reached: usageCheck.limit > 0, // Has tier access but limit reached
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

    const body = (await request.json().catch(() => ({}))) as PickerRequestBody

    const sport = body.sport || "basketball_nba"
    const emotionalScore =
      typeof body.emotionalScore === "number" ? body.emotionalScore : 70
    const riskTolerance = body.riskTolerance || "moderate"
    const weeklyBudget = typeof body.weeklyBudget === "number" && body.weeklyBudget > 0
      ? body.weeklyBudget
      : 500

    if (typeof emotionalScore !== "number" || emotionalScore < 0 || emotionalScore > 100) {
      return NextResponse.json(
        { error: "Invalid emotional score. Must be between 0-100." },
        { status: 400 },
      )
    }

    if (emotionalScore < 70) {
      return NextResponse.json({
        success: true,
        shouldBet: false,
        message: `Your emotional stability score is ${emotionalScore}/100. We recommend waiting until you're in a more stable state (70+) before placing bets.`,
        recommendations: [],
        emotionalScore,
      })
    }

    // If enhanced AI stack (Claude via Bedrock) is not available, return a safe
    // neutral response instead of attempting to generate AI picks.
    if (!isEnhancedAIAvailable()) {
      return NextResponse.json({
        success: false,
        shouldBet: false,
        message:
          "Enhanced AI picks are not configured in this environment. Set AWS and Bedrock env vars to enable AI Picks.",
        error: "Enhanced AI unavailable",
        recommendations: [],
        emotionalScore,
      })
    }

    // 1. Fetch live odds using the enhanced odds abstraction (RapidAPI + The Odds API)
    const oddsResult = await fetchEnhancedLiveOdds(sport, "auto")

    if (!oddsResult.success || !Array.isArray(oddsResult.data) || oddsResult.data.length === 0) {
      return NextResponse.json({
        success: true,
        shouldBet: false,
        message:
          oddsResult.error ||
          "No live games are available for this sport right now. Please check back later.",
        recommendations: [],
        emotionalScore,
        meta: {
          sport,
          source: oddsResult.source,
        },
      })
    }

    const games = oddsResult.data as Array<any>

    // Limit research and SageMaker work to the top 6 games by interest.
    // Interest is defined deterministically using existing fields only:
    // 1) Earlier commence_time first
    // 2) Tie-breaker: larger absolute home moneyline odds (bigger mismatch)
    const sortedGames = [...games].sort((a, b) => {
      const getCommence = (g: any): number => {
        const t: unknown = g.commenceTime || g.commence_time
        if (t instanceof Date) return t.getTime()
        if (typeof t === "string") {
          const ts = Date.parse(t)
          if (!Number.isNaN(ts)) return ts
        }
        return Number.MAX_SAFE_INTEGER
      }

      const getHomeOdds = (g: any): number => {
        const o =
          g.homeOdds?.best?.odds ??
          g.home_odds?.best?.odds ??
          g.homeOdds?.odds ??
          g.home_odds?.odds ??
          0
        return typeof o === "number" && !Number.isNaN(o) ? o : 0
      }

      const ta = getCommence(a)
      const tb = getCommence(b)
      if (ta !== tb) return ta - tb

      const oa = Math.abs(getHomeOdds(a))
      const ob = Math.abs(getHomeOdds(b))
      return ob - oa
    })

    const limitedGames = sortedGames.slice(0, 6)

    const usedPerplexityFlags: boolean[] = []
    const serenityUsedFlags: boolean[] = []

    const enrichedGames = await Promise.all(
      limitedGames.map(async (game) => {
        const homeTeam: string = game.homeTeam || game.home_team
        const awayTeam: string = game.awayTeam || game.away_team
        const league: string = game.sportKey || game.sport_key || sport
        const gameId: string | undefined = game.id

        let context: CurrentGameContext | null = null
        let features: HistoricalFeatureVector | null = null
        let usedPerplexityForGame = false

        // Best-effort Perplexity research for current context and historical features
        try {
          if (isPerplexityAvailable()) {
            const [ctx, feats] = await Promise.all([
              getCurrentGameContext({ league, teamA: homeTeam, teamB: awayTeam }),
              getHistoricalGameFeatures({
                league,
                teamA: homeTeam,
                teamB: awayTeam,
                lookbackGames: 10,
              }),
            ])

            if (ctx) {
              context = ctx
            }
            if (feats) {
              features = feats
            }

            if (ctx || feats) {
              usedPerplexityForGame = true
            }
          }
        } catch (e) {
          console.warn("[Picker] Perplexity research failed for game", gameId, e)
        }

        // Fallback context from live odds if Perplexity not available or incomplete
        if (!context) {
          const homeOdds =
            game.homeOdds?.best?.odds ?? game.home_odds?.best?.odds ?? undefined
          const awayOdds =
            game.awayOdds?.best?.odds ?? game.away_odds?.best?.odds ?? undefined

          const impliedFromOdds = (odds: number | undefined): number | undefined => {
            if (typeof odds !== "number" || Number.isNaN(odds)) return undefined
            if (odds > 0) return 100 / (odds + 100)
            return Math.abs(odds) / (Math.abs(odds) + 100)
          }

          context = {
            gameId,
            league,
            homeTeam,
            awayTeam,
            startTime:
              game.commenceTime?.toISOString?.() ||
              (typeof game.commence_time === "string" ? game.commence_time : undefined),
            currentOdds: {
              moneylineHome: homeOdds,
              moneylineAway: awayOdds,
            },
            impliedProbabilities: {
              home: impliedFromOdds(homeOdds),
              away: impliedFromOdds(awayOdds),
            },
          }
        }

        // Fallback features if Perplexity did not return historical vector
        if (!features) {
          const homeOdds =
            game.homeOdds?.best?.odds ?? game.home_odds?.best?.odds ?? 0
          const awayOdds =
            game.awayOdds?.best?.odds ?? game.away_odds?.best?.odds ?? 0

          const impliedFromOdds = (odds: number): number => {
            if (!odds || Number.isNaN(odds)) return 0.5
            if (odds > 0) return 100 / (odds + 100)
            return Math.abs(odds) / (Math.abs(odds) + 100)
          }

          features = {
            league,
            teamA: homeTeam,
            teamB: awayTeam,
            lookbackGames: 10,
            numericFeatures: [
              impliedFromOdds(homeOdds),
              impliedFromOdds(awayOdds),
              homeOdds,
              awayOdds,
            ],
            categoricalFeatures: [league],
          }
        }

        // Serenity SageMaker multiclass probabilities for this game
        let serenityProbs: { pLoss: number; pPush: number; pWin: number } = {
          pLoss: 0.33,
          pPush: 0.34,
          pWin: 0.33,
        }

        let prediction: ModelPrediction
        try {
          const homeOdds =
            game.homeOdds?.best?.odds ?? game.home_odds?.best?.odds ?? 0

          const impliedFromOdds = (odds: number): number => {
            if (!odds || Number.isNaN(odds)) return 0.5
            if (odds > 0) return 100 / (odds + 100)
            return Math.abs(odds) / (Math.abs(odds) + 100)
          }

          const contextImpliedHome =
            context.impliedProbabilities?.home ?? impliedFromOdds(homeOdds)
          const contextImpliedAway =
            context.impliedProbabilities?.away ?? undefined

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

          const last5WinRate =
            homeWinPct ?? awayWinPct ?? undefined

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
            sport: (league as any) || "basketball_nba",
            betType: "moneyline",
            betAmount: weeklyBudget * 0.05,
            budget: weeklyBudget,

            favoriteWinPct,
            underdogWinPct,
            hasKeyInjuries,
            badWeather,
            isParlay: false,

            emotionalRisk:
              riskTolerance === "conservative"
                ? "low"
                : riskTolerance === "aggressive"
                ? "high"
                : "moderate",
            emotionalState:
              body.currentEmotion === "positive" ||
              body.currentEmotion === "negative" ||
              body.currentEmotion === "dangerous"
                ? (body.currentEmotion as any)
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

            oddsAmerican: homeOdds,
            impliedProbability: impliedFromOdds(homeOdds),
            confidenceScore: 0.6,

            safetyRisk: "moderate",
            userExperience: "intermediate",

            emotionalIntensity:
              typeof body.currentEmotionIntensity === "number"
                ? body.currentEmotionIntensity
                : Math.round(emotionalScore / 10),

            biasOverconfidence: false,
            biasRecency: false,
            biasLossAversion: false,
            biasConfirmation: false,

            last5WinRate: typeof last5WinRate === "number" ? last5WinRate : 0.5,
            userAgeBucket: "26_35",
          }

          const csvRow = buildFeaturesCsv(featureInput)
          serenityProbs = await predictSerenityBet(csvRow)

          console.log("[Picker] Serenity SageMaker prediction succeeded for game", gameId, serenityProbs)

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

          serenityUsedFlags.push(true)
        } catch (e) {
          console.warn("[Picker] Serenity SageMaker prediction failed for game", gameId, e)
          prediction = {
            winProbabilityHome: 0.5,
            winProbabilityAway: 0.5,
            modelConfidence: 0.5,
            riskScore: 0.5,
          }
          serenityUsedFlags.push(false)
        }

        usedPerplexityFlags.push(usedPerplexityForGame)

        return {
          id: gameId,
          context,
          features,
          prediction,
          probs: serenityProbs,
        }
      }),
    )

    const userSnapshot: UserPsychologySnapshot = {
      currentEmotion: body.currentEmotion || "neutral",
      currentEmotionIntensity:
        typeof body.currentEmotionIntensity === "number"
          ? body.currentEmotionIntensity
          : Math.round(emotionalScore / 10),
      riskTolerance,
      weeklyBudget,
      recentHistorySummary: "", // Can be enriched later from logs
    }

    const reasoningInput: PickerReasoningInput = {
      user: userSnapshot,
      games: enrichedGames,
    }

    let reasoningOutput = await generatePickerRecommendations(reasoningInput)
    if (!reasoningOutput.recommendations || reasoningOutput.recommendations.length === 0) {
      reasoningOutput = buildFallbackRecommendations({
        games: enrichedGames.map((g) => ({ id: g.id, context: g.context })),
        riskTolerance,
        weeklyBudget,
        emotionalScore,
      })
    }

    const anyPerplexityUsed = usedPerplexityFlags.some(Boolean)

    // Build a simple map of Serenity probabilities keyed by gameId for the frontend
    const probsByGameId: Record<
      string,
      { pLoss: number; pPush: number; pWin: number }
    > = {}
    for (const g of enrichedGames) {
      if (g.id && g.probs) {
        probsByGameId[g.id] = g.probs
      }
    }

    // Record AI service usage
    await recordAIServiceUsage(supabase, user.id, 'ai_picker', {
      sport,
      emotionalScore,
      riskTolerance,
      recommendations_count: reasoningOutput.recommendations.length,
      used_perplexity: anyPerplexityUsed,
      used_sagemaker: serenityUsedFlags.some(Boolean)
    })

    return NextResponse.json({
      success: true,
      shouldBet: reasoningOutput.recommendations.length > 0,
      message:
        reasoningOutput.recommendations.length > 0
          ? `Found ${reasoningOutput.recommendations.length} recommendations tailored to your risk profile and emotional state.`
          : "No high-quality recommendations at this time. Staying patient is often the best decision.",
      recommendations: reasoningOutput.recommendations,
      emotionalScore,
      meta: {
        sport,
        oddsSource: oddsResult.source,
        usedPerplexity: anyPerplexityUsed,
        usedSageMaker: serenityUsedFlags.some(Boolean),
        usedClaude: true,
      },
      probsByGameId,
    })
  } catch (error) {
    console.error("[Picker] FATAL ERROR in /api/picker/recommend:", error)
    return NextResponse.json({
      success: false,
      shouldBet: false,
      message:
        "Enhanced AI picks are temporarily unavailable due to an internal error. Please try again later.",
      error: "Failed to generate picker recommendations",
      recommendations: [],
    })
  }
}

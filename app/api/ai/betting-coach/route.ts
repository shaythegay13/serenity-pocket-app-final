import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"
import { fetchLiveOdds, transformOddsForDisplay } from "@/lib/odds-api"
import { fetchTeamRecentResults } from "@/lib/sports-data-api"
import { isEnhancedAIAvailable, invokeClaude } from "@/lib/aws-bedrock"

// ---- Types for request payload ----

interface UserStateContext {
  emotionalStabilityScore: number
  emotionalStabilityLevel: "LOW" | "MODERATE" | "HIGH"
  emotionalRecommendation: string
  recentEmotions: Array<{
    timestamp: string
    emotion: string
    intensity: number
  }>
  currentEmotion?: string
  currentEmotionIntensity?: number
  biasProfile?: {
    confirmationBias?: number
    lossAversion?: number
    anchoringBias?: number
    recencyBias?: number
    overconfidenceBias?: number
    herdMentality?: number
  }
  cooldownEnabled: boolean
  behaviorNudgesEnabled?: boolean
}

interface BetHistoryContext {
  lastBets: Array<{
    timestamp: string
    stake: number
    odds: number
    outcome: string
    expectedValue?: number
  }>
  last7NetResult: number
  last7Wins: number
  last7Losses: number
  currentLossStreak: number
  currentWinStreak: number
  averageStake: number
  biggestRecentLoss: number
  biggestRecentWin: number
}

interface BankrollContext {
  weeklyBudget?: number
  weeklyStakedSoFar?: number
  maxStakeLimit?: number
  typicalBetAmount?: number
  weekToDateNetResult?: number
}

interface UserBetPlan {
  stake: number
  odds: number
  description: string
  reasonForBet: string
  isChasing?: boolean
  isBoredomBet?: boolean
  isFOMO?: boolean
}

interface ClientPayload {
  sportKey: string
  gameId: string
  isFavoriteTeam: boolean
  isRivalTeam: boolean
  userNotesAboutGame?: string
  userState: UserStateContext
  betHistory: BetHistoryContext
  bankroll: BankrollContext
  userBetPlan: UserBetPlan
}

// ---- Route handler ----

export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseServer

    // Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Subscription tier check (Elite required)
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
        { status: 403 }
      )
    }

    const payload = (await request.json()) as ClientPayload

    if (!payload.sportKey || !payload.gameId || !payload.userBetPlan) {
      return NextResponse.json(
        { error: "Missing required fields: sportKey, gameId, userBetPlan" },
        { status: 400 }
      )
    }

    // Fetch odds and auto-build game + market context from APIs
    const liveOddsRes = await fetchLiveOdds(payload.sportKey)
    if (!liveOddsRes.success || !liveOddsRes.data || liveOddsRes.data.length === 0) {
      return NextResponse.json(
        { error: "Failed to fetch live odds for this sport" },
        { status: 502 }
      )
    }

    const displayGames = transformOddsForDisplay(liveOddsRes.data)
    const game = displayGames.find((g: any) => g.id === payload.gameId)

    if (!game) {
      return NextResponse.json(
        { error: "Game not found in live odds data" },
        { status: 404 }
      )
    }

    // Build market context for the user's side using best/median/worst across books
    const userOdds = Number(payload.userBetPlan.odds)

    const allHomeOdds = (game.homeOdds?.all || []) as Array<{ bookmaker: string; odds: number }>
    const allAwayOdds = (game.awayOdds?.all || []) as Array<{ bookmaker: string; odds: number }>

    const allOdds = [...allHomeOdds, ...allAwayOdds]
    const sortedByOdds = [...allOdds].sort((a, b) => a.odds - b.odds)
    const bestAvailable = allOdds.reduce((best: any, cur: any) => {
      // For American odds, "best" for backing is highest value
      return cur.odds > best.odds ? cur : best
    }, allOdds[0] || { bookmaker: "", odds: userOdds })

    const worstAvailable = allOdds.reduce((worst: any, cur: any) => {
      return cur.odds < worst.odds ? cur : worst
    }, allOdds[0] || { bookmaker: "", odds: userOdds })

    const medianMarketOdds = (() => {
      if (!sortedByOdds.length) return userOdds
      const mid = Math.floor(sortedByOdds.length / 2)
      if (sortedByOdds.length % 2 === 0) {
        return (sortedByOdds[mid - 1].odds + sortedByOdds[mid].odds) / 2
      }
      return sortedByOdds[mid].odds
    })()

    const impliedProb = (odds: number) => {
      if (!odds || Number.isNaN(odds)) return 0
      if (odds > 0) return 100 / (odds + 100)
      return Math.abs(odds) / (Math.abs(odds) + 100)
    }

    const impliedUser = impliedProb(userOdds)
    const impliedMedian = impliedProb(medianMarketOdds)

    let priceQuality: "GOOD" | "FAIR" | "POOR" = "FAIR"
    if (userOdds >= bestAvailable.odds) priceQuality = "GOOD"
    else if (userOdds <= worstAvailable.odds) priceQuality = "POOR"

    const marketContext = {
      userSide: "other" as const,
      marketType: "moneyline" as const,
      userChosenOdds: userOdds,
      bestAvailableOdds: bestAvailable.odds,
      worstAvailableOdds: worstAvailable.odds,
      medianMarketOdds,
      impliedProbUserSide: impliedUser,
      impliedProbOpposite: 1 - impliedUser,
      priceQuality,
    }

    const gameContext = {
      sportKey: payload.sportKey,
      sportTitle: game.sport,
      homeTeam: game.homeTeam,
      awayTeam: game.awayTeam,
      commenceTime: game.commenceTime?.toISOString?.() || new Date().toISOString(),
      isFavoriteTeam: payload.isFavoriteTeam,
      isRivalTeam: payload.isRivalTeam,
      userNotesAboutGame: payload.userNotesAboutGame || "",
    }

    // Best-effort: enrich with TheSportsDB recent form for each team
    let sportsDbContext: any = null
    try {
      const [homeForm, awayForm] = await Promise.all([
        fetchTeamRecentResults(game.homeTeam, 5),
        fetchTeamRecentResults(game.awayTeam, 5),
      ])

      if ((homeForm && homeForm.length) || (awayForm && awayForm.length)) {
        sportsDbContext = {
          homeTeamForm: homeForm,
          awayTeamForm: awayForm,
        }
      }
    } catch (e) {
      console.warn("[AI Coach] Failed to load TheSportsDB context:", e)
    }

    // If Claude is not available, return a conservative built-in recommendation
    if (!isEnhancedAIAvailable()) {
      const conservative = buildConservativeRecommendation(
        payload.userState,
        payload.betHistory,
        payload.bankroll,
        gameContext,
        marketContext,
        payload.userBetPlan
      )

      return NextResponse.json({
        success: true,
        usedEnhancedAI: false,
        recommendation: conservative,
      })
    }

    // Build Claude prompts
    const systemPrompt = `You are an AI betting coach focused on responsible gambling and harm reduction.
You must:
- Combine psychological state, bankroll health, and market/odds efficiency
- Prioritize emotional and financial safety over profit
- Be direct and honest, but empathetic
- Give a clear recommendation: BET, MAYBE, or DONT_BET.
- Explain reasoning separately for psychology, bankroll, and market.`

    const coachInput = {
      userState: payload.userState,
      betHistory: payload.betHistory,
      bankroll: payload.bankroll,
      gameContext,
      marketContext,
      userBetPlan: payload.userBetPlan,
      sportsDbContext,
    }

    const userPrompt = `Analyze this betting scenario and respond ONLY with JSON.

${JSON.stringify(coachInput, null, 2)}

Return JSON in this shape:
{
  "recommendation": "BET" | "MAYBE" | "DONT_BET",
  "overallMessage": string,
  "psychology": {
    "riskLevel": "LOW" | "MEDIUM" | "HIGH",
    "keyFactors": string[],
    "suggestedActions": string[]
  },
  "bankroll": {
    "riskLevel": "LOW" | "MEDIUM" | "HIGH",
    "stakeAsPctOfWeeklyBudget": number | null,
    "stakeVsTypicalBet": number | null,
    "keyFactors": string[],
    "suggestedStake": number | null
  },
  "market": {
    "efficiencyView": "GOOD_PRICE" | "NEUTRAL" | "BAD_PRICE",
    "keyFactors": string[],
    "betterLineSuggestion": {
      "bookmakerName"?: string,
      "suggestedOdds"?: number,
      "suggestedLine"?: string
    } | null
  },
  "scores": {
    "psychologyScore": number,
    "bankrollScore": number,
    "marketScore": number,
    "overallScore": number
  },
  "safetyWarnings": string[]
}`

    const rawText = await invokeClaude({
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
      max_tokens: 2000,
      temperature: 0.5,
    })

    let jsonText = rawText.trim()
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "")
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```\n?/g, "")
    }

    const parsed = JSON.parse(jsonText)

    return NextResponse.json({
      success: true,
      usedEnhancedAI: true,
      recommendation: parsed,
    })
  } catch (error) {
    console.error("AI betting coach error:", error)
    return NextResponse.json(
      { error: "Failed to analyze betting scenario" },
      { status: 500 }
    )
  }
}

function buildConservativeRecommendation(
  userState: UserStateContext,
  betHistory: BetHistoryContext,
  bankroll: BankrollContext,
  gameContext: any,
  marketContext: any,
  userBetPlan: UserBetPlan
) {
  const emotionalHighRisk = userState.emotionalStabilityScore < 60 || userState.cooldownEnabled
  const largeStakeVsBudget =
    bankroll.weeklyBudget && userBetPlan.stake > bankroll.weeklyBudget * 0.2

  const baseRecommendation = emotionalHighRisk || largeStakeVsBudget ? "DONT_BET" : "MAYBE"

  const safetyWarnings: string[] = []
  if (emotionalHighRisk) {
    safetyWarnings.push("Emotional stability is low or cooldown is enabled.")
  }
  if (largeStakeVsBudget) {
    safetyWarnings.push("Stake is large relative to weekly budget (over 20%).")
  }
  if (betHistory.currentLossStreak >= 3) {
    safetyWarnings.push("Multiple losses in a row detected. High risk of chasing losses.")
  }

  return {
    recommendation: baseRecommendation,
    overallMessage:
      baseRecommendation === "DONT_BET"
        ? "Based on your current state and stake size, it is safer not to bet on this game."
        : "There are some risks present. If you choose to bet, consider reducing your stake and treating this as a low-stakes fun bet.",
    psychology: {
      riskLevel: emotionalHighRisk ? "HIGH" : "MODERATE",
      keyFactors: [
        `Emotional stability score: ${userState.emotionalStabilityScore}`,
        userState.cooldownEnabled ? "Safety cooldown is enabled." : "Cooldown not enabled.",
      ],
      suggestedActions: [
        "Log your current emotions in the Behavior tab before betting.",
        "Take a short break and re-evaluate your reasons for this bet.",
      ],
    },
    bankroll: {
      riskLevel: largeStakeVsBudget ? "HIGH" : "MODERATE",
      stakeAsPctOfWeeklyBudget:
        bankroll.weeklyBudget && bankroll.weeklyBudget > 0
          ? (userBetPlan.stake / bankroll.weeklyBudget) * 100
          : null,
      stakeVsTypicalBet:
        bankroll.typicalBetAmount && bankroll.typicalBetAmount > 0
          ? userBetPlan.stake / bankroll.typicalBetAmount
          : null,
      keyFactors: [
        bankroll.weeklyBudget
          ? `Weekly budget: $${bankroll.weeklyBudget}`
          : "Weekly budget not set.",
        `Planned stake: $${userBetPlan.stake}`,
      ],
      suggestedStake: largeStakeVsBudget && bankroll.weeklyBudget
        ? Math.round(bankroll.weeklyBudget * 0.1)
        : null,
    },
    market: {
      efficiencyView: marketContext.priceQuality === "GOOD" ? "GOOD_PRICE" : marketContext.priceQuality === "POOR" ? "BAD_PRICE" : "NEUTRAL",
      keyFactors: [
        `Your odds: ${userBetPlan.odds}`,
        `Best available: ${marketContext.bestAvailableOdds}`,
      ],
      betterLineSuggestion: null,
    },
    scores: {
      psychologyScore: userState.emotionalStabilityScore,
      bankrollScore: largeStakeVsBudget ? 40 : 70,
      marketScore: marketContext.priceQuality === "GOOD" ? 80 : marketContext.priceQuality === "POOR" ? 40 : 60,
      overallScore: emotionalHighRisk || largeStakeVsBudget ? 45 : 65,
    },
    safetyWarnings,
  }
}

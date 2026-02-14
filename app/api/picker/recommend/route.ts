import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"
import { fetchEnhancedLiveOdds } from "@/lib/enhanced-odds-api"
import { generatePickerRecommendations } from "@/lib/services/gemini-reasoner"
import { generateParlayRecommendations } from "@/lib/parlay-utils"
import {
  conductSportsResearch,
  type SportsResearchInput,
  type SportsResearchOutput,
} from "@/lib/sports-research"
import type {
  CurrentGameContext,
  HistoricalFeatureVector,
  ModelPrediction,
  PickerReasoningInput,
  PickerReasoningOutput,
  UserPsychologySnapshot,
  ParlayRecommendation,
} from "@/lib/types/ai-models"
import { isEnhancedAIAvailable } from "@/lib/ai-service"
import {
  buildFeaturesCsv,
  type SerenityFeatureInput,
} from "@/lib/services/serenityFeatureBuilder"
import { checkAIServiceUsage, recordAIServiceUsage } from "@/lib/ai-usage-tracker"
import { emotionalStabilityService } from "@/lib/services/emotional-stability-service"
import { computeEvFromProbAndOdds } from "@/lib/ev-calculator"
import {
  calculateRiskIndex,
  getKellyFraction,
  getSportVariance,
} from "@/lib/risk-index"
import { getSportById } from "@/lib/sports-config"

// -- ANCHORED RISK IMPORTS --
import {
  computeAnchoredRisk,
  getRiskLevelLabel,
  shouldBlockBetting,
  type UserRiskProfile,
  type BettingSession,
} from "@/lib/risk-models"
import {
  RESEARCH_CITATIONS,
  type DemographicProfile,
  type GamblingBehaviorProfile,
  type PgsiSbResponse,
} from "@/lib/research-anchors"

// -- NEW EV STACK IMPORTS --
import { computeEv, EvDiagnostics, EvInputs, impliedProbFromAmerican } from "@/lib/ev-calculator"
import { BasicBlendingTrueProbabilityEngine } from "@/lib/true-probability-engine"
import { SimpleEmbeddingClient, GeminiLlmClient } from "@/lib/clients/ai-clients"
import { LlmTrueProbabilityService, GameContext } from "@/services/true-probability-llm-service"
import { SmartSlipEvService, SmartSlipLegInput } from "@/services/smart-slip-ev"

// Instantiate services (stateless/singleton safe)
const embeddingClient = new SimpleEmbeddingClient()
const llmClient = new GeminiLlmClient()
const probabilityEngine = new BasicBlendingTrueProbabilityEngine()
const llmProbService = new LlmTrueProbabilityService({
  embeddingClient,
  llmClient,
  probabilityEngine
})
const smartSlipService = new SmartSlipEvService(llmProbService)

function getNoGamesMessage(sport: string): string {
  const now = new Date()
  const month = now.getMonth() // 0-indexed

  const sportMessages: Record<string, string> = {
    basketball_nba: month === 1
      ? "No NBA games scheduled right now — the league is likely on All-Star break. Games typically resume after the All-Star Game. Try another sport or check back soon!"
      : month >= 6 && month <= 9
        ? "The NBA is currently in the off-season. The regular season starts in October."
        : "No upcoming NBA games found right now. Games are usually scheduled in the evening (ET). Check back later today!",
    americanfootball_nfl: month >= 1 && month <= 8
      ? "The NFL season has ended. The next season starts in September. Try NBA, NHL, or NCAAB in the meantime!"
      : "No upcoming NFL games right now. Games are typically on Sundays, Mondays, and Thursdays.",
    baseball_mlb: month >= 10 || month <= 2
      ? "MLB is in the off-season. Spring Training starts in February and the regular season begins in late March."
      : "No upcoming MLB games found right now. Check back closer to game time!",
    icehockey_nhl: month === 1
      ? "No NHL games right now — the league may be on All-Star break. Games typically resume shortly after."
      : month >= 6 && month <= 9
        ? "The NHL is currently in the off-season. The regular season starts in October."
        : "No upcoming NHL games found right now. Check back later today!",
    basketball_ncaab: "No upcoming NCAAB games found right now. College basketball games are usually scheduled in the evening.",
    americanfootball_ncaaf: month >= 1 && month <= 7
      ? "College football is in the off-season. The season starts in late August."
      : "No upcoming NCAAF games right now. Games are typically on Saturdays.",
  }

  return sportMessages[sport] || `No upcoming games found for this sport right now. The league may be between seasons or on a break. Please try another sport or check back later.`
}

async function callPsychPicker(
  emotionalScore: number,
  riskTolerance: string,
): Promise<any> {
  return new Promise((resolve) => {
    const { exec } = require("child_process")
    exec(
      `python psych_model_picker.py ${emotionalScore} ${riskTolerance}`,
      (error: any, stdout: string) => {
        if (error) {
          console.error("[PsychPicker] Failed:", error)
          resolve({
            model_id: "growth_optimizer_v3",
            params: { max_stake_multiplier: 1.0 },
          })
        } else {
          try {
            resolve(JSON.parse(stdout))
          } catch {
            resolve({
              model_id: "growth_optimizer_v3",
              params: { max_stake_multiplier: 1.0 },
            })
          }
        }
      },
    )
  })
}

// Increase timeout for complex AI analysis and ML predictions
export const maxDuration = 60 // 60 seconds

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
  riskTolerance?: "conservative" | "moderate" | "aggressive"
  weeklyBudget?: number
  currentEmotion?: string
  currentEmotionIntensity?: number
}

function normalizeSportKey(input?: string): string {
  const raw = String(input || "").trim()
  if (!raw) return "basketball_nba"
  const v = raw.toLowerCase()
  if (v === "basketball_nba" || v.includes("basketball_nba")) return "basketball_nba"
  if (v === "americanfootball_nfl" || v.includes("americanfootball_nfl"))
    return "americanfootball_nfl"
  if (v === "baseball_mlb" || v.includes("baseball_mlb")) return "baseball_mlb"
  if (v === "icehockey_nhl" || v.includes("icehockey_nhl")) return "icehockey_nhl"
  if (v === "nba" || v.includes(" nba")) return "basketball_nba"
  if (v === "nfl" || v.includes(" nfl")) return "americanfootball_nfl"
  if (v === "mlb" || v.includes(" mlb")) return "baseball_mlb"
  if (v === "nhl" || v.includes(" nhl")) return "icehockey_nhl"
  if (v.includes("ncaab") || v.includes("ncaa_basketball")) return "basketball_ncaab"
  if (v.includes("ncaaf") || v.includes("ncaa_football")) return "americanfootball_ncaaf"
  if (v.includes("epl") || v.includes("premier league")) return "soccer_epl"
  if (v.includes("mls")) return "soccer_mls"
  if (v.includes("ucl") || v.includes("champions league"))
    return "soccer_champions_league"
  if (v.includes("ufc") || v.includes("mma")) return "mma_ufc"
  if (v.includes("boxing")) return "boxing"
  if (v.includes("atp")) return "tennis_atp"
  if (v.includes("wta")) return "tennis_wta"
  if (v.includes("tennis")) return "tennis_atp"
  if (v.includes("pga")) return "golf_pga"
  if (v.includes("golf")) return "golf_pga"
  if (v.includes("f1")) return "motorsports_f1"
  if (v.includes("nascar")) return "motorsports_nascar"
  if (v.includes("lol")) return "esports_lol"
  if (v.includes("csgo")) return "esports_csgo"
  return raw
}

function oddsToImpliedProb(odds: number, sportKey: string = ""): number {
  return impliedProbFromAmerican(odds) // Use new EV stack helper
}

async function buildFallbackRecommendations(args: {
  games: Array<{ id?: string; context: CurrentGameContext }>
  riskTolerance: "conservative" | "moderate" | "aggressive"
  weeklyBudget: number // advisory only
  emotionalScore?: number
}): Promise<PickerReasoningOutput> {
  const alignment =
    typeof args.emotionalScore === "number"
      ? Math.max(0, Math.min(100, Math.round(args.emotionalScore)))
      : 70

  const riskLevel =
    args.riskTolerance === "conservative"
      ? "LOW"
      : args.riskTolerance === "aggressive"
        ? "HIGH"
        : "MEDIUM"

  const baseStake =
    args.riskTolerance === "aggressive"
      ? 40
      : args.riskTolerance === "conservative"
        ? 15
        : 25

  const potentialPicks: any[] = []

  for (const g of args.games) {
    const ctx = g.context
    if (!ctx) continue

    // Helper to map context - include research notes for better AI probability signals
    const teamFormNotes = ctx.teamForm
      ? `Home form: ${ctx.teamForm.homeRecent?.join(',') || 'unknown'}. Away form: ${ctx.teamForm.awayRecent?.join(',') || 'unknown'}.`
      : '';

    const mapContext = (marketType: 'moneyline' | 'spread' | 'total', marketSide: any): GameContext => ({
      gameId: g.id || 'unknown',
      sport: ctx.league || 'unknown',
      teams: {
        home: ctx.homeTeam || 'Home',
        away: ctx.awayTeam || 'Away'
      },
      marketType,
      marketSide,
      startTime: ctx.startTime || new Date().toISOString(),
      notes: teamFormNotes || undefined
    })

    // 1. MONEYLINE
    // Best odds = what we'd bet at (highest available from any book)
    const homeOdds = ctx.currentOdds?.moneylineHome
    const awayOdds = ctx.currentOdds?.moneylineAway
    // Average odds = consensus across books (used to calculate true probability)
    const homeOddsAvg = ctx.averageOdds?.moneylineHome ?? homeOdds
    const awayOddsAvg = ctx.averageOdds?.moneylineAway ?? awayOdds

    if (typeof homeOdds === "number" && typeof awayOdds === "number") {
      // Enriched Home - bet at BEST odds, calculate EV using AVERAGE as consensus
      const legHome: SmartSlipLegInput = {
        gameContext: mapContext('moneyline', 'home'),
        offeredAmericanOdds: homeOdds, // Best available odds
        stake: baseStake,
        consensusAmericanOdds: { sideA: homeOddsAvg ?? homeOdds, sideB: awayOddsAvg ?? awayOdds } // Average/consensus for true prob
      }
      const homeResult = await smartSlipService.enrichLegWithEv(legHome)

      // Enriched Away
      const legAway: SmartSlipLegInput = {
        gameContext: mapContext('moneyline', 'away'),
        offeredAmericanOdds: awayOdds, // Best available odds
        stake: baseStake,
        consensusAmericanOdds: { sideA: homeOddsAvg ?? homeOdds, sideB: awayOddsAvg ?? awayOdds } // Average/consensus
      }
      const awayResult = await smartSlipService.enrichLegWithEv(legAway)

      const createPick = (res: typeof homeResult, side: "home" | "away") => {
        return {
          gameId: g.id,
          teams: `${ctx.awayTeam} @ ${ctx.homeTeam}`,
          startTime: ctx.startTime,
          betType: "moneyline",
          line: `${side === "home" ? ctx.homeTeam : ctx.awayTeam} ML`,
          odds: res.offeredAmericanOdds,
          emotionalAlignment: alignment,
          confidence: Math.round((res.ev.confidenceScore || 0.5) * 100),
          suggestedStakeFraction: res.ev.kellyFraction,
          suggestedStakeAbsolute: Math.round(res.ev.kellyFraction * args.weeklyBudget * 0.5), // Scale roughly
          riskLevel,
          shortExplanation: `SmartSlip (v2): EV $${res.ev.evDollars.toFixed(2)} (${res.ev.evPercent.toFixed(1)}%). TrueProb: ${(res.ev.trueWinProb * 100).toFixed(1)}%.`,
          numericRisk: { ev: res.ev.evDollars, evPercentage: res.ev.evPercent },
          kellyTier: res.ev.kellyFraction > 0.05 ? "Aggressive" : "Conservative"
        }
      }
      potentialPicks.push(createPick(homeResult, "home"))
      potentialPicks.push(createPick(awayResult, "away"))
    }


    // 2. SPREADS
    const homeSpreadOdds = ctx.currentOdds?.spreadHomeOdds
    const homeSpreadLine = ctx.spreadLines?.home
    const awaySpreadOdds = ctx.currentOdds?.spreadAwayOdds
    const awaySpreadLine = ctx.spreadLines?.away
    // Average spread odds for consensus
    const homeSpreadOddsAvg = ctx.averageOdds?.spreadHomeOdds ?? homeSpreadOdds
    const awaySpreadOddsAvg = ctx.averageOdds?.spreadAwayOdds ?? awaySpreadOdds

    if (typeof homeSpreadOdds === "number" && typeof awaySpreadOdds === "number" &&
      typeof homeSpreadLine === "number" && typeof awaySpreadLine === "number") {

      const legHomeSpread: SmartSlipLegInput = {
        gameContext: mapContext('spread', 'home'),
        offeredAmericanOdds: homeSpreadOdds, // Best odds
        stake: baseStake,
        consensusAmericanOdds: { sideA: homeSpreadOddsAvg ?? homeSpreadOdds, sideB: awaySpreadOddsAvg ?? awaySpreadOdds }
      }
      const homeSpreadResult = await smartSlipService.enrichLegWithEv(legHomeSpread)

      const legAwaySpread: SmartSlipLegInput = {
        gameContext: mapContext('spread', 'away'),
        offeredAmericanOdds: awaySpreadOdds, // Best odds
        stake: baseStake,
        consensusAmericanOdds: { sideA: homeSpreadOddsAvg ?? homeSpreadOdds, sideB: awaySpreadOddsAvg ?? awaySpreadOdds }
      }
      const awaySpreadResult = await smartSlipService.enrichLegWithEv(legAwaySpread)

      const createSpreadPick = (res: typeof homeSpreadResult, side: "home" | "away", line: number) => ({
        gameId: g.id,
        teams: `${ctx.awayTeam} @ ${ctx.homeTeam}`,
        startTime: ctx.startTime,
        betType: "spread",
        line: `${side === "home" ? ctx.homeTeam : ctx.awayTeam} ${line > 0 ? '+' : ''}${line}`,
        odds: res.offeredAmericanOdds,
        emotionalAlignment: alignment,
        confidence: Math.round((res.ev.confidenceScore || 0.5) * 100),
        suggestedStakeFraction: res.ev.kellyFraction,
        suggestedStakeAbsolute: Math.round(res.ev.kellyFraction * args.weeklyBudget * 0.5),
        riskLevel,
        shortExplanation: `SmartSlip (v2): Spread EV $${res.ev.evDollars.toFixed(2)} (${res.ev.evPercent.toFixed(1)}%).`,
        numericRisk: { ev: res.ev.evDollars, evPercentage: res.ev.evPercent },
        kellyTier: res.ev.kellyFraction > 0.05 ? "Aggressive" : "Conservative"
      })

      potentialPicks.push(createSpreadPick(homeSpreadResult, "home", homeSpreadLine))
      potentialPicks.push(createSpreadPick(awaySpreadResult, "away", awaySpreadLine))
    }

    // 3. TOTALS
    const overOdds = ctx.currentOdds?.totalOverOdds
    const underOdds = ctx.currentOdds?.totalUnderOdds
    const totalLine = ctx.totalLine
    // Average total odds for consensus
    const overOddsAvg = ctx.averageOdds?.totalOverOdds ?? overOdds
    const underOddsAvg = ctx.averageOdds?.totalUnderOdds ?? underOdds

    if (typeof overOdds === "number" && typeof underOdds === "number" && typeof totalLine === "number") {

      const legOver: SmartSlipLegInput = {
        gameContext: mapContext('total', 'over'),
        offeredAmericanOdds: overOdds, // Best odds
        stake: baseStake,
        consensusAmericanOdds: { sideA: overOddsAvg ?? overOdds, sideB: underOddsAvg ?? underOdds }
      }
      const overResult = await smartSlipService.enrichLegWithEv(legOver)

      const legUnder: SmartSlipLegInput = {
        gameContext: mapContext('total', 'under'),
        offeredAmericanOdds: underOdds, // Best odds
        stake: baseStake,
        consensusAmericanOdds: { sideA: overOddsAvg ?? overOdds, sideB: underOddsAvg ?? underOdds }
      }
      const underResult = await smartSlipService.enrichLegWithEv(legUnder)

      const createTotalPick = (res: typeof overResult, type: "over" | "under") => ({
        gameId: g.id,
        teams: `${ctx.awayTeam} @ ${ctx.homeTeam}`,
        startTime: ctx.startTime,
        betType: type,
        line: `${type === "over" ? "Over" : "Under"} ${totalLine}`,
        odds: res.offeredAmericanOdds,
        emotionalAlignment: alignment,
        confidence: Math.round((res.ev.confidenceScore || 0.5) * 100),
        suggestedStakeFraction: res.ev.kellyFraction,
        suggestedStakeAbsolute: Math.round(res.ev.kellyFraction * args.weeklyBudget * 0.5),
        riskLevel,
        shortExplanation: `SmartSlip (v2): ${type === "over" ? "Over" : "Under"} EV $${res.ev.evDollars.toFixed(2)} (${res.ev.evPercent.toFixed(1)}%).`,
        numericRisk: { ev: res.ev.evDollars, evPercentage: res.ev.evPercent },
        kellyTier: res.ev.kellyFraction > 0.05 ? "Aggressive" : "Conservative"
      })

      potentialPicks.push(createTotalPick(overResult, "over"))
      potentialPicks.push(createTotalPick(underResult, "under"))
    }
  }

  // For each game + market type, pick only the BETTER side (higher EV)
  // This ensures we don't recommend both sides of the same bet
  const bestPerGameMarket: Map<string, any> = new Map()

  for (const pick of potentialPicks) {
    const marketKey = `${pick.gameId}-${pick.betType === 'over' || pick.betType === 'under' ? 'total' : pick.betType}`
    const existing = bestPerGameMarket.get(marketKey)
    if (!existing || (pick.numericRisk?.evPercentage || 0) > (existing.numericRisk?.evPercentage || 0)) {
      bestPerGameMarket.set(marketKey, pick)
    }
  }

  // Sort the best picks by EV
  const sortedByEV = Array.from(bestPerGameMarket.values()).sort(
    (a: any, b: any) => (b.numericRisk?.evPercentage || 0) - (a.numericRisk?.evPercentage || 0),
  )

  // Prioritize positive EV picks
  const positiveEvPicks = sortedByEV.filter(p => (p.numericRisk?.evPercentage || 0) > 0)
  const nearZeroPicks = sortedByEV.filter(p => {
    const ev = p.numericRisk?.evPercentage || 0
    return ev <= 0 && ev > -3 // Near market efficient
  })

  const finalPicks: any[] = []

  // First, add all positive EV picks (up to 4)
  finalPicks.push(...positiveEvPicks.slice(0, 4))

  // If we don't have 4, fill with near-zero EV picks (labeled as informational)
  if (finalPicks.length < 4) {
    const needed = 4 - finalPicks.length
    finalPicks.push(...nearZeroPicks.slice(0, needed))
  }

  // Mark picks with clear BET/PASS labels
  const markedPicks = finalPicks.map(p => {
    const evPct = p.numericRisk?.evPercentage || 0
    if (evPct <= 0) {
      return {
        ...p,
        informational: true,
        informationalLabel: evPct > -2 ? "Near Market Efficient" : "Negative EV",
        isRecommended: false,
        recommendation: "PASS"
      }
    }
    return {
      ...p,
      isRecommended: true,
      recommendation: "BET",
      informational: false
    }
  })

  // Sort: Recommended (BET) first, then by EV
  const sortedFinal = markedPicks.sort((a, b) => {
    if (a.isRecommended && !b.isRecommended) return -1;
    if (!a.isRecommended && b.isRecommended) return 1;
    return (b.numericRisk?.evPercentage || 0) - (a.numericRisk?.evPercentage || 0);
  });

  console.log(`[Fallback] SmartSlip v2 generated ${sortedFinal.length} picks. Positive EV (BET): ${sortedFinal.filter(p => p.isRecommended).length}.`)

  return { recommendations: sortedFinal }
}


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

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const usageCheck = await checkAIServiceUsage(
      supabase,
      user.id,
      "ai_picker",
    )

    if (!usageCheck.canUse) {
      return NextResponse.json(
        {
          error: usageCheck.reason || "AI Picker usage limit reached",
          upgrade_required: usageCheck.limit === 0,
          usage_limit_reached: usageCheck.limit > 0,
          current_usage: {
            used: usageCheck.usedThisWeek,
            limit: usageCheck.limit,
            remaining: usageCheck.remaining,
            purchased_credits: usageCheck.purchasedCredits,
            total_available: usageCheck.totalAvailable,
          },
          marketplace_url: "/marketplace",
        },
        { status: 403 },
      )
    }

    const body = ((await request.json().catch(() => ({}))) ||
      {}) as PickerRequestBody

    const sport = normalizeSportKey(body.sport)

    const { data: userData, error: userError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (userError || !userData) {
      console.error("Error fetching user data:", userError)
      return NextResponse.json(
        { error: "Failed to fetch user data" },
        { status: 500 },
      )
    }

    const emotionalStability =
      await emotionalStabilityService.getCurrentEmotionalStability(userData)
    const emotionalScore = emotionalStability.score
    const riskTolerance = body.riskTolerance || "moderate"

    // weeklyBudget is metadata only; stakes are income-agnostic
    const weeklyBudget =
      typeof body.weeklyBudget === "number" && body.weeklyBudget > 0
        ? body.weeklyBudget
        : 500

    if (
      typeof emotionalScore !== "number" ||
      emotionalScore < 0 ||
      emotionalScore > 100
    ) {
      return NextResponse.json(
        { error: "Invalid emotional score. Must be between 0-100." },
        { status: 400 },
      )
    }

    // ============================================================================
    // ANCHORED RISK COMPUTATION
    // Formula: overallRisk = 0.80 * emotionalTilt + 0.10 * pgsiSb + 0.05 * demoBase + 0.05 * crimeMultiplier
    // ============================================================================
    const emotionalTilt = 1 - (emotionalScore / 100) // Convert to risk (higher score = lower tilt)

    // Build demographic profile from user data
    const demographics = buildDemographicProfile(userData)
    const gamblingBehavior = buildGamblingBehavior(userData)

    // Fetch recent betting session data for expenditure risk
    const bettingSession = await fetchRecentBettingSession(supabase, user.id)

    // Fetch PGSI-SB survey responses if user has completed it
    const pgsiSbResponses = await fetchPgsiSbResponses(supabase, user.id)

    const riskProfile: UserRiskProfile = {
      userId: user.id,
      demographics,
      gamblingBehavior,
      pgsiSbResponses,
    }

    const anchoredRisk = computeAnchoredRisk(emotionalTilt, riskProfile, bettingSession)
    const riskLevel = getRiskLevelLabel(anchoredRisk.overallRisk)

    console.log("[SmartSlip] Anchored Risk Assessment:", {
      emotionalScore,
      emotionalTilt: emotionalTilt.toFixed(3),
      overallRisk: anchoredRisk.overallRisk.toFixed(3),
      riskLevel: riskLevel.label,
      confidence: anchoredRisk.confidence.toFixed(2),
      breakdown: anchoredRisk.breakdown,
      shouldBlock: shouldBlockBetting(anchoredRisk.overallRisk),
    })

    // Gate based on anchored risk (combines emotional + research factors)
    // Primary gate: emotional score < 60 OR critical anchored risk
    if (emotionalScore < 60 || shouldBlockBetting(anchoredRisk.overallRisk)) {
      return NextResponse.json({
        success: true,
        shouldBet: false,
        message: shouldBlockBetting(anchoredRisk.overallRisk)
          ? `${anchoredRisk.suggestedIntervention.message} (Risk level: ${riskLevel.label})`
          : `Your emotional stability score is ${emotionalScore}/100. We recommend waiting until you're in a more stable state (60+) before placing bets.`,
        recommendations: [],
        emotionalScore,
        anchoredRisk: {
          overallRisk: anchoredRisk.overallRisk,
          riskLevel: riskLevel.label,
          riskColor: riskLevel.color,
          confidence: anchoredRisk.confidence,
          clinicalContext: anchoredRisk.clinicalContext,
          intervention: anchoredRisk.suggestedIntervention,
          researchIntegration: RESEARCH_CITATIONS.map(c => c.shortName),
        },
      })
    }

    if (!isEnhancedAIAvailable()) {
      console.error("[SmartSlip] Enhanced AI not available. Env:", {
        hasGeminiKey: Boolean(process.env.GOOGLE_GEMINI_API_KEY),
        hasEnhancedFlag: Boolean(process.env.ENABLE_ENHANCED_AI_ANALYSIS),
        enhancedFlagValue: process.env.ENABLE_ENHANCED_AI_ANALYSIS,
      })
      return NextResponse.json({
        success: false,
        shouldBet: false,
        message:
          "SmartSlip AI is not configured. Please contact support or check your environment configuration (GOOGLE_GEMINI_API_KEY required).",
        error: "SmartSlip AI unavailable",
        recommendations: [],
        emotionalScore,
      })
    }

    console.log(
      `[SmartSlip] Fetching odds for sport: ${sport}, risk: ${riskTolerance}`,
    )
    const oddsResult = await fetchEnhancedLiveOdds(sport, "auto")

    console.log("[SmartSlip] Odds API result:", {
      success: oddsResult.success,
      source: oddsResult.source,
      dataLength: Array.isArray(oddsResult.data)
        ? oddsResult.data.length
        : 0,
      error: oddsResult.error,
    })

    if (
      !oddsResult.success ||
      !Array.isArray(oddsResult.data) ||
      oddsResult.data.length === 0
    ) {
      console.error(`[SmartSlip] No odds data available for ${sport}`, {
        success: oddsResult.success,
        source: oddsResult.source,
        error: oddsResult.error,
      })
      return NextResponse.json({
        success: true,
        shouldBet: false,
        message: getNoGamesMessage(sport),
        recommendations: [],
        emotionalScore,
        meta: {
          sport,
          source: oddsResult.source,
          debugInfo: `Fetched from ${oddsResult.source}, no data available`,
        },
      })
    }

    const rawGames = oddsResult.data as Array<any>
    console.log(`[SmartSlip] Raw games fetched: ${rawGames.length}`)

    const now = Date.now()
    const games = rawGames.filter((g: any) => {
      const gKeyRaw = g.sportKey || g.sport_key || g.sport
      const gKey = normalizeSportKey(gKeyRaw)
      if (gKey !== sport) return false

      // Filter out games that ended long ago (allow in-progress: up to 4h old)
      const ct = g.commenceTime || g.commence_time
      if (ct) {
        const gameTime = typeof ct === 'string' ? Date.parse(ct) : (ct instanceof Date ? ct.getTime() : NaN)
        const FOUR_HOURS = 4 * 60 * 60 * 1000
        if (!Number.isNaN(gameTime) && gameTime < now - FOUR_HOURS) return false
      }

      return true
    })

    console.log(
      `[SmartSlip] Games after sport+date filter: ${games.length} (requested: ${sport})`,
    )

    if (games.length === 0) {
      console.warn(
        `[SmartSlip] No games found after filtering for ${sport}. Raw game sports:`,
        rawGames.slice(0, 3).map((g) => g.sportKey || g.sport_key || g.sport),
      )
      return NextResponse.json({
        success: true,
        shouldBet: false,
        message: getNoGamesMessage(sport),
        recommendations: [],
        emotionalScore,
        meta: {
          sport,
          source: oddsResult.source,
          debugInfo: `${rawGames.length} games fetched but none matched sport ${sport}`,
        },
      })
    }

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

    const limitedGames = sortedGames.slice(0, 4)

    const psychResult = await callPsychPicker(emotionalScore, riskTolerance)
    const psychModel = (psychResult as any).model_id
    console.log(
      `[PsychPicker] Selected: ${psychModel} for emotionalScore ${emotionalScore}`,
    )

    const serenityUsedFlags: boolean[] = []

    const enrichedGames = await Promise.all(
      limitedGames.map(async (game) => {
        const homeTeam: string = game.homeTeam || game.home_team || "Home Team"
        const awayTeam: string = game.awayTeam || game.away_team || "Away Team"
        const league: string = game.sportKey || game.sport_key || sport
        const gameId: string | undefined = game.id

        console.log("[SmartSlip] Game data extraction:", {
          gameId,
          homeTeam,
          awayTeam,
          league,
          rawGame: {
            homeTeam: game.homeTeam,
            home_team: game.home_team,
            awayTeam: game.awayTeam,
            away_team: game.away_team,
            sportKey: game.sportKey,
            sport_key: game.sport_key,
          },
        })

        let context: CurrentGameContext | null = null
        let features: HistoricalFeatureVector | null = null
        let sportsResearch: SportsResearchOutput | null = null

        try {
          console.log(
            `[SmartSlip] Conducting sports research for ${homeTeam} vs ${awayTeam}`,
          )
          const researchPromise = conductSportsResearch({
            homeTeam,
            awayTeam,
            sport,
            league,
          } as SportsResearchInput)

          sportsResearch = await Promise.race([
            researchPromise,
            new Promise<SportsResearchOutput | null>((resolve) =>
              setTimeout(() => resolve(null), 6000),
            ),
          ])

          if (sportsResearch) {
            console.log(
              `[SmartSlip] ✅ Sports research completed: ${sportsResearch.dataSource}`,
            )
          } else {
            console.log(
              "[SmartSlip] ⏱️ Sports research timeout, continuing without it",
            )
          }
        } catch (error) {
          console.warn(
            "[SmartSlip] ⚠️ Sports research failed, continuing with analysis:",
            error,
          )
        }

        if (!context) {
          // Best odds (highest available - what we'd bet at)
          const homeOdds =
            game.homeOdds?.best?.odds ??
            game.home_odds?.best?.odds ??
            0
          const awayOdds =
            game.awayOdds?.best?.odds ??
            game.away_odds?.best?.odds ??
            0

          // Average odds (consensus across books - used for true probability)
          const homeOddsAvg = game.homeOdds?.average ?? homeOdds
          const awayOddsAvg = game.awayOdds?.average ?? awayOdds

          const homeSpreadLine =
            game.homeSpread?.best?.line ??
            game.home_spread?.best?.line ??
            undefined
          const homeSpreadOdds =
            game.homeSpread?.best?.odds ??
            game.home_spread?.best?.odds ??
            undefined
          const homeSpreadOddsAvg = game.homeSpread?.average ?? homeSpreadOdds
          const awaySpreadLine =
            game.awaySpread?.best?.line ??
            game.away_spread?.best?.line ??
            undefined
          const awaySpreadOdds =
            game.awaySpread?.best?.odds ??
            game.away_spread?.best?.odds ??
            undefined
          const awaySpreadOddsAvg = game.awaySpread?.average ?? awaySpreadOdds

          const overLine =
            game.overLine?.best?.line ??
            game.over_line?.best?.line ??
            undefined
          const overOdds =
            game.overLine?.best?.odds ??
            game.over_line?.best?.odds ??
            undefined
          const overOddsAvg = game.overLine?.average ?? overOdds
          const underLine =
            game.underLine?.best?.line ??
            game.under_line?.best?.line ??
            undefined
          const underOdds =
            game.underLine?.best?.odds ??
            game.under_line?.best?.odds ??
            undefined
          const underOddsAvg = game.underLine?.average ?? underOdds

          const impliedFromOdds = (
            odds: number | undefined,
          ): number | undefined => {
            if (typeof odds !== "number" || Number.isNaN(odds))
              return undefined
            if (odds > 0) return 100 / (odds + 100)
            return Math.abs(odds) / (Math.abs(odds) + 100)
          }

          context = {
            gameId,
            league,
            homeTeam,
            awayTeam,
            startTime:
              typeof game.commenceTime === "string"
                ? game.commenceTime
                : game.commenceTime instanceof Date
                  ? game.commenceTime.toISOString()
                  : typeof game.commence_time === "string"
                    ? game.commence_time
                    : undefined,
            currentOdds: {
              moneylineHome: homeOdds,
              moneylineAway: awayOdds,
              spreadHomeOdds: homeSpreadOdds,
              spreadAwayOdds: awaySpreadOdds,
              totalOverOdds: overOdds,
              totalUnderOdds: underOdds,
            },
            // Average/consensus odds across all bookmakers for true EV calculation
            averageOdds: {
              moneylineHome: homeOddsAvg,
              moneylineAway: awayOddsAvg,
              spreadHomeOdds: homeSpreadOddsAvg,
              spreadAwayOdds: awaySpreadOddsAvg,
              totalOverOdds: overOddsAvg,
              totalUnderOdds: underOddsAvg,
            },
            spreadLines:
              homeSpreadLine !== undefined &&
                awaySpreadLine !== undefined
                ? {
                  home: homeSpreadLine,
                  away: awaySpreadLine,
                }
                : undefined,
            totalLine: overLine ?? underLine,
            impliedProbabilities: {
              home: impliedFromOdds(homeOdds),
              away: impliedFromOdds(awayOdds),
            },
          }

          // DEBUG: Log market availability for this game
          const hasSpread = typeof homeSpreadOdds === 'number';
          const hasTotal = typeof overOdds === 'number';
          if (!hasSpread || !hasTotal) {
            console.log(`[SmartSlip] Missing markets for ${homeTeam}: Spread=${hasSpread}, Total=${hasTotal}`);
          }
        }

        if (!features) {
          const homeOdds =
            game.homeOdds?.best?.odds ??
            game.home_odds?.best?.odds ??
            0
          const awayOdds =
            game.awayOdds?.best?.odds ??
            game.away_odds?.best?.odds ??
            0

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

        let serenityProbs: { pLoss: number; pPush: number; pWin: number } = {
          pLoss: 0.33,
          pPush: 0.34,
          pWin: 0.33,
        }

        let prediction: ModelPrediction
        try {
          const homeOdds =
            game.homeOdds?.best?.odds ??
            game.home_odds?.best?.odds ??
            0
          const awayOdds =
            game.awayOdds?.best?.odds ??
            game.away_odds?.best?.odds ??
            0

          const impliedFromOdds = (odds: number): number => {
            if (!odds || Number.isNaN(odds)) return 0.5
            if (odds > 0) return 100 / (odds + 100)
            return Math.abs(odds) / (Math.abs(odds) + 100)
          }

          const contextImpliedHome =
            context.impliedProbabilities?.home ??
            impliedFromOdds(homeOdds)
          const contextImpliedAway =
            context.impliedProbabilities?.away ??
            undefined

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

          const hasKeyInjuries =
            (context.keyInjuries?.length ?? 0) > 0

          const weatherText = context.weather?.toLowerCase() || ""
          const badWeather =
            /rain|snow|wind|storm/.test(weatherText)

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
            const homeIsFavorite =
              contextImpliedHome >= contextImpliedAway
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

            last5WinRate:
              typeof last5WinRate === "number"
                ? last5WinRate
                : 0.5,
            userAgeBucket: "26_35",
          }

          const csvRow = buildFeaturesCsv(featureInput)
          void csvRow // currently unused but generated

          const homeImpliedProb = oddsToImpliedProb(homeOdds)
          const awayImpliedProb = oddsToImpliedProb(awayOdds)


          // Use the new Probability Engine for consistent "prediction" data passed to Gemini
          // We treat the psychMultiplier as a contextual signal (e.g. user momentum/risk state)
          const psychSignal = ((psychResult as any).params.max_stake_multiplier - 1) * 0.05

          const engineResult = probabilityEngine.compute({
            marketImpliedProb: homeImpliedProb,
            modelWinProb: undefined, // No specific local ML model output here yet
            contextualSignals: [psychSignal]
          })

          const pWin = engineResult.trueWinProb
          const pLoss = 1 - pWin - 0.02
          const pPush = 0.02

          serenityProbs = { pWin, pLoss, pPush }

          prediction = {
            winProbabilityHome: pWin,
            winProbabilityAway: pLoss,
            modelConfidence: 1 - pPush,
            riskScore: pLoss,
            primaryMarket: "moneyline",
          }

          serenityUsedFlags.push(false)
        } catch (e) {
          console.warn(
            "[Picker] Serenity heuristic prediction failed for game",
            gameId,
            e,
          )
          prediction = {
            winProbabilityHome: 0.5,
            winProbabilityAway: 0.5,
            modelConfidence: 0.5,
            riskScore: 0.5,
          }
          serenityUsedFlags.push(false)
        }

        if (sportsResearch && context) {
          context.teamForm = {
            homeRecent: sportsResearch.homeTeam.recentForm?.last5 || [],
            awayRecent: sportsResearch.awayTeam.recentForm?.last5 || []
          };
          console.log(`[SmartSlip] Populated teamForm from research for ${homeTeam} vs ${awayTeam}:`, context.teamForm);
        }

        return {
          id: gameId,
          context,
          features,
          prediction,
          probs: serenityProbs,
          sportsResearch: sportsResearch
            ? {
              dataSource: sportsResearch.dataSource,
              researchTimestamp: sportsResearch.researchTimestamp,
              homeTeam: {
                name: sportsResearch.homeTeam.teamInfo?.strTeam,
                currentForm: sportsResearch.homeTeam.currentForm,
                strengths: sportsResearch.homeTeam.strengths.slice(0, 3),
                recentForm:
                  sportsResearch.homeTeam.recentForm?.last5 || [],
              },
              awayTeam: {
                name: sportsResearch.awayTeam.teamInfo?.strTeam,
                currentForm: sportsResearch.awayTeam.currentForm,
                strengths: sportsResearch.awayTeam.strengths.slice(0, 3),
                recentForm:
                  sportsResearch.awayTeam.recentForm?.last5 || [],
              },
              headToHead: sportsResearch.headToHead
                ? {
                  totalMatches: sportsResearch.headToHead.totalMatches,
                  homeWins:
                    sportsResearch.headToHead.homeTeamWins,
                  awayWins:
                    sportsResearch.headToHead.awayTeamWins,
                  draws: sportsResearch.headToHead.draws,
                }
                : null,
              keyFactors: sportsResearch.keyFactors.slice(0, 5),
              expertPrediction: sportsResearch.prediction,
            }
            : null,
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
      recentHistorySummary: "",
    }

    const reasoningInput: PickerReasoningInput = {
      user: userSnapshot,
      games: enrichedGames,
    }

    console.log(
      `[SmartSlip] Calling AI reasoner with ${enrichedGames.length} enriched games`,
    )
    let reasoningOutput =
      await generatePickerRecommendations(reasoningInput)

    console.log(
      `[SmartSlip] AI reasoner returned ${reasoningOutput.recommendations?.length || 0
      } recommendations`,
    )

    // Process Gemini's picks - label based on EV
    const filtered = (reasoningOutput.recommendations || []).map((r: any) => {
      const evPct = r.numericRisk?.evPercentage ?? 0
      if (evPct <= 0) {
        return {
          ...r,
          informational: true,
          informationalLabel: evPct > -2 ? "Near Market Efficient" : "Negative EV",
          isRecommended: false,
          recommendation: "PASS"
        }
      }
      return {
        ...r,
        isRecommended: true,
        recommendation: "BET",
        informational: false
      }
    }).sort((a: any, b: any) => {
      if (a.isRecommended && !b.isRecommended) return -1;
      if (!a.isRecommended && b.isRecommended) return 1;
      return (b.numericRisk?.evPercentage || 0) - (a.numericRisk?.evPercentage || 0);
    })

    console.log(`[SmartSlip] Gemini returned ${filtered.length} picks, ${filtered.filter((r: any) => r.isRecommended).length} with positive EV`)

    reasoningOutput = {
      ...reasoningOutput,
      recommendations: filtered,
    }

    console.log(`[SmartSlip] Final Response Summary: ${filtered.length} picks. EV Range: ${Math.min(...filtered.map(r => r.numericRisk?.evPercentage ?? 0)).toFixed(2)}% to ${Math.max(...filtered.map(r => r.numericRisk?.evPercentage ?? 0)).toFixed(2)}%`);

    if (
      !reasoningOutput.recommendations ||
      reasoningOutput.recommendations.length === 0
    ) {
      // (This block remains for absolute fallback)
      console.log(`[SmartSlip] AI returned no recommendations, using fallback logic`)
      reasoningOutput = await buildFallbackRecommendations({
        games: enrichedGames.map((g) => ({
          id: g.id,
          context: g.context,
        })),
        riskTolerance,
        weeklyBudget,
        emotionalScore,
      })
    }

    const probsByGameId: Record<
      string,
      { pLoss: number; pPush: number; pWin: number }
    > = {}
    for (const g of enrichedGames) {
      if (g.id && g.probs) {
        probsByGameId[g.id] = g.probs
      }
    }

    await recordAIServiceUsage(supabase, user.id, "ai_picker", {
      sport,
      emotionalScore,
      riskTolerance,
      recommendations_count: reasoningOutput.recommendations.length,
      used_sagemaker: false,
      psych_model: (psychResult as any).model_id,
    })

    // Emotional gate stays the real guardrail
    const emotionallySafe = emotionalScore >= 60

    // If we have any picks (even informational), we’ll say shouldBet = emotionallySafe
    const hasAnyPicks = (reasoningOutput.recommendations?.length || 0) > 0

    const shouldBet = emotionallySafe && hasAnyPicks

    const shouldBetMessage = !emotionallySafe
      ? `Your emotional stability score is ${emotionalScore}/100. We recommend waiting until you're in a more stable state (60+) before placing bets.`
      : hasAnyPicks
        ? "SmartSlip found some options for tonight. Focus on long‑term discipline and only wager what you can afford to lose."
        : "No games available or odds data found for this sport right now."


    // Final Summary Logging
    console.log(`[SmartSlip Summary]`, {
      sport,
      riskTolerance,
      gamesAnalyzed: enrichedGames.length,
      picksGenerated: reasoningOutput.recommendations?.length || 0,
      positiveEvPicks: (reasoningOutput.recommendations || []).filter((p: any) => p.isRecommended).length,
      informationalPicks: (reasoningOutput.recommendations || []).filter((p: any) => p.informational).length,
      betTypeDistribution: {
        moneyline: (reasoningOutput.recommendations || []).filter((p: any) => p.betType === 'moneyline').length,
        spread: (reasoningOutput.recommendations || []).filter((p: any) => p.betType === 'spread').length,
        total: (reasoningOutput.recommendations || []).filter((p: any) => ['over', 'under'].includes(p.betType)).length
      },
      evRange: (reasoningOutput.recommendations || []).length > 0 ? {
        min: Math.min(...(reasoningOutput.recommendations || []).map((p: any) => p.numericRisk?.evPercentage ?? 0)).toFixed(2) + '%',
        max: Math.max(...(reasoningOutput.recommendations || []).map((p: any) => p.numericRisk?.evPercentage ?? 0)).toFixed(2) + '%'
      } : null
    })

    // Generate Parlay Recommendations (new for Phase 2)
    const parlayRecommendations: ParlayRecommendation[] = generateParlayRecommendations(filtered, 3, sport)
    console.log(`[SmartSlip] Generated ${parlayRecommendations.length} parlay recommendations`)

    return NextResponse.json({
      success: true,
      shouldBet,
      message: shouldBetMessage,
      recommendations: reasoningOutput.recommendations,
      parlayRecommendations,
      emotionalScore,
      // Anchored Risk Assessment (research-backed)
      anchoredRisk: {
        overallRisk: anchoredRisk.overallRisk,
        riskLevel: riskLevel.label,
        riskColor: riskLevel.color,
        riskDescription: riskLevel.description,
        confidence: anchoredRisk.confidence,
        clinicalContext: anchoredRisk.clinicalContext,
        intervention: anchoredRisk.suggestedIntervention,
        breakdown: {
          emotional: anchoredRisk.breakdown.emotionalContribution,
          behavioral: anchoredRisk.breakdown.behavioralContribution,
          demographic: anchoredRisk.breakdown.demographicBase,
        },
        researchIntegration: RESEARCH_CITATIONS.map(c => c.shortName),
      },
      meta: {
        sport,
        oddsSource: oddsResult.source,
        usedSageMaker: false,
        psychModel: (psychResult as any).model_id,
        usedGemini: true,
        // REMOVE: Market limitations message removed by user request (default to showing all available markets)
        marketLimitations: null
      },
      probsByGameId,
    })
  } catch (error) {
    console.error("[Picker] Failed to generate picker recommendations", error)
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

// ============================================================================
// Anchored Risk Helper Functions
// ============================================================================

/**
 * Build demographic profile from user data for risk calculation
 */
function buildDemographicProfile(userData: any): DemographicProfile | undefined {
  if (!userData) return undefined

  const surveyData = userData.survey_data || {}

  // Map gender
  const genderMap: Record<string, DemographicProfile['gender']> = {
    'male': 'male',
    'female': 'female',
    'other': 'other',
  }
  const gender = genderMap[userData.gender?.toLowerCase()] || 'other'

  // Map age to age group
  const ageRange = surveyData.ageRange || userData.age_range
  const ageGroup = mapAgeRangeToGroup(ageRange, userData.age)

  // Map education level
  const educationMap: Record<string, DemographicProfile['education']> = {
    'high school': 'upper_secondary',
    'some college': 'short_cycle_tertiary',
    'bachelors': 'bachelors',
    'masters': 'masters_doctoral',
    'doctorate': 'masters_doctoral',
  }
  const education = educationMap[surveyData.educationLevel?.toLowerCase()] ||
    educationMap[userData.education_level?.toLowerCase()]

  // Map employment status
  const employmentMap: Record<string, DemographicProfile['employmentStatus']> = {
    'employed': 'employed',
    'full-time': 'employed',
    'part-time': 'employed',
    'unemployed': 'unemployed',
    'retired': 'retired',
    'student': 'outside_labor_force',
  }
  const employmentStatus = employmentMap[surveyData.employmentStatus?.toLowerCase()] ||
    employmentMap[userData.employment_status?.toLowerCase()]

  // Map income level
  const incomeRange = surveyData.incomeRange || userData.income_range
  const incomeLevel = mapIncomeRangeToLevel(incomeRange)

  return { gender, ageGroup, education, employmentStatus, incomeLevel }
}

function mapAgeRangeToGroup(ageRange?: string, age?: number): DemographicProfile['ageGroup'] {
  if (ageRange) {
    const lower = ageRange.toLowerCase()
    if (lower.includes('18-24') || lower.includes('18') && lower.includes('24')) return '18-24'
    if (lower.includes('25-34') || lower.includes('25') && lower.includes('34')) return '25-34'
    if (lower.includes('35-44') || lower.includes('35') && lower.includes('44')) return '35-44'
    if (lower.includes('45-54') || lower.includes('45') && lower.includes('54')) return '45-54'
    if (lower.includes('55-64') || lower.includes('55') && lower.includes('64')) return '55-64'
    if (lower.includes('65+') || lower.includes('65')) return '65+'
  }
  if (typeof age === 'number') {
    if (age < 25) return '18-24'
    if (age < 35) return '25-34'
    if (age < 45) return '35-44'
    if (age < 55) return '45-54'
    if (age < 65) return '55-64'
    return '65+'
  }
  return '25-34' // Default
}

function mapIncomeRangeToLevel(incomeRange?: string): DemographicProfile['incomeLevel'] {
  if (!incomeRange) return 'medium'
  const lower = incomeRange.toLowerCase()
  if (lower.includes('under') || lower.includes('less than') || lower.includes('<25') || lower.includes('<30')) {
    return 'low'
  }
  if (lower.includes('100') || lower.includes('150') || lower.includes('200') || lower.includes('+')) {
    return 'high'
  }
  return 'medium'
}

/**
 * Build gambling behavior profile from user data
 */
function buildGamblingBehavior(userData: any): GamblingBehaviorProfile | undefined {
  if (!userData) return undefined

  const surveyData = userData.survey_data || {}
  const bettingFrequency = surveyData.bettingFrequency || userData.betting_frequency

  const frequencyMap: Record<string, GamblingBehaviorProfile['frequency']> = {
    'daily': 'daily',
    'several times a week': 'several_times_week',
    'weekly': 'once_week',
    'monthly': 'less_than_monthly',
    'rarely': 'less_than_monthly',
  }
  const frequency = frequencyMap[bettingFrequency?.toLowerCase()] || 'once_week'

  return { frequency, gamblingMode: 'online_only' }
}

/**
 * Fetch recent betting session data for expenditure risk calculation
 */
async function fetchRecentBettingSession(
  supabase: any,
  userId: string
): Promise<BettingSession | undefined> {
  try {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: recentBets, error } = await supabase
      .from('bets')
      .select('stake, created_at, is_chasing_loss')
      .eq('user_id', userId)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })

    if (error || !recentBets || recentBets.length === 0) {
      return undefined
    }

    const today = new Date().toDateString()
    const todayBets = recentBets.filter((b: any) =>
      new Date(b.created_at).toDateString() === today
    )

    return {
      amount: todayBets[0]?.stake || 0,
      frequency: recentBets.length,
      sessionSpend: todayBets.reduce((sum: number, b: any) => sum + (b.stake || 0), 0),
      weeklySpend: recentBets.reduce((sum: number, b: any) => sum + (b.stake || 0), 0),
      lossChaseCount: recentBets.filter((b: any) => b.is_chasing_loss).length,
    }
  } catch (error) {
    console.error("[SmartSlip] Error fetching betting session:", error)
    return undefined
  }
}

/**
 * Fetch PGSI-SB survey responses for behavioral risk calculation
 */
async function fetchPgsiSbResponses(
  supabase: any,
  userId: string
): Promise<PgsiSbResponse[] | undefined> {
  try {
    // Fetch recent surveys and find PGSI-SB by checking responses._surveyType
    const { data: surveys, error } = await supabase
      .from('survey_responses')
      .select('responses, score')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error || !surveys || surveys.length === 0) {
      return undefined
    }

    // Find the most recent PGSI-SB survey
    const pgsiSurvey = surveys.find((s: any) => {
      const responses = s.responses as any
      return responses?._surveyType === 'pgsi_sb'
    })

    if (!pgsiSurvey) {
      return undefined
    }

    // Extract questions from the stored format
    const surveyResponses = pgsiSurvey.responses as any
    const questions = surveyResponses?.questions as Array<{
      questionId: string
      response: number
    }>

    if (!questions || !Array.isArray(questions)) {
      return undefined
    }

    // Map survey responses to PgsiSbResponse format
    return questions.map(r => ({
      questionId: r.questionId as PgsiSbResponse['questionId'],
      score: r.response as 0 | 1 | 2 | 3
    }))
  } catch (error) {
    console.error("[SmartSlip] Error fetching PGSI-SB responses:", error)
    return undefined
  }
}

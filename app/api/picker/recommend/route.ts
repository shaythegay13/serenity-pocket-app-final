import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"
import { fetchEnhancedLiveOdds } from "@/lib/enhanced-odds-api"
import { generatePickerRecommendations } from "@/lib/services/gemini-reasoner"
import { conductSportsResearch, type SportsResearchInput, type SportsResearchOutput } from "@/lib/sports-research"
import type {
  CurrentGameContext,
  HistoricalFeatureVector,
  ModelPrediction,
  PickerReasoningInput,
  PickerReasoningOutput,
  UserPsychologySnapshot,
} from "@/lib/types/ai-models"
import { isEnhancedAIAvailable } from "@/lib/ai-service"
import {
  buildFeaturesCsv,
  type SerenityFeatureInput,
} from "@/lib/services/serenityFeatureBuilder"
import { predictSerenityBet } from "@/lib/services/sagemakerSerenityCsv"
import { checkAIServiceUsage, recordAIServiceUsage } from "@/lib/ai-usage-tracker"
import { emotionalStabilityService } from "@/lib/services/emotional-stability-service"
import { computeEvFromProbAndOdds } from "@/lib/ev-calculator"

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
  const raw = String(input || '').trim()
  if (!raw) return 'basketball_nba'
  const v = raw.toLowerCase()
  if (v === 'basketball_nba' || v.includes('basketball_nba')) return 'basketball_nba'
  if (v === 'americanfootball_nfl' || v.includes('americanfootball_nfl')) return 'americanfootball_nfl'
  if (v === 'baseball_mlb' || v.includes('baseball_mlb')) return 'baseball_mlb'
  if (v === 'icehockey_nhl' || v.includes('icehockey_nhl')) return 'icehockey_nhl'
  if (v === 'nba' || v.includes(' nba')) return 'basketball_nba'
  if (v === 'nfl' || v.includes(' nfl')) return 'americanfootball_nfl'
  if (v === 'mlb' || v.includes(' mlb')) return 'baseball_mlb'
  if (v === 'nhl' || v.includes(' nhl')) return 'icehockey_nhl'
  return raw
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

  const allPicks: PickerReasoningOutput["recommendations"] = []

  // Generate picks for ALL bet types based on actual odds and value
  // Risk tolerance only affects stake size, not bet selection
  for (const g of args.games) {
    const ctx = g.context
    const suggestedStakeAbsolute = Math.max(5, Math.round(args.weeklyBudget * stakeFraction))
    const riskLevel =
      args.riskTolerance === "conservative" ? "LOW" : args.riskTolerance === "aggressive" ? "HIGH" : "MEDIUM"

    // Log available bet types for this game
    console.log(`[Fallback] Game: ${ctx.awayTeam} @ ${ctx.homeTeam}`)
    console.log(`[Fallback] - Moneyline: home=${ctx.currentOdds?.moneylineHome}, away=${ctx.currentOdds?.moneylineAway}`)
    console.log(`[Fallback] - Spread: homeOdds=${ctx.currentOdds?.spreadHomeOdds}, homeLine=${ctx.spreadLines?.home}, awayOdds=${ctx.currentOdds?.spreadAwayOdds}, awayLine=${ctx.spreadLines?.away}`)
    console.log(`[Fallback] - Totals: overOdds=${ctx.currentOdds?.totalOverOdds}, underOdds=${ctx.currentOdds?.totalUnderOdds}, line=${ctx.totalLine}`)

    // Calculate EV with an assumed bettor edge (2-5% depending on risk tolerance)
    // This represents the edge a sharp bettor might have over the market
    const bettorEdge =
      args.riskTolerance === "aggressive" ? 0.05 : // 5% edge for aggressive
      args.riskTolerance === "conservative" ? 0.02 : // 2% edge for conservative
      0.035 // 3.5% edge for moderate

    const calculateEVWithEdge = (odds: number, stake: number, impliedProb: number): number => {
      const trueProb = Math.min(0.95, impliedProb + bettorEdge)
      const { evDollars } = computeEvFromProbAndOdds(trueProb, odds, stake)
      return evDollars
    }

    // Calculate Kelly Criterion stake size based on EV and confidence
    const calculateKellyStake = (ev: number, confidence: number, baseStake: number): number => {
      if (ev <= 0) return baseStake // Use base stake for negative EV (will show warning)

      // Fractional Kelly (use 25% of Kelly for safety)
      const evPercentage = (ev / baseStake)
      const kellyFraction = 0.25
      const kellyMultiplier = 1 + (evPercentage * kellyFraction * (confidence / 100))

      // Clamp between 50% and 200% of base stake
      return Math.round(Math.max(baseStake * 0.5, Math.min(baseStake * 2, baseStake * kellyMultiplier)))
    }

    // 1. MONEYLINE picks - consider BOTH teams based on value
    const homeOdds = ctx.currentOdds?.moneylineHome
    const awayOdds = ctx.currentOdds?.moneylineAway

    if (typeof homeOdds === "number" && typeof awayOdds === "number") {
      const homeImplied = oddsToImpliedProb(homeOdds)
      const awayImplied = oddsToImpliedProb(awayOdds)
      const homeConfidence = Math.round(homeImplied * 100)
      const awayConfidence = Math.round(awayImplied * 100)

      // Calculate EV for both sides with assumed bettor edge
      const homeEV = calculateEVWithEdge(homeOdds, suggestedStakeAbsolute, homeImplied)
      const awayEV = calculateEVWithEdge(awayOdds, suggestedStakeAbsolute, awayImplied)

      // Pick the side with better value
      if (homeEV > awayEV) {
        const adjustedStake = calculateKellyStake(homeEV, homeConfidence, suggestedStakeAbsolute)
        const ev = calculateEVWithEdge(homeOdds, adjustedStake, homeImplied)
        const evPercentage = (ev / adjustedStake) * 100

        allPicks.push({
          gameId: g.id,
          teams: `${ctx.awayTeam} @ ${ctx.homeTeam}`,
          startTime: ctx.startTime,
          betType: "moneyline",
          line: `${ctx.homeTeam} ML`,
          odds: homeOdds,
          emotionalAlignment: alignment,
          confidence: homeConfidence,
          suggestedStakeFraction: adjustedStake / args.weeklyBudget,
          suggestedStakeAbsolute: adjustedStake,
          riskLevel,
          shortExplanation: ev < 0
            ? "DO NOT BET ON THIS GAME. OUR ANALYSIS HAS DETERMINED THIS WILL LEAD TO A LOSING BET. TAKE A BREAK FROM BETTING UNTIL ODDS IMPROVE."
            : `Moneyline pick with estimated ${Math.round(homeImplied * 100 + bettorEdge * 100)}% win probability.`,
          numericRisk: { ev, evPercentage }
        })
      } else {
        const adjustedStake = calculateKellyStake(awayEV, awayConfidence, suggestedStakeAbsolute)
        const ev = calculateEVWithEdge(awayOdds, adjustedStake, awayImplied)
        const evPercentage = (ev / adjustedStake) * 100

        allPicks.push({
          gameId: g.id,
          teams: `${ctx.awayTeam} @ ${ctx.homeTeam}`,
          startTime: ctx.startTime,
          betType: "moneyline",
          line: `${ctx.awayTeam} ML`,
          odds: awayOdds,
          emotionalAlignment: alignment,
          confidence: awayConfidence,
          suggestedStakeFraction: adjustedStake / args.weeklyBudget,
          suggestedStakeAbsolute: adjustedStake,
          riskLevel,
          shortExplanation: ev < 0
            ? "DO NOT BET ON THIS GAME. OUR ANALYSIS HAS DETERMINED THIS WILL LEAD TO A LOSING BET. TAKE A BREAK FROM BETTING UNTIL ODDS IMPROVE."
            : `Moneyline pick with estimated ${Math.round(awayImplied * 100 + bettorEdge * 100)}% win probability.`,
          numericRisk: { ev, evPercentage }
        })
      }
    }

    // 2. SPREAD picks - analyze BOTH sides based on value
    const homeSpreadOdds = ctx.currentOdds?.spreadHomeOdds
    const homeSpreadLine = ctx.spreadLines?.home
    const awaySpreadOdds = ctx.currentOdds?.spreadAwayOdds
    const awaySpreadLine = ctx.spreadLines?.away

    if (typeof homeSpreadOdds === "number" && typeof homeSpreadLine === "number" &&
        typeof awaySpreadOdds === "number" && typeof awaySpreadLine === "number") {
      const homeSpreadImplied = oddsToImpliedProb(homeSpreadOdds)
      const awaySpreadImplied = oddsToImpliedProb(awaySpreadOdds)
      const homeSpreadConfidence = Math.round(homeSpreadImplied * 100)
      const awaySpreadConfidence = Math.round(awaySpreadImplied * 100)

      // Calculate EV for both sides with assumed bettor edge
      const homeSpreadEV = calculateEVWithEdge(homeSpreadOdds, suggestedStakeAbsolute, homeSpreadImplied)
      const awaySpreadEV = calculateEVWithEdge(awaySpreadOdds, suggestedStakeAbsolute, awaySpreadImplied)

      // Pick the side with better value
      if (homeSpreadEV > awaySpreadEV) {
        const adjustedStake = calculateKellyStake(homeSpreadEV, homeSpreadConfidence, suggestedStakeAbsolute)
        const ev = calculateEVWithEdge(homeSpreadOdds, adjustedStake, homeSpreadImplied)
        const evPercentage = (ev / adjustedStake) * 100

        allPicks.push({
          gameId: g.id,
          teams: `${ctx.awayTeam} @ ${ctx.homeTeam}`,
          startTime: ctx.startTime,
          betType: "spread",
          line: `${ctx.homeTeam} ${homeSpreadLine > 0 ? '+' : ''}${homeSpreadLine}`,
          odds: homeSpreadOdds,
          emotionalAlignment: alignment,
          confidence: homeSpreadConfidence,
          suggestedStakeFraction: adjustedStake / args.weeklyBudget,
          suggestedStakeAbsolute: adjustedStake,
          riskLevel,
          shortExplanation: ev < 0
            ? "DO NOT BET ON THIS GAME. OUR ANALYSIS HAS DETERMINED THIS WILL LEAD TO A LOSING BET. TAKE A BREAK FROM BETTING UNTIL ODDS IMPROVE."
            : `Spread pick with estimated ${Math.round(homeSpreadImplied * 100 + bettorEdge * 100)}% win probability covering ${homeSpreadLine > 0 ? '+' : ''}${homeSpreadLine}.`,
          numericRisk: { ev, evPercentage }
        })
      } else {
        const adjustedStake = calculateKellyStake(awaySpreadEV, awaySpreadConfidence, suggestedStakeAbsolute)
        const ev = calculateEVWithEdge(awaySpreadOdds, adjustedStake, awaySpreadImplied)
        const evPercentage = (ev / adjustedStake) * 100

        allPicks.push({
          gameId: g.id,
          teams: `${ctx.awayTeam} @ ${ctx.homeTeam}`,
          startTime: ctx.startTime,
          betType: "spread",
          line: `${ctx.awayTeam} ${awaySpreadLine > 0 ? '+' : ''}${awaySpreadLine}`,
          odds: awaySpreadOdds,
          emotionalAlignment: alignment,
          confidence: awaySpreadConfidence,
          suggestedStakeFraction: adjustedStake / args.weeklyBudget,
          suggestedStakeAbsolute: adjustedStake,
          riskLevel,
          shortExplanation: ev < 0
            ? "DO NOT BET ON THIS GAME. OUR ANALYSIS HAS DETERMINED THIS WILL LEAD TO A LOSING BET. TAKE A BREAK FROM BETTING UNTIL ODDS IMPROVE."
            : `Spread pick with estimated ${Math.round(awaySpreadImplied * 100 + bettorEdge * 100)}% win probability covering ${awaySpreadLine > 0 ? '+' : ''}${awaySpreadLine}.`,
          numericRisk: { ev, evPercentage }
        })
      }
    }

    // 3. TOTALS picks - analyze BOTH over and under based on value
    const overOdds = ctx.currentOdds?.totalOverOdds
    const underOdds = ctx.currentOdds?.totalUnderOdds
    const totalLine = ctx.totalLine

    if (typeof overOdds === "number" && typeof underOdds === "number" && typeof totalLine === "number") {
      const overImplied = oddsToImpliedProb(overOdds)
      const underImplied = oddsToImpliedProb(underOdds)
      const overConfidence = Math.round(overImplied * 100)
      const underConfidence = Math.round(underImplied * 100)

      // Calculate EV for both over and under with assumed bettor edge
      const overEV = calculateEVWithEdge(overOdds, suggestedStakeAbsolute, overImplied)
      const underEV = calculateEVWithEdge(underOdds, suggestedStakeAbsolute, underImplied)

      // Pick the side with better value
      if (overEV > underEV) {
        const adjustedStake = calculateKellyStake(overEV, overConfidence, suggestedStakeAbsolute)
        const ev = calculateEVWithEdge(overOdds, adjustedStake, overImplied)
        const evPercentage = (ev / adjustedStake) * 100

        allPicks.push({
          gameId: g.id,
          teams: `${ctx.awayTeam} @ ${ctx.homeTeam}`,
          startTime: ctx.startTime,
          betType: "over",
          line: `Over ${totalLine}`,
          odds: overOdds,
          emotionalAlignment: alignment,
          confidence: overConfidence,
          suggestedStakeFraction: adjustedStake / args.weeklyBudget,
          suggestedStakeAbsolute: adjustedStake,
          riskLevel,
          shortExplanation: ev < 0
            ? "DO NOT BET ON THIS GAME. OUR ANALYSIS HAS DETERMINED THIS WILL LEAD TO A LOSING BET. TAKE A BREAK FROM BETTING UNTIL ODDS IMPROVE."
            : `Over pick with estimated ${Math.round(overImplied * 100 + bettorEdge * 100)}% win probability based on game pace and scoring trends.`,
          numericRisk: { ev, evPercentage }
        })
      } else {
        const adjustedStake = calculateKellyStake(underEV, underConfidence, suggestedStakeAbsolute)
        const ev = calculateEVWithEdge(underOdds, adjustedStake, underImplied)
        const evPercentage = (ev / adjustedStake) * 100

        allPicks.push({
          gameId: g.id,
          teams: `${ctx.awayTeam} @ ${ctx.homeTeam}`,
          startTime: ctx.startTime,
          betType: "under",
          line: `Under ${totalLine}`,
          odds: underOdds,
          emotionalAlignment: alignment,
          confidence: underConfidence,
          suggestedStakeFraction: adjustedStake / args.weeklyBudget,
          suggestedStakeAbsolute: adjustedStake,
          riskLevel,
          shortExplanation: ev < 0
            ? "DO NOT BET ON THIS GAME. OUR ANALYSIS HAS DETERMINED THIS WILL LEAD TO A LOSING BET. TAKE A BREAK FROM BETTING UNTIL ODDS IMPROVE."
            : `Under pick with estimated ${Math.round(underImplied * 100 + bettorEdge * 100)}% win probability based on game pace and scoring trends.`,
          numericRisk: { ev, evPercentage }
        })
      }
    }
  }

  // Sort picks by EV (best value first) and return top 6
  // This ensures we're recommending the BEST picks regardless of bet type
  const sortedPicks = allPicks.sort((a, b) => {
    const evA = a.numericRisk?.ev || 0
    const evB = b.numericRisk?.ev || 0
    return evB - evA  // Highest EV first
  })

  // Log bet type breakdown
  const betTypeBreakdown = sortedPicks.reduce((acc, pick) => {
    const type = pick.betType || 'unknown'
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  console.log(`[Fallback] Generated ${sortedPicks.length} total picks for ${args.riskTolerance} risk tolerance`)
  console.log(`[Fallback] Bet type breakdown:`, betTypeBreakdown)
  console.log(`[Fallback] Returning top 6 picks by EV`)

  // Return 5-6 recommendations to ensure diversity of bet types
  return { recommendations: sortedPicks.slice(0, 6) }
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

    const sport = normalizeSportKey(body.sport)
    
    // Fetch user data to calculate emotional stability server-side
    const { data: userData, error: userError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      console.error('Error fetching user data:', userError)
      return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 })
    }

    // Calculate emotional stability using centralized service
    const emotionalStability = await emotionalStabilityService.getCurrentEmotionalStability(userData)
    const emotionalScore = emotionalStability.score
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

    // If enhanced AI stack (Gemini) is not available, return a safe
    // neutral response instead of attempting to generate AI picks.
    if (!isEnhancedAIAvailable()) {
      console.error("[SmartSlip] Enhanced AI not available. Env check:", {
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

    // 1. Fetch live odds using the enhanced odds abstraction (RapidAPI + The Odds API)
    console.log(`[SmartSlip] Fetching odds for sport: ${sport}, risk: ${riskTolerance}`)
    const oddsResult = await fetchEnhancedLiveOdds(sport, "auto")

    console.log(`[SmartSlip] Odds API result:`, {
      success: oddsResult.success,
      source: oddsResult.source,
      dataLength: Array.isArray(oddsResult.data) ? oddsResult.data.length : 0,
      error: oddsResult.error
    })

    if (!oddsResult.success || !Array.isArray(oddsResult.data) || oddsResult.data.length === 0) {
      console.error(`[SmartSlip] No odds data available for ${sport}`, {
        success: oddsResult.success,
        source: oddsResult.source,
        error: oddsResult.error
      })
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
          debugInfo: `Fetched from ${oddsResult.source}, no data available`
        },
      })
    }

    const rawGames = oddsResult.data as Array<any>
    console.log(`[SmartSlip] Raw games fetched: ${rawGames.length}`)

    const games = rawGames.filter((g: any) => {
      const gKeyRaw = g.sportKey || g.sport_key || g.sport
      const gKey = normalizeSportKey(gKeyRaw)
      return gKey === sport
    })

    console.log(`[SmartSlip] Games after sport filter: ${games.length} (requested: ${sport})`)

    if (games.length === 0) {
      console.warn(`[SmartSlip] No games found after filtering for ${sport}. Raw game sports:`,
        rawGames.slice(0, 3).map(g => g.sportKey || g.sport_key || g.sport)
      )
      return NextResponse.json({
        success: true,
        shouldBet: false,
        message: "No live games are available for this sport right now. Please check back later.",
        recommendations: [],
        emotionalScore,
        meta: {
          sport,
          source: oddsResult.source,
          debugInfo: `${rawGames.length} games fetched but none matched sport ${sport}`
        },
      })
    }

    // Limit research and SageMaker work to the top 4 games by interest for faster processing.
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

    const limitedGames = sortedGames.slice(0, 4) // Reduced from 6 to 4 for faster AI processing

    const serenityUsedFlags: boolean[] = []

    const enrichedGames = await Promise.all(
      limitedGames.map(async (game) => {
        const homeTeam: string = game.homeTeam || game.home_team || 'Home Team'
        const awayTeam: string = game.awayTeam || game.away_team || 'Away Team'
        const league: string = game.sportKey || game.sport_key || sport
        const gameId: string | undefined = game.id

        console.log(`[SmartSlip] Game data extraction:`, {
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
            sport_key: game.sport_key
          }
        })

        let context: CurrentGameContext | null = null
        let features: HistoricalFeatureVector | null = null
        let sportsResearch: SportsResearchOutput | null = null

        // Conduct enhanced sports research for this game
        try {
          console.log(`[SmartSlip] Conducting sports research for ${homeTeam} vs ${awayTeam}`);
          const researchPromise = conductSportsResearch({
            homeTeam,
            awayTeam,
            sport: sport,
            league: league
          });
          
          // Wait max 6 seconds for sports research to keep SmartSlip fast
          sportsResearch = await Promise.race([
            researchPromise,
            new Promise<SportsResearchOutput | null>((resolve) => setTimeout(() => resolve(null), 6000))
          ]);
          
          if (sportsResearch) {
            console.log(`[SmartSlip] ✅ Sports research completed: ${sportsResearch.dataSource}`);
          } else {
            console.log(`[SmartSlip] ⏱️ Sports research timeout, continuing without it`);
          }
        } catch (error) {
          console.warn('[SmartSlip] ⚠️ Sports research failed, continuing with analysis:', error);
        }

        // Context from live odds - extract ALL bet types (moneyline, spread, totals)
        if (!context) {
          // Moneyline odds
          const homeOdds =
            game.homeOdds?.best?.odds ?? game.home_odds?.best?.odds ?? undefined
          const awayOdds =
            game.awayOdds?.best?.odds ?? game.away_odds?.best?.odds ?? undefined

          // Spread data
          const homeSpreadLine = game.homeSpread?.best?.line ?? game.home_spread?.best?.line ?? undefined
          const homeSpreadOdds = game.homeSpread?.best?.odds ?? game.home_spread?.best?.odds ?? undefined
          const awaySpreadLine = game.awaySpread?.best?.line ?? game.away_spread?.best?.line ?? undefined
          const awaySpreadOdds = game.awaySpread?.best?.odds ?? game.away_spread?.best?.odds ?? undefined

          // Totals data
          const overLine = game.overLine?.best?.line ?? game.over_line?.best?.line ?? undefined
          const overOdds = game.overLine?.best?.odds ?? game.over_line?.best?.odds ?? undefined
          const underLine = game.underLine?.best?.line ?? game.under_line?.best?.line ?? undefined
          const underOdds = game.underLine?.best?.odds ?? game.under_line?.best?.odds ?? undefined

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
              spreadHomeOdds: homeSpreadOdds,
              spreadAwayOdds: awaySpreadOdds,
              totalOverOdds: overOdds,
              totalUnderOdds: underOdds,
            },
            spreadLines: homeSpreadLine !== undefined && awaySpreadLine !== undefined ? {
              home: homeSpreadLine,
              away: awaySpreadLine,
            } : undefined,
            totalLine: overLine ?? underLine,
            impliedProbabilities: {
              home: impliedFromOdds(homeOdds),
              away: impliedFromOdds(awayOdds),
            },
          }
        }

        // Features derived from odds + league
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

        // Serenity heuristic probabilities for this game
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

          console.log("[Picker] Serenity heuristic prediction computed for game", gameId, serenityProbs)

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
          console.warn("[Picker] Serenity heuristic prediction failed for game", gameId, e)
          prediction = {
            winProbabilityHome: 0.5,
            winProbabilityAway: 0.5,
            modelConfidence: 0.5,
            riskScore: 0.5,
          }
          serenityUsedFlags.push(false)
        }

        return {
          id: gameId,
          context,
          features,
          prediction,
          probs: serenityProbs,
          sportsResearch: sportsResearch ? {
            dataSource: sportsResearch.dataSource,
            researchTimestamp: sportsResearch.researchTimestamp,
            homeTeam: {
              name: sportsResearch.homeTeam.teamInfo?.strTeam,
              currentForm: sportsResearch.homeTeam.currentForm,
              strengths: sportsResearch.homeTeam.strengths.slice(0, 3),
              recentForm: sportsResearch.homeTeam.recentForm?.last5 || []
            },
            awayTeam: {
              name: sportsResearch.awayTeam.teamInfo?.strTeam,
              currentForm: sportsResearch.awayTeam.currentForm,
              strengths: sportsResearch.awayTeam.strengths.slice(0, 3),
              recentForm: sportsResearch.awayTeam.recentForm?.last5 || []
            },
            headToHead: sportsResearch.headToHead ? {
              totalMatches: sportsResearch.headToHead.totalMatches,
              homeWins: sportsResearch.headToHead.homeTeamWins,
              awayWins: sportsResearch.headToHead.awayTeamWins,
              draws: sportsResearch.headToHead.draws
            } : null,
            keyFactors: sportsResearch.keyFactors.slice(0, 5),
            expertPrediction: sportsResearch.prediction
          } : null
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

    console.log(`[SmartSlip] Calling AI reasoner with ${enrichedGames.length} enriched games`)
    let reasoningOutput = await generatePickerRecommendations(reasoningInput)

    console.log(`[SmartSlip] AI reasoner returned ${reasoningOutput.recommendations?.length || 0} recommendations`)

    if (!reasoningOutput.recommendations || reasoningOutput.recommendations.length === 0) {
      console.log(`[SmartSlip] AI returned no recommendations, using fallback logic for ${riskTolerance} risk`)
      reasoningOutput = buildFallbackRecommendations({
        games: enrichedGames.map((g) => ({ id: g.id, context: g.context })),
        riskTolerance,
        weeklyBudget,
        emotionalScore,
      })
      console.log(`[SmartSlip] Fallback generated ${reasoningOutput.recommendations.length} recommendations`)
    } else {
      console.log(`[SmartSlip] Using AI recommendations:`,
        reasoningOutput.recommendations.map(r => `${r.betType} - ${r.line}`)
      )
    }

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
      used_sagemaker: serenityUsedFlags.some(Boolean)
    })

    const shouldBet = reasoningOutput.recommendations.length > 0
    const shouldBetMessage = shouldBet
      ? "Recommended bets are available based on your current emotional stability and risk tolerance."
      : "No recommended bets found right now based on your emotional stability and risk tolerance."

    return NextResponse.json({
      success: true,
      shouldBet,
      message: shouldBetMessage,
      recommendations: reasoningOutput.recommendations,
      emotionalScore,
      meta: {
        sport,
        oddsSource: oddsResult.source,
        usedSageMaker: serenityUsedFlags.some(Boolean),
        usedGemini: true,
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

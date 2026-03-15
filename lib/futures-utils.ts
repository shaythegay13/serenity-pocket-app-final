/**
 * lib/futures-utils.ts
 *
 * First-class futures support.
 * Fetches outrights/futures from TheOddsAPI, computes de-vigged fair probability
 * across all outcomes, and produces FutureMarket + FuturesRecommendation objects
 * for use in the picker route.
 */

import {
  computeEv,
  impliedProbFromAmerican,
} from './ev-calculator'
import type { EvDiagnostics } from './ev-calculator'
import type {
  FutureMarket,
  FuturesRecommendation,
  FuturesCategory,
  FuturesSubject,
} from './types/ai-models'

export type { FutureMarket, FuturesRecommendation, FuturesCategory, FuturesSubject }

// ============================================================================
// Outright market keys (TheOddsAPI)
// ============================================================================

const OUTRIGHT_MARKET_KEYS: Record<string, string[]> = {
  // NBA
  basketball_nba: [
    'outrights',                              // Championship
    'player_award_mvp',                       // MVP
    'player_award_roy',                       // Rookie of the Year
    'player_award_dpoy',                      // DPOY
  ],
  // NFL
  americanfootball_nfl: [
    'outrights',                              // Super Bowl
    'division_winner',
    'conference_winner',
    'player_award_mvp',
  ],
  // MLB
  baseball_mlb: [
    'outrights',                              // World Series
    'division_winner',
    'player_award_mvp',
    'player_award_cy_young',
  ],
  // NHL
  icehockey_nhl: [
    'outrights',                              // Stanley Cup
    'division_winner',
    'player_award_mvp',
  ],
}

function getOutrightMarkets(sport: string): string[] {
  return OUTRIGHT_MARKET_KEYS[sport] ?? ['outrights']
}

function categorizeFutureMarket(marketKey: string): FuturesCategory {
  if (marketKey === 'outrights') return 'championship'
  if (marketKey === 'division_winner') return 'division'
  if (marketKey === 'conference_winner') return 'conference'
  if (marketKey.includes('award')) return 'award'
  return 'season_stat'
}

function subjectFromMarket(marketKey: string): FuturesSubject {
  return marketKey.includes('player') ? 'player' : 'team'
}

function buildSportKey(sport: string): string {
  if (sport.includes('_')) return sport
  const s = sport.toLowerCase()
  if (s === 'nba') return 'basketball_nba'
  if (s === 'nfl') return 'americanfootball_nfl'
  if (s === 'mlb') return 'baseball_mlb'
  if (s === 'nhl') return 'icehockey_nhl'
  return sport
}

function getApiKey(): string | undefined {
  return process.env.NEXT_PUBLIC_ODDS_API_KEY ?? process.env.ODDS_API_KEY
}

// ============================================================================
// Fetch futures from TheOddsAPI
// ============================================================================

/**
 * Fetches all outright/futures markets for a sport from TheOddsAPI.
 * Returns an array of FutureMarket objects with de-vigged fair probabilities.
 */
export async function fetchFutureMarkets(
  sport: string,
  seasonId: string = 'current'
): Promise<FutureMarket[]> {
  const apiKey = getApiKey()
  if (!apiKey) {
    console.warn('[FuturesUtils] No API key configured')
    return []
  }

  const sportKey = buildSportKey(sport)
  const marketKeys = getOutrightMarkets(sportKey)
  const allMarkets: FutureMarket[] = []

  for (const marketKey of marketKeys) {
    try {
      const url = [
        `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/`,
        `?regions=us&markets=${marketKey}&oddsFormat=american`,
        `&apiKey=${apiKey}`,
      ].join('')

      const response = await fetch(url, { next: { revalidate: 3600 } }) // 1-hour cache
      if (!response.ok) {
        console.warn(`[FuturesUtils] API error for ${marketKey}: ${response.status}`)
        continue
      }

      const data: any[] = await response.json()
      if (!Array.isArray(data)) continue

      const category = categorizeFutureMarket(marketKey)
      const subject = subjectFromMarket(marketKey)

      // Estimate settlement date from start of next season / award season
      const settlementDate = estimateSettlementDate(sportKey)

      for (const event of data) {
        const bookmakers: any[] = event.bookmakers || []
        if (bookmakers.length === 0) continue

        // Collect all outcomes from the first bookmaker that has this market
        const book = bookmakers[0]
        const market = book.markets?.find((m: any) => m.key === marketKey)
        if (!market || !Array.isArray(market.outcomes)) continue

        // Compute total implied probability across all outcomes for de-vig
        const allImplied = market.outcomes.map((o: any) =>
          impliedProbFromAmerican(o.price)
        )
        const totalImplied = allImplied.reduce((s: number, p: number) => s + p, 0)

        for (let i = 0; i < market.outcomes.length; i++) {
          const outcome = market.outcomes[i]
          const odds: number = outcome.price
          const impl = allImplied[i]
          const fairProb = totalImplied > 0 ? impl / totalImplied : undefined

          allMarkets.push({
            id: `${event.id}_${marketKey}_${i}`,
            sport: sportKey,
            seasonId,
            category,
            subject,
            selection: outcome.name,
            odds,
            impliedProbability: impl,
            fairProbability: fairProb,
            bookmaker: book.key,
            settlementDate,
            isOpen: true,
            variantType: 'base_line',
            marketLevel: 'future',
          })
        }
      }
    } catch (err) {
      console.error(`[FuturesUtils] Error fetching ${marketKey}:`, err)
    }
  }

  return allMarkets
}

// ============================================================================
// Futures EV & stake calculations
// ============================================================================

/**
 * Computes EV for a futures market using the de-vigged fair probability.
 * Returns standard EvDiagnostics identical to other bet types.
 */
export function computeFuturesEV(
  market: FutureMarket,
  stake: number,
  trueWinProb: number
): EvDiagnostics {
  return computeEv({
    stake,
    offeredAmericanOdds: market.odds,
    precomputedTrueWinProb: trueWinProb,
  })
}

/**
 * Futures stake recommendation: cap at 50% of normal Kelly fraction
 * due to long settlement horizon and liquidity risk.
 */
export function getFuturesStakeFraction(
  kellyFraction: number
): number {
  return Math.min(kellyFraction * 0.5, 0.05) // max 5% of budget for any future
}

// ============================================================================
// Futures recommendation builder
// ============================================================================

/**
 * Builds a FuturesRecommendation from a FutureMarket.
 * Requires a true win probability estimate (typically from de-vigging).
 */
export function buildFuturesRecommendation(
  market: FutureMarket,
  weeklyBudget: number,
  overrideTrueProb?: number
): FuturesRecommendation | null {
  const trueProb = overrideTrueProb ?? market.fairProbability
  if (trueProb === undefined || trueProb <= 0) return null

  const stake = weeklyBudget * 0.02 // 2% of budget default for futures
  const ev = computeFuturesEV(market, stake, trueProb)

  if (ev.evPercent < -5) return null // Reject clearly -EV futures

  const kellyFraction = getFuturesStakeFraction(ev.kellyFraction ?? 0.02)
  const suggestedStake = Math.max(1, Math.round(weeklyBudget * kellyFraction))

  const horizonDays = settlementHorizonDays(market.settlementDate)
  const riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' =
    ev.evPercent > 3 ? 'LOW' : ev.evPercent > 0 ? 'MEDIUM' : 'HIGH'

  const reasoning =
    `${market.selection} to win ${market.category} at ${market.odds > 0 ? '+' : ''}${market.odds}. ` +
    `Fair probability: ${(trueProb * 100).toFixed(1)}% vs implied ${(market.impliedProbability * 100).toFixed(1)}%. ` +
    `Projected EV: ${ev.evPercent >= 0 ? '+' : ''}${ev.evPercent.toFixed(1)}%. ` +
    `Settles in ~${horizonDays} days.`

  return {
    market,
    confidence: Math.round(Math.min(100, Math.max(0, 50 + ev.evPercent * 5))),
    evPercentage: ev.evPercent,
    suggestedStake,
    suggestedStakeFraction: kellyFraction,
    riskLevel,
    reasoning,
    settlementHorizonDays: horizonDays,
    subject: market.subject,
  }
}

// ============================================================================
// Helpers
// ============================================================================

function settlementHorizonDays(settlementDate: string): number {
  const ms = new Date(settlementDate).getTime() - Date.now()
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)))
}

function estimateSettlementDate(sport: string): string {
  const now = new Date()
  const year = now.getFullYear()

  if (sport === 'americanfootball_nfl') {
    // Super Bowl in early February
    return new Date(year + (now.getMonth() >= 2 ? 1 : 0), 1, 1).toISOString()
  }
  if (sport === 'basketball_nba') {
    // NBA Finals in June
    return new Date(year + (now.getMonth() >= 6 ? 1 : 0), 5, 1).toISOString()
  }
  if (sport === 'baseball_mlb') {
    // World Series in October
    return new Date(year + (now.getMonth() >= 10 ? 1 : 0), 9, 1).toISOString()
  }
  if (sport === 'icehockey_nhl') {
    // Stanley Cup Finals in June
    return new Date(year + (now.getMonth() >= 6 ? 1 : 0), 5, 1).toISOString()
  }
  // Default: 1 year from now
  return new Date(year + 1, now.getMonth(), 1).toISOString()
}

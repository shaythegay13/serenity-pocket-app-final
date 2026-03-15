/**
 * lib/services/live-odds-service.ts
 *
 * Live odds refresh service.
 * When isLiveBet === true, fetches fresh odds from TheOddsAPI on-demand
 * and recomputes EV using the latest prices.
 *
 * TheOddsAPI does not provide in-game score data directly; scoreSnapshot
 * is populated from the same odds response (in-progress games show live
 * moneyline movement) and is surfaced as a context string for Gemini.
 */

import type { LiveBettingOdds } from '../types/live-betting'
import { computeEv, impliedProbFromAmerican, noVigFairProbFromTwoWayMarket } from '../ev-calculator'
import type { EvDiagnostics } from '../ev-calculator'

// ============================================================================
// Types
// ============================================================================

export interface LiveOddsUpdate {
  gameId: string
  sport: string
  timestamp: string
  odds: LiveBettingOdds
  /** Score/game state if detectable from the odds shift (best-effort) */
  scoreSnapshot?: { home: number; away: number; period?: string; clock?: string }
}

// ============================================================================
// API helpers
// ============================================================================

function getApiKey(): string | undefined {
  return process.env.NEXT_PUBLIC_ODDS_API_KEY ?? process.env.ODDS_API_KEY
}

function buildSportKey(sport: string): string {
  // Already a full key like "basketball_nba"
  if (sport.includes('_')) return sport
  const s = sport.toLowerCase()
  if (s === 'nba') return 'basketball_nba'
  if (s === 'nfl') return 'americanfootball_nfl'
  if (s === 'mlb') return 'baseball_mlb'
  if (s === 'nhl') return 'icehockey_nhl'
  return sport
}

// ============================================================================
// Live odds fetch
// ============================================================================

/**
 * Fetches the latest odds for a specific game from TheOddsAPI.
 * Uses a narrow commenceTime window (now ± 4 h) to capture in-progress games.
 * Returns null if the API key is missing, the game is not found, or the
 * request fails.
 */
export async function fetchLiveOddsUpdate(
  gameId: string,
  sport: string
): Promise<LiveOddsUpdate | null> {
  const apiKey = getApiKey()
  if (!apiKey) {
    console.warn('[LiveOddsService] No API key configured')
    return null
  }

  const sportKey = buildSportKey(sport)
  const now = new Date()
  const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000)
  const fourHoursFromNow = new Date(now.getTime() + 4 * 60 * 60 * 1000)
  const from = fourHoursAgo.toISOString().replace('.000Z', 'Z')
  const to = fourHoursFromNow.toISOString().replace('.000Z', 'Z')

  const url = [
    `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/`,
    `?regions=us&markets=h2h,spreads,totals&oddsFormat=american`,
    `&commenceTimeFrom=${encodeURIComponent(from)}`,
    `&commenceTimeTo=${encodeURIComponent(to)}`,
    `&apiKey=${apiKey}`,
  ].join('')

  try {
    const response = await fetch(url, { cache: 'no-store' })
    if (!response.ok) {
      console.warn(`[LiveOddsService] API error: ${response.status}`)
      return null
    }

    const data: any[] = await response.json()
    const game = Array.isArray(data) ? data.find((g: any) => g.id === gameId) : null

    if (!game) {
      console.warn(`[LiveOddsService] Game ${gameId} not found in live response`)
      return null
    }

    const odds = parseGameOdds(game)
    if (!odds) return null

    return {
      gameId,
      sport,
      timestamp: now.toISOString(),
      odds: { ...odds, lastOddsUpdate: now.toISOString(), isInProgress: true },
    }
  } catch (err) {
    console.error('[LiveOddsService] Fetch error:', err)
    return null
  }
}

// ============================================================================
// Parse game odds from raw API response
// ============================================================================

function parseGameOdds(game: any): LiveBettingOdds | null {
  const preferredBooks = ['draftkings', 'fanduel', 'betmgm', 'caesars', 'bovada']
  const findMarket = (book: any, key: string) =>
    book.markets?.find((m: any) => m.key === key)

  let h2h: any = null, spreads: any = null, totals: any = null

  const books: any[] = game.bookmakers || []
  const perfectBook =
    books.find((b: any) =>
      preferredBooks.includes(b.key) &&
      findMarket(b, 'h2h') && findMarket(b, 'spreads') && findMarket(b, 'totals')
    ) ||
    books.find((b: any) =>
      findMarket(b, 'h2h') && findMarket(b, 'spreads') && findMarket(b, 'totals')
    )

  if (perfectBook) {
    h2h = findMarket(perfectBook, 'h2h')
    spreads = findMarket(perfectBook, 'spreads')
    totals = findMarket(perfectBook, 'totals')
  } else {
    for (const b of books) {
      if (!h2h && findMarket(b, 'h2h')) h2h = findMarket(b, 'h2h')
      if (!spreads && findMarket(b, 'spreads')) spreads = findMarket(b, 'spreads')
      if (!totals && findMarket(b, 'totals')) totals = findMarket(b, 'totals')
    }
  }

  if (!h2h) return null

  const homeTeam = game.home_team
  const awayTeam = game.away_team

  const homeOdds = h2h.outcomes?.find((o: any) => o.name === homeTeam)?.price ?? -110
  const awayOdds = h2h.outcomes?.find((o: any) => o.name === awayTeam)?.price ?? -110

  const homeSpread = spreads?.outcomes?.find((o: any) => o.name === homeTeam)
  const awaySpread = spreads?.outcomes?.find((o: any) => o.name === awayTeam)

  const overOutcome = totals?.outcomes?.find((o: any) => o.name === 'Over')
  const underOutcome = totals?.outcomes?.find((o: any) => o.name === 'Under')

  return {
    id: game.id,
    sport: game.sport_key,
    homeTeam,
    awayTeam,
    commenceTime: game.commence_time,
    moneyline: { home: homeOdds, away: awayOdds },
    spread: {
      home: { line: homeSpread?.point ?? 0, odds: homeSpread?.price ?? -110 },
      away: { line: awaySpread?.point ?? 0, odds: awaySpread?.price ?? -110 },
    },
    totals: {
      over: { line: overOutcome?.point ?? 0, odds: overOutcome?.price ?? -110 },
      under: { line: underOutcome?.point ?? 0, odds: underOutcome?.price ?? -110 },
    },
  }
}

// ============================================================================
// Live EV recomputation
// ============================================================================

/**
 * Recomputes EV for an existing bet using the latest live odds snapshot.
 * Uses de-vigged fair probability from the current two-way market.
 */
export function recomputeLiveEV(
  bet: { selection: string; originalOdds: number; stake: number },
  latestOdds: LiveBettingOdds,
  _sport: string
): EvDiagnostics {
  const { selection, stake } = bet

  // Determine the current offered odds and opposing odds for this selection
  let offeredOdds = bet.originalOdds
  let opposingOdds = bet.originalOdds

  if (selection === 'home' || selection === 'away') {
    offeredOdds = selection === 'home' ? latestOdds.moneyline.home : latestOdds.moneyline.away
    opposingOdds = selection === 'home' ? latestOdds.moneyline.away : latestOdds.moneyline.home
  } else if (selection === 'over' || selection === 'under') {
    offeredOdds = selection === 'over' ? latestOdds.totals.over.odds : latestOdds.totals.under.odds
    opposingOdds = selection === 'over' ? latestOdds.totals.under.odds : latestOdds.totals.over.odds
  }

  const impliedA = impliedProbFromAmerican(offeredOdds)
  const impliedB = impliedProbFromAmerican(opposingOdds)
  const { fairProbSideA } = noVigFairProbFromTwoWayMarket(impliedA, impliedB)

  return computeEv({
    stake,
    offeredAmericanOdds: offeredOdds,
    precomputedTrueWinProb: fairProbSideA,
  })
}

// ============================================================================
// Narrative context builder
// ============================================================================

/**
 * Returns a concise live context string for Gemini / psych model prompts.
 * e.g. "LIVE — LAL 87, BOS 82 (Q3 4:22 remaining)"
 */
export function buildLiveContext(update: LiveOddsUpdate): string {
  const { odds } = update
  const score = update.scoreSnapshot ?? odds.scoreSnapshot

  const baseContext = `LIVE — ${odds.homeTeam} vs ${odds.awayTeam}`

  if (score) {
    const scoreStr = `${odds.homeTeam} ${score.home}, ${odds.awayTeam} ${score.away}`
    const periodStr = score.period ? ` (${score.period}${score.clock ? ` ${score.clock} remaining` : ''})` : ''
    return `${baseContext}: ${scoreStr}${periodStr}`
  }

  // No score data; surface the current moneyline shift as context
  const impliedHome = (impliedProbFromAmerican(odds.moneyline.home) * 100).toFixed(0)
  const impliedAway = (impliedProbFromAmerican(odds.moneyline.away) * 100).toFixed(0)
  return `${baseContext} — live odds: ${odds.homeTeam} ${impliedHome}% / ${odds.awayTeam} ${impliedAway}% implied`
}

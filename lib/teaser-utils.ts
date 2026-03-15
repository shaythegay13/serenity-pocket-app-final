/**
 * lib/teaser-utils.ts
 *
 * Teaser bet type for NFL and NBA.
 * Teasers adjust spreads/totals by a fixed number of points in the bettor's
 * favour, with payouts determined by a fixed payout table (NOT naive parlay
 * multiplication).
 */

import { computeEv, impliedProbFromAmerican } from './ev-calculator'
import type { EvDiagnostics } from './ev-calculator'
import type { TeaserLeg, TeaserRecommendation } from './types/ai-models'

// ============================================================================
// Payout Tables
// ============================================================================

/**
 * Standard Vegas teaser payout tables (American odds).
 * Keys: [sport][teaserSize][legCount]
 */
const TEASER_PAYOUT_TABLES: Record<string, Record<number, Record<number, number>>> = {
  nfl: {
    6:   { 2: -110, 3: 180, 4: 300 },
    6.5: { 2: -120, 3: 160, 4: 260 },
    7:   { 2: -130, 3: 120, 4: 200 },
    10:  { 2: -200, 3: 100, 4: 150 },  // "monster" / "sweetheart"
  },
  nba: {
    5:   { 2: -110, 3: 180, 4: 300 },
    6:   { 2: -120, 3: 160, 4: 260 },
  },
}

/** Allowed teaser sizes per sport */
const ALLOWED_TEASER_SIZES: Record<string, number[]> = {
  nfl: [6, 6.5, 7, 10],
  nba: [5, 6],
}

/** Min and max leg counts for teasers */
const TEASER_MIN_LEGS = 2
const TEASER_MAX_LEGS = 4

// ============================================================================
// Validation
// ============================================================================

/**
 * Resolves a sport string to the internal teaser sport key ('nfl' | 'nba').
 * Returns null if the sport does not support teasers.
 */
function resolveTeaserSport(sport: string): 'nfl' | 'nba' | null {
  const s = sport.toLowerCase()
  if (s.includes('football') || s.includes('nfl')) return 'nfl'
  if (s.includes('basketball') || s.includes('nba')) return 'nba'
  return null
}

/**
 * Validates that a proposed teaser is legal.
 * Checks: sport eligibility, teaser size, leg count, and leg types (spread/total only).
 */
export function validateTeaser(
  legs: TeaserLeg[],
  sport: string,
  teaserSize: number
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  const teaserSport = resolveTeaserSport(sport)
  if (!teaserSport) {
    errors.push(`Teasers are not available for sport "${sport}". Only NFL and NBA support teasers.`)
    return { valid: false, errors }
  }

  const allowedSizes = ALLOWED_TEASER_SIZES[teaserSport]
  if (!allowedSizes.includes(teaserSize)) {
    errors.push(`Teaser size ${teaserSize} is not allowed for ${teaserSport.toUpperCase()}. Allowed sizes: ${allowedSizes.join(', ')}.`)
  }

  if (legs.length < TEASER_MIN_LEGS) {
    errors.push(`Teasers require at least ${TEASER_MIN_LEGS} legs. Got ${legs.length}.`)
  }

  if (legs.length > TEASER_MAX_LEGS) {
    errors.push(`Teasers support at most ${TEASER_MAX_LEGS} legs. Got ${legs.length}.`)
  }

  for (let i = 0; i < legs.length; i++) {
    const leg = legs[i]
    if (leg.betType !== 'spread' && leg.betType !== 'total') {
      errors.push(`Leg ${i + 1} has betType "${leg.betType}". Only spread and total legs are eligible for teasers.`)
    }
  }

  // Check that payout table entry exists
  if (errors.length === 0) {
    const table = TEASER_PAYOUT_TABLES[teaserSport]?.[teaserSize]
    if (!table || table[legs.length] === undefined) {
      errors.push(`No payout table entry found for ${teaserSport.toUpperCase()} ${teaserSize}-point teaser with ${legs.length} legs.`)
    }
  }

  return { valid: errors.length === 0, errors }
}

// ============================================================================
// Line Adjustment
// ============================================================================

/**
 * Applies the teaser point adjustment to a leg, moving the line in the
 * bettor's favour.
 *
 * - spread home: adjusts the home spread by -teaserSize (more favourable)
 * - spread away: adjusts the home spread by +teaserSize (so away gets easier)
 * - total over: adjusts line down by -teaserSize (easier to go over)
 * - total under: adjusts line up by +teaserSize (easier to stay under)
 */
export function applyTeaserAdjustment(leg: TeaserLeg, teaserSize: number): TeaserLeg {
  let adjustedLine = leg.originalLine

  if (leg.betType === 'spread') {
    // Bettor selects a side; adjustment always favours them
    if (leg.selection === 'home') {
      adjustedLine = leg.originalLine - teaserSize  // e.g. -3 becomes +3 with 6pt
    } else {
      adjustedLine = leg.originalLine + teaserSize  // e.g. +3 becomes +9 with 6pt
    }
  } else if (leg.betType === 'total') {
    if (leg.selection === 'over') {
      adjustedLine = leg.originalLine - teaserSize  // lower total = easier over
    } else {
      adjustedLine = leg.originalLine + teaserSize  // higher total = easier under
    }
  }

  return { ...leg, adjustedLine }
}

// ============================================================================
// Payout Table Lookup
// ============================================================================

/**
 * Returns the American odds from the payout table for the given sport,
 * teaser size, and number of legs.
 * Throws if no entry exists (call validateTeaser first).
 */
export function getTeaserOdds(sport: string, teaserSize: number, legCount: number): number {
  const teaserSport = resolveTeaserSport(sport)
  if (!teaserSport) throw new Error(`Sport "${sport}" does not support teasers.`)

  const table = TEASER_PAYOUT_TABLES[teaserSport]?.[teaserSize]
  if (!table) throw new Error(`No teaser table for ${teaserSport.toUpperCase()} ${teaserSize}-point teaser.`)

  const odds = table[legCount]
  if (odds === undefined) throw new Error(`No payout for ${legCount}-leg ${teaserSport.toUpperCase()} ${teaserSize}-point teaser.`)

  return odds
}

// ============================================================================
// Probability Estimation
// ============================================================================

/**
 * Estimates true win probability for a single teaser leg after point adjustment.
 * Uses the adjusted line and the leg's original market-implied probability,
 * then applies a simple model: each teaser point is worth ~2.5% win probability
 * for spreads in NFL, ~2% for NBA, and ~1.5% for totals.
 */
function estimateLegProbAfterAdjustment(
  leg: TeaserLeg,
  teaserSize: number,
  teaserSport: 'nfl' | 'nba'
): number {
  const baseImplied = leg.aiWinProbability ?? impliedProbFromAmerican(leg.odds ?? -110)

  const probPerPoint = leg.betType === 'spread'
    ? (teaserSport === 'nfl' ? 0.025 : 0.020)
    : 0.015  // totals

  const boost = probPerPoint * teaserSize
  return Math.min(0.95, Math.max(0.05, baseImplied + boost))
}

/**
 * Computes the combined true win probability for a teaser by multiplying
 * per-leg probabilities after applying the teaser adjustment.
 * (Assumes legs are approximately independent after the line move.)
 */
export function computeTeaserTrueProbability(
  legs: TeaserLeg[],
  sport: string,
  teaserSize: number
): number {
  const teaserSport = resolveTeaserSport(sport)
  if (!teaserSport || legs.length === 0) return 0

  const adjustedLegs = legs.map(l => applyTeaserAdjustment(l, teaserSize))
  return adjustedLegs.reduce((prob, leg) => {
    return prob * estimateLegProbAfterAdjustment(leg, teaserSize, teaserSport)
  }, 1)
}

// ============================================================================
// EV Calculation
// ============================================================================

/**
 * Computes EV for a teaser bet using the payout table odds (not leg multiplication).
 * The "true win probability" is derived from the adjusted legs.
 */
export function computeTeaserEV(
  legs: TeaserLeg[],
  sport: string,
  teaserSize: number,
  stake: number
): EvDiagnostics {
  const teaserOdds = getTeaserOdds(sport, teaserSize, legs.length)
  const trueProbability = computeTeaserTrueProbability(legs, sport, teaserSize)

  return computeEv({
    stake,
    offeredAmericanOdds: teaserOdds,
    precomputedTrueWinProb: trueProbability,
  })
}

// ============================================================================
// Recommendation Builder
// ============================================================================

/**
 * Builds a TeaserRecommendation from a set of validated legs.
 * Returns null if validation fails.
 */
export function buildTeaserRecommendation(
  legs: TeaserLeg[],
  sport: string,
  teaserSize: number,
  stake: number
): TeaserRecommendation | null {
  const { valid } = validateTeaser(legs, sport, teaserSize)
  if (!valid) return null

  const adjustedLegs = legs.map(l => applyTeaserAdjustment(l, teaserSize))
  const teaserOddsAmerican = getTeaserOdds(sport, teaserSize, legs.length)
  const trueProbability = computeTeaserTrueProbability(legs, sport, teaserSize)
  const evResult = computeTeaserEV(legs, sport, teaserSize, stake)

  const summary = adjustedLegs
    .map(l => `${l.teams} — ${l.selection === 'home' || l.selection === 'away' ? 'Spread' : 'Total'} ${l.adjustedLine}`)
    .join(' + ')

  return {
    legs: adjustedLegs,
    teaserSize,
    teaserOddsAmerican,
    trueProbability,
    projectedEV: evResult.evDollars,
    evPercentage: evResult.evPercent,
    suggestedStake: stake,
    sport,
    summary: `${teaserSize}-pt ${sport.toUpperCase()} Teaser (${legs.length} legs): ${summary}`,
  }
}

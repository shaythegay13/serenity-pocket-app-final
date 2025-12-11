/**
 * Betting Calculations and Odds Utilities
 *
 * Comprehensive utility functions for:
 * - Odds format conversions (American, Decimal, Fractional)
 * - Line movement calculations and analysis
 * - Sharp money detection and trend analysis
 * - Value betting identification
 * - Consensus calculations
 */

import type {
  OddsValue,
  BookmakerOdds,
  LineMovementSnapshot,
  BettingSplit,
  SharpMoneyIndicator,
  LiveOddsData,
} from "../types/live-betting"

// ============================================================================
// ODDS FORMAT CONVERSIONS
// ============================================================================

/**
 * Convert American odds to Decimal format
 * @example americanToDecimal(-110) => 1.909
 * @example americanToDecimal(+150) => 2.50
 */
export function americanToDecimal(american: number): number {
  if (american > 0) {
    return (american / 100) + 1
  } else {
    return (100 / Math.abs(american)) + 1
  }
}

/**
 * Convert American odds to Fractional format
 * @example americanToFractional(-110) => "10/11"
 * @example americanToFractional(+150) => "3/2"
 */
export function americanToFractional(american: number): string {
  const decimal = americanToDecimal(american)
  const fraction = decimal - 1

  // Find closest simple fraction
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
  const precision = 100
  const numerator = Math.round(fraction * precision)
  const denominator = precision
  const divisor = gcd(numerator, denominator)

  return `${numerator / divisor}/${denominator / divisor}`
}

/**
 * Convert Decimal odds to American format
 * @example decimalToAmerican(1.909) => -110
 * @example decimalToAmerican(2.50) => +150
 */
export function decimalToAmerican(decimal: number): number {
  if (decimal >= 2) {
    return Math.round((decimal - 1) * 100)
  } else {
    return Math.round(-100 / (decimal - 1))
  }
}

/**
 * Calculate implied probability from American odds
 * @example calculateImpliedProbability(-110) => 52.38%
 * @example calculateImpliedProbability(+150) => 40%
 */
export function calculateImpliedProbability(american: number): number {
  if (american > 0) {
    return (100 / (american + 100)) * 100
  } else {
    return (Math.abs(american) / (Math.abs(american) + 100)) * 100
  }
}

/**
 * Calculate "no-vig" fair odds by removing bookmaker margin
 */
export function calculateNoVigOdds(homeOdds: number, awayOdds: number): {
  home: number
  away: number
  margin: number
} {
  const homeProb = calculateImpliedProbability(homeOdds)
  const awayProb = calculateImpliedProbability(awayOdds)
  const totalProb = homeProb + awayProb
  const margin = totalProb - 100

  const fairHomeProb = (homeProb / totalProb) * 100
  const fairAwayProb = (awayProb / totalProb) * 100

  return {
    home: decimalToAmerican(100 / fairHomeProb + 1),
    away: decimalToAmerican(100 / fairAwayProb + 1),
    margin,
  }
}

// ============================================================================
// LINE MOVEMENT ANALYSIS
// ============================================================================

/**
 * Calculate percentage change in odds
 */
export function calculateOddsChange(opening: number, current: number): number {
  const openingProb = calculateImpliedProbability(opening)
  const currentProb = calculateImpliedProbability(current)
  return ((currentProb - openingProb) / openingProb) * 100
}

/**
 * Determine if line movement is significant
 */
export function isSignificantLineMovement(
  opening: OddsValue,
  current: OddsValue,
  threshold: number = 5 // 5% change is significant
): boolean {
  const change = Math.abs(calculateOddsChange(opening.value, current.value))
  return change >= threshold
}

/**
 * Detect reverse line movement (sharp indicator)
 * Line moving opposite to public betting percentage
 */
export function detectReverseLineMovement(
  opening: OddsValue,
  current: OddsValue,
  publicPercentage: number // % of public on this side
): boolean {
  const oddsChange = calculateOddsChange(opening.value, current.value)

  // If public is heavily on one side (>60%) but line moved against them, it's RLM
  if (publicPercentage > 60 && oddsChange < -2) {
    return true // Line moved worse for public (sharp money on other side)
  }

  return false
}

/**
 * Calculate line movement velocity (how fast the line is moving)
 */
export function calculateLineVelocity(
  snapshots: LineMovementSnapshot[],
  timeWindowMinutes: number = 15
): number {
  if (snapshots.length < 2) return 0

  const now = new Date()
  const cutoff = new Date(now.getTime() - timeWindowMinutes * 60 * 1000)
  const recentSnapshots = snapshots.filter(s => s.timestamp >= cutoff)

  if (recentSnapshots.length < 2) return 0

  const first = recentSnapshots[0]
  const last = recentSnapshots[recentSnapshots.length - 1]
  const timeElapsed = (last.timestamp.getTime() - first.timestamp.getTime()) / 1000 / 60 // minutes

  if (timeElapsed === 0) return 0

  const oddsChange = Math.abs(calculateOddsChange(first.odds.value, last.odds.value))
  return oddsChange / timeElapsed // % change per minute
}

/**
 * Detect steam move (rapid coordinated line movement)
 */
export function detectSteamMove(
  snapshots: LineMovementSnapshot[],
  thresholdPercentage: number = 10,
  timeWindowMinutes: number = 5
): boolean {
  const velocity = calculateLineVelocity(snapshots, timeWindowMinutes)
  const significantChange = velocity * timeWindowMinutes >= thresholdPercentage

  // Steam move: rapid significant movement in short time
  return significantChange && velocity > 2 // >2% per minute
}

// ============================================================================
// BEST ODDS IDENTIFICATION
// ============================================================================

/**
 * Find best odds across all bookmakers for a given bet type
 */
export function findBestOdds(bookmakers: BookmakerOdds[], betType: "moneyline" | "spread" | "total") {
  const bestHome = { bookmaker: "", odds: -Infinity, point: 0 }
  const bestAway = { bookmaker: "", odds: -Infinity, point: 0 }
  const bestOver = { bookmaker: "", odds: -Infinity, point: 0 }
  const bestUnder = { bookmaker: "", odds: -Infinity, point: 0 }

  bookmakers.forEach(book => {
    if (betType === "moneyline" && book.moneyline) {
      if (book.moneyline.home.value > bestHome.odds) {
        bestHome.odds = book.moneyline.home.value
        bestHome.bookmaker = book.bookmaker
      }
      if (book.moneyline.away.value > bestAway.odds) {
        bestAway.odds = book.moneyline.away.value
        bestAway.bookmaker = book.bookmaker
      }
    }

    if (betType === "spread" && book.spread) {
      if (book.spread.home.value > bestHome.odds) {
        bestHome.odds = book.spread.home.value
        bestHome.bookmaker = book.bookmaker
        bestHome.point = book.spread.home.point
      }
      if (book.spread.away.value > bestAway.odds) {
        bestAway.odds = book.spread.away.value
        bestAway.bookmaker = book.bookmaker
        bestAway.point = book.spread.away.point
      }
    }

    if (betType === "total" && book.total) {
      if (book.total.over.value > bestOver.odds) {
        bestOver.odds = book.total.over.value
        bestOver.bookmaker = book.bookmaker
        bestOver.point = book.total.over.point
      }
      if (book.total.under.value > bestUnder.odds) {
        bestUnder.odds = book.total.under.value
        bestUnder.bookmaker = book.bookmaker
        bestUnder.point = book.total.under.point
      }
    }
  })

  return { bestHome, bestAway, bestOver, bestUnder }
}

/**
 * Calculate arbitrage opportunity (guaranteed profit)
 */
export function calculateArbitrage(odds1: number, odds2: number): {
  hasArbitrage: boolean
  profit: number // percentage profit if arb exists
  stake1: number // % of bankroll to bet on side 1
  stake2: number // % of bankroll to bet on side 2
} {
  const prob1 = calculateImpliedProbability(odds1)
  const prob2 = calculateImpliedProbability(odds2)
  const totalProb = prob1 + prob2

  if (totalProb < 100) {
    const profit = ((100 / totalProb) - 1) * 100
    return {
      hasArbitrage: true,
      profit,
      stake1: (prob1 / totalProb) * 100,
      stake2: (prob2 / totalProb) * 100,
    }
  }

  return { hasArbitrage: false, profit: 0, stake1: 0, stake2: 0 }
}

// ============================================================================
// SHARP MONEY DETECTION
// ============================================================================

/**
 * Calculate sharp money confidence level
 */
export function calculateSharpConfidence(
  publicPercentage: number,
  sharpPercentage: number,
  lineMovement: number, // % change
  reverseLineMovement: boolean
): SharpMoneyIndicator["confidence"] {
  let score = 0

  // Heavy sharp money (vs public)
  const divergence = Math.abs(sharpPercentage - publicPercentage)
  if (divergence > 40) score += 3
  else if (divergence > 25) score += 2
  else if (divergence > 15) score += 1

  // Significant line movement
  if (Math.abs(lineMovement) > 10) score += 2
  else if (Math.abs(lineMovement) > 5) score += 1

  // Reverse line movement (strongest indicator)
  if (reverseLineMovement) score += 3

  if (score >= 7) return "extreme"
  if (score >= 5) return "high"
  if (score >= 3) return "medium"
  return "low"
}

/**
 * Detect sharp money indicators across all bet types
 */
export function detectSharpMoneyIndicators(
  bettingSplits: { public: BettingSplit[]; sharp: BettingSplit[] },
  lineMovement: LineMovementSnapshot[],
  opening?: OddsValue,
  current?: OddsValue
): SharpMoneyIndicator[] {
  const indicators: SharpMoneyIndicator[] = []

  bettingSplits.sharp.forEach(sharpSplit => {
    const publicSplit = bettingSplits.public.find(p => p.side === sharpSplit.side)
    if (!publicSplit) return

    const publicPct = publicSplit.percentageOfMoney
    const sharpPct = sharpSplit.percentageOfMoney

    // Calculate line movement if available
    let lineMove = 0
    let reverseMove = false
    if (opening && current) {
      lineMove = calculateOddsChange(opening.value, current.value)
      reverseMove = detectReverseLineMovement(opening, current, publicPct)
    }

    // Only flag if sharp money is significantly different from public
    if (Math.abs(sharpPct - publicPct) > 15) {
      const confidence = calculateSharpConfidence(publicPct, sharpPct, lineMove, reverseMove)

      indicators.push({
        side: sharpSplit.side,
        betType: "moneyline", // This would be passed in
        confidence,
        percentage: sharpPct,
        lineMovement: {
          direction: lineMove > 0 ? "towards" : lineMove < 0 ? "away" : "neutral",
          magnitude: Math.abs(lineMove),
        },
        reverseLineMovement: reverseMove,
      })
    }
  })

  return indicators.sort((a, b) => {
    const confidenceOrder = { extreme: 4, high: 3, medium: 2, low: 1 }
    return confidenceOrder[b.confidence] - confidenceOrder[a.confidence]
  })
}

// ============================================================================
// CONSENSUS CALCULATIONS
// ============================================================================

/**
 * Calculate consensus (average) odds across all bookmakers
 */
export function calculateConsensusOdds(bookmakers: BookmakerOdds[], betType: "moneyline" | "spread" | "total") {
  const validBooks = bookmakers.filter(b => {
    if (betType === "moneyline") return b.moneyline
    if (betType === "spread") return b.spread
    if (betType === "total") return b.total
    return false
  })

  if (validBooks.length === 0) return null

  if (betType === "moneyline") {
    const homeSum = validBooks.reduce((sum, b) => sum + (b.moneyline?.home.value || 0), 0)
    const awaySum = validBooks.reduce((sum, b) => sum + (b.moneyline?.away.value || 0), 0)
    return {
      home: Math.round(homeSum / validBooks.length),
      away: Math.round(awaySum / validBooks.length),
    }
  }

  if (betType === "spread") {
    const homeOddsSum = validBooks.reduce((sum, b) => sum + (b.spread?.home.value || 0), 0)
    const awayOddsSum = validBooks.reduce((sum, b) => sum + (b.spread?.away.value || 0), 0)
    const homePointSum = validBooks.reduce((sum, b) => sum + (b.spread?.home.point || 0), 0)
    const awayPointSum = validBooks.reduce((sum, b) => sum + (b.spread?.away.point || 0), 0)
    return {
      home: { odds: Math.round(homeOddsSum / validBooks.length), point: homePointSum / validBooks.length },
      away: { odds: Math.round(awayOddsSum / validBooks.length), point: awayPointSum / validBooks.length },
    }
  }

  if (betType === "total") {
    const overOddsSum = validBooks.reduce((sum, b) => sum + (b.total?.over.value || 0), 0)
    const underOddsSum = validBooks.reduce((sum, b) => sum + (b.total?.under.value || 0), 0)
    const pointSum = validBooks.reduce((sum, b) => sum + (b.total?.over.point || 0), 0)
    return {
      over: { odds: Math.round(overOddsSum / validBooks.length), point: pointSum / validBooks.length },
      under: { odds: Math.round(underOddsSum / validBooks.length), point: pointSum / validBooks.length },
    }
  }

  return null
}

/**
 * Calculate value bet opportunities
 * Compare your probability estimate against market odds
 */
export function calculateValueBet(
  yourProbability: number, // Your estimated win probability (0-100)
  marketOdds: number, // American odds
  minEdge: number = 5 // Minimum edge % required
): {
  hasValue: boolean
  edge: number // percentage edge
  expectedValue: number // EV of $100 bet
} {
  const marketProb = calculateImpliedProbability(marketOdds)
  const edge = yourProbability - marketProb

  if (edge >= minEdge) {
    const decimal = americanToDecimal(marketOdds)
    const ev = (decimal * yourProbability) - 100 // Expected value of $100 bet
    return { hasValue: true, edge, expectedValue: ev }
  }

  return { hasValue: false, edge, expectedValue: 0 }
}

// ============================================================================
// UTILITY HELPERS
// ============================================================================

/**
 * Format odds for display
 */
export function formatOdds(odds: number, includeSign: boolean = true): string {
  if (odds > 0 && includeSign) {
    return `+${odds}`
  }
  return odds.toString()
}

/**
 * Get color indicator for odds movement
 */
export function getOddsMovementColor(change: number): "green" | "red" | "gray" {
  if (change > 2) return "green" // Line moved in bettor's favor
  if (change < -2) return "red" // Line moved against bettor
  return "gray"
}

/**
 * Calculate Kelly Criterion bet sizing
 */
export function calculateKellyCriterion(
  probability: number, // Your estimated win probability (0-1)
  odds: number // American odds
): number {
  const decimal = americanToDecimal(odds)
  const q = 1 - probability
  const b = decimal - 1

  const kelly = (b * probability - q) / b

  // Return as percentage of bankroll (capped at 25% for safety)
  return Math.max(0, Math.min(kelly * 100, 25))
}

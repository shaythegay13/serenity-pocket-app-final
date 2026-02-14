/**
 * Parlay System Tests — PlayMind Labs
 *
 * Test Case 1: 3-leg regular (cross-game) parlay
 * Test Case 2: 4-leg NFL SGP (Mahomes props)
 * Additional: Settlement with push/reduce, validation, EV
 */

import {
  americanToDecimal,
  decimalToAmerican,
  calculateCombinedOdds,
  calculateSGPOdds,
  calculateParlayEV,
  detectCorrelations,
  detectSGPCorrelationPairs,
  validateParlayLegs,
  recalculateOddsAfterPush,
  calculateImpliedProbability,
} from '@/lib/parlay-utils'
import { determineParlayType, detectTiltSignals } from '@/lib/parlay-tracking-service'
import type { ParlayLeg } from '@/lib/types/ai-models'

// ============================================================================
// Helpers: Sample Data
// ============================================================================

/** 3-leg regular parlay: NBA cross-game */
const regularLegs: ParlayLeg[] = [
  {
    pickId: 'nba-1',
    gameId: 'game-celtics-lakers',
    teams: 'Celtics vs Lakers',
    betType: 'moneyline',
    line: 'Celtics ML',
    odds: -150,
    aiWinProbability: 0.65,
    sport: 'nba',
  },
  {
    pickId: 'nba-2',
    gameId: 'game-bucks-knicks',
    teams: 'Bucks vs Knicks',
    betType: 'spread',
    line: 'Knicks +3.5',
    odds: -110,
    aiWinProbability: 0.55,
    sport: 'nba',
  },
  {
    pickId: 'nba-3',
    gameId: 'game-nuggets-suns',
    teams: 'Nuggets vs Suns',
    betType: 'total',
    line: 'Over 224.5',
    odds: -105,
    aiWinProbability: 0.58,
    sport: 'nba',
  },
]

/** 4-leg NFL SGP: Mahomes props (all same game) */
const sgpLegs: ParlayLeg[] = [
  {
    pickId: 'nfl-sgp-1',
    gameId: 'game-chiefs-bills',
    teams: 'Chiefs vs Bills',
    betType: 'player_passing_yards',
    line: 'Mahomes Over 275.5 Pass Yds',
    odds: -120,
    aiWinProbability: 0.60,
    sport: 'nfl',
  },
  {
    pickId: 'nfl-sgp-2',
    gameId: 'game-chiefs-bills',
    teams: 'Chiefs vs Bills',
    betType: 'player_passing_tds',
    line: 'Mahomes Over 1.5 Pass TDs',
    odds: -140,
    aiWinProbability: 0.68,
    sport: 'nfl',
  },
  {
    pickId: 'nfl-sgp-3',
    gameId: 'game-chiefs-bills',
    teams: 'Chiefs vs Bills',
    betType: 'player_receiving_yards',
    line: 'Kelce Over 65.5 Rec Yds',
    odds: +105,
    aiWinProbability: 0.52,
    sport: 'nfl',
  },
  {
    pickId: 'nfl-sgp-4',
    gameId: 'game-chiefs-bills',
    teams: 'Chiefs vs Bills',
    betType: 'moneyline',
    line: 'Chiefs ML',
    odds: +130,
    aiWinProbability: 0.48,
    sport: 'nfl',
  },
]

// ============================================================================
// Test Case 1: 3-Leg Regular Parlay
// ============================================================================

describe('Test Case 1: 3-Leg Regular NBA Parlay', () => {
  test('odds converters are accurate', () => {
    // -150 American → 1.6667 decimal
    expect(americanToDecimal(-150)).toBeCloseTo(1.6667, 3)
    // -110 → 1.9091
    expect(americanToDecimal(-110)).toBeCloseTo(1.9091, 3)
    // +130 → 2.30
    expect(americanToDecimal(130)).toBeCloseTo(2.30, 2)

    // Round-trip
    expect(decimalToAmerican(americanToDecimal(-150))).toBeCloseTo(-150, 0)
    expect(decimalToAmerican(americanToDecimal(130))).toBeCloseTo(130, 0)
  })

  test('combined odds multiply correctly (independence assumption)', () => {
    const combined = calculateCombinedOdds(regularLegs)
    // 1.6667 * 1.9091 * 1.9524 ≈ 6.21
    expect(combined).toBeGreaterThan(5.5)
    expect(combined).toBeLessThan(7.0)
  })

  test('detects as classic type with different gameIds', () => {
    expect(determineParlayType(regularLegs)).toBe('classic')
  })

  test('validation passes for regular parlay', () => {
    const result = validateParlayLegs(regularLegs, 'regular')
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(result.detectedType).toBe('classic')
  })

  test('validation fails if regular parlay has same-game legs', () => {
    const badLegs: ParlayLeg[] = [
      { ...regularLegs[0], gameId: 'same-game' },
      { ...regularLegs[1], gameId: 'same-game', betType: 'total', line: 'Over 210' },
      regularLegs[2],
    ]
    const result = validateParlayLegs(badLegs, 'regular')
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.includes('different events'))).toBe(true)
  })

  test('SGP correlation pairs detect betType matches even on cross-game legs (caller gates by type)', () => {
    // detectSGPCorrelationPairs only looks at betType pairs, not gameId.
    // It's the caller's responsibility to only invoke it on SGP legs.
    // Regular legs with moneyline+spread+total will still match pairs.
    const warnings = detectSGPCorrelationPairs(regularLegs)
    expect(warnings.length).toBeGreaterThan(0) // moneyline ↔ spread, moneyline ↔ total
  })

  test('detects same-team correlation in cross-game parlay', () => {
    const warnings = detectCorrelations([
      { ...regularLegs[0], teams: 'Celtics vs Lakers' },
      { ...regularLegs[1], teams: 'Celtics vs Bucks' }, // Celtics appears twice
    ])
    expect(warnings.some(w => w.type === 'same-team')).toBe(true)
  })

  test('EV calculation uses AI probabilities', () => {
    const stake = 100
    const ev = calculateParlayEV(regularLegs, stake)
    // Combined prob ≈ 0.65 * 0.55 * 0.58 ≈ 0.2074
    // Combined odds ≈ 6.21
    // EV = (0.2074 * 621) - 100 ≈ 28.8
    expect(ev).toBeGreaterThan(0) // Should be positive since all legs are +EV
  })

  test('implied probability from combined odds', () => {
    const combined = calculateCombinedOdds(regularLegs)
    // calculateImpliedProbability expects American odds; for parlay use 1/decimal directly
    const implied = 1 / combined
    expect(implied).toBeGreaterThan(0.10)
    expect(implied).toBeLessThan(0.25)
  })
})

// ============================================================================
// Test Case 2: 4-Leg NFL SGP (Mahomes Props)
// ============================================================================

describe('Test Case 2: 4-Leg NFL SGP (Mahomes Props)', () => {
  test('detects as SGP type (all same gameId)', () => {
    expect(determineParlayType(sgpLegs)).toBe('sgp')
  })

  test('validation passes for same_game declared type', () => {
    const result = validateParlayLegs(sgpLegs, 'same_game')
    expect(result.isValid).toBe(true)
    expect(result.detectedType).toBe('sgp')
  })

  test('validation fails if SGP has multiple gameIds', () => {
    const badSgp: ParlayLeg[] = [
      sgpLegs[0],
      { ...sgpLegs[1], gameId: 'different-game' },
      sgpLegs[2],
      sgpLegs[3],
    ]
    const result = validateParlayLegs(badSgp, 'same_game')
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.includes('same event'))).toBe(true)
  })

  test('SGP odds are lower than naive multiplication (correlation tax applied)', () => {
    const naiveOdds = calculateCombinedOdds(sgpLegs)
    const sgpResult = calculateSGPOdds(sgpLegs)

    expect(sgpResult.odds).toBeLessThan(naiveOdds)
    expect(sgpResult.odds).toBeGreaterThan(1.01) // Floor
    expect(sgpResult.effectiveTax).toBeGreaterThan(0) // Some tax was applied
  })

  test('detects correlated SGP pairs (QB yards ↔ WR yards)', () => {
    const warnings = detectSGPCorrelationPairs(sgpLegs)
    // Should detect: passing_yards ↔ receiving_yards, passing_tds ↔ receiving_tds (if present)
    expect(warnings.length).toBeGreaterThan(0)
    expect(warnings.some(w => w.message.includes('QB yards'))).toBe(true)
  })

  test('extra correlation tax increases effective tax beyond base 25%', () => {
    const sgpResult = calculateSGPOdds(sgpLegs)
    // Base tax = 25%, plus extra for correlated pairs → effective > 25%
    expect(sgpResult.effectiveTax).toBeGreaterThan(0.25)
  })

  test('SGP EV calculation with taxed odds', () => {
    const stake = 50
    const sgpResult = calculateSGPOdds(sgpLegs)

    // Manual EV: prob = 0.60 * 0.68 * 0.52 * 0.48 ≈ 0.1019
    const combinedProb = 0.60 * 0.68 * 0.52 * 0.48
    const evFromSGP = (combinedProb * stake * sgpResult.odds) - stake

    // With correlation tax, EV should be lower than naive
    const naiveOdds = calculateCombinedOdds(sgpLegs)
    const evFromNaive = (combinedProb * stake * naiveOdds) - stake
    expect(evFromSGP).toBeLessThan(evFromNaive)
  })

  test('SGP with highly correlated moneyline+spread gets extra penalty', () => {
    const legsWithML_Spread: ParlayLeg[] = [
      { ...sgpLegs[0], betType: 'moneyline' },
      { ...sgpLegs[1], betType: 'spread' },
    ]
    const warnings = detectSGPCorrelationPairs(legsWithML_Spread)
    expect(warnings.some(w => w.message.includes('near-duplicate'))).toBe(true)
    expect(warnings.find(w => w.message.includes('near-duplicate'))?.extraTax).toBe(0.12)
  })
})

// ============================================================================
// Settlement Tests
// ============================================================================

describe('Settlement: Push Handling & Reduce/Reprice', () => {
  test('recalculateOddsAfterPush excludes pushed legs for classic parlay', () => {
    const legsWithPush: ParlayLeg[] = [
      { ...regularLegs[0], outcome: 'won' },
      { ...regularLegs[1], outcome: 'push' },
      { ...regularLegs[2], outcome: 'won' },
    ]
    const repriced = recalculateOddsAfterPush(legsWithPush, 'classic')

    // Should only multiply odds from leg 0 and leg 2 (not leg 1)
    const expected = americanToDecimal(-150) * americanToDecimal(-105)
    expect(repriced).toBeCloseTo(expected, 4)
  })

  test('recalculateOddsAfterPush uses SGP pricing for sgp type', () => {
    const legsWithPush: ParlayLeg[] = [
      { ...sgpLegs[0], outcome: 'won' },
      { ...sgpLegs[1], outcome: 'push' },
      { ...sgpLegs[2], outcome: 'won' },
      { ...sgpLegs[3], outcome: 'won' },
    ]
    const repriced = recalculateOddsAfterPush(legsWithPush, 'sgp')
    const activeLegs = legsWithPush.filter(l => l.outcome !== 'push')
    const sgpOdds = calculateSGPOdds(activeLegs).odds

    expect(repriced).toBeCloseTo(sgpOdds, 4)
  })

  test('all legs pushed returns odds of 1 (full refund)', () => {
    const allPushed: ParlayLeg[] = [
      { ...regularLegs[0], outcome: 'push' },
      { ...regularLegs[1], outcome: 'push' },
    ]
    const repriced = recalculateOddsAfterPush(allPushed, 'classic')
    expect(repriced).toBe(1)
  })
})

// ============================================================================
// Validation Edge Cases
// ============================================================================

describe('Validation Edge Cases', () => {
  test('rejects parlay with fewer than 2 legs', () => {
    const result = validateParlayLegs([regularLegs[0]])
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.includes('at least 2'))).toBe(true)
  })

  test('rejects parlay with more than 20 legs', () => {
    const tooMany = Array.from({ length: 21 }, (_, i) => ({
      ...regularLegs[0],
      pickId: `leg-${i}`,
      gameId: `game-${i}`,
      line: `Line ${i}`,
    }))
    const result = validateParlayLegs(tooMany)
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.includes('20'))).toBe(true)
  })

  test('warns but allows 12-leg parlay', () => {
    const bigParlay = Array.from({ length: 12 }, (_, i) => ({
      ...regularLegs[0],
      pickId: `leg-${i}`,
      gameId: `game-${i}`,
      line: `Line ${i}`,
    }))
    const result = validateParlayLegs(bigParlay)
    expect(result.isValid).toBe(true)
    expect(result.warnings.some(w => w.includes('extremely low'))).toBe(true)
  })

  test('detects duplicate legs', () => {
    const dupes = [regularLegs[0], { ...regularLegs[0] }]
    const result = validateParlayLegs(dupes)
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.includes('Duplicate'))).toBe(true)
  })

  test('detects SGP+ type (mixed same-game groups)', () => {
    const sgpPlusLegs: ParlayLeg[] = [
      { ...regularLegs[0], gameId: 'game-A' },
      { ...regularLegs[1], gameId: 'game-A', betType: 'total', line: 'Over 210' },
      { ...regularLegs[2], gameId: 'game-B' },
    ]
    expect(determineParlayType(sgpPlusLegs)).toBe('sgp_plus')
  })
})

// ============================================================================
// Tilt Signal Detection
// ============================================================================

describe('Tilt Signal Detection', () => {
  test('detects chasing losses pattern', () => {
    const recentBets = [{ outcome: 'loss' }, { outcome: 'loss' }, { outcome: 'loss' }]
    const signals = detectTiltSignals(regularLegs, recentBets)
    expect(signals).toContain('chasing_losses')
  })

  test('detects cross-sport mashup', () => {
    const mixedSport: ParlayLeg[] = [
      { ...regularLegs[0], sport: 'nba' },
      { ...regularLegs[1], sport: 'nfl' },
    ]
    const signals = detectTiltSignals(mixedSport)
    expect(signals).toContain('cross_sport_mashup')
  })
})

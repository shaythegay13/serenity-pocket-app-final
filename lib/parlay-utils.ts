import { ParlayLeg, CorrelationWarning, PickerRecommendationItem, ParlayRecommendation, ParlayType, ParlayOutcome, isPlayerPropLeg, PropCategory, SystemBetConfig, SystemBetRecommendation } from './types/ai-models'
import { isParlayEligible, isSGPEligible, getSportById, getParlayEligibleSportIds, getSGPEligibleSportIds } from './sports-config'

/**
 * 🎯 FIXED EV CALCULATION SYSTEM FOR PLAYMIND LABS SMARTSLIP
 * 
 * PROBLEM: All bets showed negative EV because fallback used book implied probs (always -EV due to vig)
 * SOLUTION: Require AI model probabilities; add warnings; cleaner EV formula
 */

// ==================== CORE CALCULATION FUNCTIONS ====================

/**
 * Convert American odds to decimal odds
 */
export function americanToDecimal(americanOdds: number): number {
  if (americanOdds > 0) {
    return (americanOdds / 100) + 1
  } else {
    return (100 / Math.abs(americanOdds)) + 1
  }
}

/**
 * Convert decimal odds to American odds
 */
export function decimalToAmerican(decimalOdds: number): number {
  if (decimalOdds >= 2) {
    return Math.round((decimalOdds - 1) * 100)
  } else {
    return Math.round(-100 / (decimalOdds - 1))
  }
}

/**
 * Calculate implied probability from American odds
 */
export function impliedProbabilityFromOdds(odds: number): number {
  if (odds > 0) return 100 / (odds + 100)
  return Math.abs(odds) / (Math.abs(odds) + 100)
}

/**
 * ✅ FIXED: Calculate EV per unit stake (profit formula)
 * EV = true_prob * profit_if_win - lose_prob * stake_loss
 */
export function calculateSingleBetEV(
  americanOdds: number,
  trueWinProbability: number  // ← CRITICAL: Your AI model's estimate
): number {
  if (!Number.isFinite(trueWinProbability) || trueWinProbability < 0 || trueWinProbability > 1) {
    throw new Error(`Invalid trueWinProbability: ${trueWinProbability}. Must be 0-1 decimal.`)
  }

  const decimalOdds = americanToDecimal(americanOdds)
  const profitIfWin = decimalOdds - 1  // Profit per unit staked
  const evPerUnit = trueWinProbability * profitIfWin - (1 - trueWinProbability) * 1
  return evPerUnit  // Positive = good bet
}

/**
 * Calculate EV as percentage
 */
export function calculateEVPercentage(evPerUnit: number): number {
  return evPerUnit * 100
}

/**
 * Calculate combined odds for a parlay by multiplying decimal odds
 */
export function calculateCombinedOdds(legs: ParlayLeg[]): number {
  if (legs.length === 0) return 1

  const combinedDecimalOdds = legs.reduce((product, leg) => {
    return product * americanToDecimal(leg.odds)
  }, 1)

  return combinedDecimalOdds
}

// ==================== SGP PRICING ====================

/**
 * Known highly-correlated SGP market pairs.
 * When both sides of a pair appear in the same SGP, an extra correlation
 * penalty is applied on top of the base SGP tax.
 */
const SGP_CORRELATED_PAIRS: Array<{ marketA: string; marketB: string; extraTax: number; label: string }> = [
  { marketA: 'player_passing_yards', marketB: 'player_receiving_yards', extraTax: 0.10, label: 'QB yards ↔ WR yards' },
  { marketA: 'player_passing_yards', marketB: 'player_receptions',     extraTax: 0.10, label: 'QB yards ↔ WR receptions' },
  { marketA: 'player_passing_tds',   marketB: 'player_receiving_tds',  extraTax: 0.08, label: 'QB TDs ↔ WR TDs' },
  { marketA: 'player_rushing_yards', marketB: 'total',                 extraTax: 0.06, label: 'Rush yards ↔ Game total' },
  { marketA: 'player_points',        marketB: 'moneyline',             extraTax: 0.05, label: 'Player points ↔ Moneyline' },
  { marketA: 'player_points',        marketB: 'spread',                extraTax: 0.05, label: 'Player points ↔ Spread' },
  { marketA: 'player_rebounds',      marketB: 'total',                 extraTax: 0.04, label: 'Rebounds ↔ Game total' },
  { marketA: 'player_assists',       marketB: 'player_points',         extraTax: 0.04, label: 'Assists ↔ Points' },
  { marketA: 'moneyline',            marketB: 'spread',                extraTax: 0.12, label: 'Moneyline ↔ Spread (near-duplicate)' },
  { marketA: 'moneyline',            marketB: 'total',                 extraTax: 0.04, label: 'Moneyline ↔ Game total' },
  // Team prop correlations
  { marketA: 'team_prop',            marketB: 'moneyline',             extraTax: 0.08, label: 'Team total ↔ Moneyline (same direction)' },
  { marketA: 'team_prop',            marketB: 'total',                 extraTax: 0.10, label: 'Team total ↔ Game total (same direction)' },
  { marketA: 'team_prop',            marketB: 'spread',                extraTax: 0.06, label: 'Team total ↔ Spread (same direction)' },
  { marketA: 'team_prop',            marketB: 'player_points',         extraTax: 0.06, label: 'Team total ↔ Player points (same team)' },
  { marketA: 'team_prop',            marketB: 'team_prop',             extraTax: 0.05, label: 'Team total ↔ Opposing team total' },
]

/**
 * Player-to-player correlation pairs for SGP detection.
 * These capture correlations between different players on the same team
 * or between opposing players in the same game.
 */
interface PlayerCorrelationPair {
  playerA: { position?: string; stat?: string; category?: PropCategory }
  playerB: { position?: string; stat?: string; category?: PropCategory }
  sameTeam: boolean
  extraTax: number
  label: string
}

const PLAYER_CORRELATION_PAIRS: PlayerCorrelationPair[] = [
  // Same player, multiple props (highest correlation)
  // This is handled separately in detectPlayerCorrelations

  // QB-WR/TE same team correlations (NFL)
  {
    playerA: { position: 'QB', category: 'passing' },
    playerB: { position: 'WR', category: 'receiving' },
    sameTeam: true,
    extraTax: 0.12,
    label: 'QB passing ↔ WR receiving (same team)'
  },
  {
    playerA: { position: 'QB', category: 'passing' },
    playerB: { position: 'TE', category: 'receiving' },
    sameTeam: true,
    extraTax: 0.10,
    label: 'QB passing ↔ TE receiving (same team)'
  },
  {
    playerA: { position: 'QB', stat: 'player_pass_tds' },
    playerB: { category: 'touchdown' },
    sameTeam: true,
    extraTax: 0.15,
    label: 'QB passing TDs ↔ teammate ATTD'
  },

  // RB correlations (NFL)
  {
    playerA: { position: 'RB', category: 'rushing' },
    playerB: { position: 'RB', category: 'rushing' },
    sameTeam: true,
    extraTax: 0.08,
    label: 'RB ↔ RB rushing (same team - split carries)'
  },

  // NBA Point Guard ↔ Teammate correlations
  {
    playerA: { position: 'PG', stat: 'player_assists' },
    playerB: { category: 'scoring' },
    sameTeam: true,
    extraTax: 0.08,
    label: 'PG assists ↔ teammate scoring'
  },
  {
    playerA: { position: 'PG', stat: 'player_assists' },
    playerB: { position: 'C', stat: 'player_points' },
    sameTeam: true,
    extraTax: 0.10,
    label: 'PG assists ↔ Center points (PnR correlation)'
  },

  // NBA Rebound correlations
  {
    playerA: { category: 'rebounding' },
    playerB: { category: 'rebounding' },
    sameTeam: true,
    extraTax: 0.06,
    label: 'Teammate rebounding competition'
  },

  // Cross-team correlations (opposing players)
  {
    playerA: { position: 'QB', category: 'passing' },
    playerB: { position: 'QB', category: 'passing' },
    sameTeam: false,
    extraTax: 0.05,
    label: 'Opposing QB passing (game script correlation)'
  },
]

/**
 * Detect SGP-specific correlation pairs present in a set of legs.
 * Returns warnings with the extra tax that should be applied.
 */
export function detectSGPCorrelationPairs(legs: ParlayLeg[]): Array<CorrelationWarning & { extraTax: number }> {
  const warnings: Array<CorrelationWarning & { extraTax: number }> = []
  if (legs.length < 2) return warnings

  const marketTypes = legs.map(l => l.betType.toLowerCase())

  for (const pair of SGP_CORRELATED_PAIRS) {
    const idxA = marketTypes.findIndex(m => m === pair.marketA)
    const idxB = marketTypes.findIndex((m, i) => m === pair.marketB && i !== idxA)
    if (idxA !== -1 && idxB !== -1) {
      warnings.push({
        type: 'same-game',
        severity: pair.extraTax >= 0.10 ? 'high' : 'medium',
        message: `Correlated SGP pair: ${pair.label} → extra ${(pair.extraTax * 100).toFixed(0)}% tax`,
        affectedLegs: [legs[idxA].pickId, legs[idxB].pickId],
        extraTax: pair.extraTax,
      })
    }
  }

  return warnings
}

/**
 * Detect player-level correlations in parlay legs.
 * This includes same-player stacking and position-based correlations.
 *
 * @param legs - Array of parlay legs to analyze
 * @returns Array of correlation warnings with severity and extra tax
 */
export function detectPlayerCorrelations(legs: ParlayLeg[]): Array<CorrelationWarning & { extraTax: number }> {
  const warnings: Array<CorrelationWarning & { extraTax: number }> = []
  const playerLegs = legs.filter(isPlayerPropLeg)

  if (playerLegs.length < 2) return warnings

  // Check for same-player stacking (highest correlation)
  const playerGroups = new Map<string, ParlayLeg[]>()
  for (const leg of playerLegs) {
    const playerId = leg.playerId!
    if (!playerGroups.has(playerId)) {
      playerGroups.set(playerId, [])
    }
    playerGroups.get(playerId)!.push(leg)
  }

  for (const [playerId, playerLegGroup] of playerGroups) {
    if (playerLegGroup.length > 1) {
      const playerName = playerLegGroup[0].playerName || playerId
      const stats = playerLegGroup.map(l => l.propStat).join(', ')
      warnings.push({
        type: 'same-game',
        severity: 'high',
        message: `Same player stacking: ${playerName} (${stats}) → 15% extra tax`,
        affectedLegs: playerLegGroup.map(l => l.pickId),
        extraTax: 0.15
      })
    }
  }

  // Check position-based correlations between different players
  for (let i = 0; i < playerLegs.length; i++) {
    for (let j = i + 1; j < playerLegs.length; j++) {
      const legA = playerLegs[i]
      const legB = playerLegs[j]

      // Skip if same player (already handled above)
      if (legA.playerId === legB.playerId) continue

      // Check if same game (required for correlation)
      if (legA.gameId !== legB.gameId) continue

      const sameTeam = legA.playerTeam === legB.playerTeam

      // Find matching correlation pair
      for (const pair of PLAYER_CORRELATION_PAIRS) {
        if (pair.sameTeam !== sameTeam) continue

        const matchesA = matchesPlayerCriteria(legA, pair.playerA)
        const matchesB = matchesPlayerCriteria(legB, pair.playerB)
        const matchesReverse = matchesPlayerCriteria(legA, pair.playerB) && matchesPlayerCriteria(legB, pair.playerA)

        if ((matchesA && matchesB) || matchesReverse) {
          warnings.push({
            type: 'same-game',
            severity: pair.extraTax >= 0.10 ? 'high' : 'medium',
            message: `${pair.label} → ${(pair.extraTax * 100).toFixed(0)}% extra tax`,
            affectedLegs: [legA.pickId, legB.pickId],
            extraTax: pair.extraTax
          })
          break // Only add one warning per pair
        }
      }
    }
  }

  return warnings
}

/**
 * Check if a leg matches player correlation criteria
 */
function matchesPlayerCriteria(
  leg: ParlayLeg,
  criteria: { position?: string; stat?: string; category?: PropCategory }
): boolean {
  // If no criteria specified, it's a wildcard match
  if (!criteria.position && !criteria.stat && !criteria.category) return true

  // Check position match
  if (criteria.position && leg.playerPosition !== criteria.position) return false

  // Check stat match
  if (criteria.stat && leg.propStat !== criteria.stat) return false

  // Check category match
  if (criteria.category && leg.propCategory !== criteria.category) return false

  return true
}

/**
 * Calculate SGP odds with correlation tax.
 *
 * Base tax: 20-30% reduction (default taxMultiplier = 0.75 → 25% haircut).
 * Correlated-pair surcharge: each detected pair adds its own extra penalty.
 *
 * Final odds = naiveProduct × baseTax × (1 − Σ extraTaxes)
 *
 * The floor is clamped so the result never drops below 1.01 decimal odds.
 */
export function calculateSGPOdds(
  legs: ParlayLeg[],
  baseTaxMultiplier: number = 0.75,
): { odds: number; correlationWarnings: Array<CorrelationWarning & { extraTax: number }>; effectiveTax: number } {
  const naive = legs.reduce((acc, leg) => acc * americanToDecimal(leg.odds), 1)

  // Detect both market-level and player-level correlations
  const marketCorrelations = detectSGPCorrelationPairs(legs)
  const playerCorrelations = detectPlayerCorrelations(legs)

  // Combine all correlation warnings
  const correlationWarnings = [...marketCorrelations, ...playerCorrelations]
  const totalExtraTax = correlationWarnings.reduce((sum, w) => sum + w.extraTax, 0)

  // Effective multiplier = baseTax × (1 − extra taxes), floored at 0.30
  const effectiveMultiplier = Math.max(0.30, baseTaxMultiplier * (1 - totalExtraTax))
  const effectiveTax = 1 - effectiveMultiplier

  // Floor at 1.01 to avoid nonsensical sub-even odds
  const odds = Math.max(1.01, naive * effectiveMultiplier)

  return { odds, correlationWarnings, effectiveTax }
}

/**
 * Recalculate parlay odds after removing pushed legs.
 * Used during settlement when one or more legs push.
 * Pushed legs are excluded — the parlay reprices with remaining legs only.
 */
export function recalculateOddsAfterPush(
  legs: ParlayLeg[],
  type: ParlayType,
): number {
  const activeLeg = legs.filter(l => l.outcome !== 'push' && l.outcome !== 'void')
  if (activeLeg.length === 0) return 1
  if (type === 'sgp') {
    return calculateSGPOdds(activeLeg).odds
  }
  return calculateCombinedOdds(activeLeg)
}

/**
 * ✅ FIXED: Calculate expected value for a parlay using AI probabilities
 */
export function calculateParlayEV(
  legs: ParlayLeg[],
  stake: number,
  probabilities?: number[]
): number {
  if (legs.length === 0) return 0

  // Use AI probabilities if provided, otherwise throw error (no fallback to book odds)
  const legProbabilities = probabilities || legs.map(leg => {
    if (!leg.aiWinProbability) {
      throw new Error(`AI probability required for parlay EV calculation. Missing for leg with odds ${leg.odds}`)
    }
    return leg.aiWinProbability
  })

  // For a parlay to win, all legs must win
  const combinedProbability = legProbabilities.reduce((product, prob) => product * prob, 1)

  // Calculate potential payout
  const combinedDecimalOdds = calculateCombinedOdds(legs)
  const potentialPayout = stake * combinedDecimalOdds

  // EV = (Probability * Payout) - Stake
  const ev = (combinedProbability * potentialPayout) - stake

  return ev
}

/**
 * Calculate EV as percentage of stake
 */
export function calculateParlayEVPercentage(
  legs: ParlayLeg[],
  probabilities?: number[]
): number {
  if (legs.length === 0) return 0

  const ev = calculateParlayEV(legs, 100, probabilities) // Use $100 as base
  return ev
}

/**
 * Detect correlations between parlay legs
 */
export function detectCorrelations(legs: ParlayLeg[]): CorrelationWarning[] {
  const warnings: CorrelationWarning[] = []

  if (legs.length < 2) return warnings

  // Check for same-game parlays
  const gameGroups = legs.reduce((groups, leg) => {
    if (leg.gameId) {
      if (!groups[leg.gameId]) {
        groups[leg.gameId] = []
      }
      groups[leg.gameId].push(leg)
    }
    return groups
  }, {} as Record<string, ParlayLeg[]>)

  Object.entries(gameGroups).forEach(([gameId, gameLegs]) => {
    if (gameLegs.length > 1) {
      warnings.push({
        type: 'same-game',
        severity: gameLegs.length >= 3 ? 'high' : 'medium',
        message: `Multiple legs from same game (${gameLegs.length} picks) - correlated outcomes`,
        affectedLegs: gameLegs.map(leg => leg.pickId)
      })
    }
  })

  // Check for same-team parlays
  const teamGroups = legs.reduce((groups, leg) => {
    const teams = leg.teams.split(' vs ')
    teams.forEach(team => {
      const cleanTeam = team.trim()
      if (!groups[cleanTeam]) {
        groups[cleanTeam] = []
      }
      groups[cleanTeam].push(leg)
    })
    return groups
  }, {} as Record<string, ParlayLeg[]>)

  Object.entries(teamGroups).forEach(([team, teamLegs]) => {
    if (teamLegs.length > 1) {
      warnings.push({
        type: 'same-team',
        severity: teamLegs.length >= 3 ? 'high' : 'medium',
        message: `Multiple legs involving ${team} - correlated outcomes`,
        affectedLegs: teamLegs.map(leg => leg.pickId)
      })
    }
  })

  // Check for excessive number of legs
  if (legs.length > 8) {
    warnings.push({
      type: 'excessive-legs',
      severity: legs.length >= 12 ? 'high' : 'medium',
      message: `High number of legs (${legs.length}) - extremely low probability`,
      affectedLegs: legs.map(leg => leg.pickId)
    })
  }

  return warnings
}

/**
 * Format odds for display
 */
export function formatOdds(odds: number): string {
  return odds >= 0 ? `+${odds}` : `${odds}`
}

/**
 * Calculate implied probability from American odds
 */
export function calculateImpliedProbability(americanOdds: number): number {
  const decimalOdds = americanToDecimal(americanOdds)
  return 1 / decimalOdds
}

/**
 * Generate a unique ID for a parlay leg based on its properties
 */
export function generateLegId(leg: Partial<ParlayLeg>): string {
  const keyParts = [
    leg.gameId || '',
    leg.teams || '',
    leg.betType || '',
    leg.line || '',
    leg.odds?.toString() || ''
  ]
  return keyParts.join('|').replace(/\s+/g, '_').toLowerCase()
}

/**
 * Validate parlay legs for common issues
 */
export function validateParlayLegs(
  legs: ParlayLeg[],
  declaredType?: 'regular' | 'same_game',
): {
  isValid: boolean
  errors: string[]
  warnings: string[]
  detectedType: 'classic' | 'sgp' | 'sgp_plus'
} {
  const errors: string[] = []
  const warnings: string[] = []

  // ── Minimum / maximum legs ──
  if (legs.length < 2) {
    errors.push('Parlay must have at least 2 legs')
  }
  if (legs.length > 20) {
    errors.push('Parlay cannot have more than 20 legs')
  } else if (legs.length > 10) {
    warnings.push('Parlays with more than 10 legs have extremely low win probabilities')
  } else if (legs.length > 8) {
    warnings.push('Parlays with more than 8 legs have very low win probabilities')
  }

  // ── Duplicate legs ──
  const legIds = legs.map(leg => generateLegId(leg))
  const duplicateIds = legIds.filter((id, index) => legIds.indexOf(id) !== index)
  if (duplicateIds.length > 0) {
    errors.push('Duplicate legs detected')
  }

  // ── Invalid odds ──
  legs.forEach((leg, index) => {
    if (!leg.odds || leg.odds === 0) {
      errors.push(`Leg ${index + 1} has invalid odds`)
    }
  })

  // ── Sport eligibility validation ──
  const legsWithSport = legs.filter(l => l.sport)
  const ineligibleSports = legsWithSport
    .filter(l => l.sport && !isParlayEligible(l.sport))
    .map(l => l.sport)
  if (ineligibleSports.length > 0) {
    const uniqueIneligible = [...new Set(ineligibleSports)]
    warnings.push(`Sport(s) may not support parlays: ${uniqueIneligible.join(', ')}`)
  }

  // ── Type-specific validation ──
  const gameIds = legs.map(l => l.gameId).filter(Boolean)
  const uniqueGames = new Set(gameIds)

  if (declaredType === 'same_game') {
    // SGP: all legs MUST share the same eventId
    if (uniqueGames.size > 1) {
      errors.push('Same-game parlay legs must all belong to the same event')
    }
    if (uniqueGames.size === 0 && gameIds.length === 0) {
      warnings.push('No gameId on legs — cannot verify same-game constraint')
    }
  } else if (declaredType === 'regular') {
    // Regular: all legs must come from DIFFERENT events
    if (gameIds.length > 0 && uniqueGames.size < gameIds.length) {
      errors.push('Regular parlay legs must come from different events (use same-game parlay for same-event legs)')
    }
  }

  // Auto-detect type regardless of declared type
  let detectedType: 'classic' | 'sgp' | 'sgp_plus' = 'classic'
  if (uniqueGames.size === 1 && gameIds.length === legs.length) {
    detectedType = 'sgp'
  } else if (gameIds.length > 0) {
    const gameCounts: Record<string, number> = {}
    gameIds.forEach(g => { gameCounts[g!] = (gameCounts[g!] || 0) + 1 })
    if (Object.values(gameCounts).some(c => c >= 2) && uniqueGames.size > 1) {
      detectedType = 'sgp_plus'
    }
  }

  // SGP-specific correlation warnings (market-level)
  if (detectedType === 'sgp' || detectedType === 'sgp_plus') {
    const sgpWarnings = detectSGPCorrelationPairs(legs)
    sgpWarnings.forEach(w => {
      warnings.push(w.message)
    })

    // Check SGP eligibility for the sport
    const sgpSports = legsWithSport.map(l => l.sport).filter(Boolean) as string[]
    const sgpIneligible = sgpSports.filter(sport => !isSGPEligible(sport))
    if (sgpIneligible.length > 0) {
      const uniqueIneligible = [...new Set(sgpIneligible)]
      warnings.push(`SGP may not be available for: ${uniqueIneligible.join(', ')}`)
    }
  }

  // Player-level correlation warnings (applies to any parlay with player props)
  const playerCorrelations = detectPlayerCorrelations(legs)
  playerCorrelations.forEach(w => {
    warnings.push(w.message)
  })

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    detectedType,
  }
}

/**
 * Generate high-EV parlay recommendations from a list of single bet recommendations.
 * 
 * Algorithm:
 * 1. Filter for positive EV bets.
 * 2. Generate 2-leg and 3-leg combinations (strictly cross-game for V1 to minimize correlation risk).
 * 3. Calculate combined EV and Risk.
 * 4. Rank by EV/Edge.
 */
export function generateParlayRecommendations(
  singleBets: PickerRecommendationItem[],
  maxRecommendations: number = 3,
  sport?: string
): ParlayRecommendation[] {
  // 1. Filter candidates: Must be recommended, positive EV, and have necessary data
  const candidates = singleBets.filter(bet =>
    bet.isRecommended &&
    (bet.numericRisk?.evPercentage || 0) > 0 &&
    bet.gameId
  ).sort((a, b) => (b.numericRisk?.evPercentage || 0) - (a.numericRisk?.evPercentage || 0)) // Sort by highest EV

  // Limit to top 8 candidates to prevent combinatorial explosion
  const topCandidates = candidates.slice(0, 8)

  const recommendations: ParlayRecommendation[] = []
  const seenLegKeys = new Set<string>()

  function addParlay(parlay: ParlayRecommendation | null): void {
    if (!parlay) return
    const key = [...parlay.legs].map(l => l.pickId).sort().join('|')
    if (!seenLegKeys.has(key)) {
      seenLegKeys.add(key)
      recommendations.push(parlay)
    }
  }

  // 2. Generate SGP (Same Game Parlays) - game pick + player prop(s) from same game
  const picksByGame = new Map<string, PickerRecommendationItem[]>()
  for (const pick of candidates) {
    if (!pick.gameId) continue
    const existing = picksByGame.get(pick.gameId) || []
    existing.push(pick)
    picksByGame.set(pick.gameId, existing)
  }

  for (const [gameId, picks] of picksByGame) {
    const gamePicksForGame = picks.filter(p => p.betType !== 'prop' && !p.propStat)
    const propPicksForGame = picks.filter(p => p.betType === 'prop' || p.propStat)

    // Only create SGPs if we have both game picks and prop picks for the same game
    if (gamePicksForGame.length > 0 && propPicksForGame.length > 0) {
      // Take the best game pick and best prop pick
      const bestGamePick = gamePicksForGame[0]
      const bestPropPick = propPicksForGame[0]

      const sgp = createSGPFromLegs([bestGamePick, bestPropPick], sport)
      addParlay(sgp)

      // If we have multiple props, create a 3-leg SGP
      if (propPicksForGame.length >= 2) {
        const secondPropPick = propPicksForGame[1]
        const sgp3Leg = createSGPFromLegs([bestGamePick, bestPropPick, secondPropPick], sport)
        addParlay(sgp3Leg)
      }
    }
  }

  // 3. Generate 2-Leg Classic Parlays (different games)
  for (let i = 0; i < topCandidates.length; i++) {
    for (let j = i + 1; j < topCandidates.length; j++) {
      const leg1 = topCandidates[i]
      const leg2 = topCandidates[j]

      // Must be different games for classic parlays
      if (leg1.gameId === leg2.gameId) continue

      const parlay = createParlayFromLegs([leg1, leg2], 'core', sport)
      addParlay(parlay)
    }
  }

  // 3. Generate 3-Leg Parlays (The "Lotto" Parlays - optional, lower priority)
  if (topCandidates.length >= 3) {
    for (let i = 0; i < topCandidates.length; i++) {
      for (let j = i + 1; j < topCandidates.length; j++) {
        for (let k = j + 1; k < topCandidates.length; k++) {
          const leg1 = topCandidates[i]
          const leg2 = topCandidates[j]
          const leg3 = topCandidates[k]

          if (leg1.gameId === leg2.gameId || leg1.gameId === leg3.gameId || leg2.gameId === leg3.gameId) continue

          const parlay = createParlayFromLegs([leg1, leg2, leg3], 'lotto', sport)
          addParlay(parlay)
        }
      }
    }
  }

  // 4. Sort by EV Percentage and return top N
  return recommendations
    .sort((a, b) => b.evPercentage - a.evPercentage)
    .slice(0, maxRecommendations)
}

/**
 * Helper to construct a ParlayRecommendation from selected single legs
 */
function createParlayFromLegs(
  legsData: PickerRecommendationItem[],
  category: 'core' | 'lotto',
  sport?: string
): ParlayRecommendation | null {
  try {
    const parlayLegs: ParlayLeg[] = legsData.map(l => ({
      pickId: l.gameId + '_' + l.betType, // Temporary ID
      gameId: l.gameId,
      teams: l.teams,
      betType: l.betType,
      line: l.line,
      odds: l.odds,
      confidence: l.confidence,
      // Infer true probability from EV if not explicitly available via `aiWinProbability`
      // EV% = (TrueProb * DecimalOdds - 1)
      // TrueProb = (EV% + 1) / DecimalOdds  <-- Approx if EV% is return on investment
      // Or just use implied probability if we assume edge is small.
      // Better: assume the single bet recommendation has an implied-from-odds probability
      // and adjust it by the EV edge.
      aiWinProbability: calculateImpliedFromEV(l.odds, l.numericRisk?.evPercentage || 0),
      selection: l.line, // Just store line or side name in selection for now
      sport: sport,
    }))

    const totalOddsDecimal = parlayLegs.reduce((acc, leg) => acc * americanToDecimal(leg.odds), 1)
    const totalOddsAmerican = decimalToAmerican(totalOddsDecimal)

    // Combined True Probability (assuming independence for different games)
    const trueProbability = parlayLegs.reduce((acc, leg) => acc * (leg.aiWinProbability || 0.5), 1)

    // Implied Probability from combined odds
    const impliedProbability = 1 / totalOddsDecimal

    // Projected EV
    // EV = (TrueProb * (DecimalOdds - 1)) - ((1 - TrueProb) * 1)
    const projectedEV = (trueProbability * (totalOddsDecimal - 1)) - (1 - trueProbability)
    const evPercentage = projectedEV * 100

    // Skip if somehow negative EV (shouldn't happen if inputs are +EV)
    if (evPercentage <= 0) return null

    // Risk Score: Higher odds = Higher risk. 
    // Normalized 0-1. Parlays are inherently risky.
    // Simple heuristic: 1 - TrueProb
    const riskScore = 1 - trueProbability

    return {
      legs: parlayLegs,
      totalOddsAmerican,
      totalOddsDecimal,
      impliedProbability,
      trueProbability,
      projectedEV,
      evPercentage,
      riskScore,
      suggestedStake: 10, // Placeholder, should be calculated via Kelly
      parlayType: 'classic',
      category,
      correlationWarnings: [],
      summary: `${legsData.length}-Leg High Value Parlay (+${Math.round(evPercentage)}% EV)`
    }
  } catch (e) {
    console.error("Error creating parlay recommendation:", e)
    return null
  }
}

/**
 * Helper to back-calculate True Win Probability from Odds and EV Percentage
 * EV% = (TrueProb * DecimalOdds) - 1   [ROI formula]
 * TrueProb = (EV% + 1) / DecimalOdds
 */
function calculateImpliedFromEV(americanOdds: number, evPercentage: number): number {
  const decimal = americanToDecimal(americanOdds)
  // evPercentage is e.g. 5.5 for 5.5%
  const roi = evPercentage / 100
  // ROI = (Payout * Prob) - 1
  // ROI + 1 = Decimal * Prob
  // Prob = (ROI + 1) / Decimal
  return (roi + 1) / decimal
}

/**
 * Helper to construct an SGP (Same Game Parlay) from legs within the same game
 * Applies correlation tax via calculateSGPOdds
 */
function createSGPFromLegs(
  legsData: PickerRecommendationItem[],
  sport?: string
): ParlayRecommendation | null {
  try {
    const parlayLegs: ParlayLeg[] = legsData.map(l => ({
      pickId: (l.gameId || 'unknown') + '_' + l.betType + '_' + (l.propStat || ''),
      gameId: l.gameId,
      teams: l.teams,
      betType: l.betType,
      line: l.line,
      odds: l.odds,
      confidence: l.confidence,
      aiWinProbability: calculateImpliedFromEV(l.odds, l.numericRisk?.evPercentage || 0),
      selection: l.line,
      sport: sport,
      // Player prop fields
      playerId: l.playerId,
      playerName: l.playerName,
      playerTeam: l.playerTeam,
      propCategory: l.propCategory,
      propStat: l.propStat,
      propLine: l.propLine,
      propDirection: l.propDirection,
    }))

    // Use SGP odds calculation with correlation tax
    const sgpResult = calculateSGPOdds(parlayLegs)
    const totalOddsDecimal = sgpResult.odds
    const totalOddsAmerican = decimalToAmerican(totalOddsDecimal)

    // Combined True Probability (adjusted for correlations)
    // For SGPs, reduce the combined probability slightly due to correlations
    const correlationAdjustment = 1 - (sgpResult.effectiveTax * 0.5) // Partial adjustment
    const trueProbability = parlayLegs.reduce((acc, leg) => acc * (leg.aiWinProbability || 0.5), 1) * correlationAdjustment

    // Implied Probability from combined odds
    const impliedProbability = 1 / totalOddsDecimal

    // Projected EV (accounting for correlation tax in odds)
    const projectedEV = (trueProbability * (totalOddsDecimal - 1)) - (1 - trueProbability)
    const evPercentage = projectedEV * 100

    // Skip if negative EV after correlation tax
    if (evPercentage <= -5) return null // Allow slightly negative for display purposes

    // Risk Score: Higher for SGPs due to correlation
    const riskScore = Math.min(0.9, (1 - trueProbability) + 0.1) // Slightly higher risk for SGPs

    // Build summary with player prop info
    const propLegs = parlayLegs.filter(l => l.propStat)
    const propSummary = propLegs.length > 0
      ? propLegs.map(l => `${l.playerName} ${l.propDirection} ${l.propLine}`).join(' + ')
      : ''

    return {
      legs: parlayLegs,
      totalOddsAmerican,
      totalOddsDecimal,
      impliedProbability,
      trueProbability,
      projectedEV,
      evPercentage,
      riskScore,
      suggestedStake: 10, // Smaller stakes for SGPs due to higher variance
      parlayType: 'sgp',
      category: legsData.length <= 2 ? 'core' : 'lotto',
      correlationWarnings: sgpResult.correlationWarnings,
      summary: propSummary
        ? `SGP: ${propSummary} (${evPercentage > 0 ? '+' : ''}${Math.round(evPercentage)}% EV)`
        : `${legsData.length}-Leg SGP (${evPercentage > 0 ? '+' : ''}${Math.round(evPercentage)}% EV)`
    }
  } catch (e) {
    console.error("Error creating SGP recommendation:", e)
    return null
  }
}

// ============================================================================
// System / Round-Robin Parlay Foundation
// ============================================================================

/**
 * Generates all C(n, k) combinations from an array of items.
 * e.g. generateCombinations([A,B,C,D], 2) → [[A,B],[A,C],[A,D],[B,C],[B,D],[C,D]]
 */
export function generateCombinations<T>(items: T[], k: number): T[][] {
  if (k <= 0 || k > items.length) return []
  if (k === items.length) return [items.slice()]

  const result: T[][] = []

  function recurse(start: number, current: T[]): void {
    if (current.length === k) {
      result.push(current.slice())
      return
    }
    for (let i = start; i < items.length; i++) {
      current.push(items[i])
      recurse(i + 1, current)
      current.pop()
    }
  }

  recurse(0, [])
  return result
}

/**
 * Builds a SystemBetRecommendation from a pool of picks and a K-of-N config.
 * Each sub-parlay (combination) is processed through the existing correlation tax engine.
 * Returns null if there are not enough picks to form the required combinations.
 */
export function buildSystemBet(
  picks: PickerRecommendationItem[],
  requiredWinners: number,
  sport: string,
  stakePerCombination: number
): SystemBetRecommendation | null {
  if (picks.length < requiredWinners) return null

  const combinations = generateCombinations(picks, requiredWinners)
  if (combinations.length === 0) return null

  const combinationLegs: ParlayLeg[][] = []
  const allOdds: number[] = []
  const allWarnings: CorrelationWarning[] = []

  for (const combo of combinations) {
    // Convert each pick to a ParlayLeg
    const legs: ParlayLeg[] = combo.map(pick => ({
      pickId: pick.gameId ?? crypto.randomUUID(),
      gameId: pick.gameId,
      teams: pick.teams,
      betType: pick.betType,
      line: pick.line,
      odds: pick.odds,
      confidence: pick.confidence,
      aiWinProbability: pick.numericRisk?.ev !== undefined
        ? (pick.confidence ?? 50) / 100
        : undefined,
    } as ParlayLeg))

    combinationLegs.push(legs)

    // Calculate odds using existing correlation engine
    const isSGP = legs.some(l => l.gameId && legs.filter(x => x.gameId === l.gameId).length > 1)
    let comboOddsDecimal: number
    let warnings: CorrelationWarning[] = []

    if (isSGP) {
      const sgpResult = calculateSGPOdds(legs) // returns decimal odds + correlation warnings
      comboOddsDecimal = sgpResult.odds
      warnings = sgpResult.correlationWarnings
    } else {
      comboOddsDecimal = calculateCombinedOdds(legs)
      warnings = detectCorrelations(legs)
    }

    allOdds.push(decimalToAmerican(comboOddsDecimal))

    for (const w of warnings) {
      if (!allWarnings.find(x => x.message === w.message)) {
        allWarnings.push(w)
      }
    }
  }

  const minOddsAmerican = Math.min(...allOdds)
  const maxOddsAmerican = Math.max(...allOdds)
  const totalStake = stakePerCombination * combinations.length

  // EV: sum of payout probabilities across all combinations
  const { totalEV, evPercentage } = computeSystemBetEV(combinationLegs, stakePerCombination)
  const expectedReturn = totalStake + totalEV

  // All picks as pool legs
  const poolLegs: ParlayLeg[] = picks.map(pick => ({
    pickId: pick.gameId ?? crypto.randomUUID(),
    gameId: pick.gameId,
    teams: pick.teams,
    betType: pick.betType,
    line: pick.line,
    odds: pick.odds,
    confidence: pick.confidence,
  } as ParlayLeg))

  const config: SystemBetConfig = {
    type: requiredWinners === picks.length ? 'system' : 'round_robin',
    totalLegs: picks.length,
    requiredWinners,
    combinationCount: combinations.length,
  }

  const summary =
    `${requiredWinners}-of-${picks.length} system: ${combinations.length} combos ` +
    `× $${stakePerCombination} = $${totalStake} total stake. ` +
    `EV: ${evPercentage >= 0 ? '+' : ''}${evPercentage.toFixed(1)}%.`

  return {
    config,
    legs: poolLegs,
    combinations: combinationLegs,
    totalStake,
    stakePerCombination,
    minOddsAmerican,
    maxOddsAmerican,
    expectedReturn,
    evPercentage,
    correlationWarnings: allWarnings,
    summary,
  }
}

/**
 * Computes aggregate EV for a system bet.
 * Sums EV across all sub-parlay combinations.
 */
export function computeSystemBetEV(
  combinations: ParlayLeg[][],
  stakePerCombination: number
): { totalEV: number; evPercentage: number } {
  if (combinations.length === 0) return { totalEV: 0, evPercentage: 0 }

  let totalEV = 0
  const totalStake = stakePerCombination * combinations.length

  for (const legs of combinations) {
    const decimalOdds = calculateCombinedOdds(legs)
    const trueProbProduct = legs.reduce((p, leg) => {
      const prob = leg.aiWinProbability ?? (leg.confidence !== undefined ? leg.confidence / 100 : 0.5)
      return p * prob
    }, 1)

    const payout = stakePerCombination * decimalOdds - stakePerCombination
    const ev = trueProbProduct * payout - (1 - trueProbProduct) * stakePerCombination
    totalEV += ev
  }

  const evPercentage = totalStake > 0 ? (totalEV / totalStake) * 100 : 0
  return { totalEV, evPercentage }
}

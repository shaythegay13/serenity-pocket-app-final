import { ParlayLeg, CorrelationWarning } from './types/ai-models'

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
export function validateParlayLegs(legs: ParlayLeg[]): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []
  
  if (legs.length === 0) {
    errors.push('Parlay must have at least one leg')
  }
  
  if (legs.length > 10) {
    errors.push('Parlay cannot have more than 10 legs')
  } else if (legs.length > 8) {
    warnings.push('Parlays with more than 8 legs have extremely low win probabilities')
  }
  
  // Check for duplicate legs
  const legIds = legs.map(leg => generateLegId(leg))
  const duplicateIds = legIds.filter((id, index) => legIds.indexOf(id) !== index)
  if (duplicateIds.length > 0) {
    errors.push('Duplicate legs detected')
  }
  
  // Check for invalid odds
  legs.forEach((leg, index) => {
    if (!leg.odds || leg.odds === 0) {
      errors.push(`Leg ${index + 1} has invalid odds`)
    }
  })
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

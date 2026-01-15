/**
 * Enhanced Odds Calculator for Real-World Betting Scenarios
 * Handles asymmetric odds, vig/juice, and various sportsbook formats
 */

export interface OddsAnalysis {
  homeTeam: string
  awayTeam: string
  homeOdds: number
  awayOdds: number
  favoriteTeam: string
  underdogTeam: string
  favoriteRecord: string
  underdogRecord: string
  
  // Implied probabilities (including vig)
  homeImpliedProb: number
  awayImpliedProb: number
  
  // True probabilities (vig removed)
  homeTrueProb: number
  awayTrueProb: number
  
  // Market analysis
  totalImpliedProb: number
  bookmakerEdge: number
  vigPercentage: number
  
  // Value metrics
  homeValue: number
  awayValue: number
  
  // Market classification
  marketType: 'balanced' | 'favorite-heavy' | 'underdog-heavy' | 'promotional'
  oddsPattern: 'mixed' | 'both-negative' | 'both-positive'
}

export interface OddsInput {
  homeTeam: string
  awayTeam: string
  homeOdds: number
  awayOdds: number
  homeRecord?: string
  awayRecord?: string
}

/**
 * Convert American odds to implied probability
 */
export function oddsToImpliedProbability(odds: number): number {
  if (!odds || Number.isNaN(odds)) return 0.5
  
  if (odds > 0) {
    // Positive odds: underdog
    return 100 / (odds + 100)
  } else if (odds < 0) {
    // Negative odds: favorite
    return Math.abs(odds) / (Math.abs(odds) + 100)
  } else {
    // Even odds (rare)
    return 0.5
  }
}

/**
 * Remove vig/juice to get true probabilities
 */
export function removeVig(homeProb: number, awayProb: number): [number, number] {
  const totalProb = homeProb + awayProb
  
  if (totalProb <= 0 || totalProb >= 200) {
    // Invalid probabilities, return as-is
    return [homeProb, awayProb]
  }
  
  // Normalize to 100% (remove bookmaker edge)
  const homeTrue = (homeProb / totalProb) * 100
  const awayTrue = (awayProb / totalProb) * 100
  
  return [homeTrue, awayTrue]
}

/**
 * Determine favorite and underdog teams from odds
 */
export function determineTeams(
  homeTeam: string,
  awayTeam: string,
  homeOdds: number,
  awayOdds: number,
  homeRecord?: string,
  awayRecord?: string
): {
  favoriteTeam: string
  underdogTeam: string
  favoriteRecord: string
  underdogRecord: string
  homeRecord: string
  awayRecord: string
} {
  // Handle different odds patterns
  let favoriteTeam = homeTeam
  let underdogTeam = awayTeam
  
  if (homeOdds < 0 && awayOdds < 0) {
    // Both negative: less negative = favorite
    favoriteTeam = homeOdds > awayOdds ? homeTeam : awayTeam
    underdogTeam = homeOdds > awayOdds ? awayTeam : homeTeam
  } else if (homeOdds > 0 && awayOdds > 0) {
    // Both positive: smaller positive = favorite
    favoriteTeam = homeOdds < awayOdds ? homeTeam : awayTeam
    underdogTeam = homeOdds < awayOdds ? awayTeam : homeTeam
  } else {
    // Mixed signs: negative = favorite
    favoriteTeam = homeOdds < 0 ? homeTeam : awayTeam
    underdogTeam = homeOdds < 0 ? awayTeam : homeTeam
  }
  
  // Assign records based on favorite/underdog status
  const favoriteRecord = favoriteTeam === homeTeam ? (homeTeam === homeTeam ? 'homeRecord' : 'awayRecord') : 
                        favoriteTeam === awayTeam ? (awayTeam === awayTeam ? 'awayRecord' : 'homeRecord') : ''
  const underdogRecord = underdogTeam === homeTeam ? (homeTeam === homeTeam ? 'homeRecord' : 'awayRecord') : 
                         underdogTeam === awayTeam ? (awayTeam === awayTeam ? 'awayRecord' : 'homeRecord') : ''
  
  return {
    favoriteTeam,
    underdogTeam,
    favoriteRecord: favoriteRecord === 'homeRecord' ? homeRecord || '' : awayRecord || '',
    underdogRecord: underdogRecord === 'homeRecord' ? homeRecord || '' : awayRecord || '',
    homeRecord: homeRecord || '',
    awayRecord: awayRecord || ''
  }
}

/**
 * Calculate bookmaker edge/vig
 */
export function calculateVig(homeProb: number, awayProb: number): {
  totalImpliedProb: number
  bookmakerEdge: number
  vigPercentage: number
} {
  const totalImpliedProb = homeProb + awayProb
  const bookmakerEdge = Math.max(0, totalImpliedProb - 100)
  const vigPercentage = totalImpliedProb > 0 ? (bookmakerEdge / totalImpliedProb) * 100 : 0
  
  return {
    totalImpliedProb,
    bookmakerEdge,
    vigPercentage
  }
}

/**
 * Calculate value for each side (true prob - implied prob)
 */
export function calculateValue(
  homeTrueProb: number,
  awayTrueProb: number,
  homeImpliedProb: number,
  awayImpliedProb: number
): {
  homeValue: number
  awayValue: number
} {
  const homeValue = homeTrueProb - homeImpliedProb
  const awayValue = awayTrueProb - awayImpliedProb
  
  return { homeValue, awayValue }
}

/**
 * Classify the market type
 */
export function classifyMarket(
  homeOdds: number,
  awayOdds: number,
  bookmakerEdge: number
): {
  marketType: 'balanced' | 'favorite-heavy' | 'underdog-heavy' | 'promotional'
  oddsPattern: 'mixed' | 'both-negative' | 'both-positive'
} {
  // Determine odds pattern
  let oddsPattern: 'mixed' | 'both-negative' | 'both-positive'
  
  if (homeOdds < 0 && awayOdds < 0) {
    oddsPattern = 'both-negative'
  } else if (homeOdds > 0 && awayOdds > 0) {
    oddsPattern = 'both-positive'
  } else {
    oddsPattern = 'mixed'
  }
  
  // Determine market type
  let marketType: 'balanced' | 'favorite-heavy' | 'underdog-heavy' | 'promotional'
  
  if (bookmakerEdge < 2) {
    marketType = 'promotional' // Very low vig
  } else if (Math.abs(homeOdds - awayOdds) < 30) {
    marketType = 'balanced' // Close matchup
  } else if (Math.min(Math.abs(homeOdds), Math.abs(awayOdds)) < 120) {
    marketType = 'favorite-heavy' // Strong favorite
  } else {
    marketType = 'underdog-heavy' // High underdog payout
  }
  
  return { marketType, oddsPattern }
}

/**
 * Main function: analyze odds comprehensively
 */
export function analyzeOdds(input: OddsInput): OddsAnalysis {
  const {
    homeTeam,
    awayTeam,
    homeOdds,
    awayOdds,
    homeRecord = '',
    awayRecord = ''
  } = input
  
  // Calculate implied probabilities
  const homeImpliedProb = oddsToImpliedProbability(homeOdds)
  const awayImpliedProb = oddsToImpliedProbability(awayOdds)
  
  // Remove vig to get true probabilities
  const [homeTrueProb, awayTrueProb] = removeVig(homeImpliedProb, awayImpliedProb)
  
  // Determine favorite/underdog teams
  const {
    favoriteTeam,
    underdogTeam,
    favoriteRecord,
    underdogRecord
  } = determineTeams(homeTeam, awayTeam, homeOdds, awayOdds, homeRecord, awayRecord)
  
  // Calculate vig
  const { totalImpliedProb, bookmakerEdge, vigPercentage } = calculateVig(homeImpliedProb, awayImpliedProb)
  
  // Calculate value
  const { homeValue, awayValue } = calculateValue(homeTrueProb, awayTrueProb, homeImpliedProb, awayImpliedProb)
  
  // Classify market
  const { marketType, oddsPattern } = classifyMarket(homeOdds, awayOdds, bookmakerEdge)
  
  return {
    homeTeam,
    awayTeam,
    homeOdds,
    awayOdds,
    favoriteTeam,
    underdogTeam,
    favoriteRecord,
    underdogRecord,
    homeImpliedProb,
    awayImpliedProb,
    homeTrueProb,
    awayTrueProb,
    totalImpliedProb,
    bookmakerEdge,
    vigPercentage,
    homeValue,
    awayValue,
    marketType,
    oddsPattern
  }
}

/**
 * Format odds for display
 */
export function formatOdds(odds: number): string {
  if (!odds || Number.isNaN(odds)) return 'N/A'
  return odds > 0 ? `+${odds}` : `${odds}`
}

/**
 * Get betting recommendation based on value
 */
export function getValueRecommendation(analysis: OddsAnalysis): {
  recommendation: 'home' | 'away' | 'no-value'
  confidence: 'low' | 'medium' | 'high'
  reasoning: string
} {
  const { homeValue, awayValue, homeOdds, awayOdds, marketType } = analysis
  
  // Minimum value threshold
  const minValueThreshold = marketType === 'promotional' ? 1 : 2
  
  if (homeValue > minValueThreshold && homeValue > awayValue) {
    return {
      recommendation: 'home',
      confidence: homeValue > 5 ? 'high' : homeValue > 3 ? 'medium' : 'low',
      reasoning: `Home team offers ${homeValue.toFixed(1)}% value over implied probability`
    }
  } else if (awayValue > minValueThreshold && awayValue > homeValue) {
    return {
      recommendation: 'away',
      confidence: awayValue > 5 ? 'high' : awayValue > 3 ? 'medium' : 'low',
      reasoning: `Away team offers ${awayValue.toFixed(1)}% value over implied probability`
    }
  } else {
    return {
      recommendation: 'no-value',
      confidence: 'low',
      reasoning: `No significant value found (Home: ${homeValue.toFixed(1)}%, Away: ${awayValue.toFixed(1)}%)`
    }
  }
}

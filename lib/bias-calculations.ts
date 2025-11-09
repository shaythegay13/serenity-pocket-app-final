import type { Trade, BiasProfile } from "./types"

/**
 * Calculate mindful decision percentage based on trades with bias awareness
 * @param trades - Array of all trades
 * @returns Percentage of trades where biases were identified (0-100)
 */
export function calculateMindfulDecisionPercentage(trades: Trade[]): number {
  if (trades.length === 0) return 0
  
  const tradesWithBiases = trades.filter(t => t.biasesIdentified && t.biasesIdentified.length > 0).length
  return Math.round((tradesWithBiases / trades.length) * 100)
}

/**
 * Calculate bias recognition score combining assessment and practical identification
 * @param biasProfile - User's bias assessment profile (lower scores = more susceptible)
 * @param totalBiasesIdentified - Total number of biases identified across all trades
 * @param totalTrades - Total number of trades
 * @returns Bias recognition score (0-100, higher is better)
 */
export function calculateBiasRecognitionScore(
  biasProfile: BiasProfile | null,
  totalBiasesIdentified: number,
  totalTrades: number
): number {
  // Component 1: Assessment score (60% weight)
  let assessmentScore = 50 // Default if no assessment taken
  if (biasProfile) {
    const avgBiasScore = Object.values(biasProfile).reduce((a, b) => a + b, 0) / 6
    assessmentScore = Math.round(100 - avgBiasScore) // Invert: lower bias = higher recognition
  }
  
  // Component 2: Practical identification rate (40% weight)
  let practicalScore = 0
  if (totalTrades > 0) {
    // Average biases identified per trade (capped at 3 for scoring)
    const avgBiasesPerTrade = Math.min(totalBiasesIdentified / totalTrades, 3)
    practicalScore = Math.round((avgBiasesPerTrade / 3) * 100)
  }
  
  // Weighted combination
  const finalScore = Math.round((assessmentScore * 0.6) + (practicalScore * 0.4))
  
  return Math.min(100, Math.max(0, finalScore))
}

/**
 * Get total number of biases identified across all trades
 * @param trades - Array of all trades
 * @returns Total count of biases identified
 */
export function getTotalBiasesIdentified(trades: Trade[]): number {
  return trades.reduce((acc, trade) => {
    return acc + (trade.biasesIdentified?.length || 0)
  }, 0)
}

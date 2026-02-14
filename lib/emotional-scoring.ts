/**
 * Emotional Stability Scoring System
 * Calculates a user's emotional stability score (0-100) based on:
 * - Recent emotion logs
 * - Survey results
 * - Betting patterns
 */

import type { EmotionLog, Trade } from './types'

export interface EmotionalStabilityResult {
  score: number // 0-100
  level: 'VERY_LOW' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH'
  recommendation: string
  factors: {
    recentEmotions: number
    emotionalVariance: number
    surveyScore: number
    bettingPatterns: number
  }
}

/**
 * Calculate emotional stability score
 */
export function calculateEmotionalStability(
  emotionLogs: EmotionLog[],
  surveyScore?: number,
  recentTrades?: Trade[]
): EmotionalStabilityResult {
  // Base score from survey (40% weight)
  const surveyComponent = surveyScore ? (100 - surveyScore) * 0.4 : 50

  // Recent emotions score (30% weight)
  const emotionsComponent = calculateEmotionsScore(emotionLogs) * 0.3

  // Emotional variance score (20% weight)
  const varianceComponent = calculateVarianceScore(emotionLogs) * 0.2

  // Betting patterns score (10% weight)
  const patternsComponent = calculatePatternsScore(recentTrades || []) * 0.1

  // Total score
  const totalScore = Math.round(
    surveyComponent + emotionsComponent + varianceComponent + patternsComponent
  )

  const score = Math.min(100, Math.max(0, totalScore))

  return {
    score,
    level: getStabilityLevel(score),
    recommendation: getRecommendation(score),
    factors: {
      recentEmotions: Math.round(emotionsComponent / 0.3),
      emotionalVariance: Math.round(varianceComponent / 0.2),
      surveyScore: Math.round(surveyComponent / 0.4),
      bettingPatterns: Math.round(patternsComponent / 0.1)
    }
  }
}

/**
 * Calculate score from recent emotions
 */
function calculateEmotionsScore(emotionLogs: EmotionLog[]): number {
  if (!emotionLogs || emotionLogs.length === 0) return 50

  // Get last 10 emotion logs
  const recentLogs = emotionLogs.slice(-10)

  // Positive emotions boost score, negative emotions lower it
  const positiveEmotions = ['happy', 'confident', 'calm', 'excited', 'grateful']
  const negativeEmotions = ['anxious', 'frustrated', 'angry', 'fearful', 'stressed']

  let totalScore = 0
  recentLogs.forEach(log => {
    const baseScore = 50
    const intensityFactor = log.intensity / 10

    if (positiveEmotions.includes(log.emotion.toLowerCase())) {
      // Positive emotions increase score
      totalScore += baseScore + (50 * intensityFactor)
    } else if (negativeEmotions.includes(log.emotion.toLowerCase())) {
      // Negative emotions decrease score
      totalScore += baseScore - (50 * intensityFactor)
    } else {
      // Neutral emotions
      totalScore += baseScore
    }
  })

  return totalScore / recentLogs.length
}

/**
 * Calculate emotional variance (consistency)
 */
function calculateVarianceScore(emotionLogs: EmotionLog[]): number {
  if (!emotionLogs || emotionLogs.length < 3) return 50

  const recentLogs = emotionLogs.slice(-10)
  const intensities = recentLogs.map(log => log.intensity)

  // Calculate variance
  const mean = intensities.reduce((a, b) => a + b, 0) / intensities.length
  const variance = intensities.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / intensities.length

  // Lower variance = more stable = higher score
  // Variance ranges from 0 (perfect stability) to ~25 (extreme volatility)
  const stabilityScore = Math.max(0, 100 - (variance * 4))

  return stabilityScore
}

/**
 * Calculate score from betting patterns
 */
function calculatePatternsScore(trades: Trade[]): number {
  if (!trades || trades.length === 0) return 50

  const recentTrades = trades.slice(-10)
  let score = 50

  // Check for loss chasing (betting more after losses)
  let consecutiveLosses = 0
  let increasedStakeAfterLoss = 0

  for (let i = 1; i < recentTrades.length; i++) {
    const prev = recentTrades[i - 1]
    const curr = recentTrades[i]

    if (prev.outcome === 'loss') {
      consecutiveLosses++
      // If we had stake data, we'd check if it increased
      // For now, just count consecutive losses
    } else {
      consecutiveLosses = 0
    }

    if (consecutiveLosses > 2) {
      score -= 10 // Penalty for loss chasing pattern
    }
  }

  // Check for emotional betting (high intensity emotions before trades)
  const emotionalTrades = recentTrades.filter(
    trade => trade.preTradeIntensity && trade.preTradeIntensity > 7
  ).length

  if (emotionalTrades > recentTrades.length * 0.5) {
    score -= 15 // Penalty for frequent emotional betting
  }

  return Math.max(0, Math.min(100, score))
}

/**
 * Get stability level from score
 */
function getStabilityLevel(score: number): EmotionalStabilityResult['level'] {
  if (score >= 85) return 'VERY_HIGH'
  if (score >= 60) return 'HIGH'
  if (score >= 50) return 'MODERATE'
  if (score >= 30) return 'LOW'
  return 'VERY_LOW'
}

/**
 * Get recommendation based on score
 */
function getRecommendation(score: number): string {
  if (score >= 85) {
    return 'Excellent emotional stability. You\'re in a great state for making rational betting decisions.'
  }
  if (score >= 60) {
    return 'Good emotional stability. You\'re ready to analyze bets objectively.'
  }
  if (score >= 50) {
    return 'Moderate emotional stability. Consider reviewing your recent emotions before placing bets.'
  }
  if (score >= 30) {
    return 'Low emotional stability. We recommend taking a break and revisiting when you\'re feeling more balanced.'
  }
  return 'Very low emotional stability. Please take a break from betting and focus on your well-being.'
}

/**
 * Quick check if user should receive AI picks
 */
export function shouldReceiveAIPicks(emotionalScore: number): boolean {
  return emotionalScore >= 60
}

/**
 * Get color class for score display
 */
export function getScoreColor(score: number): string {
  if (score >= 85) return 'text-green-500'
  if (score >= 60) return 'text-blue-500'
  if (score >= 50) return 'text-yellow-500'
  if (score >= 30) return 'text-orange-500'
  return 'text-red-500'
}

/**
 * Get badge variant for score display
 */
export function getScoreBadgeVariant(score: number): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (score >= 60) return 'default'
  if (score >= 50) return 'secondary'
  return 'destructive'
}

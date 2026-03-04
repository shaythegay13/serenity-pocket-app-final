/**
 * Emotional Stability Scoring System
 *
 * A two-factor model for determining betting readiness:
 * 1. TRAIT RISK (Slow Moving) - Based on PGSI survey, represents baseline gambling risk
 * 2. STATE STABILITY (Fast Moving) - Based on current emotions, trends, and betting behavior
 *
 * The final score combines both factors with adaptive thresholds.
 */

import type { EmotionLog, Trade } from './types'

export interface EmotionalStabilityResult {
  score: number // 0-100 (higher = more stable/ready)
  level: 'VERY_LOW' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH'
  recommendation: string
  factors: {
    recentEmotions: number      // State: Current emotional valence (0-100)
    emotionalVariance: number   // State: Trend stability (0-100)
    surveyScore: number         // Trait: PGSI-based risk (0-100, inverted)
    bettingPatterns: number     // State: Impulse/behavior patterns (0-100)
  }
  // New: Adaptive threshold based on trait risk
  adaptiveThreshold: number
}

/**
 * Comprehensive emotion valence map
 * Range: -1 (worst for betting) to +1 (best for betting)
 *
 * All 60 emotions from the 6 core categories:
 * - JOY: Generally positive, but watch for overconfidence
 * - CALM: Best for betting - clear-headed decision making
 * - FEAR: Negative - leads to hesitation or panic decisions
 * - GREED: Dangerous - leads to impulsive, risky betting
 * - FRUSTRATION: Negative - leads to tilt and revenge betting
 * - SADNESS: Negative - impaired judgment and escapism risk
 */
const EMOTION_VALENCE_MAP: Record<string, number> = {
  // JOY (positive but some carry risk)
  happy: 0.7,
  excited: 0.5,        // Can lead to impulsivity
  optimistic: 0.6,
  grateful: 0.8,       // Grounded positive emotion
  confident: 0.6,      // Good but watch for overconfidence
  proud: 0.5,          // Can lead to ego-driven decisions
  hopeful: 0.6,
  content: 0.8,        // Stable positive state
  cheerful: 0.7,
  inspired: 0.6,

  // CALM (best for betting - highest valence)
  peaceful: 0.9,
  relaxed: 0.85,
  centered: 0.95,      // Ideal betting state
  focused: 0.9,        // Ideal for analysis
  balanced: 0.95,      // Best emotional state
  serene: 0.85,
  patient: 0.9,        // Critical for good betting
  composed: 0.9,
  tranquil: 0.85,
  stable: 0.95,        // Ideal baseline

  // FEAR (negative - impairs decision making)
  anxious: -0.6,
  worried: -0.5,
  nervous: -0.5,
  scared: -0.7,
  uncertain: -0.4,
  panicked: -0.9,      // Very dangerous for betting
  hesitant: -0.3,
  overwhelmed: -0.7,
  tense: -0.5,
  uneasy: -0.4,

  // GREED (dangerous - leads to poor risk management)
  fomo: -0.8,          // Fear of missing out - very risky
  euphoric: -0.6,      // Overconfidence after wins
  impulsive: -0.9,     // Most dangerous for betting
  overconfident: -0.7,
  eager: -0.4,         // Mild risk
  craving: -0.7,
  obsessed: -0.8,
  compulsive: -0.9,    // Severe risk indicator
  restless: -0.5,
  driven: -0.3,        // Can be channeled positively

  // FRUSTRATION (negative - leads to tilt)
  angry: -0.8,
  irritated: -0.5,
  disappointed: -0.5,
  impatient: -0.6,
  stressed: -0.6,
  resentful: -0.7,
  annoyed: -0.4,
  agitated: -0.7,
  bitter: -0.7,
  exhausted: -0.6,     // Impairs judgment

  // SADNESS (negative - escapism risk)
  down: -0.5,
  discouraged: -0.5,
  regretful: -0.6,
  defeated: -0.7,
  helpless: -0.7,
  lonely: -0.5,
  empty: -0.6,
  hopeless: -0.8,
  dejected: -0.6,
  grief: -0.8,
}

/**
 * Get emotion valence from the map
 * Returns 0 for unknown emotions (treated as baseline)
 */
export function getEmotionValence(emotion: string): number {
  const normalized = emotion.toLowerCase().trim()
  return EMOTION_VALENCE_MAP[normalized] ?? 0
}

/**
 * Calculate TRAIT RISK score (slow moving)
 * Based on PGSI survey score - represents baseline gambling risk
 * Higher PGSI = higher risk = lower stability
 */
function calculateTraitRisk(pgsiScore?: number): number {
  if (pgsiScore === undefined || pgsiScore === null) {
    return 50 // Default moderate risk if no survey data
  }
  // PGSI typical range is 0-27
  // Normalize to 0-100 risk scale
  const normalized = Math.min(pgsiScore / 27, 1)
  return normalized * 100 // 0-100 risk scale (higher = riskier)
}

/**
 * Calculate STATE STABILITY score (fast moving)
 * Based on current emotion, intensity, trends, and betting behavior
 */
function calculateStateStability(
  currentEmotion: string,
  intensity: number,
  recentEmotions: { emotion: string; intensity: number }[],
  lastBetSize?: number,
  avgBetSize?: number
): number {
  // Get valence for current emotion (-1 to +1)
  const valence = getEmotionValence(currentEmotion)

  // Convert valence (-1 to +1) to (0 to 100)
  const valenceScore = ((valence + 1) / 2) * 100

  // Intensity penalty: higher intensity amplifies negative emotions more
  // For negative emotions (valence < 0), high intensity is worse
  // For positive emotions, high intensity is slightly destabilizing (overexcitement)
  const intensityPenalty = valence < 0
    ? intensity * 3  // Negative emotions: 3 points per intensity level
    : intensity * 1  // Positive emotions: 1 point per intensity level

  // Emotional trend: Check if emotions are worsening (last 3 logs)
  const lastThree = recentEmotions.slice(-3)
  let trendPenalty = 0
  if (lastThree.length >= 2) {
    // Check if intensity is increasing AND emotions are getting more negative
    const worseningTrend = lastThree.every((e, i, arr) => {
      if (i === 0) return true
      const prevValence = getEmotionValence(arr[i - 1].emotion)
      const currValence = getEmotionValence(e.emotion)
      return currValence < prevValence || e.intensity > arr[i - 1].intensity
    })
    trendPenalty = worseningTrend ? 10 : 0
  }

  // Impulse detection: Significant bet size increase signals emotional betting
  let impulsePenalty = 0
  if (lastBetSize !== undefined && avgBetSize !== undefined && avgBetSize > 0) {
    const betSpike = lastBetSize > avgBetSize * 1.5
    impulsePenalty = betSpike ? 10 : 0
  }

  // Calculate final stability score
  const stability = valenceScore - intensityPenalty - trendPenalty - impulsePenalty

  return Math.max(0, Math.min(100, stability))
}

/**
 * Determine adaptive threshold based on trait risk
 * Higher trait risk = stricter threshold for betting access
 */
function determineAdaptiveThreshold(traitRisk: number): number {
  // Base threshold = 60
  // Higher trait risk raises the threshold (up to +10)
  return 60 + (traitRisk * 0.1)
}

/**
 * Calculate emotional stability score
 * Combines trait risk (slow) and state stability (fast)
 */
export function calculateEmotionalStability(
  emotionLogs: EmotionLog[],
  surveyScore?: number,
  recentTrades?: Trade[]
): EmotionalStabilityResult {
  // 1. Calculate Trait Risk (from PGSI survey)
  const traitRisk = calculateTraitRisk(surveyScore)
  const traitStability = 100 - traitRisk // Invert: lower risk = higher stability

  // 2. Get current emotion data
  const recentLogs = emotionLogs?.slice(-10) || []
  const currentLog = recentLogs[recentLogs.length - 1]

  // 3. Calculate betting statistics for impulse detection
  const trades = recentTrades || []
  const recentBetSizes = trades.slice(-10).map(t => t.stake || 0).filter(s => s > 0)
  const avgBetSize = recentBetSizes.length > 0
    ? recentBetSizes.reduce((a, b) => a + b, 0) / recentBetSizes.length
    : 0
  const lastBetSize = recentBetSizes[recentBetSizes.length - 1]

  // 4. Calculate State Stability (fast moving)
  const stateStability = currentLog
    ? calculateStateStability(
      currentLog.emotion,
      currentLog.intensity,
      recentLogs.map(l => ({ emotion: l.emotion, intensity: l.intensity })),
      lastBetSize,
      avgBetSize
    )
    : 50 // Default if no emotion logs

  // 5. Calculate emotional variance (consistency over time)
  const varianceScore = calculateVarianceScore(emotionLogs)

  // 6. Calculate betting pattern score
  const patternsScore = calculatePatternsScore(recentTrades || [])

  // 7. Combine scores with weights
  // State (current emotion): 45% - primary driver, immediate emotional state
  // Variance: 25% - emotional consistency over time
  // Patterns: 20% - betting behavior signals
  // Trait (PGSI): 10% - modifier, not core driver
  const weightedScore =
    (stateStability * 0.45) +
    (varianceScore * 0.25) +
    (patternsScore * 0.20) +
    (traitStability * 0.10)

  const score = Math.round(Math.min(100, Math.max(0, weightedScore)))
  const adaptiveThreshold = determineAdaptiveThreshold(traitRisk)

  return {
    score,
    level: getStabilityLevel(score),
    recommendation: getRecommendation(score, adaptiveThreshold),
    factors: {
      recentEmotions: Math.round(stateStability),
      emotionalVariance: Math.round(varianceScore),
      surveyScore: Math.round(traitStability),
      bettingPatterns: Math.round(patternsScore)
    },
    adaptiveThreshold: Math.round(adaptiveThreshold)
  }
}

/**
 * Calculate emotional variance (consistency)
 * Lower variance = more stable = higher score
 */
function calculateVarianceScore(emotionLogs: EmotionLog[]): number {
  if (!emotionLogs || emotionLogs.length < 3) return 50

  const recentLogs = emotionLogs.slice(-10)

  // Calculate valence variance (not just intensity)
  const valences = recentLogs.map(log => getEmotionValence(log.emotion))
  const intensities = recentLogs.map(log => log.intensity)

  // Valence variance
  const valMean = valences.reduce((a, b) => a + b, 0) / valences.length
  const valVariance = valences.reduce((sum, val) => sum + Math.pow(val - valMean, 2), 0) / valences.length

  // Intensity variance
  const intMean = intensities.reduce((a, b) => a + b, 0) / intensities.length
  const intVariance = intensities.reduce((sum, val) => sum + Math.pow(val - intMean, 2), 0) / intensities.length

  // Combined variance (valence variance is on 0-4 scale, intensity on 0-25)
  // Normalize both to similar scales
  const normalizedValVariance = valVariance * 25 // Scale up valence variance
  const combinedVariance = (normalizedValVariance + intVariance) / 2

  // Lower variance = more stable = higher score
  // Combined variance ranges from 0 (perfect stability) to ~25 (extreme volatility)
  const stabilityScore = Math.max(0, 100 - (combinedVariance * 4))

  return stabilityScore
}

/**
 * Calculate score from betting patterns
 */
function calculatePatternsScore(trades: Trade[]): number {
  if (!trades || trades.length === 0) return 50

  const recentTrades = trades.slice(-10)
  let score = 70 // Start higher, deduct for problems

  // Check for loss chasing (betting more after losses)
  let consecutiveLosses = 0

  for (let i = 1; i < recentTrades.length; i++) {
    const prev = recentTrades[i - 1]
    const curr = recentTrades[i]

    if (prev.outcome === 'loss') {
      consecutiveLosses++

      // Check for stake increase after loss (loss chasing)
      if (curr.stake && prev.stake && curr.stake > prev.stake * 1.2) {
        score -= 15 // Significant penalty for loss chasing
      }
    } else {
      consecutiveLosses = 0
    }

    if (consecutiveLosses > 2) {
      score -= 10 // Penalty for extended losing streak continuing to bet
    }
  }

  // Check for emotional betting (high intensity emotions before trades)
  const emotionalTrades = recentTrades.filter(
    trade => trade.preTradeIntensity && trade.preTradeIntensity > 7
  ).length

  if (emotionalTrades > recentTrades.length * 0.5) {
    score -= 15 // Penalty for frequent emotional betting
  }

  // Check for rapid betting (many bets in short time)
  if (recentTrades.length >= 5) {
    const timestamps = recentTrades.map(t => new Date(t.timestamp).getTime())
    const timeSpan = timestamps[timestamps.length - 1] - timestamps[0]
    const avgTimeBetweenBets = timeSpan / (timestamps.length - 1)

    // If betting more frequently than every 30 minutes on average
    if (avgTimeBetweenBets < 30 * 60 * 1000) {
      score -= 10 // Penalty for rapid betting
    }
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
 * Get recommendation based on score and adaptive threshold
 */
function getRecommendation(score: number, adaptiveThreshold: number = 60): string {
  if (score >= 85) {
    return 'Excellent emotional stability. You\'re in an optimal state for making rational betting decisions.'
  }
  if (score >= adaptiveThreshold) {
    return 'Good emotional stability. You\'re ready to analyze bets objectively.'
  }
  if (score >= 50) {
    return `Moderate emotional stability. Your current threshold is ${Math.round(adaptiveThreshold)}. Consider reviewing your emotional state before placing bets.`
  }
  if (score >= 30) {
    return 'Low emotional stability detected. We recommend taking a break and using the breathing exercises before making any betting decisions.'
  }
  return 'Very low emotional stability. Please prioritize your well-being. Consider reaching out to support resources if needed.'
}

/**
 * Quick check if user should receive AI picks
 * @deprecated Use modulateRisk() from behavioral-risk-modulator.ts instead.
 * Picks are always generated at full quality; risk modulation handles exposure control.
 */
export function shouldReceiveAIPicks(emotionalScore: number): boolean {
  // Always return picks — the behavioral risk modulator handles graduated
  // risk responses (PROCEED / CAUTION / SKIP / TAKE_BREAK) post-analysis.
  return true
}

/**
 * Check with adaptive threshold (for personalized recommendations)
 */
export function shouldReceiveAIPicksAdaptive(
  emotionalScore: number,
  adaptiveThreshold: number
): boolean {
  return emotionalScore >= adaptiveThreshold
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

/**
 * Get all emotions for a given category
 */
export function getEmotionsByCategory(category: string): string[] {
  const categories: Record<string, string[]> = {
    joy: ['happy', 'excited', 'optimistic', 'grateful', 'confident', 'proud', 'hopeful', 'content', 'cheerful', 'inspired'],
    calm: ['peaceful', 'relaxed', 'centered', 'focused', 'balanced', 'serene', 'patient', 'composed', 'tranquil', 'stable'],
    fear: ['anxious', 'worried', 'nervous', 'scared', 'uncertain', 'panicked', 'hesitant', 'overwhelmed', 'tense', 'uneasy'],
    greed: ['fomo', 'euphoric', 'impulsive', 'overconfident', 'eager', 'craving', 'obsessed', 'compulsive', 'restless', 'driven'],
    frustration: ['angry', 'irritated', 'disappointed', 'impatient', 'stressed', 'resentful', 'annoyed', 'agitated', 'bitter', 'exhausted'],
    sadness: ['down', 'discouraged', 'regretful', 'defeated', 'helpless', 'lonely', 'empty', 'hopeless', 'dejected', 'grief']
  }
  return categories[category.toLowerCase()] || []
}

/**
 * Get the category for a given emotion
 */
export function getEmotionCategory(emotion: string): string | null {
  const normalized = emotion.toLowerCase().trim()
  const categories = ['joy', 'calm', 'fear', 'greed', 'frustration', 'sadness']

  for (const category of categories) {
    if (getEmotionsByCategory(category).includes(normalized)) {
      return category
    }
  }
  return null
}

/**
 * Check if an emotion is high-risk for betting
 * Returns true for emotions with valence <= -0.5
 */
export function isHighRiskEmotion(emotion: string): boolean {
  const valence = getEmotionValence(emotion)
  return valence <= -0.5
}

/**
 * Get all available emotions
 */
export function getAllEmotions(): string[] {
  return Object.keys(EMOTION_VALENCE_MAP)
}

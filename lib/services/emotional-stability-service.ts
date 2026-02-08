/**
 * Centralized Emotional Stability Service
 * Provides consistent emotional stability scoring across the entire application
 */

import {
  calculateEmotionalStability,
  type EmotionalStabilityResult,
  shouldReceiveAIPicks,
  getScoreColor,
  getScoreBadgeVariant
} from "@/lib/emotional-scoring"
import { storageHybrid as storage } from "@/lib/storage-hybrid"
import type { UserData, EmotionLog, Trade } from "@/lib/types"
import { analyticsEvents, ANALYTICS_EVENTS } from "@/lib/events"

export interface EmotionalStabilityCache {
  score: number
  level: EmotionalStabilityResult['level']
  recommendation: string
  factors: EmotionalStabilityResult['factors']
  lastCalculated: number
  userId: string
}

class EmotionalStabilityService {
  private cache = new Map<string, EmotionalStabilityCache>()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  constructor() {
    // Listen for emotion logs and invalidate cache to ensure fresh scores
    // This ensures the score updates immediately when users log new emotions
    if (typeof window !== 'undefined') {
      analyticsEvents.on(ANALYTICS_EVENTS.EMOTION_LOGGED, () => {
        this.clearCache()
        console.log('[EmotionalStability] Cache cleared due to new emotion log')
      })

      // Also clear cache when betting data changes
      analyticsEvents.on(ANALYTICS_EVENTS.BETTING_DATA_SAVED, () => {
        this.clearCache()
        console.log('[EmotionalStability] Cache cleared due to betting data update')
      })
    }
  }

  /**
   * Get the current user's emotional stability score
   * Uses cached value if available and fresh, otherwise calculates fresh
   */
  async getCurrentEmotionalStability(userData: UserData): Promise<EmotionalStabilityResult> {
    const userId = userData.email || 'anonymous'
    const now = Date.now()
    const cached = this.cache.get(userId)

    // Return cached value if it's still fresh
    if (cached && (now - cached.lastCalculated) < this.CACHE_DURATION) {
      return {
        score: cached.score,
        level: cached.level,
        recommendation: cached.recommendation,
        factors: cached.factors
      }
    }

    // Calculate fresh score
    const result = await this.calculateFreshScore(userData)
    
    // Update cache
    this.cache.set(userId, {
      ...result,
      lastCalculated: now,
      userId
    })

    return result
  }

  /**
   * Force recalculation of emotional stability score
   */
  async forceRecalculate(userData: UserData): Promise<EmotionalStabilityResult> {
    const userId = userData.email || 'anonymous'
    const result = await this.calculateFreshScore(userData)
    
    // Update cache
    this.cache.set(userId, {
      ...result,
      lastCalculated: Date.now(),
      userId
    })

    return result
  }

  /**
   * Get just the score (for components that only need the number)
   */
  async getScore(userData: UserData): Promise<number> {
    const stability = await this.getCurrentEmotionalStability(userData)
    return stability.score
  }

  /**
   * Check if user should receive AI picks based on emotional stability
   * Uses the centralized threshold from emotional-scoring.ts (70+)
   */
  async checkShouldReceiveAIPicks(userData: UserData): Promise<boolean> {
    const score = await this.getScore(userData)
    return shouldReceiveAIPicks(score)
  }

  /**
   * Clear cache for a specific user or all users
   */
  clearCache(userId?: string): void {
    if (userId) {
      this.cache.delete(userId)
    } else {
      this.cache.clear()
    }
  }

  /**
   * Calculate fresh emotional stability score
   */
  private async calculateFreshScore(userData: UserData): Promise<EmotionalStabilityResult> {
    try {
      // Get emotion logs and trades from storage
      const emotionLogs = await storage.getEmotionLogs()
      const trades = await storage.getTrades()

      // Calculate using the existing scoring algorithm
      return calculateEmotionalStability(
        emotionLogs,
        userData.surveyData?.score,
        trades
      )
    } catch (error) {
      console.error('Error calculating emotional stability:', error)
      
      // Return default values on error
      return {
        score: 50,
        level: 'MODERATE',
        recommendation: 'Unable to calculate emotional stability at this time.',
        factors: {
          recentEmotions: 50,
          emotionalVariance: 50,
          surveyScore: userData.surveyData?.score ? (100 - userData.surveyData.score) : 50,
          bettingPatterns: 50
        }
      }
    }
  }

  /**
   * Get emotional stability data formatted for API requests
   * Uses the centralized threshold from emotional-scoring.ts
   */
  async getForAPI(userData: UserData): Promise<{ emotionalScore: number; shouldBet: boolean; message?: string }> {
    const stability = await this.getCurrentEmotionalStability(userData)
    const shouldBet = shouldReceiveAIPicks(stability.score)

    return {
      emotionalScore: stability.score,
      shouldBet,
      message: shouldBet
        ? undefined
        : `Your emotional stability score is ${stability.score}/100. We recommend waiting until you're in a more stable state (70+) before placing bets.`
    }
  }

  /**
   * Get emotional stability data formatted for UI display
   * Uses centralized color and badge functions from emotional-scoring.ts
   */
  async getForUIDisplay(userData: UserData): Promise<{
    score: number
    level: EmotionalStabilityResult['level']
    recommendation: string
    color: string
    badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline'
  }> {
    const stability = await this.getCurrentEmotionalStability(userData)

    return {
      score: stability.score,
      level: stability.level,
      recommendation: stability.recommendation,
      color: getScoreColor(stability.score),
      badgeVariant: getScoreBadgeVariant(stability.score)
    }
  }
}

// Export singleton instance
export const emotionalStabilityService = new EmotionalStabilityService()

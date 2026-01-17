/**
 * Centralized Emotional Stability Service
 * Provides consistent emotional stability scoring across the entire application
 */

import { calculateEmotionalStability, type EmotionalStabilityResult } from "@/lib/emotional-scoring"
import { storageHybrid as storage } from "@/lib/storage-hybrid"
import type { UserData, EmotionLog, Trade } from "@/lib/types"

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
   */
  async shouldReceiveAIPicks(userData: UserData): Promise<boolean> {
    const score = await this.getScore(userData)
    return score >= 70
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
   */
  async getForAPI(userData: UserData): Promise<{ emotionalScore: number; shouldBet: boolean; message?: string }> {
    const stability = await this.getCurrentEmotionalStability(userData)
    const shouldBet = stability.score >= 70

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
   */
  async getForUIDisplay(userData: UserData): Promise<{
    score: number
    level: EmotionalStabilityResult['level']
    recommendation: string
    color: string
    badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline'
  }> {
    const stability = await this.getCurrentEmotionalStability(userData)
    
    // Import color functions to avoid circular dependencies
    const getScoreColor = (score: number): string => {
      if (score >= 85) return 'text-green-500'
      if (score >= 70) return 'text-blue-500'
      if (score >= 50) return 'text-yellow-500'
      if (score >= 30) return 'text-orange-500'
      return 'text-red-500'
    }

    const getScoreBadgeVariant = (score: number): 'default' | 'secondary' | 'destructive' | 'outline' => {
      if (score >= 70) return 'default'
      if (score >= 50) return 'secondary'
      return 'destructive'
    }

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

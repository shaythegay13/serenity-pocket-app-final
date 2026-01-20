/**
 * React hook for accessing emotional stability data
 * Provides consistent emotional stability scoring across all components
 */

import { useState, useEffect } from "react"
import { emotionalStabilityService } from "@/lib/services/emotional-stability-service"
import type { UserData } from "@/lib/types"
import type { EmotionalStabilityResult } from "@/lib/emotional-scoring"

export interface UseEmotionalStabilityReturn {
  score: number | null
  level: EmotionalStabilityResult['level'] | null
  recommendation: string | null
  loading: boolean
  error: string | null
  shouldReceiveAIPicks: boolean
  refresh: () => Promise<void>
  color: string
  badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline'
}

export function useEmotionalStability(userData: UserData | null): UseEmotionalStabilityReturn {
  const [score, setScore] = useState<number | null>(null)
  const [level, setLevel] = useState<EmotionalStabilityResult['level'] | null>(null)
  const [recommendation, setRecommendation] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const calculateStability = async () => {
    if (!userData) {
      setScore(null)
      setLevel(null)
      setRecommendation(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const stability = await emotionalStabilityService.getCurrentEmotionalStability(userData)
      setScore(stability.score)
      setLevel(stability.level)
      setRecommendation(stability.recommendation)
    } catch (err) {
      console.error('Error calculating emotional stability:', err)
      setError(err instanceof Error ? err.message : 'Failed to calculate emotional stability')
      setScore(50) // Default fallback
      setLevel('MODERATE')
      setRecommendation('Unable to calculate stability. Proceed with caution.')
    } finally {
      setLoading(false)
    }
  }

  const refresh = async () => {
    if (!userData) return
    
    try {
      setLoading(true)
      const stability = await emotionalStabilityService.forceRecalculate(userData)
      setScore(stability.score)
      setLevel(stability.level)
      setRecommendation(stability.recommendation)
    } catch (err) {
      console.error('Error refreshing emotional stability:', err)
      setError(err instanceof Error ? err.message : 'Failed to refresh emotional stability')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    calculateStability()
  }, [userData])

  // Calculate derived values
  const shouldReceiveAIPicks = score !== null && score >= 50
  
  const getScoreColor = (score: number): string => {
    if (score >= 85) return 'text-green-500'
    if (score >= 70) return 'text-blue-500'
    if (score >= 50) return 'text-yellow-500'
    if (score >= 30) return 'text-orange-500'
    return 'text-red-500'
  }

  const getScoreBadgeVariant = (score: number): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (score >= 50) return 'default'
    if (score >= 30) return 'secondary'
    return 'destructive'
  }

  const color = score !== null ? getScoreColor(score) : 'text-muted-foreground'
  const badgeVariant = score !== null ? getScoreBadgeVariant(score) : 'secondary'

  return {
    score,
    level,
    recommendation,
    loading,
    error,
    shouldReceiveAIPicks,
    refresh,
    color,
    badgeVariant
  }
}

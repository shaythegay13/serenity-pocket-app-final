'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Zap, TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface UsageCheckResult {
  canUse: boolean
  remaining: number
  limit: number
  usedThisWeek: number
  purchasedCredits: number
  totalAvailable: number
}

interface UsageStats {
  aiPicker: UsageCheckResult
  aiBetAnalyzer: UsageCheckResult
  weekStartDate: string
}

export function AIUsageIndicator() {
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchUsageStats()
  }, [])

  async function fetchUsageStats() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setLoading(false)
        return
      }

      const res = await fetch('/api/marketplace/usage-stats', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      })
      
      if (!res.ok) {
        throw new Error('Failed to fetch usage stats')
      }

      const data = await res.json()
      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch usage stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="p-4 mb-4 animate-pulse">
        <div className="h-6 bg-muted rounded mb-4"></div>
        <div className="h-2 bg-muted rounded mb-4"></div>
        <div className="h-2 bg-muted rounded"></div>
      </Card>
    )
  }

  if (!stats) return null

  const { aiPicker, aiBetAnalyzer } = stats

  // Calculate percentage for progress bars
  const pickerPercentage = aiPicker.totalAvailable > 0 
    ? (aiPicker.usedThisWeek / aiPicker.totalAvailable) * 100 
    : 0

  const analyzerPercentage = aiBetAnalyzer.totalAvailable > 0
    ? (aiBetAnalyzer.usedThisWeek / aiBetAnalyzer.totalAvailable) * 100
    : 0

  return (
    <Card className="p-4 mb-4 bg-linear-to-br from-purple-500/5 to-blue-500/5 border-purple-500/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          AI Service Usage This Week
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/marketplace')}
          className="gap-2"
        >
          <ShoppingCart className="h-4 w-4" />
          Buy More
        </Button>
      </div>

      {/* AI Picker */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-blue-500" />
            SmartSlip
          </span>
          <span className="text-muted-foreground">
            {aiPicker.usedThisWeek} / {aiPicker.totalAvailable} used
          </span>
        </div>
        <Progress 
          value={pickerPercentage} 
          className="h-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Tier limit: {aiPicker.limit}</span>
          {aiPicker.purchasedCredits > 0 && (
            <span className="text-green-600 dark:text-green-400">
              +{aiPicker.purchasedCredits} purchased
            </span>
          )}
        </div>
      </div>

      {/* AI Bet Analyzer */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium flex items-center gap-1">
            <Zap className="h-3 w-3 text-purple-500" />
            TiltLab
          </span>
          <span className="text-muted-foreground">
            {aiBetAnalyzer.usedThisWeek} / {aiBetAnalyzer.totalAvailable} used
          </span>
        </div>
        <Progress 
          value={analyzerPercentage} 
          className="h-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Tier limit: {aiBetAnalyzer.limit}</span>
          {aiBetAnalyzer.purchasedCredits > 0 && (
            <span className="text-green-600 dark:text-green-400">
              +{aiBetAnalyzer.purchasedCredits} purchased
            </span>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-3 text-center">
        Resets every Monday • Week started {new Date(stats.weekStartDate).toLocaleDateString()}
      </p>
    </Card>
  )
}

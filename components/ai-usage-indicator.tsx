'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Brain } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { DecisionCheckResult } from '@/lib/ai-usage-tracker'

interface DecisionStats {
  decisions: DecisionCheckResult
  weekStartDate: string
}

export function AIUsageIndicator() {
  const [stats, setStats] = useState<DecisionStats | null>(null)
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
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (!res.ok) {
        let bodyText = ''
        try { bodyText = await res.text() } catch { /* ignore */ }
        throw new Error(
          `Failed to fetch usage stats: ${res.status} ${res.statusText}${bodyText ? ` - ${bodyText}` : ''}`,
        )
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
        <div className="h-6 bg-muted rounded mb-4" />
        <div className="h-2 bg-muted rounded mb-2" />
        <div className="h-4 bg-muted rounded w-1/2" />
      </Card>
    )
  }

  if (!stats) return null

  const { decisions } = stats
  const percentage =
    decisions.totalAvailable > 0
      ? (decisions.usedThisWeek / decisions.totalAvailable) * 100
      : 0

  return (
    <Card className="p-4 mb-4 bg-linear-to-br from-purple-500/5 to-blue-500/5 border-purple-500/20">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-500" />
          AI-Guided Decisions This Week
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

      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-muted-foreground">
            Use a decision to analyze your next bet with AI guidance
          </span>
          <span className="font-medium tabular-nums">
            {decisions.usedThisWeek} / {decisions.totalAvailable} used
          </span>
        </div>
        <Progress value={percentage} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Weekly allocation: {decisions.weeklyLimit}</span>
          {decisions.purchasedCredits > 0 && (
            <span className="text-green-600 dark:text-green-400">
              +{decisions.purchasedCredits} purchased
            </span>
          )}
        </div>
      </div>

      {decisions.remaining === 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
          No decisions remaining — purchase more to continue your AI analysis.
        </p>
      )}

      <p className="text-xs text-muted-foreground mt-2 text-center">
        Resets every Monday · Week started{' '}
        {new Date(stats.weekStartDate).toLocaleDateString()}
      </p>
    </Card>
  )
}

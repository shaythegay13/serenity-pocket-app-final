"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { storageHybrid as storage } from "@/lib/storage-hybrid"
import type { EmotionLog, Trade, UserData, BetAnalysis } from "@/lib/types"
import type { ComprehensiveBet } from "@/lib/types/bet-tracking"
import { Lock, Crown, Activity, TrendingUp, Brain, CheckCircle2 } from "lucide-react"
import { canAccessFeature } from "@/lib/subscription-tiers"
import { supabase } from "@/lib/supabase"
import { CorrelationTab } from "@/components/analytics/CorrelationTab"
import { PerformanceTab } from "@/components/analytics/PerformanceTab"
import { MentalHealthTab } from "@/components/analytics/MentalHealthTab"

interface AnalyticsTabProps {
  userData: UserData
  onNavigateToTab?: (tab: string) => void
}

type SubTab = "correlation" | "performance" | "mental-health"

export function AnalyticsTab({ userData, onNavigateToTab }: AnalyticsTabProps) {
  const hasAccess = canAccessFeature(userData.subscriptionTier || "free", "premium")

  // State declarations
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<EmotionLog[]>([])
  const [trades, setTrades] = useState<Trade[]>([])
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("performance")

  // Show paywall for free tier users
  if (!hasAccess) {
    return (
      <div className="space-y-6 fade-in">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-foreground">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Advanced analytics and performance tracking
          </p>
        </div>

        <Card className="p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-primary/10">
              <Lock className="h-12 w-12 text-primary" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-foreground">Premium Feature</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              The Analytics Dashboard is available to Premium subscribers and above. Upgrade to unlock detailed performance tracking, emotion-outcome correlations, and advanced betting analytics.
            </p>
          </div>

          <div className="space-y-3 max-w-sm mx-auto">
            <div className="flex items-start gap-3 text-left">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
              <span className="text-sm text-foreground">Emotion vs. Outcome Correlation Charts</span>
            </div>
            <div className="flex items-start gap-3 text-left">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
              <span className="text-sm text-foreground">Betting Performance Metrics & ROI Tracking</span>
            </div>
            <div className="flex items-start gap-3 text-left">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
              <span className="text-sm text-foreground">Mental Health Score Timeline</span>
            </div>
            <div className="flex items-start gap-3 text-left">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
              <span className="text-sm text-foreground">Detailed Betting History with Filters</span>
            </div>
          </div>

          <Button
            size="lg"
            className="gap-2"
            onClick={() => onNavigateToTab?.('account')}
          >
            <Crown className="h-5 w-5" />
            Upgrade to Premium
          </Button>
        </Card>
      </div>
    )
  }

  // Load data effect
  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        setLoading(true)
        console.log('📊 Loading analytics data...')

        // Load data from localStorage
        const emotionLogs = JSON.parse(localStorage.getItem('serenity_emotion_logs') || '[]')
        const tradeData = JSON.parse(localStorage.getItem('serenity_trades') || '[]')

        // Also try loading emotions from Supabase as primary source
        if (supabase) {
          try {
            const { data: supabaseEmotions, error } = await supabase
              .from('emotion_logs')
              .select(`
                id,
                emotion,
                phase,
                timestamp,
                trade_id,
                trades(
                  id,
                  timestamp,
                  title,
                  sport,
                  stake,
                  odds,
                  outcome,
                  profit
                )
              `)
              .order('timestamp', { ascending: false })

            if (!error && supabaseEmotions) {
              console.log('✅ Loaded emotions from Supabase:', supabaseEmotions.length)

              // Map Supabase data to EmotionLog type
              const mappedEmotions: EmotionLog[] = supabaseEmotions.map((emotion: any) => ({
                id: emotion.id || `supabase-${emotion.timestamp}`,
                timestamp: new Date(emotion.timestamp),
                emotion: emotion.emotion,
                intensity: 5,
                context: 'betting',
                phase: emotion.phase,
                tradeId: emotion.trade_id
              }))

              if (!cancelled) {
                setLogs(mappedEmotions)
              }
            } else {
              console.log('Using localStorage emotions as fallback')
              if (!cancelled) {
                setLogs(emotionLogs || [])
              }
            }
          } catch (supabaseError) {
            console.log('Supabase error, using localStorage:', supabaseError)
            if (!cancelled) {
              setLogs(emotionLogs || [])
            }
          }
        } else {
          if (!cancelled) {
            setLogs(emotionLogs || [])
          }
        }

        if (!cancelled) {
          setTrades(tradeData || [])
        }

        console.log('📊 Analytics data loaded:', {
          emotions: emotionLogs.length,
          trades: tradeData.length
        })
      } catch (error) {
        if (cancelled) return
        console.error('Error loading analytics data:', error)
        setError(error instanceof Error ? error.message : 'Failed to load analytics data')
        setLogs([])
        setTrades([])
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 fade-in">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-foreground">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Loading your analytics data...</p>
        </div>
        <Card className="p-8 text-center">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6 fade-in">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-foreground">Analytics Dashboard</h2>
          <p className="text-destructive">Error: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-foreground">Analytics Dashboard</h2>
        <p className="text-muted-foreground">
          Advanced insights into your betting performance and emotional patterns
        </p>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex flex-wrap gap-2 justify-center">
        <Button
          variant={activeSubTab === "performance" ? "default" : "outline"}
          onClick={() => setActiveSubTab("performance")}
          className="gap-2"
        >
          <TrendingUp className="h-4 w-4" />
          Performance
        </Button>
        <Button
          variant={activeSubTab === "correlation" ? "default" : "outline"}
          onClick={() => setActiveSubTab("correlation")}
          className="gap-2"
        >
          <Activity className="h-4 w-4" />
          Emotion Correlation
        </Button>
        <Button
          variant={activeSubTab === "mental-health" ? "default" : "outline"}
          onClick={() => setActiveSubTab("mental-health")}
          className="gap-2"
        >
          <Brain className="h-4 w-4" />
          Mental Health
        </Button>
      </div>

      {/* Tab Content */}
      {activeSubTab === "performance" && (
        <PerformanceTab trades={trades} />
      )}

      {activeSubTab === "correlation" && (
        <CorrelationTab emotionLogs={logs} trades={trades} />
      )}

      {activeSubTab === "mental-health" && (
        <MentalHealthTab emotionLogs={logs} />
      )}
    </div>
  )
}

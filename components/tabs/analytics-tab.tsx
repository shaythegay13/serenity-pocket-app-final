"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { storageHybrid as storage } from "@/lib/storage-hybrid"
import type { EmotionLog, Trade, UserData, BetAnalysis } from "@/lib/types"
import type { ComprehensiveBet } from "@/lib/types/bet-tracking"
import { Lock, Crown, Activity, TrendingUp, Brain, CheckCircle2 } from "lucide-react"
import { analyticsEvents, ANALYTICS_EVENTS } from "@/lib/events"
import { canAccessFeature } from "@/lib/subscription-tiers"
import { supabase } from "@/lib/supabase"
import { CorrelationTab } from "@/components/analytics/CorrelationTab"
import { PerformanceTab } from "@/components/analytics/PerformanceTab"
import { MentalHealthTab } from "@/components/analytics/MentalHealthTab"
import { usePerformanceMonitor } from "@/lib/use-performance-monitor"

interface AnalyticsTabProps {
  userData: UserData
  onNavigateToTab?: (tab: string) => void
}

type SubTab = "correlation" | "performance" | "mental-health"

export function AnalyticsTab({ userData, onNavigateToTab }: AnalyticsTabProps) {
  const hasAccess = canAccessFeature(userData.subscriptionTier || "free", "premium")
  const { markDataLoaded, markError } = usePerformanceMonitor('AnalyticsTab')

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
              <span className="text-sm text-foreground">Emotion vs Outcome Correlation Charts</span>
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

  // State declarations
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<EmotionLog[]>([])
  const [trades, setTrades] = useState<Trade[]>([])
  const [comprehensiveBets, setComprehensiveBets] = useState<ComprehensiveBet[]>([])
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("performance")

  // Load data on mount - only run once
  useEffect(() => {
    let cancelled = false

    const loadData = async () => {
      try {
        setLoading(true)

        // Check authentication status first
        const { data: { session } } = await supabase.auth.getSession()

        if (!session || cancelled) {
          setLogs([])
          setTrades([])
          setLoading(false)
          return
        }

        const startTime = performance.now()
        
        // Load data in parallel to improve performance
        const [emotionLogsResult, betAnalysesResult, tradesData, comprehensiveBetsData] = await Promise.allSettled([
          storage.getEmotionLogs().catch(err => {
            console.error('Error loading emotion logs:', err)
            return [] as EmotionLog[]
          }),
          storage.getBetAnalyses().catch(err => {
            console.error('Error loading bet analyses:', err)
            return [] as BetAnalysis[]
          }),
          storage.getTrades().catch(err => {
            console.error('Error loading trades data:', err)
            return [] as Trade[]
          }),
          storage.getComprehensiveBets().catch(err => {
            console.error('Error loading comprehensive bets:', err)
            return [] as ComprehensiveBet[]
          })
        ])
        
        const emotionLogs = emotionLogsResult.status === 'fulfilled' ? emotionLogsResult.value : []
        const betAnalyses = betAnalysesResult.status === 'fulfilled' ? betAnalysesResult.value : []
        const trades = tradesData.status === 'fulfilled' ? tradesData.value : []
        const comprehensiveBets = comprehensiveBetsData.status === 'fulfilled' ? comprehensiveBetsData.value : []
        
        const loadTime = performance.now() - startTime
        
        if (cancelled) return

        // Process bet analyses to trades
        const performanceTradesFromAnalyses: Trade[] = betAnalyses.slice(0, 100).map((analysis: BetAnalysis) => ({
          id: analysis.id,
          timestamp: analysis.timestamp,
          title: analysis.description || 'Unknown Bet',
          sport: analysis.sport,
          betType: analysis.betType === 'straight' ? 'moneyline' as const : analysis.betType,
          stake: analysis.stake,
          odds: analysis.odds,
          actualReturn: analysis.actualReturn,
          outcome: analysis.outcome === 'push' ? 'breakeven' : 
                  analysis.outcome === 'win' ? 'profit' : 
                  analysis.outcome === 'loss' ? 'loss' : 
                  analysis.outcome === 'pending' ? undefined :
                  undefined,
          preTradeEmotion: analysis.emotionalState,
          preTradeIntensity: analysis.emotionalIntensity,
          biasesIdentified: analysis.biasWarnings,
          confidenceLevel: analysis.probabilityEstimate ? analysis.probabilityEstimate * 100 : 50,
          reasoning: analysis.aiRecommendation || '',
        }))

        // Process comprehensive bets to trades
        const performanceTradesFromComprehensive: Trade[] = comprehensiveBets.slice(0, 100).map((bet: ComprehensiveBet) => ({
          id: bet.id,
          timestamp: bet.timestamp,
          title: `${bet.awayTeam} vs ${bet.homeTeam} - ${bet.betType}`,
          sport: bet.sport,
          betType: bet.betType,
          stake: bet.stake,
          odds: bet.odds,
          actualReturn: bet.actualReturn || 0,
          outcome: bet.outcome === 'push' ? 'breakeven' : 
                  bet.outcome === 'win' ? 'profit' : 
                  bet.outcome === 'loss' ? 'loss' : 
                  bet.outcome === 'pending' ? undefined :
                  undefined,
          preTradeEmotion: bet.emotions.before.emotion,
          preTradeIntensity: bet.emotions.before.intensity,
          biasesIdentified: bet.biasesIdentified,
          confidenceLevel: bet.confidenceLevel,
          reasoning: bet.reasoning || '',
        }))

        // Combine all trades, prioritizing bet analyses and removing duplicates by ID
        const allTrades = [...performanceTradesFromAnalyses]
        comprehensiveBets.forEach(bet => {
          if (!allTrades.find(trade => trade.id === bet.id)) {
            const comprehensiveTrade = performanceTradesFromComprehensive.find(trade => trade.id === bet.id)
            if (comprehensiveTrade) {
              allTrades.push(comprehensiveTrade)
            }
          }
        })

        // Sort by timestamp (newest first) and limit to 100
        const performanceTrades = allTrades
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 100)

        // Update state
        setLogs(emotionLogs)
        setTrades(performanceTrades)
        setComprehensiveBets(comprehensiveBets)
        markDataLoaded(emotionLogs.length + performanceTrades.length + comprehensiveBets.length)
        
      } catch (error) {
        if (cancelled) return
        console.error('Error loading analytics data:', error)
        const errorMessage = error instanceof Error ? error.message : 'Failed to load analytics data'
        setError(errorMessage)
        markError(errorMessage)
        setLogs([])
        setTrades([])
        setComprehensiveBets([])
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, []) // Empty dependency array - only run once on mount

  // Listen for betting data updates from emotion check-ins
  useEffect(() => {
    const handleBettingDataSaved = () => {
      console.log('🔄 Betting data saved, automatically refreshing analytics...')
      refreshData()
    }

    analyticsEvents.on(ANALYTICS_EVENTS.BETTING_DATA_SAVED, handleBettingDataSaved)

    return () => {
      analyticsEvents.off(ANALYTICS_EVENTS.BETTING_DATA_SAVED, handleBettingDataSaved)
    }
  }, [])

  // Simple refresh function for PerformanceTab
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const refreshData = async () => {
    try {
      setIsRefreshing(true)
      console.log('🔄 Refreshing analytics data...')
      
      // Load only bet analyses and comprehensive bets data in parallel for refresh
      const [betAnalysesResult, comprehensiveBetsResult] = await Promise.allSettled([
        storage.getBetAnalyses().catch(err => {
          console.error('Error loading bet analyses:', err)
          return [] as BetAnalysis[]
        }),
        storage.getComprehensiveBets().catch(err => {
          console.error('Error loading comprehensive bets:', err)
          return [] as ComprehensiveBet[]
        })
      ])
      
      const betAnalyses = betAnalysesResult.status === 'fulfilled' ? betAnalysesResult.value : []
      const comprehensiveBets = comprehensiveBetsResult.status === 'fulfilled' ? comprehensiveBetsResult.value : []
      console.log('🔄 Bet analyses refreshed:', betAnalyses.length)
      console.log('🔄 Comprehensive bets refreshed:', comprehensiveBets.length)
      
      // Debug: Log sample data
      const settledBets = betAnalyses.filter(bet => bet.outcome !== 'pending')
      console.log('🔄 Settled bets found:', settledBets.length)
      if (settledBets.length > 0) {
        console.log('🔄 Sample settled bet:', settledBets[0])
      }

      // Process bet analyses to trades
      const performanceTradesFromAnalyses: Trade[] = betAnalyses.slice(0, 100).map((analysis: BetAnalysis) => ({
        id: analysis.id,
        timestamp: analysis.timestamp,
        title: analysis.description || 'Unknown Bet',
        sport: analysis.sport,
        betType: analysis.betType === 'straight' ? 'moneyline' as const : analysis.betType,
        stake: analysis.stake,
        odds: analysis.odds,
        actualReturn: analysis.actualReturn,
        outcome: analysis.outcome === 'push' ? 'breakeven' : 
                analysis.outcome === 'win' ? 'profit' : 
                analysis.outcome === 'loss' ? 'loss' : 
                analysis.outcome === 'pending' ? undefined :
                undefined,
        preTradeEmotion: analysis.emotionalState,
        preTradeIntensity: analysis.emotionalIntensity,
        biasesIdentified: analysis.biasWarnings,
        confidenceLevel: analysis.probabilityEstimate ? analysis.probabilityEstimate * 100 : 50,
        reasoning: analysis.aiRecommendation || '',
      }))

      // Process comprehensive bets to trades
      const performanceTradesFromComprehensive: Trade[] = comprehensiveBets.slice(0, 100).map((bet: ComprehensiveBet) => ({
        id: bet.id,
        timestamp: bet.timestamp,
        title: `${bet.awayTeam} vs ${bet.homeTeam} - ${bet.betType}`,
        sport: bet.sport,
        betType: bet.betType,
        stake: bet.stake,
        odds: bet.odds,
        actualReturn: bet.actualReturn || 0,
        outcome: bet.outcome === 'push' ? 'breakeven' : 
                bet.outcome === 'win' ? 'profit' : 
                bet.outcome === 'loss' ? 'loss' : 
                bet.outcome === 'pending' ? undefined :
                undefined,
        preTradeEmotion: bet.emotions.before.emotion,
        preTradeIntensity: bet.emotions.before.intensity,
        biasesIdentified: bet.biasesIdentified,
        confidenceLevel: bet.confidenceLevel,
        reasoning: bet.reasoning || '',
      }))

      // Combine all trades, prioritizing bet analyses and removing duplicates by ID
      const allTrades = [...performanceTradesFromAnalyses]
      comprehensiveBets.forEach(bet => {
        if (!allTrades.find(trade => trade.id === bet.id)) {
          const comprehensiveTrade = performanceTradesFromComprehensive.find(trade => trade.id === bet.id)
          if (comprehensiveTrade) {
            allTrades.push(comprehensiveTrade)
          }
        }
      })

      // Sort by timestamp (newest first) and limit to 100
      const performanceTrades = allTrades
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 100)

      // Debug: Log final trades data
      const completedTrades = performanceTrades.filter(t => t.outcome && t.actualReturn != null)
      console.log('🔄 Final performance trades:', performanceTrades.length)
      console.log('🔄 Completed trades with actual returns:', completedTrades.length)
      if (completedTrades.length > 0) {
        console.log('🔄 Sample completed trade:', completedTrades[0])
      }

      // Update only the trades data (keep emotion logs the same)
      setTrades(performanceTrades)
      setComprehensiveBets(comprehensiveBets)
      markDataLoaded(logs.length + performanceTrades.length)
      
    } catch (error) {
      console.error('Error refreshing data:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

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
          variant={activeSubTab === "mental-health" ? "default" : "outline"}
          onClick={() => setActiveSubTab("mental-health")}
          className="gap-2"
        >
          <Brain className="h-4 w-4" />
          Mental Health
        </Button>
        <Button
          variant={activeSubTab === "correlation" ? "default" : "outline"}
          onClick={() => setActiveSubTab("correlation")}
          className="gap-2"
        >
          <Activity className="h-4 w-4" />
          Emotion Correlation
        </Button>
      </div>

      {/* Tab Content */}
      {activeSubTab === "performance" && (
        <PerformanceTab trades={trades} onRefreshData={refreshData} isRefreshing={isRefreshing} />
      )}

      {activeSubTab === "mental-health" && (
        <MentalHealthTab emotionLogs={logs} />
      )}

      {activeSubTab === "correlation" && (
        <CorrelationTab emotionLogs={logs} trades={trades} />
      )}
    </div>
  )
}

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
            onClick={() => window.location.href = "/pricing"}
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

  // Read subtab from URL path
  useEffect(() => {
    const path = window.location.pathname
    const pathSegments = path.split('/').filter(Boolean)
    
    // Check if we have a subtab in the path (e.g., /analytics/correlation)
    if (pathSegments.length >= 2) {
      const potentialSubtab = pathSegments[1] as SubTab
      if (["correlation", "performance", "mental-health"].includes(potentialSubtab)) {
        setActiveSubTab(potentialSubtab)
      }
    }
  }, [])

  // Helper function to update subtab and URL
  const handleSubTabChange = (subtab: SubTab) => {
    setActiveSubTab(subtab)
    window.history.replaceState(null, '', `/analytics/${subtab}`)
  }

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
        const betAnalyses = betAnalysesResult.status === 'fulfilled' ? betAnalysesResult.value.slice(0, 50) : [] // Reduced from 100
        const trades = tradesData.status === 'fulfilled' ? tradesData.value : []
        const comprehensiveBets = comprehensiveBetsData.status === 'fulfilled' ? comprehensiveBetsData.value.slice(0, 50) : [] // Reduced from 50
        
        const loadTime = performance.now() - startTime
        
        if (cancelled) return

        // Optimized data processing with Map for faster duplicate removal
        const tradesMap = new Map<string, Trade>()
        
        // Process bet analyses to trades (prioritized)
        betAnalyses.forEach((analysis: BetAnalysis) => {
          tradesMap.set(analysis.id, {
            id: analysis.id,
            timestamp: analysis.timestamp,
            title: analysis.description || 'Unknown Bet',
            stake: analysis.stake,
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
          })
        })

        // Add comprehensive bets only if not already present (using Map for O(1) lookup)
        comprehensiveBets.forEach((bet: ComprehensiveBet) => {
          if (!tradesMap.has(bet.id)) {
            tradesMap.set(bet.id, {
              id: bet.id,
              timestamp: bet.timestamp,
              title: `${bet.awayTeam} vs ${bet.homeTeam} - ${bet.betType}`,
              stake: bet.stake,
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
            })
          }
        })

        // Convert Map to array and sort (more efficient than previous approach)
        const performanceTrades = Array.from(tradesMap.values())
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 100) // Final limit to 100

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
      
      const betAnalyses = betAnalysesResult.status === 'fulfilled' ? betAnalysesResult.value.slice(0, 50) : []
      const comprehensiveBets = comprehensiveBetsResult.status === 'fulfilled' ? comprehensiveBetsResult.value.slice(0, 50) : []
      
      // Use same optimized Map approach for refresh
      const tradesMap = new Map<string, Trade>()
      
      betAnalyses.forEach((analysis: BetAnalysis) => {
        tradesMap.set(analysis.id, {
          id: analysis.id,
          timestamp: analysis.timestamp,
          title: analysis.description || 'Unknown Bet',
          stake: analysis.stake,
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
        })
      })

      comprehensiveBets.forEach((bet: ComprehensiveBet) => {
        if (!tradesMap.has(bet.id)) {
          tradesMap.set(bet.id, {
            id: bet.id,
            timestamp: bet.timestamp,
            title: `${bet.awayTeam} vs ${bet.homeTeam} - ${bet.betType}`,
            stake: bet.stake,
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
          })
        }
      })

      const performanceTrades = Array.from(tradesMap.values())
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 100)

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
          onClick={() => handleSubTabChange("performance")}
          className="gap-2"
        >
          <TrendingUp className="h-4 w-4" />
          Performance
        </Button>
        <Button
          variant={activeSubTab === "mental-health" ? "default" : "outline"}
          onClick={() => handleSubTabChange("mental-health")}
          className="gap-2"
        >
          <Brain className="h-4 w-4" />
          Mental Health
        </Button>
        <Button
          variant={activeSubTab === "correlation" ? "default" : "outline"}
          onClick={() => handleSubTabChange("correlation")}
          className="gap-2"
        >
          <Activity className="h-4 w-4" />
          Correlation
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

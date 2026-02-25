"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { storageHybrid as storage } from "@/lib/storage-hybrid"
import type { EmotionLog, Trade, UserData, BetAnalysis } from "@/lib/types"
import type { ComprehensiveBet } from "@/lib/types/bet-tracking"
import type { Parlay } from "@/lib/types/ai-models"
import { Lock, Crown, Activity, TrendingUp, Brain, CheckCircle2 } from "lucide-react"
import { analyticsEvents, ANALYTICS_EVENTS } from "@/lib/events"
import { canAccessFeature } from "@/lib/subscription-tiers"
import { CorrelationTab } from "@/components/analytics/CorrelationTab"
import { PerformanceTab } from "@/components/analytics/PerformanceTab"
import { MentalHealthTab } from "@/components/analytics/MentalHealthTab"
import { usePerformanceMonitor } from "@/lib/use-performance-monitor"
import { reconcileAllData } from "@/lib/services/data-reconciliation-service"

interface AnalyticsTabProps {
  userData: UserData
  onNavigateToTab?: (tab: string) => void
}

type SubTab = "correlation" | "performance" | "mental-health"

export function AnalyticsTab({ userData, onNavigateToTab }: AnalyticsTabProps) {
  // Memoize hasAccess to prevent unnecessary re-renders
  const hasAccess = useMemo(
    () => canAccessFeature(userData.subscriptionTier || "free", "premium"),
    [userData.subscriptionTier]
  )
  const { markDataLoaded, markError } = usePerformanceMonitor('AnalyticsTab')

  const hasReadUrl = useRef(false)

  // State declarations (Must be at top level)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<EmotionLog[]>([])
  const [trades, setTrades] = useState<Trade[]>([])
  const [comprehensiveBets, setComprehensiveBets] = useState<ComprehensiveBet[]>([])
  const [parlays, setParlays] = useState<Parlay[]>([])
  const router = useRouter()
  const pathname = usePathname()

  // Get active subtab from URL pathname
  const subTabFromPathname = (): SubTab => {
    if (pathname === '/analytics/performance') return 'performance'
    if (pathname === '/analytics/mentalhealth') return 'mental-health'
    if (pathname === '/analytics/correlation') return 'correlation'
    return 'performance' // default
  }

  // Local state for instant UI response; synced with pathname once route change lands
  const [localSubTab, setLocalSubTab] = useState<SubTab>(subTabFromPathname())

  useEffect(() => {
    setLocalSubTab(subTabFromPathname())
  }, [pathname])

  const activeSubTab = localSubTab

  const setActiveSubTab = useCallback((tab: SubTab) => {
    setLocalSubTab(tab) // instant UI update
    const routes: Record<SubTab, string> = {
      'performance': '/analytics/performance',
      'mental-health': '/analytics/mentalhealth',
      'correlation': '/analytics/correlation'
    }
    router.push(routes[tab])
  }, [router])
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Comprehensive refresh function for all analytics data
  const refreshData = useCallback(async () => {
    if (!hasAccess) return

    try {
      setIsRefreshing(true)

      const [emotionLogsResult, betAnalysesResult, tradesData, comprehensiveBetsResult, parlaysResult] = await Promise.allSettled([
        storage.getEmotionLogs().catch(err => {
          console.error('Error loading emotion logs:', err)
          return [] as EmotionLog[]
        }),
        storage.getBetAnalyses().catch(err => {
          console.error('Error loading bet analyses:', err)
          return [] as BetAnalysis[]
        }),
        storage.getTrades().catch(err => {
          console.error('Error loading trades:', err)
          return [] as Trade[]
        }),
        storage.getComprehensiveBets().catch(err => {
          console.error('Error loading comprehensive bets:', err)
          return [] as ComprehensiveBet[]
        }),
        storage.getParlays().catch(err => {
          console.error('Error loading parlays:', err)
          return [] as Parlay[]
        })
      ])

      const emotionLogs = emotionLogsResult.status === 'fulfilled' ? emotionLogsResult.value : []
      const betAnalyses = betAnalysesResult.status === 'fulfilled' ? betAnalysesResult.value.slice(0, 50) : []
      const tradesResult = tradesData.status === 'fulfilled' ? tradesData.value : []
      const comprehensiveBets = comprehensiveBetsResult.status === 'fulfilled' ? comprehensiveBetsResult.value.slice(0, 50) : []
      const parlaysData = parlaysResult.status === 'fulfilled' ? parlaysResult.value : []

      const tradesMap = new Map<string, Trade>()

      // Include existing Trade records
      tradesResult.forEach((trade: Trade) => {
        tradesMap.set(trade.id, trade)
      })

      // Overlay BetAnalysis records
      betAnalyses.forEach((analysis: BetAnalysis) => {
        tradesMap.set(analysis.id, {
          id: analysis.id,
          timestamp: analysis.timestamp,
          title: analysis.description || 'Unknown Bet',
          sport: analysis.sport,
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
          betType: analysis.betType,
          isParlay: analysis.betType === 'parlay',
          playerName: (analysis as any).playerName,
        })
      })

      // Overlay ComprehensiveBet records
      comprehensiveBets.forEach((bet: ComprehensiveBet) => {
        if (!tradesMap.has(bet.id)) {
          tradesMap.set(bet.id, {
            id: bet.id,
            timestamp: bet.timestamp,
            title: bet.description || `${bet.awayTeam} vs ${bet.homeTeam} - ${bet.betType}`,
            sport: bet.sport,
            stake: bet.stake,
            actualReturn: bet.actualReturn,
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
            betType: bet.betType,
            isParlay: bet.betType === 'parlay',
            playerName: bet.playerName,
          })
        }
      })

      const performanceTrades = Array.from(tradesMap.values())
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 100)

      setLogs(emotionLogs)
      setTrades(performanceTrades)
      setComprehensiveBets(comprehensiveBets)
      setParlays(parlaysData)
      markDataLoaded(emotionLogs.length + performanceTrades.length + parlaysData.length)

    } catch (error) {
      console.error('Error refreshing data:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [hasAccess, markDataLoaded])

  // Read subtab from URL query parameter (legacy support, redirects to proper route)
  useEffect(() => {
    if (!hasAccess || hasReadUrl.current) return
    hasReadUrl.current = true

    const params = new URLSearchParams(window.location.search)
    const tab = params.get('tab') as SubTab | null
    if (tab && ["correlation", "performance", "mental-health"].includes(tab)) {
      setActiveSubTab(tab)
    }

  // Load data on mount
  useEffect(() => {
    if (!hasAccess) {
      setLoading(false)
      return
    }

    let cancelled = false

    const loadData = async () => {
      try {
        setLoading(true)

        if (cancelled) return

        const [emotionLogsResult, betAnalysesResult, tradesData, comprehensiveBetsData, parlaysData] = await Promise.allSettled([
          storage.getEmotionLogs().catch(() => [] as EmotionLog[]),
          storage.getBetAnalyses().catch(() => [] as BetAnalysis[]),
          storage.getTrades().catch(() => [] as Trade[]),
          storage.getComprehensiveBets().catch(() => [] as ComprehensiveBet[]),
          storage.getParlays().catch(() => [] as Parlay[])
        ])

        const emotionLogs = emotionLogsResult.status === 'fulfilled' ? emotionLogsResult.value : []
        const betAnalyses = betAnalysesResult.status === 'fulfilled' ? betAnalysesResult.value.slice(0, 50) : []
        const tradesResult = tradesData.status === 'fulfilled' ? tradesData.value : []
        const comprehensiveBets = comprehensiveBetsData.status === 'fulfilled' ? comprehensiveBetsData.value.slice(0, 50) : []
        const parlaysLoaded = parlaysData.status === 'fulfilled' ? parlaysData.value : []

        if (cancelled) return

        const tradesMap = new Map<string, Trade>()

        // Include existing Trade records (from trades table)
        tradesResult.forEach((trade: Trade) => {
          tradesMap.set(trade.id, trade)
        })

        // Overlay BetAnalysis records (richer data takes priority)
        betAnalyses.forEach((analysis: BetAnalysis) => {
          tradesMap.set(analysis.id, {
            id: analysis.id,
            timestamp: analysis.timestamp,
            title: analysis.description || 'Unknown Bet',
            sport: analysis.sport,
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
            betType: analysis.betType,
            isParlay: analysis.betType === 'parlay',
            playerName: (analysis as any).playerName,
          })
        })

        // Overlay ComprehensiveBet records (only if not already present from bet analyses)
        comprehensiveBets.forEach((bet: ComprehensiveBet) => {
          if (!tradesMap.has(bet.id)) {
            tradesMap.set(bet.id, {
              id: bet.id,
              timestamp: bet.timestamp,
              title: bet.description || `${bet.awayTeam} vs ${bet.homeTeam} - ${bet.betType}`,
              sport: bet.sport,
              stake: bet.stake,
              actualReturn: bet.actualReturn,
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
              betType: bet.betType,
              isParlay: bet.betType === 'parlay',
              playerName: bet.playerName,
            })
          }
        })

        const performanceTrades = Array.from(tradesMap.values())
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 100)

        setLogs(emotionLogs)
        setTrades(performanceTrades)
        setComprehensiveBets(comprehensiveBets)
        setParlays(parlaysLoaded)
        markDataLoaded(emotionLogs.length + performanceTrades.length + comprehensiveBets.length + parlaysLoaded.length)

      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load analytics data')
        markError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    // Safety timeout to prevent permanent loading state
    const safetyTimeout = setTimeout(() => {
      if (!cancelled) {
        console.warn('Analytics data load timed out after 8s, showing available data')
        setLoading(false)
      }
    }, 8000)

    loadData().finally(() => clearTimeout(safetyTimeout))
    return () => { cancelled = true; clearTimeout(safetyTimeout) }
  }, [hasAccess, markDataLoaded, markError])

  // Listen for betting data and emotion logging updates
  useEffect(() => {
    if (!hasAccess) return
    const handleDataUpdate = () => refreshData()
    analyticsEvents.on(ANALYTICS_EVENTS.BETTING_DATA_SAVED, handleDataUpdate)
    analyticsEvents.on(ANALYTICS_EVENTS.EMOTION_LOGGED, handleDataUpdate)
    return () => {
      analyticsEvents.off(ANALYTICS_EVENTS.BETTING_DATA_SAVED, handleDataUpdate)
      analyticsEvents.off(ANALYTICS_EVENTS.EMOTION_LOGGED, handleDataUpdate)
    }
  }, [hasAccess, refreshData])

  // Automatically reconcile any missing data on analytics page load
  // This catches any data that may have been saved to localStorage but not synced
  useEffect(() => {
    if (!hasAccess || loading) return

    // Run reconciliation in background after initial data load
    const runReconciliation = async () => {
      try {
        const result = await reconcileAllData()
        const total = result.emotionLogsReconciled + result.betAnalysesReconciled +
          result.comprehensiveBetsReconciled + result.tradesReconciled

        if (total > 0) {
          console.log(`[Analytics] Auto-reconciled ${total} missing records`)
        }
      } catch (error) {
        console.warn('[Analytics] Reconciliation error:', error)
      }
    }

    // Small delay to ensure initial load completes first
    const timeoutId = setTimeout(runReconciliation, 2000)

    return () => clearTimeout(timeoutId)
  }, [hasAccess, loading])


  // Render paywall if no access
  if (!hasAccess) {
    return (
      <div className="space-y-6 fade-in">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-foreground">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Advanced analytics and performance tracking</p>
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
              <span className="text-sm text-foreground">ROI Tracking & Performance Metrics</span>
            </div>
          </div>
          <Button size="lg" className="gap-2" onClick={() => router.push("/pricing")}>
            <Crown className="h-5 w-5" />
            Upgrade to Premium
          </Button>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6 fade-in text-center">
        <h2 className="text-3xl font-bold text-foreground">Analytics Dashboard</h2>
        <Card className="p-8"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div></Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6 fade-in text-center">
        <h2 className="text-3xl font-bold text-foreground">Analytics Dashboard</h2>
        <p className="text-destructive">Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-foreground">Analytics Dashboard</h2>
        <p className="text-muted-foreground">Advanced insights into your betting and emotional patterns</p>
      </div>

      <div className="flex flex-wrap gap-2 justify-center px-2">
        <Button variant={activeSubTab === "performance" ? "default" : "outline"} onClick={() => setActiveSubTab("performance")} className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 min-h-[44px]">
          <TrendingUp className="h-4 w-4" /> <span className="hidden sm:inline">Performance</span><span className="sm:hidden">Perf</span>
        </Button>
        <Button variant={activeSubTab === "mental-health" ? "default" : "outline"} onClick={() => setActiveSubTab("mental-health")} className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 min-h-[44px]">
          <Brain className="h-4 w-4" /> <span className="hidden sm:inline">Mental Health</span><span className="sm:hidden">Mental</span>
        </Button>
        <Button variant={activeSubTab === "correlation" ? "default" : "outline"} onClick={() => setActiveSubTab("correlation")} className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 min-h-[44px]">
          <Activity className="h-4 w-4" /> <span className="hidden sm:inline">Correlation</span><span className="sm:hidden">Corr</span>
        </Button>
      </div>

      {activeSubTab === "performance" && <PerformanceTab trades={trades} comprehensiveBets={comprehensiveBets} parlays={parlays} onRefreshData={refreshData} isRefreshing={isRefreshing} />}
      {activeSubTab === "mental-health" && <MentalHealthTab emotionLogs={logs} comprehensiveBets={comprehensiveBets} userData={userData} />}
      {activeSubTab === "correlation" && <CorrelationTab emotionLogs={logs} trades={trades} parlays={parlays} comprehensiveBets={comprehensiveBets} />}
    </div>
  )
}

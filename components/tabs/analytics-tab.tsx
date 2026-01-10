"use client"

import { useEffect, useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { storageHybrid as storage } from "@/lib/storage-hybrid"
import type { EmotionLog, Trade, UserData, BetAnalysis, GameLineRecord, AIServiceUsage } from "@/lib/types"
import type { ComprehensiveBet, BetPerformanceMetrics } from "@/lib/types/bet-tracking"
import { calculateEmotionalStability } from "@/lib/emotional-scoring"
import { calculateBetMetrics } from "@/lib/bet-tracking-calculations"
import { BetTrackingService } from "@/lib/bet-tracking-service"
import {
  Activity,
  BarChart3,
  Brain,
  TrendingUp,
  TrendingDown,
  History,
  DollarSign,
  Target,
  Filter,
  Search,
  Calendar,
  Trophy,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Thermometer,
  Smile,
  Frown,
  Meh
} from "lucide-react"
import { EmotionHistory } from "@/components/emotion-history"
import { EmotionInsights } from "@/components/emotion-insights"
import { toast } from "sonner"
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
  Cell,
  ReferenceArea,
  ComposedChart,
  Area,
  PieChart,
  Pie
} from "recharts"
import { BetOutcomeUpdate } from "@/components/bet-outcome-update"

// Extracted types, constants, and utilities
import type { UnifiedBet, TimelineItem, EmotionOutcomePoint, DailyBucket } from "@/components/analytics/types"
import { EMOTION_SCORE_LOOKUP, AVAILABLE_SPORTS } from "@/components/analytics/constants"
import { calculateWinReturn, calculateBettingMetrics } from "@/components/analytics/utils/calculations"
import { canAccessFeature } from "@/lib/subscription-tiers"
import { Lock, Crown } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface AnalyticsTabProps {
  userData: UserData
  onNavigateToTab?: (tab: string) => void
}

export function AnalyticsTab({ userData, onNavigateToTab }: AnalyticsTabProps) {
  console.log('🔥 AnalyticsTab component rendered - this should always appear')
  const hasAccess = canAccessFeature(userData.subscriptionTier || "free", "premium")
  
  // State declarations
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<EmotionLog[]>([])
  const [trades, setTrades] = useState<Trade[]>([])
  const [analyses, setAnalyses] = useState<BetAnalysis[]>([])
  const [gameLines, setGameLines] = useState<GameLineRecord[]>([])
  const [aiUsage, setAiUsage] = useState<AIServiceUsage[]>([])
  const [comprehensiveBets, setComprehensiveBets] = useState<ComprehensiveBet[]>([])
  const [comprehensiveBetMetrics, setComprehensiveBetMetrics] = useState<BetPerformanceMetrics | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterOutcome, setFilterOutcome] = useState<string>("all")
  const [filterSport, setFilterSport] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("date")
  const [filteredAnalyses, setFilteredAnalyses] = useState<UnifiedBet[]>([])
  const [showUsageEvents, setShowUsageEvents] = useState(true)
  const [showGameLineEvents, setShowGameLineEvents] = useState(true)
  const [showOutcomeUpdate, setShowOutcomeUpdate] = useState(false)
  const [selectedBet, setSelectedBet] = useState<UnifiedBet | null>(null)
  const [updatingOutcome, setUpdatingOutcome] = useState(false)
  const [activeSubTab, setActiveSubTab] = useState<"correlation" | "performance" | "mental-health">("correlation")
  
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

  const [showEmotionLine, setShowEmotionLine] = useState(true)
  const [showOutcomeLine, setShowOutcomeLine] = useState(true)
  const [showActivityLine, setShowActivityLine] = useState(true)
  const [showEvLine, setShowEvLine] = useState(true)
  const [showMentalHealthLine, setShowMentalHealthLine] = useState(true)

  // Outcome update modal state
  const [betToUpdate, setBetToUpdate] = useState<ComprehensiveBet | null>(null)

  // Bulk edit states
  const [bulkEditMode, setBulkEditMode] = useState(false)
  const [selectedBetIds, setSelectedBetIds] = useState<Set<string>>(new Set())
  const [bulkStakeValue, setBulkStakeValue] = useState("")

  // Date range for analytics
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Default: 90 days ago
    end: new Date()
  })

  // Filter data by date range
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const logDate = new Date(log.timestamp)
      return logDate >= dateRange.start && logDate <= dateRange.end
    })
  }, [logs, dateRange])

  const filteredTrades = useMemo(() => {
    return trades.filter(trade => {
      const tradeDate = new Date(trade.timestamp)
      return tradeDate >= dateRange.start && tradeDate <= dateRange.end
    })
  }, [trades, dateRange])

  const filteredComprehensiveBets = useMemo(() => {
    return comprehensiveBets.filter(bet => {
      const betDate = new Date(bet.timestamp)
      return betDate >= dateRange.start && betDate <= dateRange.end
    })
  }, [comprehensiveBets, dateRange])

  // Load data effect
  useEffect(() => {
    let cancelled = false

    const load = async () => {
      console.log('🚀 LOAD FUNCTION CALLED - This should always appear')
      try {
        console.log('📊 Starting analytics data load...')

        // Load data directly from localStorage for development to avoid timeouts
        const emotionLogs = JSON.parse(localStorage.getItem('serenity_emotion_logs') || '[]')
        const tradeData = JSON.parse(localStorage.getItem('serenity_trades') || '[]')
        const betAnalyses = JSON.parse(localStorage.getItem('serenity_bet_analyses') || '[]')
        const gameLineData = JSON.parse(localStorage.getItem('serenity_game_lines') || '[]')
        const usage = JSON.parse(localStorage.getItem('serenity_ai_service_usage') || '[]')
        const comprehensiveBetsData = JSON.parse(localStorage.getItem('serenity_comprehensive_bets') || '[]')

        // Also load emotions directly from Supabase to get all emotions
        console.log('🧪 Testing Supabase connection...')
        
        // Check if Supabase is properly initialized
        if (!supabase) {
          console.log('❌ Supabase is not initialized')
          setLogs(emotionLogs || [])
          return
        }
        
        try {
          console.log('🔄 Loading emotions from Supabase (primary source)...')
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
          
          console.log('🧪 Supabase query result:', { data: supabaseEmotions?.length, error })
          
          if (!error && supabaseEmotions) {
            console.log('✅ Successfully loaded emotions from Supabase:', {
              total: supabaseEmotions.length,
              uniqueEmotions: [...new Set(supabaseEmotions.map(e => e.emotion))].length,
              emotions: [...new Set(supabaseEmotions.map(e => e.emotion))].sort(),
              phases: [...new Set(supabaseEmotions.map(e => e.phase))].sort(),
              withTradeIds: supabaseEmotions.filter(e => e.trade_id).length,
              withTrades: supabaseEmotions.filter(e => e.trades && e.trades.length > 0).length,
              profitableTrades: supabaseEmotions.filter(e => e.trades && e.trades.length > 0 && e.trades[0]?.outcome === 'profit').length
            })
            
            // Map Supabase data to EmotionLog type
            const mappedEmotions: EmotionLog[] = supabaseEmotions.map((emotion: any) => ({
              id: emotion.id || `supabase-${emotion.timestamp}`,
              timestamp: new Date(emotion.timestamp),
              emotion: emotion.emotion,
              intensity: 5, // Default intensity since not in Supabase
              context: 'betting', // Default context since not in Supabase
              phase: emotion.phase,
              tradeId: emotion.trade_id
            }))
            
            // Use Supabase emotions as primary source
            setLogs(mappedEmotions)
            console.log('📊 Analytics will use Supabase emotions as primary data source')
          } else {
            console.log('❌ Could not load emotions from Supabase, falling back to localStorage:', error)
            console.log('📊 Analytics will use localStorage emotions as fallback')
            setLogs(emotionLogs || [])
          }
        } catch (supabaseError) {
          console.log('❌ Supabase emotion loading failed, falling back to localStorage:', supabaseError)
          console.log('📊 Analytics will use localStorage emotions as fallback')
          setLogs(emotionLogs || [])
        }

        console.log('📊 Analytics data loaded:', {
          emotionLogs: emotionLogs.length,
          trades: tradeData.length,
          betAnalyses: betAnalyses.length,
          gameLines: gameLineData.length,
          aiUsage: usage.length,
          comprehensiveBets: comprehensiveBetsData.length
        })

        setTrades(tradeData || [])
        setAnalyses(betAnalyses || [])
        setGameLines(gameLineData || [])
        setAiUsage(usage || [])
        setComprehensiveBets(comprehensiveBetsData || [])

        // Calculate comprehensive bet metrics with error handling
        if (comprehensiveBetsData && comprehensiveBetsData.length > 0) {
          try {
            const metrics = calculateBetMetrics(comprehensiveBetsData)
            if (!cancelled) {
              setComprehensiveBetMetrics(metrics)
            }
          } catch (metricsError) {
            console.error('Error calculating bet metrics:', metricsError)
            if (!cancelled) {
              setComprehensiveBetMetrics(null)
            }
          }
        }
      } catch (error) {
        if (cancelled) return
        console.error('Error loading analytics data:', error)
        setError(error instanceof Error ? error.message : 'Failed to load analytics data')
        // Set empty data to prevent crashes
        setLogs([])
        setTrades([])
        setAnalyses([])
        setGameLines([])
        setAiUsage([])
        setComprehensiveBets([])
        setComprehensiveBetMetrics(null)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()

    // Cleanup function to prevent errors after unmount
    return () => {
      cancelled = true
    }
  }, [])

  // Unified bets calculation
  const unifiedBets: UnifiedBet[] = useMemo(() => {
    if (!analyses?.length && !trades?.length) return []
    
    const analysisItems: UnifiedBet[] = (analyses || []).map((a) => ({
      ...(a as BetAnalysis),
      source: "analysis" as const,
    }))

    const tradeItems: UnifiedBet[] = (trades || []).map((t) => {
      // Map Trade outcome schema to BetAnalysis outcome schema
      const mappedOutcome: BetAnalysis["outcome"] =
        t.outcome === "profit"
          ? "win"
          : t.outcome === "loss"
            ? "loss"
            : t.outcome === "breakeven"
              ? "push"
              : "pending"

      let actualReturn: number | undefined = t.actualReturn
      if (actualReturn === undefined && t.stake && t.odds && t.outcome) {
        if (t.outcome === "profit") {
          actualReturn = calculateWinReturn(t.stake, t.odds)
        } else if (t.outcome === "loss") {
          actualReturn = 0
        } else if (t.outcome === "breakeven") {
          actualReturn = t.stake
        }
      }

      // BetAnalysis uses 0-10 scale; Trade uses 1-5. Convert.
      const intensity10 = Number.isFinite(t.preTradeIntensity)
        ? Math.max(0, Math.min(10, Math.round(((t.preTradeIntensity || 0) / 5) * 10)))
        : 0

      return {
        id: `trade-${t.id}`,
        timestamp: t.timestamp,
        sport: t.sport || "Unknown",
        betType: t.betType || "moneyline", // Use actual bet type or default to moneyline
        stake: t.stake || 0,
        odds: t.odds || 0,
        outcome: mappedOutcome,
        actualReturn: actualReturn,
        confidenceLevel: t.confidenceLevel || 0,
        reasoning: t.reasoning || "",
        emotionalState: t.preTradeEmotion || "",
        emotionalIntensity: t.preTradeIntensity || 0,
        biasesIdentified: t.biasesIdentified || [],
        expectedValue: undefined,
        description: t.reasoning || "",
        biasWarnings: t.biasesIdentified || [],
        source: "trade" as const,
      }
    })

    // Merge and deduplicate by ID
    const betMap = new Map<string, UnifiedBet>()
    
    // Add analyses first
    analysisItems.forEach(bet => betMap.set(bet.id, bet))
    
    // Add trades, but don't overwrite if analysis with same ID exists
    tradeItems.forEach(bet => {
      if (!betMap.has(bet.id)) {
        betMap.set(bet.id, bet)
      }
    })

    return Array.from(betMap.values()).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [analyses, trades])

  // Function to filter and sort betting history
  const filterAndSortAnalyses = () => {
    let filtered = [...unifiedBets]

    if (searchTerm) {
      filtered = filtered.filter(bet =>
        bet.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bet.sport.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterOutcome !== "all") {
      filtered = filtered.filter(bet => bet.outcome === filterOutcome)
    }

    if (filterSport !== "all") {
      filtered = filtered.filter(bet => {
        if (bet.sport === filterSport) return true

        const selectedSport = AVAILABLE_SPORTS.find(s => s.key === filterSport)
        if (selectedSport && bet.sport === selectedSport.label) return true

        return false
      })
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        case "ev":
          return (b.expectedValue || 0) - (a.expectedValue || 0)
        case "stake":
          return b.stake - a.stake
        default:
          return 0
      }
    })

    setFilteredAnalyses(filtered)
  }

  // Filter and sort betting history when criteria change
  useEffect(() => {
    filterAndSortAnalyses()
  }, [unifiedBets, searchTerm, filterOutcome, filterSport, sortBy])

  // Use comprehensive bet metrics if available, otherwise fall back to legacy calculation
  const bettingMetrics = useMemo(() => {
    if (comprehensiveBetMetrics && comprehensiveBets.length > 0) {
      // Convert comprehensive bet metrics to the format expected by the UI
      return {
        profit: comprehensiveBetMetrics.profitLoss,
        roi: comprehensiveBetMetrics.roi,
        winRate: comprehensiveBetMetrics.winRate,
        totalBets: comprehensiveBetMetrics.totalBets,
        avgEV: comprehensiveBetMetrics.totalBets > 0 ? comprehensiveBetMetrics.expectedValue / comprehensiveBetMetrics.totalBets : 0,
        wins: comprehensiveBetMetrics.wins,
        losses: comprehensiveBetMetrics.losses,
        pushes: comprehensiveBetMetrics.pushes
      }
    }
    return calculateBettingMetrics(unifiedBets)
  }, [comprehensiveBetMetrics, comprehensiveBets, unifiedBets])

  // Calculate weekly profit (last 7 days)
  const weeklyProfit = useMemo(() => {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    const recentBets = unifiedBets.filter(bet => {
      const betDate = new Date(bet.timestamp)
      return betDate >= weekAgo && betDate <= now && bet.outcome && bet.outcome !== 'pending'
    })
    
    return recentBets.reduce((total, bet) => {
      const profit = (bet.actualReturn || 0) - bet.stake
      return total + profit
    }, 0)
  }, [unifiedBets])

  // Calculate daily profit data for the chart
  const dailyProfitData = useMemo(() => {
    const dailyMap = new Map<string, { day: string; profit: number }>()
    
    // Get last 7 days
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const today = new Date()
    
    // Initialize all days with 0 profit
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      const dayIndex = date.getDay()
      dailyMap.set(days[dayIndex], { day: days[dayIndex], profit: 0 })
    }
    
    // Calculate profit for each day
    unifiedBets.forEach(bet => {
      if (bet.outcome && bet.outcome !== 'pending') {
        const betDate = new Date(bet.timestamp)
        const daysDiff = Math.floor((today.getTime() - betDate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysDiff < 7) {
          const dayIndex = betDate.getDay()
          const dayName = days[dayIndex]
          const existing = dailyMap.get(dayName) || { day: dayName, profit: 0 }
          const profit = (bet.actualReturn || 0) - bet.stake
          existing.profit += profit
          dailyMap.set(dayName, existing)
        }
      }
    })
    
    return Array.from(dailyMap.values()).sort((a, b) => {
      const dayOrder = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day)
    })
  }, [unifiedBets])

  // Calculate bet type performance
  const betTypePerformance = useMemo(() => {
    const betTypes = new Map<string, { type: string; wins: number; losses: number; roi: number }>()
    
    // Group bets by type
    unifiedBets.forEach(bet => {
      if (bet.outcome && bet.outcome !== 'pending') {
        const betType = bet.betType || 'moneyline'
        const existing = betTypes.get(betType) || { type: betType, wins: 0, losses: 0, roi: 0 }
        
        if (bet.outcome === 'win') {
          existing.wins++
        } else if (bet.outcome === 'loss') {
          existing.losses++
        }
        
        betTypes.set(betType, existing)
      }
    })
    
    // Calculate ROI for each bet type
    const result = Array.from(betTypes.values()).map(betType => {
      const typeBets = unifiedBets.filter(bet => 
        bet.outcome && bet.outcome !== 'pending' && (bet.betType || 'moneyline') === betType.type
      )
      
      const totalStaked = typeBets.reduce((sum, bet) => sum + bet.stake, 0)
      const totalReturns = typeBets.reduce((sum, bet) => sum + (bet.actualReturn || 0), 0)
      const profit = totalReturns - totalStaked
      const roi = totalStaked > 0 ? (profit / totalStaked) * 100 : 0
      
      return {
        ...betType,
        roi
      }
    })
    
    return result.sort((a, b) => b.roi - a.roi)
  }, [unifiedBets])

  // Mental health calculations
  const mentalHealthData = useMemo(() => {
    if (!filteredLogs.length) return []
    
    // Group logs by date and calculate mental health scores
    const dailyData = new Map<string, number>()
    
    filteredLogs.forEach(log => {
      const date = new Date(log.timestamp).toLocaleDateString()
      const currentScore = dailyData.get(date) || 50 // Default neutral score
      
      // Calculate mental health impact based on emotion and intensity
      let emotionImpact = 0
      const positiveEmotions = ['joy', 'surprise']
      const negativeEmotions = ['anger', 'fear', 'sadness', 'disgust']
      
      if (positiveEmotions.includes(log.emotion)) {
        emotionImpact = log.intensity * 2
      } else if (negativeEmotions.includes(log.emotion)) {
        emotionImpact = -log.intensity * 2
      }
      
      const newScore = Math.max(0, Math.min(100, currentScore + emotionImpact / 10))
      dailyData.set(date, newScore)
    })
    
    return Array.from(dailyData.entries())
      .map(([date, score]) => ({
        date,
        mentalHealthScore: Math.round(score)
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30) // Last 30 days
  }, [filteredLogs])

  const emotionDistribution = useMemo(() => {
    const emotionCounts = filteredLogs.reduce((acc, log) => {
      acc[log.emotion] = (acc[log.emotion] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return Object.entries(emotionCounts).map(([name, value]) => ({
      name,
      value
    }))
  }, [filteredLogs])

  const positiveEmotionPercentage = useMemo(() => {
    if (!filteredLogs.length) return 0
    const positiveEmotions = ['joy', 'surprise']
    const positiveCount = filteredLogs.filter(log => positiveEmotions.includes(log.emotion)).length
    return Math.round((positiveCount / filteredLogs.length) * 100)
  }, [filteredLogs])

  const averageIntensity = useMemo(() => {
    if (!filteredLogs.length) return 0
    const totalIntensity = filteredLogs.reduce((sum, log) => sum + log.intensity, 0)
    return totalIntensity / filteredLogs.length
  }, [filteredLogs])

  const emotionColors: Record<string, string> = {
    joy: '#fbbf24',
    fear: '#a78bfa', 
    anger: '#f87171',
    sadness: '#60a5fa',
    surprise: '#34d399',
    disgust: '#4ade80'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <div className="text-red-500 mb-4">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <div className="text-lg font-medium text-red-500">Error loading analytics</div>
        <div className="text-sm text-muted-foreground mt-2 text-center max-w-md">{error}</div>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline" 
          className="mt-4"
        >
          Reload Page
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <Button
          variant={activeSubTab === "correlation" ? "default" : "ghost"}
          onClick={() => setActiveSubTab("correlation")}
          className="rounded-b-none"
        >
          <Brain className="h-4 w-4 mr-2" />
          Correlation
        </Button>
        <Button
          variant={activeSubTab === "performance" ? "default" : "ghost"}
          onClick={() => setActiveSubTab("performance")}
          className="rounded-b-none"
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Performance
        </Button>
        <Button
          variant={activeSubTab === "mental-health" ? "default" : "ghost"}
          onClick={() => setActiveSubTab("mental-health")}
          className="rounded-b-none"
        >
          <Thermometer className="h-4 w-4 mr-2" />
          Mental Health
        </Button>
      </div>

      {/* Tab 1: Emotion-Outcome Correlation */}
      {activeSubTab === "correlation" && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-foreground">Emotion-Outcome Correlation</h2>
            <p className="text-muted-foreground">
              Discover how your emotional states impact betting performance
            </p>
          </div>

          <EmotionHistory 
            logs={filteredLogs}
            trades={filteredTrades}
          />

          <EmotionInsights 
            logs={filteredLogs}
          />
        </div>
      )}

      {/* Tab 2: Betting Performance */}
      {activeSubTab === "performance" && (
        <div className="space-y-6">
          {/* KPI Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Weekly Profit */}
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Weekly Profit</p>
                  <p className={`text-2xl font-bold ${weeklyProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {weeklyProfit >= 0 ? '+' : ''}${weeklyProfit.toFixed(0)}
                  </p>
                </div>
                <div className="p-2 rounded-full bg-emerald-500/10">
                  <DollarSign className="h-6 w-6 text-emerald-500" />
                </div>
              </div>
            </Card>

            {/* Win Rate */}
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Win Rate</p>
                  <p className="text-2xl font-bold text-blue-500">
                    {bettingMetrics.winRate.toFixed(0)}%
                  </p>
                </div>
                <div className="p-2 rounded-full bg-blue-500/10">
                  <BarChart3 className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </Card>

            {/* Total Bets */}
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Bets</p>
                  <p className="text-2xl font-bold text-purple-500">
                    {bettingMetrics.totalBets}
                  </p>
                </div>
                <div className="p-2 rounded-full bg-purple-500/10">
                  <TrendingUp className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </Card>

            {/* ROI */}
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">ROI</p>
                  <p className={`text-2xl font-bold ${bettingMetrics.roi >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {bettingMetrics.roi.toFixed(1)}%
                  </p>
                </div>
                <div className="p-2 rounded-full bg-amber-500/10">
                  <Activity className="h-6 w-6 text-amber-500" />
                </div>
              </div>
            </Card>
          </div>

          {/* Bottom Row: Daily Profit/Loss Chart and Bet Type Performance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Daily Profit/Loss Chart */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                Daily Profit/Loss
              </h3>
              {dailyProfitData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground italic text-sm">
                  No betting activity in the selected time period.
                </div>
              ) : (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyProfitData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.1)" />
                      <XAxis 
                        dataKey="day" 
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '8px', 
                          border: '1px solid hsl(var(--border))',
                          backgroundColor: 'hsl(var(--background))'
                        }}
                        formatter={(value: any) => [
                          `$${value}`, 
                          'Profit/Loss'
                        ]}
                      />
                      <Bar 
                        dataKey="profit" 
                        radius={[4, 4, 0, 0]}
                      >
                        {dailyProfitData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#10b981' : '#ef4444'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            {/* Bet Type Performance */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-500" />
                Bet Type Performance
              </h3>
              {betTypePerformance.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground italic text-sm">
                  No bet type data available yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {betTypePerformance.map((betType) => (
                    <div key={betType.type} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-medium capitalize">{betType.type}</span>
                          <span className="text-sm text-muted-foreground">
                            {betType.wins}W {betType.losses}L
                          </span>
                        </div>
                        <span className={`text-sm font-bold ${betType.roi >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {betType.roi >= 0 ? '+' : ''}{betType.roi.toFixed(1)}% ROI
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            betType.roi >= 0 ? 'bg-emerald-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(Math.abs(betType.roi) * 2, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Tab 3: Mental Health */}
      {activeSubTab === "mental-health" && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-foreground">Mental Health Tracking</h2>
            <p className="text-muted-foreground">
              Monitor your emotional well-being and betting patterns
            </p>
          </div>

          {/* Mental Health Score Timeline */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Thermometer className="h-5 w-5 text-orange-500" />
              Mental Health Score Timeline
            </h3>
            {filteredLogs.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground italic text-sm">
                No emotion data available yet. Start tracking your emotions to see your mental health trends.
              </div>
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mentalHealthData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.1)" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      domain={[0, 100]}
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '8px', 
                        border: '1px solid hsl(var(--border))',
                        backgroundColor: 'hsl(var(--background))'
                      }}
                      formatter={(value: any) => [`${value}`, 'Mental Health Score']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="mentalHealthScore" 
                      stroke="#f97316" 
                      strokeWidth={2}
                      dot={{ fill: '#f97316', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* Emotion Distribution */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-500" />
              Emotion Distribution
            </h3>
            {emotionDistribution.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground italic text-sm">
                No emotion data available yet.
              </div>
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={emotionDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {emotionDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={emotionColors[entry.name] || '#8884d8'} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* Mental Health Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Smile className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Positive Emotions</p>
                  <p className="text-lg font-semibold text-foreground">{positiveEmotionPercentage}%</p>
                  <p className="text-xs text-muted-foreground">of total emotions</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Meh className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Average Intensity</p>
                  <p className="text-lg font-semibold text-foreground">{averageIntensity.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">out of 10</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Activity className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Check-ins</p>
                  <p className="text-lg font-semibold text-foreground">{filteredLogs.length}</p>
                  <p className="text-xs text-muted-foreground">emotion entries</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Outcome Update Modal */}
      {showOutcomeUpdate && betToUpdate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <BetOutcomeUpdate
              bet={betToUpdate}
              onUpdate={handleOutcomeUpdateComplete}
              onCancel={() => {
                setShowOutcomeUpdate(false)
                setBetToUpdate(null)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )

  function handleOutcomeUpdateComplete(updatedBet: ComprehensiveBet) {
    // Update the comprehensive bets list
    setComprehensiveBets(prev => 
      prev.map(bet => bet.id === updatedBet.id ? updatedBet : bet)
    )
    
    // Recalculate metrics
    const updatedBets = comprehensiveBets.map(bet => 
      bet.id === updatedBet.id ? updatedBet : bet
    )
    const newMetrics = calculateBetMetrics(updatedBets)
    setComprehensiveBetMetrics(newMetrics)
    
    setShowOutcomeUpdate(false)
    setBetToUpdate(null)
  }
}

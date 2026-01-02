"use client"

import { useEffect, useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { storageHybrid as storage } from "@/lib/storage-hybrid"
import type { EmotionLog, Trade, UserData, BetAnalysis, GameLineRecord, AIServiceUsage } from "@/lib/types"
import { calculateEmotionalStability } from "@/lib/emotional-scoring"
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
  Area
} from "recharts"

// Extracted types, constants, and utilities
import type { UnifiedBet, TimelineItem, EmotionOutcomePoint, DailyBucket } from "@/components/analytics/types"
import { EMOTION_SCORE_LOOKUP, AVAILABLE_SPORTS } from "@/components/analytics/constants"
import { calculateWinReturn, calculateBettingMetrics } from "@/components/analytics/utils/calculations"
import { canAccessFeature } from "@/lib/subscription-tiers"
import { Lock, Crown } from "lucide-react"

interface AnalyticsTabProps {
  userData: UserData
  onNavigateToTab?: (tab: string) => void
}

export function AnalyticsTab({ userData, onNavigateToTab }: AnalyticsTabProps) {
  const hasAccess = canAccessFeature(userData.subscriptionTier || "free", "premium")
  
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
  const [activeSubTab, setActiveSubTab] = useState<"correlation" | "performance" | "mental-health">("correlation")
  const [logs, setLogs] = useState<EmotionLog[]>([])
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)

  // Betting history states
  const [analyses, setAnalyses] = useState<BetAnalysis[]>([])
  const [filteredAnalyses, setFilteredAnalyses] = useState<UnifiedBet[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterOutcome, setFilterOutcome] = useState<string>("all")
  const [filterSport, setFilterSport] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [selectedBet, setSelectedBet] = useState<UnifiedBet | null>(null)
  const [gameLines, setGameLines] = useState<GameLineRecord[]>([])
  const [aiUsage, setAiUsage] = useState<AIServiceUsage[]>([])
  const [emotionViewTab, setEmotionViewTab] = useState<"by-bets" | "all-checkins">("by-bets")

  const [showUsageEvents, setShowUsageEvents] = useState(true)
  const [showGameLineEvents, setShowGameLineEvents] = useState(true)

  const [showEmotionLine, setShowEmotionLine] = useState(true)
  const [showOutcomeLine, setShowOutcomeLine] = useState(true)
  const [showActivityLine, setShowActivityLine] = useState(true)
  const [showEvLine, setShowEvLine] = useState(true)
  const [showMentalHealthLine, setShowMentalHealthLine] = useState(true)

  // Bulk edit states
  const [bulkEditMode, setBulkEditMode] = useState(false)
  const [selectedBetIds, setSelectedBetIds] = useState<Set<string>>(new Set())
  const [bulkStakeValue, setBulkStakeValue] = useState("")

  // Date range for emotion vs outcomes graph
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Default: 90 days ago
    end: new Date()
  })

  // Bulk edit handlers
  const toggleBetSelection = (betId: string) => {
    setSelectedBetIds(prev => {
      const next = new Set(prev)
      if (next.has(betId)) {
        next.delete(betId)
      } else {
        next.add(betId)
      }
      return next
    })
  }

  const selectAllZeroStakeBets = () => {
    const zeroStakeBets = analyses.filter(bet => bet.stake === 0 || bet.stake === undefined)
    console.log('Found zero stake bets:', zeroStakeBets.length, 'out of', analyses.length, 'total analyses')
    setSelectedBetIds(new Set(zeroStakeBets.map(bet => bet.id)))
  }

  const handleBulkUpdateStakes = async () => {
    const stakeNum = parseFloat(bulkStakeValue)
    if (isNaN(stakeNum) || stakeNum <= 0) {
      toast.error("Please enter a valid stake amount greater than $0")
      return
    }

    if (selectedBetIds.size === 0) {
      toast.error("Please select at least one bet to update")
      return
    }

    try {
      // Update selected bets
      const updatedAnalyses = analyses.map(bet => {
        if (selectedBetIds.has(bet.id)) {
          return { ...bet, stake: stakeNum }
        }
        return bet
      })

      // Save to storage
      for (const bet of updatedAnalyses) {
        if (selectedBetIds.has(bet.id)) {
          // @ts-ignore - Method added dynamically to storageHybrid
          await storage.updateBetAnalysis(bet)
        }
      }

      setAnalyses(updatedAnalyses)
      setSelectedBetIds(new Set())
      setBulkStakeValue("")
      setBulkEditMode(false)

      toast.success(`Updated stakes for ${selectedBetIds.size} bet(s)`)
    } catch (error) {
      console.error('Error updating stakes:', error)
      toast.error("Failed to update stakes. Please try again.")
    }
  }

  useEffect(() => {
    const load = async () => {
      try {
        const [emotionLogs, tradeData, betAnalyses, gameLineData, usage] = await Promise.all([
          storage.getEmotionLogs(),
          storage.getTrades(),
          // @ts-ignore - Method added dynamically to storageHybrid
          storage.getBetAnalyses().catch(() => []),
          storage.getGameLines().catch(() => [] as GameLineRecord[]),
          // @ts-ignore - Method added dynamically to storageHybrid
          storage.getAIServiceUsage?.().catch(() => [] as AIServiceUsage[]),
        ])
        setLogs(emotionLogs)
        setTrades(tradeData)
        setAnalyses(betAnalyses || [])
        setGameLines(gameLineData || [])
        setAiUsage(usage || [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const unifiedBets: UnifiedBet[] = useMemo(() => {
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

      // BetAnalysis uses 0-10 scale; Trade uses 1-5. Convert.
      const intensity10 = Number.isFinite(t.preTradeIntensity)
        ? Math.max(0, Math.min(10, Math.round(((t.preTradeIntensity || 0) / 5) * 10)))
        : 0

      const description =
        t.title?.trim() ||
        (t.reasoning ? String(t.reasoning).slice(0, 140) : "Emotion-tracked bet")

      // Calculate actual return based on outcome, stake, and odds
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

      return {
        id: `trade:${t.id}`,
        timestamp: new Date(t.timestamp),
        betType: "straight",
        sport: (t.sport as any) || "Unknown",
        description,
        odds: t.odds || 0,
        stake: t.stake || 0,
        emotionalState: t.preTradeEmotion || "",
        emotionalIntensity: intensity10,
        biasWarnings: Array.isArray(t.biasesIdentified) ? t.biasesIdentified : [],
        aiRecommendation: undefined,
        expectedValue: undefined,
        probabilityEstimate: undefined,
        outcome: mappedOutcome,
        actualReturn,
        source: "trade" as const,
      }
    })

    const merged = [...analysisItems, ...tradeItems]
    const map = new Map<string, UnifiedBet>()
    for (const b of merged) {
      // Prefer analysis record if it shares the same id
      const existing = map.get(b.id)
      if (!existing) map.set(b.id, b)
      else if (existing.source === "trade" && b.source === "analysis") map.set(b.id, b)
    }

    return Array.from(map.values()).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [analyses, trades])

  // Filter and sort betting history when criteria change
  useEffect(() => {
    filterAndSortAnalyses()
  }, [unifiedBets, searchTerm, filterOutcome, filterSport, sortBy])

  const totalBets = trades.length
  const wins = trades.filter(t => t.outcome === "profit").length
  const losses = trades.filter(t => t.outcome === "loss").length
  const breakeven = trades.filter(t => t.outcome === "breakeven").length
  const winRate = totalBets ? Math.round((wins / totalBets) * 100) : 0
  const netResult = wins - losses

  // Bridge Graph Data
  const bridgeData = useMemo(() => {
    const dataMap = new Map<string, { date: string; profit: number; mood: number; count: number; triggers: string[] }>()
    
    // Process bets for profit
    unifiedBets.forEach(bet => {
      if (bet.outcome === 'pending') return
      const dateKey = new Date(bet.timestamp).toISOString().split('T')[0]
      const profit = (bet.actualReturn || 0) - bet.stake
      
      // Debug logging
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Bridge Data] Bet: ${bet.description}, Stake: $${bet.stake}, ActualReturn: $${bet.actualReturn || 0}, Profit: $${profit}, Outcome: ${bet.outcome}`)
      }
      
      const existing = dataMap.get(dateKey) || { date: dateKey, profit: 0, mood: 0, count: 0, triggers: [] }
      existing.profit += profit
      dataMap.set(dateKey, existing)
    })

    // Process logs for mood
    logs.forEach(log => {
      const dateKey = new Date(log.timestamp).toISOString().split('T')[0]
      const score = EMOTION_SCORE_LOOKUP[log.emotion.toLowerCase()] || 50
      // Normalize to 1-10
      const moodScore = (score / 10)
      
      const existing = dataMap.get(dateKey) || { date: dateKey, profit: 0, mood: 0, count: 0, triggers: [] }
      existing.mood += moodScore
      existing.count += 1
      
      // Check for triggers
      if (log.intensity >= 4) {
        if (['stressed', 'anxious', 'angry', 'frustrated'].includes(log.emotion.toLowerCase())) {
          existing.triggers.push('😰')
        } else if (['excited', 'euphoric', 'confident', 'happy'].includes(log.emotion.toLowerCase())) {
          existing.triggers.push('🔥')
        }
      }
      dataMap.set(dateKey, existing)
    })

    return Array.from(dataMap.values())
      .map(d => ({
        ...d,
        mood: d.count > 0 ? Number((d.mood / d.count).toFixed(1)) : null,
        displayDate: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30) // Last 30 days
  }, [unifiedBets, logs])

  // Mental Health Tab Data
  const mentalHealthData = useMemo(() => {
    const emotionsByPhase = {
      before: {} as Record<string, number>,
      during: {} as Record<string, number>,
      after: {} as Record<string, number>
    }

    logs.forEach(log => {
      const phase = log.phase || 'before'
      const emotion = log.emotion.toLowerCase()
      emotionsByPhase[phase][emotion] = (emotionsByPhase[phase][emotion] || 0) + 1
    })

    const topPreBetEmotions = Object.entries(emotionsByPhase.before)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }))

    // ROI Correlation for Top Emotion
    const topEmotion = topPreBetEmotions[0]?.name
    let topEmotionROI = 0
    if (topEmotion) {
      const emotionBets = unifiedBets.filter(b => 
        b.outcome !== 'pending' && 
        b.emotionalState?.toLowerCase().includes(topEmotion)
      )
      const totalStaked = emotionBets.reduce((sum, b) => sum + b.stake, 0)
      const totalReturn = emotionBets.reduce((sum, b) => sum + (b.actualReturn || 0), 0)
      topEmotionROI = totalStaked > 0 ? ((totalReturn - totalStaked) / totalStaked) * 100 : 0
    }

    return { emotionsByPhase, topPreBetEmotions, topEmotion, topEmotionROI }
  }, [logs, unifiedBets])

  // Betting history functions

  const handleUpdateOutcome = async (betId: string, outcome: 'win' | 'loss' | 'push') => {
    try {
      // Only update persisted bet analyses (not trade-derived rows)
      const betIndex = analyses.findIndex(bet => bet.id === betId)
      if (betIndex === -1) return

      const bet = analyses[betIndex]
      const actualReturn =
        outcome === 'win' ? calculateWinReturn(bet.stake, bet.odds) :
        outcome === 'push' ? bet.stake :
        0

      const updatedBet: UnifiedBet = {
        ...bet,
        outcome,
        actualReturn,
        source: "analysis"
      }

      const updatedAnalyses = [...analyses]
      updatedAnalyses[betIndex] = updatedBet as any
      setAnalyses(updatedAnalyses)
      setSelectedBet(updatedBet)

      await storage.updateBetAnalysis(updatedBet)

      toast.success('Outcome updated', {
        description: `Bet marked as ${outcome.toUpperCase()} - Return: $${actualReturn.toFixed(2)}`
      })
    } catch (error) {
      console.error('Error updating outcome:', error)
      toast.error('Failed to update outcome')
    }
  }

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

  const unifiedTimelineItems = useMemo((): TimelineItem[] => {
    const items: TimelineItem[] = []

    for (const b of filteredAnalyses) {
      const ts = new Date((b as any).timestamp)
      if (!Number.isNaN(ts.getTime())) {
        items.push({ kind: "bet", ts, bet: b as UnifiedBet })
      }
    }

    const normalizedSearch = String(searchTerm || "").trim().toLowerCase()

    if (showUsageEvents && filterOutcome === "all" && filterSport === "all") {
      for (const u of aiUsage || []) {
        const ts = new Date((u as any).createdAt ?? (u as any).created_at ?? Date.now())
        if (Number.isNaN(ts.getTime())) continue
        if (normalizedSearch) {
          const hay = `${u.serviceType || ""} ${(u as any).tierAtTimeOfUse || ""}`.toLowerCase()
          if (!hay.includes(normalizedSearch)) continue
        }
        items.push({ kind: "ai", ts, usage: u })
      }
    }

    if (showGameLineEvents && filterOutcome === "all") {
      for (const g of gameLines || []) {
        const ts = new Date(
          (g as any).updatedAt ??
            (g as any).updated_at ??
            (g as any).createdAt ??
            (g as any).created_at ??
            (g as any).commenceTime ??
            (g as any).commence_time ??
            Date.now(),
        )
        if (Number.isNaN(ts.getTime())) continue

        if (filterSport !== "all") {
          const selectedSport = AVAILABLE_SPORTS.find((s) => s.key === filterSport)
          const sportMatch =
            (g.sport as any) === filterSport ||
            (selectedSport && (g.sport as any) === selectedSport.label) ||
            (selectedSport && (g as any).sport === selectedSport.key)
          if (!sportMatch) continue
        }

        if (normalizedSearch) {
          const hay = `${g.homeTeam || ""} ${g.awayTeam || ""} ${g.league || ""} ${g.sport || ""}`.toLowerCase()
          if (!hay.includes(normalizedSearch)) continue
        }

        items.push({ kind: "game", ts, game: g })
      }
    }

    return items.sort((a, b) => b.ts.getTime() - a.ts.getTime())
  }, [filteredAnalyses, aiUsage, gameLines, showUsageEvents, showGameLineEvents, filterOutcome, filterSport, searchTerm])

  const bettingMetrics = calculateBettingMetrics(unifiedBets)
  const userSports = Array.from(new Set(unifiedBets.map(bet => bet.sport)))
  const allSportOptions = [
    ...AVAILABLE_SPORTS,
    ...userSports
      .filter(sport => !AVAILABLE_SPORTS.some(s => s.key === sport || s.label === sport))
      .map(sport => ({ key: sport, label: sport }))
  ]

  const emotionOutcomeSeries = useMemo((): EmotionOutcomePoint[] => {
    const MS_DAY = 86_400_000
    const points: EmotionOutcomePoint[] = []

    const toDayKey = (d: Date) => {
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, "0")
      const dd = String(d.getDate()).padStart(2, "0")
      return `${yyyy}-${mm}-${dd}`
    }

    const normalizeEmotionKey = (raw: string) =>
      String(raw || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z\s]/g, "")
        .replace(/\s+/g, " ")

    const getLookupBaseScore = (raw: string): number | undefined => {
      const normalized = normalizeEmotionKey(raw)
      if (!normalized) return undefined

      // Direct match
      const direct = EMOTION_SCORE_LOOKUP[normalized]
      if (typeof direct === "number") return direct

      // If stored as "CATEGORY emotion" or "emotion category" or any multi-word label,
      // try to match any token (prefer the last token).
      const tokens = normalized.split(" ").filter(Boolean)
      if (!tokens.length) return undefined

      for (let i = tokens.length - 1; i >= 0; i--) {
        const t = tokens[i]
        const v = EMOTION_SCORE_LOOKUP[t]
        if (typeof v === "number") return v
      }

      // As a last resort, match if the normalized string contains a lookup key.
      for (const k of Object.keys(EMOTION_SCORE_LOOKUP)) {
        if (normalized.includes(k)) return EMOTION_SCORE_LOOKUP[k]
      }

      return undefined
    }

    const emotionScoreFromLog = (log: EmotionLog): number | undefined => {
      const base = getLookupBaseScore(log.emotion)
      if (typeof base !== "number") return undefined

      const intensity5 = Number.isFinite(log.intensity) ? Number(log.intensity) : 3
      const intensity = Math.max(1, Math.min(5, intensity5))

      // Stable adjustment (keeps lookup as source of truth):
      // Higher intensity amplifies the emotion direction.
      const neutralIntensity = 3
      const step = intensity - neutralIntensity

      const isPositive = base >= 60
      const isVeryNegative = base <= 30

      const adj = isPositive ? step * 3 : isVeryNegative ? step * -3 : step * -1
      return Math.max(0, Math.min(100, Number((base + adj).toFixed(1))))
    }

    const emotionByDay = new Map<string, { sum: number; n: number }>()
    let maxTs = 0

    // Include profile-level recency markers so the chart window can't lag behind
    // if other tables are empty for a period.
    if ((userData as any)?.lastEmotionCheckIn) {
      const t = new Date((userData as any).lastEmotionCheckIn)
      if (!Number.isNaN(t.getTime())) maxTs = Math.max(maxTs, t.getTime())
    }
    if ((userData as any)?.lastRingReset) {
      const t = new Date((userData as any).lastRingReset)
      if (!Number.isNaN(t.getTime())) maxTs = Math.max(maxTs, t.getTime())
    }

    for (const l of logs || []) {
      const t = new Date((l as any).timestamp ?? (l as any).created_at ?? Date.now())
      if (Number.isNaN(t.getTime())) continue
      maxTs = Math.max(maxTs, t.getTime())
      const k = toDayKey(t)
      const s = emotionScoreFromLog(l)
      if (typeof s !== "number") continue
      const agg = emotionByDay.get(k) || { sum: 0, n: 0 }
      agg.sum += s
      agg.n += 1
      emotionByDay.set(k, agg)
    }

    const outcomeByDay = new Map<string, { sum: number; n: number }>()
    const activityByDay = new Map<string, number>()
    const evByDay = new Map<string, { sum: number; n: number }>()
    // Include pending as 0 so the betting line still renders for active betting history.
    for (const b of unifiedBets) {
      const t = new Date((b as any).timestamp)
      if (Number.isNaN(t.getTime())) continue
      maxTs = Math.max(maxTs, t.getTime())
      const k = toDayKey(t)
      const rawOutcome = String((b as any).outcome || "").toLowerCase()
      const v =
        rawOutcome === "win" || rawOutcome === "profit"
          ? 1
          : rawOutcome === "loss"
            ? -1
            : 0
      const agg = outcomeByDay.get(k) || { sum: 0, n: 0 }
      agg.sum += v
      agg.n += 1
      outcomeByDay.set(k, agg)

      activityByDay.set(k, 1)

      if (typeof b.expectedValue === "number" && Number.isFinite(b.expectedValue)) {
        const evAgg = evByDay.get(k) || { sum: 0, n: 0 }
        evAgg.sum += b.expectedValue
        evAgg.n += 1
        evByDay.set(k, evAgg)
      }
    }

    // AI usage (mental load proxy) - higher use implies higher cognitive load / potential risk.
    const aiByDay = new Map<string, { sum: number; n: number }>()
    for (const u of aiUsage || []) {
      const t = new Date((u as any).createdAt ?? (u as any).created_at ?? Date.now())
      if (Number.isNaN(t.getTime())) continue
      maxTs = Math.max(maxTs, t.getTime())
      const k = toDayKey(t)
      const service = String(u.serviceType || "").toLowerCase()
      const weight = service === "ai_bet_analyzer" ? 12 : 8
      const agg = aiByDay.get(k) || { sum: 0, n: 0 }
      agg.sum += weight
      agg.n += 1
      aiByDay.set(k, agg)
    }

    // Game line records: included for recency and (optionally later) EV proxies.
    // We at least use them to keep the chart window anchored to the latest captured odds/game activity.
    for (const g of gameLines || []) {
      const t = new Date(
        (g as any).updatedAt ??
          (g as any).updated_at ??
          (g as any).createdAt ??
          (g as any).created_at ??
          (g as any).commenceTime ??
          (g as any).commence_time ??
          Date.now(),
      )
      if (Number.isNaN(t.getTime())) continue
      maxTs = Math.max(maxTs, t.getTime())
    }

    const end = maxTs ? new Date(maxTs) : new Date()
    end.setHours(0, 0, 0, 0)
    const start = dateRange.start
    end.setTime(Math.min(end.getTime(), dateRange.end.getTime()))

    for (let ts = start.getTime(); ts <= end.getTime(); ts += MS_DAY) {
      const d = new Date(ts)
      const k = toDayKey(d)
      const eAgg = emotionByDay.get(k)
      const oAgg = outcomeByDay.get(k)
      const evAgg = evByDay.get(k)
      const aiAgg = aiByDay.get(k)

      // Mental health score: emotion (good) minus AI usage load (bad). Keep in 0-100.
      const emotionBase = eAgg && eAgg.n ? eAgg.sum / eAgg.n : undefined
      const aiLoad = aiAgg && aiAgg.n ? aiAgg.sum : 0
      const mental =
        typeof emotionBase === "number"
          ? Math.max(0, Math.min(100, Number((emotionBase - aiLoad).toFixed(1))))
          : aiAgg
            ? Math.max(0, Math.min(100, 55 - aiLoad))
            : undefined

      points.push({
        day: d.toLocaleDateString([], { month: "short", day: "numeric" }),
        emotionScore: eAgg && eAgg.n ? Number((eAgg.sum / eAgg.n).toFixed(1)) : undefined,
        outcomeScore: oAgg && oAgg.n ? Number((oAgg.sum / oAgg.n).toFixed(2)) : undefined,
        betActivity: activityByDay.get(k) ? 1 : 0,
        expectedValue: evAgg && evAgg.n ? Number((evAgg.sum / evAgg.n).toFixed(2)) : undefined,
        mentalHealthScore: mental,
      })
    }

    return points
  }, [logs, unifiedBets, aiUsage, gameLines, userData, dateRange])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        Loading analytics...
      </div>
    )
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header with subtabs */}
      <div>
        <h2 className="text-3xl font-bold text-foreground">Analytics</h2>
        <p className="text-muted-foreground text-sm">
          Comprehensive view of your betting and emotional data
        </p>
      </div>

      {/* Development Disclaimer */}
      <Card className="p-4 bg-amber-500/10 border-amber-500/30">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground mb-1">Under Development</h3>
            <p className="text-xs text-muted-foreground">
              These sections are still under development currently - so there are still some functions that do not work correctly. This will be remedied in the future.
            </p>
          </div>
        </div>
      </Card>

      {/* Subtabs */}
      <div className="flex gap-2 border-b border-border">
        <Button
          variant={activeSubTab === "correlation" ? "default" : "ghost"}
          onClick={() => setActiveSubTab("correlation")}
          className="rounded-b-none"
        >
          <TrendingUp className="h-4 w-4 mr-2" />
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
          <Brain className="h-4 w-4 mr-2" />
          Mental Health
        </Button>
      </div>

      {/* Tab 1: Behavioral Correlation (The 'Bridge' Graph) */}
      {activeSubTab === "correlation" && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  The Behavioral Bridge
                </h3>
                <p className="text-sm text-muted-foreground">Correlation between your profit/loss and daily mood</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span>Profit/Loss ($)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span>Mood (1-10)</span>
                </div>
              </div>
            </div>

            <div className="h-[400px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={bridgeData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground) / 0.1)" />
                  <XAxis 
                    dataKey="displayDate" 
                    tick={{ fontSize: 12 }} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    yAxisId="left" 
                    tick={{ fontSize: 12 }} 
                    axisLine={false} 
                    tickLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    domain={[0, 10]} 
                    tick={{ fontSize: 12 }} 
                    axisLine={false} 
                    tickLine={false}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background border border-border p-3 rounded-lg shadow-xl text-sm">
                            <p className="font-bold mb-2">{label}</p>
                            <div className="space-y-1">
                              <p className="flex justify-between gap-4">
                                <span className="text-muted-foreground">Net P/L:</span>
                                <span className={data.profit >= 0 ? "text-emerald-500" : "text-red-500"}>
                                  {data.profit >= 0 ? '+' : ''}${data.profit.toFixed(2)}
                                </span>
                              </p>
                              <p className="flex justify-between gap-4">
                                <span className="text-muted-foreground">Avg Mood:</span>
                                <span className="text-purple-500 font-medium">{data.mood || 'N/A'}</span>
                              </p>
                              {data.triggers.length > 0 && (
                                <div className="pt-2 border-t border-border mt-2">
                                  <p className="text-xs text-muted-foreground mb-1">Triggers:</p>
                                  <div className="flex gap-1">
                                    {data.triggers.map((t: string, i: number) => (
                                      <span key={i} title={t === '😰' ? 'High Stress' : 'High Excitement'}>{t}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="profit"
                    fill="url(#colorProfit)"
                    stroke="#10b981"
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="mood"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#8b5cf6", strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 6 }}
                  />
                  <defs>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  {/* Trigger Overlays */}
                  {bridgeData.map((entry, index) => (
                    entry.triggers.length > 0 ? (
                      <ReferenceArea
                        key={index}
                        x1={entry.displayDate}
                        x2={entry.displayDate}
                        yAxisId="right"
                        fill="transparent"
                        label={{
                          position: 'bottom',
                          value: entry.triggers[0],
                          fontSize: 16,
                          fill: '#000',
                          offset: 10
                        }}
                      />
                    ) : null
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 p-4 bg-muted/30 rounded-lg flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Insight: Behavioral Patterns</p>
                <p className="text-muted-foreground">
                  The chart above maps your financial performance directly against your emotional state. 
                  Emoji markers indicate days where <span className="text-foreground font-medium">High Stress (😰)</span> or 
                  <span className="text-foreground font-medium">High Excitement (🔥)</span> were logged. 
                  Watch for profit drops following these triggers.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Betting History & Performance */}
      {activeSubTab === "performance" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 flex flex-col items-center text-center justify-center bg-linear-to-br from-emerald-500/5 to-emerald-500/10 border-emerald-500/20">
              <div className="p-2 rounded-full bg-emerald-500/10 mb-2">
                <DollarSign className="h-5 w-5 text-emerald-500" />
              </div>
              <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Total P/L</p>
              <p className={`text-2xl font-bold ${bettingMetrics.profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {bettingMetrics.profit >= 0 ? '+' : ''}${bettingMetrics.profit.toFixed(2)}
              </p>
            </Card>

            <Card className="p-4 flex flex-col items-center text-center justify-center bg-linear-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
              <div className="p-2 rounded-full bg-blue-500/10 mb-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">ROI</p>
              <p className={`text-2xl font-bold ${bettingMetrics.roi >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {bettingMetrics.roi.toFixed(1)}%
              </p>
            </Card>

            <Card className="p-4 flex flex-col items-center text-center justify-center bg-linear-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20">
              <div className="p-2 rounded-full bg-amber-500/10 mb-2">
                <Trophy className="h-5 w-5 text-amber-500" />
              </div>
              <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Win Rate</p>
              <p className="text-2xl font-bold">{bettingMetrics.winRate.toFixed(1)}%</p>
            </Card>

            <Card className="p-4 flex flex-col items-center text-center justify-center bg-linear-to-br from-purple-500/5 to-purple-500/10 border-purple-500/20">
              <div className="p-2 rounded-full bg-purple-500/10 mb-2">
                <Target className="h-5 w-5 text-purple-500" />
              </div>
              <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Total EV</p>
              <p className={`text-2xl font-bold ${bettingMetrics.avgEV * bettingMetrics.totalBets >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                ${(bettingMetrics.avgEV * bettingMetrics.totalBets).toFixed(2)}
              </p>
            </Card>
          </div>

          <Card className="overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <History className="h-4 w-4" />
                Performance History
              </h3>
              <div className="flex gap-2">
                <Input 
                  placeholder="Filter games..." 
                  className="h-8 w-64 text-xs"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground uppercase tracking-wider text-[10px]">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground uppercase tracking-wider text-[10px]">Game</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground uppercase tracking-wider text-[10px]">Result</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground uppercase tracking-wider text-[10px]">Odds</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground uppercase tracking-wider text-[10px]">Stake</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground uppercase tracking-wider text-[10px]">EV ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredAnalyses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground italic">
                        No betting records found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredAnalyses.map((bet: UnifiedBet) => (
                      <tr 
                        key={bet.id} 
                        className="hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => setSelectedBet(bet)}
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground tabular-nums">
                          {new Date(bet.timestamp).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 font-medium truncate max-w-[200px]">
                          {bet.description}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {bet.outcome && (
                            <Badge 
                              variant="outline" 
                              className={`text-[10px] uppercase font-bold py-0 h-5 px-2 ${
                                bet.outcome === 'win' ? 'border-emerald-500 text-emerald-500 bg-emerald-500/5' :
                                bet.outcome === 'loss' ? 'border-red-500 text-red-500 bg-red-500/5' :
                                'border-muted-foreground text-muted-foreground'
                              }`}
                            >
                              {bet.outcome}
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                          {bet.odds > 0 ? '+' : ''}{bet.odds}
                        </td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums">
                          ${bet.stake.toFixed(2)}
                        </td>
                        <td className={`px-4 py-3 text-right tabular-nums font-semibold ${
                          (bet.expectedValue || 0) >= 0 ? 'text-emerald-500' : 'text-red-500'
                        }`}>
                          ${(bet.expectedValue || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 3: Mental Health & Triggers */}
      {activeSubTab === "mental-health" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Thermometer className="h-5 w-5 text-purple-500" />
                Emotional Heatmap
              </h3>
              <div className="space-y-6">
                {['before', 'during', 'after'].map((phase) => (
                  <div key={phase} className="space-y-2">
                    <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest">{phase} bet</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(mentalHealthData.emotionsByPhase[phase as keyof typeof mentalHealthData.emotionsByPhase]).length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">No data logged</p>
                      ) : (
                        Object.entries(mentalHealthData.emotionsByPhase[phase as keyof typeof mentalHealthData.emotionsByPhase])
                          .sort(([, a], [, b]) => b - a)
                          .map(([emotion, count]) => (
                            <div 
                              key={emotion} 
                              className={`px-3 py-1.5 rounded-full text-xs flex items-center gap-2 border ${
                                phase === 'before' ? 'bg-blue-500/10 border-blue-500/20' :
                                phase === 'during' ? 'bg-amber-500/10 border-amber-500/20' :
                                'bg-emerald-500/10 border-emerald-500/20'
                              }`}
                            >
                              <span className="font-medium capitalize">{emotion}</span>
                              <Badge variant="secondary" className="h-4 px-1 min-w-[1.2rem] flex justify-center text-[10px]">{count}</Badge>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                Top 5 Pre-Bet Emotions
              </h3>
              {mentalHealthData.topPreBetEmotions.length === 0 ? (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground italic text-sm">
                  Start logging your emotions before bets to see insights here.
                </div>
              ) : (
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mentalHealthData.topPreBetEmotions} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--muted-foreground) / 0.1)" />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        tick={{ fontSize: 12 }} 
                        width={80} 
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                      />
                      <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                        {mentalHealthData.topPreBetEmotions.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'][index % 5]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              
              <div className="mt-6 p-4 bg-linear-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-1.5 rounded-md bg-primary/20 text-primary">
                    <Brain className="h-4 w-4" />
                  </div>
                  <h4 className="font-semibold text-sm">Behavioral Correlation</h4>
                </div>
                {mentalHealthData.topEmotion ? (
                  <div className="space-y-2">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Your primary betting trigger is <span className="text-foreground font-bold capitalize">{mentalHealthData.topEmotion}</span>. 
                    </p>
                    <div className="flex items-center justify-between p-2 bg-background/50 rounded-md">
                      <span className="text-xs font-medium">ROI while {mentalHealthData.topEmotion}:</span>
                      <span className={`text-sm font-bold ${mentalHealthData.topEmotionROI >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {mentalHealthData.topEmotionROI >= 0 ? '+' : ''}{mentalHealthData.topEmotionROI.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground italic mt-2 text-center">
                      Tip: Use the Cool-Off tool if your ROI drops while feeling {mentalHealthData.topEmotion}.
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Log more emotional data to unlock your personalized ROI correlation insight.
                  </p>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

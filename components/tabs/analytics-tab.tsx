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
  Clock
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
} from "recharts"

interface AnalyticsTabProps {
  userData: UserData
  onNavigateToTab?: (tab: string) => void
}

type UnifiedBetSource = "analysis" | "trade"

type UnifiedBet = BetAnalysis & {
  source: UnifiedBetSource
}

type TimelineItem =
  | { kind: "bet"; ts: Date; bet: UnifiedBet }
  | { kind: "ai"; ts: Date; usage: AIServiceUsage }
  | { kind: "game"; ts: Date; game: GameLineRecord }

type EmotionOutcomePoint = {
  day: string
  emotionScore?: number
  outcomeScore?: number
  betActivity?: number
  expectedValue?: number
  mentalHealthScore?: number
}

const EMOTION_SCORE_LOOKUP: Record<string, number> = {
  // JOY (higher is better; happiest person = 100)
  happy: 100,
  excited: 96,
  optimistic: 92,
  grateful: 90,
  confident: 88,
  proud: 86,
  hopeful: 84,
  content: 82,
  cheerful: 80,
  inspired: 78,

  // CALM (positive/stable)
  peaceful: 85,
  relaxed: 82,
  centered: 80,
  focused: 78,
  balanced: 76,
  serene: 74,
  patient: 72,
  composed: 70,
  tranquil: 68,
  stable: 66,

  // FEAR (negative)
  anxious: 35,
  worried: 37,
  nervous: 38,
  scared: 33,
  uncertain: 40,
  panicked: 28,
  hesitant: 42,
  overwhelmed: 25,
  tense: 36,
  uneasy: 39,

  // GREED (risk / impulse; negative leaning)
  fomo: 30,
  euphoric: 44,
  impulsive: 26,
  overconfident: 40,
  eager: 52,
  craving: 24,
  obsessed: 20,
  compulsive: 18,
  restless: 34,
  driven: 46,

  // FRUSTRATION (lowest; maddest person = 0)
  angry: 0,
  irritated: 10,
  disappointed: 22,
  impatient: 14,
  stressed: 12,
  resentful: 6,
  annoyed: 16,
  agitated: 8,
  bitter: 4,
  exhausted: 18,

  // SADNESS (sad person = 45)
  down: 45,
  discouraged: 42,
  regretful: 40,
  defeated: 34,
  helpless: 28,
  lonely: 32,
  empty: 26,
  hopeless: 20,
  dejected: 30,
  grief: 16,
}

interface DailyBucket {
  label: string
  wins: number
  losses: number
  breakeven: number
}

// Available sports (same as Live Odds tab)
const AVAILABLE_SPORTS = [
  { key: "basketball_nba", label: "NBA" },
  { key: "americanfootball_nfl", label: "NFL" },
  { key: "baseball_mlb", label: "MLB" },
  { key: "icehockey_nhl", label: "NHL" },
]

export function AnalyticsTab({ userData, onNavigateToTab }: AnalyticsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<"data" | "betting-history" | "emotional-history">("data")
  const [logs, setLogs] = useState<EmotionLog[]>([])
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)

  // Betting history states
  const [analyses, setAnalyses] = useState<BetAnalysis[]>([])
  const [filteredAnalyses, setFilteredAnalyses] = useState<BetAnalysis[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterOutcome, setFilterOutcome] = useState<string>("all")
  const [filterSport, setFilterSport] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"date" | "ev" | "stake">("date")
  const [selectedBet, setSelectedBet] = useState<BetAnalysis | null>(null)
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

      return {
        id: `trade:${t.id}`,
        timestamp: new Date(t.timestamp),
        betType: "straight",
        sport: (t.sport as any) || "Unknown",
        description,
        odds: 0,
        stake: 0,
        emotionalState: t.preTradeEmotion || "",
        emotionalIntensity: intensity10,
        biasWarnings: Array.isArray(t.biasesIdentified) ? t.biasesIdentified : [],
        aiRecommendation: undefined,
        expectedValue: undefined,
        probabilityEstimate: undefined,
        outcome: mappedOutcome,
        actualReturn: undefined,
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

  const overallStability = useMemo(() => {
    const { score } = calculateEmotionalStability(logs)
    return score
  }, [logs])

  const emotionCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    logs.forEach(l => {
      const key = l.emotion
      counts[key] = (counts[key] || 0) + 1
    })
    return counts
  }, [logs])

  const mostCommonEmotion = useMemo(() => {
    const entries = Object.entries(emotionCounts)
    if (!entries.length) return null
    return entries.sort((a, b) => b[1] - a[1])[0]
  }, [emotionCounts])

  const avgIntensity = logs.length
    ? (logs.reduce((sum, l) => sum + l.intensity, 0) / logs.length).toFixed(1)
    : "-"

  const sportStats = useMemo(() => {
    const bySport: Record<string, { bets: number; wins: number }> = {}

    const ensureSport = (sport: string) => {
      const key = (sport || "Unknown").toString()
      if (!bySport[key]) bySport[key] = { bets: 0, wins: 0 }
      return key
    }

    // Trades (logged bets with outcomes)
    trades.forEach(t => {
      const key = ensureSport(t.sport as string)
      bySport[key].bets += 1
      if (t.outcome === "profit") bySport[key].wins += 1
    })

    // Saved bet analyses (from Analyze My Bet flows, including AI-powered ones)
    analyses.forEach(bet => {
      const key = ensureSport(bet.sport as string)
      bySport[key].bets += 1
    })

    // Game lines / interest from Live Odds & related flows
    gameLines.forEach(game => {
      const key = ensureSport(game.sport as string)
      bySport[key].bets += 1
    })

    return bySport
  }, [trades, analyses, gameLines])

  const topSports = useMemo(() => {
    const entries = Object.entries(sportStats)
    return entries
      .sort((a, b) => b[1].bets - a[1].bets)
      .slice(0, 5)
  }, [sportStats])

  // Build daily outcomes for last 14 days
  const dailyBuckets: DailyBucket[] = useMemo(() => {
    const days: DailyBucket[] = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date()
      d.setHours(0, 0, 0, 0)
      d.setDate(d.getDate() - i)
      const next = new Date(d)
      next.setDate(d.getDate() + 1)

      const dayTrades = trades.filter(t => {
        const ts = new Date(t.timestamp)
        return ts >= d && ts < next
      })
      const w = dayTrades.filter(t => t.outcome === "profit").length
      const l = dayTrades.filter(t => t.outcome === "loss").length
      const b = dayTrades.filter(t => t.outcome === "breakeven").length

      days.push({
        label: d.toLocaleDateString(undefined, { weekday: "short" }),
        wins: w,
        losses: l,
        breakeven: b,
      })
    }
    return days
  }, [trades])

  // Psychology vs outcomes: bucket trades by simple stability score
  const psychBuckets = useMemo(() => {
    const buckets: Record<string, { bets: number; wins: number }> = {
      LOW: { bets: 0, wins: 0 },
      MODERATE: { bets: 0, wins: 0 },
      HIGH: { bets: 0, wins: 0 },
    }

    const negativeEmotions = ["anxious", "frustrated", "angry", "fearful", "stressed"]
    const positiveEmotions = ["happy", "confident", "calm", "excited", "grateful", "relaxed", "joyful"]

    trades.forEach(t => {
      if (!t.preTradeEmotion) return
      const emotion = t.preTradeEmotion.toLowerCase()
      const intensity = t.preTradeIntensity || 3
      const scaled = (intensity / 5) * 100

      let score = 50
      if (negativeEmotions.includes(emotion)) {
        score = 100 - scaled
      } else if (positiveEmotions.includes(emotion)) {
        score = scaled
      }

      let bucket: keyof typeof buckets = "MODERATE"
      if (score < 40) bucket = "LOW"
      else if (score >= 70) bucket = "HIGH"

      buckets[bucket].bets += 1
      if (t.outcome === "profit") buckets[bucket].wins += 1
    })

    return buckets
  }, [trades])

  // Betting history functions
  const calculateWinReturn = (stake: number, odds: number): number => {
    if (odds > 0) {
      return stake + (stake * odds / 100)
    } else {
      return stake + (stake * 100 / Math.abs(odds))
    }
  }

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

      const updatedBet = {
        ...bet,
        outcome,
        actualReturn
      }

      const updatedAnalyses = [...analyses]
      updatedAnalyses[betIndex] = updatedBet
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

  const calculateBettingMetrics = () => {
    const completed = unifiedBets.filter(bet => bet.outcome && bet.outcome !== 'pending')
    const wins = completed.filter(bet => bet.outcome === 'win')
    const losses = completed.filter(bet => bet.outcome === 'loss')

    const totalStaked = completed.reduce((sum, bet) => sum + bet.stake, 0)
    const totalReturns = completed.reduce((sum, bet) => sum + (bet.actualReturn || 0), 0)
    const profit = totalReturns - totalStaked
    const roi = totalStaked > 0 ? (profit / totalStaked) * 100 : 0
    const winRate = completed.length > 0 ? (wins.length / completed.length) * 100 : 0

    const avgEV = unifiedBets.reduce((sum, bet) => sum + (bet.expectedValue || 0), 0) / (unifiedBets.length || 1)

    return {
      totalBets: unifiedBets.length,
      completedBets: completed.length,
      pendingBets: unifiedBets.filter(bet => bet.outcome === 'pending').length,
      wins: wins.length,
      losses: losses.length,
      winRate,
      totalStaked,
      totalReturns,
      profit,
      roi,
      avgEV
    }
  }

  const bettingMetrics = calculateBettingMetrics()
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
      const t = new Date((g as any).updatedAt ?? (g as any).updated_at ?? (g as any).createdAt ?? (g as any).created_at ?? (g as any).commenceTime ?? (g as any).commence_time ?? Date.now())
      if (Number.isNaN(t.getTime())) continue
      maxTs = Math.max(maxTs, t.getTime())
    }

    const defaultWindowDays = 180
    const end = maxTs ? new Date(maxTs) : new Date()
    end.setHours(0, 0, 0, 0)
    const start = new Date(end.getTime() - (defaultWindowDays - 1) * MS_DAY)

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
  }, [logs, unifiedBets, aiUsage, gameLines, userData])

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Analytics</h2>
          <p className="text-muted-foreground text-sm">
            Comprehensive view of your betting and emotional data
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <BarChart3 className="w-4 h-4" />
          Experimental
        </Badge>
      </div>

      {/* Subtabs */}
      <div className="flex gap-2 border-b border-border">
        <Button
          variant={activeSubTab === "data" ? "default" : "ghost"}
          onClick={() => setActiveSubTab("data")}
          className="rounded-b-none"
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Data
        </Button>
        <Button
          variant={activeSubTab === "betting-history" ? "default" : "ghost"}
          onClick={() => setActiveSubTab("betting-history")}
          className="rounded-b-none"
        >
          <Target className="h-4 w-4 mr-2" />
          Betting History
        </Button>
        <Button
          variant={activeSubTab === "emotional-history" ? "default" : "ghost"}
          onClick={() => setActiveSubTab("emotional-history")}
          className="rounded-b-none"
        >
          <Brain className="h-4 w-4 mr-2" />
          Emotional History
        </Button>
      </div>

      {/* Data Tab */}
      {activeSubTab === "data" && (
        <div className="space-y-6">
        {/* Emotional Tracking Analytics */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Emotional Tracking</h3>
            </div>
            {mostCommonEmotion && (
              <span className="text-xs text-muted-foreground">
                Most common: <span className="font-medium text-foreground">{mostCommonEmotion[0]}</span>
              </span>
            )}
          </div>

          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No emotion logs yet. Start tracking your emotions to unlock this analytics view.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Emotion frequency */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Most frequent emotions</p>
                <div className="space-y-2">
                  {Object.entries(emotionCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 6)
                    .map(([emotion, count]) => {
                      const pct = Math.round((count / logs.length) * 100)
                      return (
                        <div key={emotion} className="flex items-center gap-2 text-sm">
                          <span className="w-24 truncate text-foreground">{emotion}</span>
                          <div className="flex-1 h-2 rounded bg-muted overflow-hidden">
                            <div
                              className="h-full bg-primary/70"
                              style={{ width: `${Math.max(5, pct)}%` }}
                            />
                          </div>
                          <span className="w-10 text-right text-xs text-muted-foreground">{pct}%</span>
                        </div>
                      )
                    })}
                </div>
              </div>

              {/* Intensity summary */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  <p className="text-sm text-foreground font-medium">Average Intensity</p>
                </div>
                <p className="text-3xl font-bold text-foreground">{avgIntensity} / 5</p>
                <p className="text-xs text-muted-foreground">
                  Higher values mean your emotions tend to be more intense when you log them.
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Betting Outcomes over time */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-semibold text-foreground">Betting Outcomes</h3>
            </div>
            <p className="text-xs text-muted-foreground">Last 14 days</p>
          </div>

          {totalBets === 0 ? (
            <p className="text-sm text-muted-foreground">
              No bets recorded yet. Use the behavior and analysis tools to log your decisions.
            </p>
          ) : (
            <div className="grid grid-cols-14 gap-1 items-end h-32">
              {dailyBuckets.map((day, idx) => {
                const dayTotal = day.wins + day.losses + day.breakeven
                const winHeight = dayTotal ? (day.wins / dayTotal) * 100 : 0
                const lossHeight = dayTotal ? (day.losses / dayTotal) * 100 : 0
                const breakevenHeight = dayTotal ? (day.breakeven / dayTotal) * 100 : 0

                return (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <div className="w-full flex flex-col justify-end h-24 bg-muted/40 rounded overflow-hidden">
                      <div
                        className="w-full bg-emerald-500/80"
                        style={{ height: `${winHeight}%` }}
                      />
                      <div
                        className="w-full bg-yellow-400/80"
                        style={{ height: `${breakevenHeight}%` }}
                      />
                      <div
                        className="w-full bg-red-500/80"
                        style={{ height: `${lossHeight}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{day.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Sports & Leagues */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Sports & Leagues</h3>
            </div>
            <p className="text-xs text-muted-foreground">Top 5 by volume</p>
          </div>

          {topSports.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No sport data yet. When you log trades with a sport, they will appear here.
            </p>
          ) : (
            <div className="space-y-2 text-sm">
              {topSports.map(([sport, stats]) => {
                const sportWinRate = stats.bets ? Math.round((stats.wins / stats.bets) * 100) : 0
                return (
                  <div key={sport} className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-medium text-foreground truncate">{sport}</p>
                      <p className="text-xs text-muted-foreground">
                        {stats.bets} bets · {sportWinRate}% win rate
                      </p>
                    </div>
                    <div className="w-32 h-2 rounded bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary/80"
                        style={{ width: `${sportWinRate}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Psychology vs Outcomes */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Psychology vs Outcomes</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Based on pre-trade emotions and bet outcomes
            </p>
          </div>

          {trades.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Once you log trades with pre-trade emotions and outcomes, you'll see how stability relates to performance.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground border-b border-border">
                  <tr>
                    <th className="py-2 text-left">Stability Bucket</th>
                    <th className="py-2 text-right">Bets</th>
                    <th className="py-2 text-right">Win Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {(["HIGH", "MODERATE", "LOW"] as const).map(bucket => {
                    const stats = psychBuckets[bucket]
                    const wr = stats.bets ? Math.round((stats.wins / stats.bets) * 100) : 0
                    return (
                      <tr key={bucket} className="border-b border-border/60 last:border-0">
                        <td className="py-2">
                          <span className="font-medium text-foreground">{bucket}</span>
                        </td>
                        <td className="py-2 text-right">{stats.bets}</td>
                        <td className="py-2 text-right">
                          {wr}%
                          {stats.bets === 0 && (
                            <span className="ml-1 text-[11px] text-muted-foreground">(no data yet)</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
                <TrendingDown className="w-3 h-3" />
                As this table fills in, look for higher win rates when your stability bucket is HIGH versus LOW.
              </p>
            </div>
          )}
        </Card>

        {/* Emotion vs Betting Outcomes (Time Series) */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Emotion vs Betting Outcomes</h3>
            </div>
            <p className="text-xs text-muted-foreground">Last 90 days · 0–100 emotion, -1/0/1 outcome</p>
          </div>

          <div className="flex flex-wrap gap-4 mb-4 rounded-md border border-border bg-muted/40 p-3">
            <label className="flex items-center gap-2 text-xs text-foreground">
              <Checkbox checked={showEmotionLine} onCheckedChange={(v) => setShowEmotionLine(!!v)} />
              Emotion (0-100)
            </label>
            <label className="flex items-center gap-2 text-xs text-foreground">
              <Checkbox checked={showOutcomeLine} onCheckedChange={(v) => setShowOutcomeLine(!!v)} />
              Outcome (-1/0/1)
            </label>
            <label className="flex items-center gap-2 text-xs text-foreground">
              <Checkbox checked={showActivityLine} onCheckedChange={(v) => setShowActivityLine(!!v)} />
              Bet activity (0/1)
            </label>
            <label className="flex items-center gap-2 text-xs text-foreground">
              <Checkbox checked={showEvLine} onCheckedChange={(v) => setShowEvLine(!!v)} />
              Expected value (EV)
            </label>
            <label className="flex items-center gap-2 text-xs text-foreground">
              <Checkbox checked={showMentalHealthLine} onCheckedChange={(v) => setShowMentalHealthLine(!!v)} />
              Mental health score
            </label>
          </div>

          {(
            (!showEmotionLine || emotionOutcomeSeries.every((p) => p.emotionScore == null)) &&
            (!showOutcomeLine || emotionOutcomeSeries.every((p) => p.outcomeScore == null)) &&
            (!showActivityLine || emotionOutcomeSeries.every((p) => (p.betActivity ?? 0) === 0)) &&
            (!showEvLine || emotionOutcomeSeries.every((p) => p.expectedValue == null)) &&
            (!showMentalHealthLine || emotionOutcomeSeries.every((p) => p.mentalHealthScore == null))
          ) ? (
            <p className="text-sm text-muted-foreground">
              Log emotions and complete bets (win/loss/push) to see how your emotional state tracks with outcomes.
            </p>
          ) : (
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={emotionOutcomeSeries} margin={{ top: 10, right: 30, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.15)" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                    minTickGap={16}
                  />
                  {(showEmotionLine || showMentalHealthLine) && (
                    <YAxis
                      yAxisId="left"
                      domain={[0, 100]}
                      tick={{ fontSize: 12 }}
                      tickCount={6}
                      label={{ value: "Emotion (0-100)", angle: -90, position: "insideLeft" }}
                    />
                  )}
                  {(showOutcomeLine || showActivityLine) && (
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      domain={[-1, 1]}
                      ticks={[-1, 0, 1]}
                      tick={{ fontSize: 12 }}
                      label={{ value: "Outcome/Activity", angle: 90, position: "insideRight" }}
                    />
                  )}
                  {showEvLine && (
                    <YAxis
                      yAxisId="ev"
                      orientation="right"
                      tick={{ fontSize: 12 }}
                      width={56}
                      label={{ value: "EV ($)", angle: 90, position: "insideRight" }}
                    />
                  )}
                  <Tooltip
                    formatter={(value: any, name: any) => {
                      if (name === "Emotion (0-100)") return [value, "Emotion (0-100)"]
                      if (name === "Outcome (-1/0/1)") return [value, "Outcome (-1/0/1)"]
                      if (name === "Bet activity (0/1)") return [value, "Bet activity (0/1)"]
                      if (name === "EV ($)") return [value, "EV ($)"]
                      if (name === "Mental health score") return [value, "Mental health score"]
                      return [value, name]
                    }}
                  />
                  <Legend />
                  {showEmotionLine && (
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="emotionScore"
                      name="Emotion (0-100)"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                    />
                  )}
                  {showOutcomeLine && (
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="outcomeScore"
                      name="Outcome (-1/0/1)"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                    />
                  )}
                  {showActivityLine && (
                    <Line
                      yAxisId="right"
                      type="stepAfter"
                      dataKey="betActivity"
                      name="Bet activity (0/1)"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                    />
                  )}
                  {showEvLine && (
                    <Line
                      yAxisId="ev"
                      type="monotone"
                      dataKey="expectedValue"
                      name="EV ($)"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                    />
                  )}
                  {showMentalHealthLine && (
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="mentalHealthScore"
                      name="Mental health score"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <p className="mt-3 text-xs text-muted-foreground">
            Emotion score uses the stable 60-emotion lookup table (0–100). Outcome score is daily average of wins (1),
            losses (-1), and pushes (0). Bet activity is 1 when any bet exists that day. EV is daily average EV from analyses.
            Mental health score is a blended proxy: emotion score minus recent AI usage load.
          </p>
        </Card>
      </div>
    )}

    {/* Betting History Tab */}
    {activeSubTab === "betting-history" && (
      <div className="space-y-6">
        {unifiedBets.length === 0 ? (
          <Card className="p-12 text-center">
            <History className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No Bets Yet</h3>
            <p className="text-muted-foreground mb-6">
              Start analyzing bets to build your history and track your performance.
            </p>
            {onNavigateToTab && (
              <Button onClick={() => onNavigateToTab("analyze")}>
                <Target className="h-4 w-4 mr-2" />
                Analyze Your First Bet
              </Button>
            )}
          </Card>
        ) : (
          <>
            {/* Performance Metrics Dashboard */}
            <Card className="p-6 bg-linear-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                Performance Overview
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-background/50 text-center">
                  <Trophy className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground mb-1">Win Rate</p>
                  <p className="text-2xl font-bold text-foreground">{bettingMetrics.winRate.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {bettingMetrics.wins}W - {bettingMetrics.losses}L
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-background/50 text-center">
                  <DollarSign className={`h-6 w-6 mx-auto mb-2 ${bettingMetrics.profit >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                  <p className="text-xs text-muted-foreground mb-1">Total P/L</p>
                  <p className={`text-2xl font-bold ${bettingMetrics.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {bettingMetrics.profit >= 0 ? '+' : ''}${bettingMetrics.profit.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ${bettingMetrics.totalStaked.toFixed(0)} staked
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-background/50 text-center">
                  {bettingMetrics.roi >= 0 ? (
                    <TrendingUp className="h-6 w-6 text-green-500 mx-auto mb-2" />
                  ) : (
                    <TrendingDown className="h-6 w-6 text-red-500 mx-auto mb-2" />
                  )}
                  <p className="text-xs text-muted-foreground mb-1">ROI</p>
                  <p className={`text-2xl font-bold ${bettingMetrics.roi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {bettingMetrics.roi >= 0 ? '+' : ''}{bettingMetrics.roi.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Return on investment
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-background/50 text-center">
                  <Target className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground mb-1">Avg EV</p>
                  <p className={`text-2xl font-bold ${bettingMetrics.avgEV >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {bettingMetrics.avgEV >= 0 ? '+' : ''}${bettingMetrics.avgEV.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Expected value
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-muted-foreground">Completed: {bettingMetrics.completedBets}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span className="text-muted-foreground">Pending: {bettingMetrics.pendingBets}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-blue-500" />
                    <span className="text-muted-foreground">Total: {bettingMetrics.totalBets}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Filters and Search */}
            <Card className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search bets..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div>
                  <select
                    value={filterOutcome}
                    onChange={(e) => setFilterOutcome(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="all">All Outcomes</option>
                    <option value="win">Wins</option>
                    <option value="loss">Losses</option>
                    <option value="push">Pushes</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>

                <div>
                  <select
                    value={filterSport}
                    onChange={(e) => setFilterSport(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="all">All Sports</option>
                    {allSportOptions.map(sport => (
                      <option key={sport.key} value={sport.key}>{sport.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-4 rounded-md border border-border bg-muted/40 p-3">
                <label className="flex items-center gap-2 text-xs text-foreground">
                  <Checkbox checked={showUsageEvents} onCheckedChange={(v) => setShowUsageEvents(!!v)} />
                  Include AI usage events
                </label>
                <label className="flex items-center gap-2 text-xs text-foreground">
                  <Checkbox checked={showGameLineEvents} onCheckedChange={(v) => setShowGameLineEvents(!!v)} />
                  Include game line events
                </label>
                {(showUsageEvents || showGameLineEvents) && sortBy !== "date" && (
                  <span className="text-xs text-muted-foreground">
                    Unified timeline view is always sorted by date.
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Sort by:</span>
                <div className="flex gap-2">
                  <Button
                    variant={sortBy === 'date' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSortBy('date')}
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    Date
                  </Button>
                  <Button
                    variant={sortBy === 'ev' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSortBy('ev')}
                  >
                    <Target className="h-4 w-4 mr-1" />
                    EV
                  </Button>
                  <Button
                    variant={sortBy === 'stake' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSortBy('stake')}
                  >
                    <DollarSign className="h-4 w-4 mr-1" />
                    Stake
                  </Button>
                </div>
              </div>
            </Card>

            {/* Results Count */}
            {filteredAnalyses.length !== unifiedBets.length && (
              <div className="text-center text-sm text-muted-foreground">
                Showing {filteredAnalyses.length} of {unifiedBets.length} bets
              </div>
            )}

            {/* Bet List */}
            {unifiedTimelineItems.length === 0 ? (
              <Card className="p-8 text-center">
                <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No bets match your filters</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchTerm("")
                    setFilterOutcome("all")
                    setFilterSport("all")
                  }}
                >
                  Clear Filters
                </Button>
              </Card>
            ) : (
              <div className="space-y-3">
                {unifiedTimelineItems.map((item, idx) => {
                  if (item.kind === "bet") {
                    const bet = item.bet
                    return (
                      <Card
                        key={`${item.kind}:${bet.id}:${idx}`}
                        className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setSelectedBet(bet)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">
                                Bet
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {bet.sport}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {bet.betType}
                              </Badge>
                              {(bet as any).source && (
                                <Badge variant="outline" className="text-xs">
                                  {(bet as any).source}
                                </Badge>
                              )}
                              {bet.outcome && (
                                <Badge
                                  className={`text-xs ${
                                    bet.outcome === 'win' ? 'bg-green-500/20 text-green-500 border-green-500/30' :
                                    bet.outcome === 'loss' ? 'bg-red-500/20 text-red-500 border-red-500/30' :
                                    bet.outcome === 'push' ? 'bg-gray-500/20 text-gray-500 border-gray-500/30' :
                                    'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'
                                  }`}
                                >
                                  {bet.outcome.toUpperCase()}
                                </Badge>
                              )}
                            </div>
                            <h4 className="font-semibold text-foreground mb-1 truncate">
                              {bet.description}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {new Date(bet.timestamp).toLocaleDateString()} at {new Date(bet.timestamp).toLocaleTimeString()}
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-sm font-semibold text-foreground mb-1">
                              {bet.stake > 0 ? `$${bet.stake.toFixed(2)}` : (
                                <span className="text-xs text-muted-foreground">(stake not logged)</span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mb-1">
                              {bet.odds !== 0 ? (
                                <>Odds: {bet.odds > 0 ? '+' : ''}{bet.odds}</>
                              ) : (
                                <>Odds: <span className="text-muted-foreground">(not logged)</span></>
                              )}
                            </div>
                            {bet.expectedValue !== undefined && (
                              <div className={`text-xs font-medium ${bet.expectedValue >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                EV: {bet.expectedValue >= 0 ? '+' : ''}${bet.expectedValue.toFixed(2)}
                              </div>
                            )}
                            {bet.actualReturn !== undefined && bet.outcome !== 'pending' && (
                              <div className={`text-xs font-medium ${bet.actualReturn >= bet.stake ? 'text-green-500' : 'text-red-500'}`}>
                                Return: ${bet.actualReturn.toFixed(2)}
                              </div>
                            )}
                          </div>
                        </div>

                        {bet.biasWarnings && bet.biasWarnings.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                              <div className="flex flex-wrap gap-1">
                                {bet.biasWarnings.slice(0, 2).map((warning, idx2) => (
                                  <span key={idx2} className="text-xs text-muted-foreground">
                                    {warning}{idx2 < Math.min(bet.biasWarnings.length, 2) - 1 ? ',' : ''}
                                  </span>
                                ))}
                                {bet.biasWarnings.length > 2 && (
                                  <span className="text-xs text-muted-foreground">
                                    +{bet.biasWarnings.length - 2} more
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </Card>
                    )
                  }

                  if (item.kind === "ai") {
                    const u = item.usage
                    const title = `AI: ${(u.serviceType || "AI service").toString().replace(/_/g, " ")}`
                    return (
                      <Card key={`${item.kind}:${u.id}:${idx}`} className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">AI usage</Badge>
                            </div>
                            <h4 className="font-semibold text-foreground mb-1 truncate">{title}</h4>
                            <p className="text-xs text-muted-foreground">
                              {item.ts.toLocaleDateString()} at {item.ts.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </Card>
                    )
                  }

                  const g = item.game
                  const matchup = `${g.homeTeam || ""} vs ${g.awayTeam || ""}`.trim() || "Game line update"
                  const status = (g.finalStatus || "").toString().replace(/_/g, " ")
                  return (
                    <Card key={`${item.kind}:${g.id}:${idx}`} className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">Game lines</Badge>
                            {g.sport && (
                              <Badge variant="outline" className="text-xs">{g.sport as any}</Badge>
                            )}
                            {status && (
                              <Badge variant="outline" className="text-xs">{status}</Badge>
                            )}
                          </div>
                          <h4 className="font-semibold text-foreground mb-1 truncate">{matchup}</h4>
                          <p className="text-xs text-muted-foreground">
                            {item.ts.toLocaleDateString()} at {item.ts.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}

              {/* Bet Detail Modal */}
              {selectedBet && (
                <div
                  className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                  onClick={() => setSelectedBet(null)}
                >
                  <Card
                    className="max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-foreground mb-2">
                            {selectedBet.description}
                          </h3>
                          <div className="flex gap-2">
                            <Badge variant="outline">{selectedBet.sport}</Badge>
                            <Badge variant="outline">{selectedBet.betType}</Badge>
                            {selectedBet.outcome && (
                              <Badge
                                className={`${
                                  selectedBet.outcome === 'win' ? 'bg-green-500/20 text-green-500' :
                                  selectedBet.outcome === 'loss' ? 'bg-red-500/20 text-red-500' :
                                  selectedBet.outcome === 'push' ? 'bg-gray-500/20 text-gray-500' :
                                  'bg-yellow-500/20 text-yellow-500'
                                }`}
                              >
                                {selectedBet.outcome.toUpperCase()}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedBet(null)}>
                          ✕
                        </Button>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Stake</p>
                            <p className="text-lg font-semibold">${selectedBet.stake.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Odds</p>
                            <p className="text-lg font-semibold">
                              {selectedBet.odds > 0 ? '+' : ''}{selectedBet.odds}
                            </p>
                          </div>
                          {selectedBet.expectedValue !== undefined && (
                            <div>
                              <p className="text-sm text-muted-foreground">Expected Value</p>
                              <p className={`text-lg font-semibold ${selectedBet.expectedValue >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {selectedBet.expectedValue >= 0 ? '+' : ''}${selectedBet.expectedValue.toFixed(2)}
                              </p>
                            </div>
                          )}
                          {selectedBet.probabilityEstimate !== undefined && (
                            <div>
                              <p className="text-sm text-muted-foreground">Win Probability</p>
                              <p className="text-lg font-semibold">{selectedBet.probabilityEstimate}%</p>
                            </div>
                          )}
                        </div>

                        {selectedBet.emotionalState && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Emotional State</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{selectedBet.emotionalState}</Badge>
                              {selectedBet.emotionalIntensity && (
                                <span className="text-sm text-muted-foreground">
                                  Intensity: {selectedBet.emotionalIntensity}/10
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {selectedBet.aiRecommendation && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">AI Recommendation</p>
                            <p className="text-sm text-foreground">{selectedBet.aiRecommendation}</p>
                          </div>
                        )}

                        {selectedBet.biasWarnings && selectedBet.biasWarnings.length > 0 && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">Bias Warnings</p>
                            <div className="space-y-1">
                              {selectedBet.biasWarnings.map((warning, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-sm">
                                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                                  <span className="text-muted-foreground">{warning}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="pt-4 border-t border-border">
                          <p className="text-sm font-medium text-foreground mb-3">Update Bet Outcome</p>
                          {(selectedBet as any).source === 'trade' ? (
                            <div className="rounded-md border border-border bg-muted/40 p-3">
                              <p className="text-sm text-foreground font-medium">Outcome tracked via Emotion Tracker</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                To change this result, update it from the Behavior / emotion-tracking flow.
                              </p>
                            </div>
                          ) : selectedBet.outcome === 'pending' ? (
                            <div className="space-y-2">
                              <p className="text-xs text-muted-foreground mb-2">
                                Mark this bet as won, lost, or pushed to track your performance
                              </p>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="flex-1 bg-green-500 hover:bg-green-600"
                                  onClick={() => handleUpdateOutcome(selectedBet.id, 'win')}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  Won
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="flex-1"
                                  onClick={() => handleUpdateOutcome(selectedBet.id, 'loss')}
                                >
                                  ✕ Lost
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => handleUpdateOutcome(selectedBet.id, 'push')}
                                >
                                  Push
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="grid grid-cols-2 gap-4 mb-3">
                                <div>
                                  <p className="text-xs text-muted-foreground">Result</p>
                                  <p className={`text-lg font-semibold ${
                                    selectedBet.outcome === 'win' ? 'text-green-500' :
                                    selectedBet.outcome === 'loss' ? 'text-red-500' :
                                    'text-gray-500'
                                  }`}>
                                    {(selectedBet.outcome?.toUpperCase()) ?? ''}
                                  </p>
                                </div>
                                {selectedBet.actualReturn !== undefined && (
                                  <div>
                                    <p className="text-xs text-muted-foreground">Return</p>
                                    <p className={`text-lg font-semibold ${
                                      selectedBet.actualReturn >= selectedBet.stake ? 'text-green-500' : 'text-red-500'
                                    }`}>
                                      ${selectedBet.actualReturn.toFixed(2)}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="pt-4 border-t border-border">
                          <p className="text-xs text-muted-foreground">
                            Analyzed on {new Date(selectedBet.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Emotional History Tab */}
      {activeSubTab === "emotional-history" && (
        <div className="space-y-6">
          <EmotionInsights logs={logs} />
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Emotion Tracker</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  View your emotions linked to specific bets or explore every check-in you have logged.
                </p>
              </div>
              <div className="inline-flex rounded-md border border-border bg-muted p-1 text-xs">
                <button
                  type="button"
                  className={`px-3 py-1 rounded-md transition-colors ${
                    emotionViewTab === "by-bets" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                  onClick={() => setEmotionViewTab("by-bets")}
                >
                  By Bets
                </button>
                <button
                  type="button"
                  className={`px-3 py-1 rounded-md transition-colors ${
                    emotionViewTab === "all-checkins" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                  onClick={() => setEmotionViewTab("all-checkins")}
                >
                  All Check-ins
                </button>
              </div>
            </div>

            {emotionViewTab === "by-bets" ? (
              <div className="space-y-3">
                <p className="text-[11px] text-muted-foreground mb-1">
                  Each card below shows a single bet with your emotional intensity before and after (and during, if you logged it).
                </p>
                <EmotionHistory logs={logs} trades={trades} />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] text-muted-foreground">
                    Every emotion check-in you have recorded, visualized by phase and intensity.
                  </p>
                  <span className="text-[11px] text-muted-foreground">{logs.length} total</span>
                </div>

                {logs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No emotion check-ins yet. Use the Behavior tab or the quick check-in dialog to start tracking how you feel.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {[...logs]
                      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                      .map((log) => {
                        const barWidth = Math.max(6, (log.intensity / 5) * 100)
                        const phaseColor =
                          log.phase === "before"
                            ? "bg-emerald-400/80"
                            : log.phase === "during"
                            ? "bg-amber-400/80"
                            : "bg-sky-400/80"

                        return (
                          <div
                            key={log.id}
                            className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-card/40 px-3 py-2"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-foreground truncate max-w-40">
                                  {log.emotion}
                                </span>
                                <span className="text-[11px] inline-flex items-center rounded-full border px-2 py-0.5 text-muted-foreground capitalize">
                                  {log.phase} bet
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="relative flex-1 h-2 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className={`h-full ${phaseColor}`}
                                    style={{ width: `${barWidth}%` }}
                                  />
                                </div>
                                <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                                  {log.intensity}/5
                                </span>
                              </div>
                              {log.context && (
                                <p className="mt-1 text-[11px] text-muted-foreground line-clamp-1">
                                  {log.context}
                                </p>
                              )}
                            </div>
                            <div className="text-right shrink-0 ml-1">
                              <p className="text-[11px] text-muted-foreground">
                                {new Date(log.timestamp).toLocaleDateString()}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}

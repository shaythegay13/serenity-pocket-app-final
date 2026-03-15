"use client"

import { useEffect, useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts"
import { TrendingUp, DollarSign, Target, BarChart3, Clock, CheckCircle2, XCircle, RefreshCw, Users, Activity, Sparkles, Zap } from "lucide-react"
import type { Trade, BetAnalysis } from "@/lib/types"
import type { ComprehensiveBet } from "@/lib/types/bet-tracking"
import type { Parlay } from "@/lib/types/ai-models"
import { analyticsEvents, ANALYTICS_EVENTS } from "@/lib/events"
import { KPICardsGrid } from "./KPICards"
import { calculateBettingMetrics } from "./utils/calculations"
import type { UnifiedBet } from "./types"
import { storageHybrid as storage } from "@/lib/storage-hybrid"
import { toast } from "sonner"
import { EmotionCheckInDialog } from "@/components/emotion-check-in-dialog"
import { normalizeTeamName, extractAndNormalizeTeams } from "@/lib/team-normalization"
import { getSportById } from "@/lib/sports-config"

interface PerformanceTabProps {
  trades: Trade[]
  unifiedBets?: UnifiedBet[]
  comprehensiveBets?: ComprehensiveBet[]
  parlays?: Parlay[]
  onRefreshData?: () => void
  isRefreshing?: boolean
}

export function PerformanceTab({ trades, unifiedBets = [], comprehensiveBets: propComprehensiveBets = [], parlays: propParlays = [], onRefreshData, isRefreshing }: PerformanceTabProps) {
  // Calculate metrics
  const metrics = useMemo(() => {
    if (unifiedBets.length > 0) {
      return calculateBettingMetrics(unifiedBets)
    }

    // Compute parlay metrics from both actual parlay data and manual entries in trades
    const settledParlays = propParlays.filter(p => p.outcome === 'won' || p.outcome === 'lost' || p.outcome === 'push' || p.outcome === 'void')
    const manualParlays = trades.filter(t => t.isParlay)
    const settledManualParlays = manualParlays.filter(t => t.outcome && t.actualReturn != null)

    const totalParlayWins = propParlays.filter(p => p.outcome === 'won').length + manualParlays.filter(t => t.outcome === 'profit').length
    const totalParlayLosses = propParlays.filter(p => p.outcome === 'lost').length + manualParlays.filter(t => t.outcome === 'loss').length

    const parlayTotalStaked = settledParlays.reduce((s, p) => s + (p.stake || 0), 0) + settledManualParlays.reduce((s, t) => s + (t.stake || 0), 0)
    const parlayTotalReturns = settledParlays.reduce((s, p) => s + (p.actualPayout || 0), 0) + settledManualParlays.reduce((s, t) => s + (t.actualReturn || 0), 0)
    const parlayProfit = parlayTotalReturns - parlayTotalStaked

    const parlayMetrics = {
      totalParlays: propParlays.length + manualParlays.length,
      completedParlays: settledParlays.length + settledManualParlays.length,
      parlayWins: totalParlayWins,
      parlayLosses: totalParlayLosses,
      parlayWinRate: (totalParlayWins + totalParlayLosses) > 0
        ? (totalParlayWins / (totalParlayWins + totalParlayLosses)) * 100
        : 0,
      parlayROI: parlayTotalStaked > 0 ? (parlayProfit / parlayTotalStaked) * 100 : 0,
      parlayPercentage: trades.length > 0 ? ((propParlays.length + manualParlays.length) / trades.length) * 100 : 0,
    }

    // Fallback to trades data
    const completed = trades.filter(t => t.outcome && t.actualReturn != null)
    const wins = completed.filter(t => t.outcome === 'profit')
    const losses = completed.filter(t => t.outcome === 'loss')
    const breakeven = completed.filter(t => t.outcome === 'breakeven')
    const totalStaked = completed.reduce((sum, t) => sum + (t.stake || 0), 0)
    const totalReturns = completed.reduce((sum, t) => sum + (t.actualReturn || 0), 0)
    const profit = totalReturns - totalStaked
    const roi = totalStaked > 0 ? (profit / totalStaked) * 100 : 0
    const winRate = completed.length > 0 ? (wins.length / completed.length) * 100 : 0

    // Calculate average expected value from completed trades
    const tradesWithEV = completed.filter(t => t.stake && t.stake > 0)
    const avgEV = tradesWithEV.length > 0
      ? tradesWithEV.reduce((sum: number, trade: Trade) => {
        const profit = (trade.actualReturn || 0) - (trade.stake || 0)
        return sum + profit
      }, 0) / tradesWithEV.length
      : 0

    return {
      totalBets: trades.length,
      completedBets: completed.length,
      wins: wins.length,
      losses: losses.length,
      winRate,
      totalStaked,
      totalReturns,
      profit,
      roi,
      avgEV,
      // Parlay metrics computed from actual parlay data
      ...parlayMetrics
    }
  }, [trades, unifiedBets, propParlays])

  // State for pending bets (from both BetAnalysis and ComprehensiveBet)
  const [pendingBets, setPendingBets] = useState<BetAnalysis[]>([])
  const [pendingComprehensiveBets, setPendingComprehensiveBets] = useState<ComprehensiveBet[]>([])
  const [loadingPending, setLoadingPending] = useState(false)

  // State for emotion check-in dialog when settling bets
  const [emotionCheckInOpen, setEmotionCheckInOpen] = useState(false)
  const [betBeingSettled, setBetBeingSettled] = useState<ComprehensiveBet | null>(null)
  const [preSelectedOutcome, setPreSelectedOutcome] = useState<"profit" | "loss" | "breakeven" | undefined>(undefined)

  // Load pending bets function (reusable for mount and refresh)
  const loadPendingBets = async () => {
    setLoadingPending(true)
    try {
      // Load from both BetAnalysis and ComprehensiveBet sources
      const [analyses, comprehensiveBets] = await Promise.all([
        storage.getBetAnalyses().catch(() => []),
        storage.getComprehensiveBets().catch(() => [])
      ])

      const pendingAnalyses = analyses.filter(bet => bet.outcome === 'pending')
      const pendingCompBets = comprehensiveBets.filter(bet => bet.outcome === 'pending')

      // Deduplicate: ComprehensiveBets take priority over BetAnalysis
      // Create a set of IDs from comprehensive bets for fast lookup
      const compBetIds = new Set(pendingCompBets.map(b => b.id))

      // Also check for duplicates by matching on description + stake + timestamp (within 5 minutes)
      const isDuplicate = (analysis: BetAnalysis) => {
        // Check exact ID match first
        if (compBetIds.has(analysis.id)) return true

        // Check for same bet logged to both systems by matching key fields
        return pendingCompBets.some(compBet => {
          const timeDiff = Math.abs(new Date(analysis.timestamp).getTime() - new Date(compBet.timestamp).getTime())
          const sameTimeWindow = timeDiff < 5 * 60 * 1000 // Within 5 minutes
          const sameStake = Math.abs(analysis.stake - compBet.stake) < 0.01
          const sameOdds = Math.abs((analysis.odds ?? 0) - compBet.odds) < 1

          return sameTimeWindow && sameStake && sameOdds
        })
      }

      // Filter out analyses that are duplicates of comprehensive bets
      const uniqueAnalyses = pendingAnalyses.filter(a => !isDuplicate(a))

      setPendingBets(uniqueAnalyses)
      setPendingComprehensiveBets(pendingCompBets)
    } catch (error) {
      console.error('Error loading pending bets:', error)
    } finally {
      setLoadingPending(false)
    }
  }

  // Load pending bets on mount and when betting data changes
  useEffect(() => {
    let isMounted = true

    const doLoad = async () => {
      if (!isMounted) return
      await loadPendingBets()
    }

    doLoad()

    // Also reload when betting data is saved (e.g., after settling a bet)
    const handleDataUpdate = () => { doLoad() }
    analyticsEvents.on(ANALYTICS_EVENTS.BETTING_DATA_SAVED, handleDataUpdate)

    return () => {
      isMounted = false
      analyticsEvents.off(ANALYTICS_EVENTS.BETTING_DATA_SAVED, handleDataUpdate)
    }
  }, [])

  // Handle bet outcome - opens emotion check-in dialog for legacy BetAnalysis bets
  // Convert to ComprehensiveBet format for the dialog
  const handleBetOutcome = (betId: string, outcome: 'win' | 'loss' | 'push') => {
    const bet = pendingBets.find(b => b.id === betId)
    if (!bet) return

    // Extract teams from description if they are Unknown
    let homeTeam = "Unknown"
    let awayTeam = "Unknown"

    if (bet.description) {
      const extracted = extractAndNormalizeTeams(bet.description, bet.sport)
      homeTeam = extracted.homeTeam
      awayTeam = extracted.awayTeam
    }

    // Convert BetAnalysis to ComprehensiveBet format for the dialog
    const comprehensiveBet: ComprehensiveBet = {
      id: bet.id,
      timestamp: new Date(bet.timestamp),
      sport: (bet.sport || "americanfootball_nfl") as ComprehensiveBet["sport"],
      homeTeam,
      awayTeam,
      gameDate: new Date(bet.timestamp),
      betType: bet.betType === "straight" ? "moneyline" : bet.betType as any,
      selection: "away",
      odds: bet.odds ?? -110,
      stake: bet.stake,
      emotions: {
        before: {
          emotion: bet.emotionalState || "neutral",
          intensity: bet.emotionalIntensity || 5,
          timestamp: new Date(bet.timestamp)
        },
        during: { emotion: "", intensity: 5, timestamp: new Date() },
        after: { emotion: "", intensity: 5, timestamp: new Date() }
      },
      biasesIdentified: bet.biasWarnings || [],
      confidenceLevel: Math.round((bet.probabilityEstimate || 0.5) * 10),
      reasoning: bet.aiRecommendation || "",
      isLiveBet: false,
      isChasingLoss: false,
      isFavoriteTeam: false,
      outcome: "pending",
      source: "bet-analyzer",
      description: bet.description
    }

    // Open emotion check-in dialog with this bet
    setBetBeingSettled(comprehensiveBet)
    setPreSelectedOutcome(outcome === 'win' ? 'profit' : outcome === 'loss' ? 'loss' : 'breakeven')
    setEmotionCheckInOpen(true)
  }

  // Handle comprehensive bet outcome - opens emotion check-in dialog
  const handleComprehensiveBetOutcome = (betId: string, outcome: 'win' | 'loss' | 'push') => {
    const bet = pendingComprehensiveBets.find(b => b.id === betId)
    if (!bet) return

    // Open emotion check-in dialog with this bet pre-selected
    setBetBeingSettled(bet)
    setPreSelectedOutcome(outcome === 'win' ? 'profit' : outcome === 'loss' ? 'loss' : 'breakeven')
    setEmotionCheckInOpen(true)
  }

  // Handle emotion check-in complete
  const handleEmotionCheckInComplete = () => {
    setEmotionCheckInOpen(false)

    // Remove the settled bet from local state
    if (betBeingSettled) {
      setPendingBets(prev => prev.filter(b => b.id !== betBeingSettled.id))
      setPendingComprehensiveBets(prev => prev.filter(b => b.id !== betBeingSettled.id))
    }

    setBetBeingSettled(null)
    setPreSelectedOutcome(undefined)

    // Refresh data
    if (onRefreshData) {
      onRefreshData()
    }
  }

  // Calculate average stake
  const avgStake = useMemo(() => {
    const betsWithStake = trades.filter(t => t.stake && t.stake > 0)
    if (betsWithStake.length === 0) return 0
    return betsWithStake.reduce((sum, t) => sum + (t.stake || 0), 0) / betsWithStake.length
  }, [trades])

  // Outcome distribution
  const outcomeData = useMemo(() => {
    const wins = trades.filter(t => t.outcome === 'profit').length
    const losses = trades.filter(t => t.outcome === 'loss').length
    const breakeven = trades.filter(t => t.outcome === 'breakeven').length
    const pending = trades.filter(t => !t.outcome).length

    return [
      { name: 'Wins', value: wins, color: 'oklch(0.65 0.18 150)' },
      { name: 'Losses', value: losses, color: 'oklch(0.55 0.24 25)' },
      { name: 'Push', value: breakeven, color: 'oklch(0.7 0.18 70)' },
      { name: 'Pending', value: pending, color: 'oklch(0.55 0.01 250)' }
    ].filter(item => item.value > 0)
  }, [trades])

  // Format sport key to display name
  const formatSportName = (sportKey: string): string => {
    if (!sportKey || sportKey === 'Unknown') return 'Unknown'
    const config = getSportById(sportKey)
    if (config?.displayName) return config.displayName

    // Fallback for database keys like americanfootball_nfl
    return sportKey
      .replace(/^[a-z]+_(.*)$/i, '$1') // Extract the part after _
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase()) || sportKey
  }

  // Sport performance
  const sportPerformance = useMemo(() => {
    const sportMap = new Map<string, { wins: number; losses: number; pushes: number; pending: number; profit: number }>()
    const processedIds = new Set<string>()

    // Process trades
    trades.forEach(trade => {
      const sportKey = trade.sport || 'Unknown'
      const sport = formatSportName(sportKey)
      if (!sportMap.has(sport)) {
        sportMap.set(sport, { wins: 0, losses: 0, pushes: 0, pending: 0, profit: 0 })
      }
      const stats = sportMap.get(sport)!

      if (trade.outcome === 'profit') stats.wins++
      else if (trade.outcome === 'loss') stats.losses++
      else if (trade.outcome === 'breakeven') stats.pushes++
      else stats.pending++ // No outcome means pending

      // Only include profit for settled bets with actualReturn
      if (trade.actualReturn != null) {
        stats.profit += (trade.actualReturn || 0) - (trade.stake || 0)
      }

      // Track processed IDs to avoid double counting
      processedIds.add(trade.id)
    })

    // Also process comprehensive bets that might not be in trades
    propComprehensiveBets.forEach(bet => {
      if (processedIds.has(bet.id)) return
      processedIds.add(bet.id)

      const sport = formatSportName(bet.sport)
      if (!sportMap.has(sport)) {
        sportMap.set(sport, { wins: 0, losses: 0, pushes: 0, pending: 0, profit: 0 })
      }
      const stats = sportMap.get(sport)!

      if (bet.outcome === 'win') stats.wins++
      else if (bet.outcome === 'loss') stats.losses++
      else if (bet.outcome === 'push') stats.pushes++
      else stats.pending++ // pending or undefined

      if (bet.actualReturn != null) {
        stats.profit += (bet.actualReturn || 0) - (bet.stake || 0)
      }
    })

    return Array.from(sportMap.entries()).map(([sport, stats]) => ({
      sport,
      wins: stats.wins,
      losses: stats.losses,
      pushes: stats.pushes,
      pending: stats.pending,
      totalBets: stats.wins + stats.losses + stats.pushes + stats.pending,
      profit: stats.profit,
      winRate: stats.wins + stats.losses > 0
        ? (stats.wins / (stats.wins + stats.losses)) * 100
        : 0
    })).sort((a, b) => b.totalBets - a.totalBets) // Sort by total bets instead of profit
  }, [trades, propComprehensiveBets])

  // Team betting statistics - count bets on each team
  const teamStats = useMemo(() => {
    const teamMap = new Map<string, { bets: number; wins: number; losses: number; pushes: number; profit: number }>()
    const processedIds = new Set<string>()

    // Helper to add stats to normalized team name
    const addTeamStats = (teamName: string, sport: string | undefined, betsToAdd: number, wins: number, losses: number, pushes: number, profit: number) => {
      // Normalize team name to canonical form
      const normalizedTeam = normalizeTeamName(teamName, sport)

      if (!teamMap.has(normalizedTeam)) {
        teamMap.set(normalizedTeam, { bets: 0, wins: 0, losses: 0, pushes: 0, profit: 0 })
      }
      const stats = teamMap.get(normalizedTeam)!
      stats.bets += betsToAdd
      stats.wins += wins
      stats.losses += losses
      stats.pushes += pushes
      stats.profit += profit
    }

    // Helper function to process a bet - only attribute to the team that was actually bet on
    const processBetTeams = (bet: ComprehensiveBet) => {
      if (processedIds.has(bet.id)) return
      processedIds.add(bet.id)

      const betProfit = bet.actualReturn != null ? (bet.actualReturn - bet.stake) : 0
      const isWin = bet.outcome === 'win'
      const isLoss = bet.outcome === 'loss'
      const isPush = bet.outcome === 'push'

      // Determine which team was actually bet on based on selection
      let selectedTeam: string | null = null

      if (bet.selection === 'home' && bet.homeTeam && bet.homeTeam !== "Unknown") {
        selectedTeam = bet.homeTeam
      } else if (bet.selection === 'away' && bet.awayTeam && bet.awayTeam !== "Unknown") {
        selectedTeam = bet.awayTeam
      } else if (bet.selection === 'over' || bet.selection === 'under') {
        // For totals, attribute to both teams as it's a matchup bet
        // But only count as 0.5 bets each to avoid inflating numbers
        const teams = [bet.homeTeam, bet.awayTeam].filter(t => t && t !== "Unknown")
        teams.forEach(team => {
          addTeamStats(
            team,
            bet.sport,
            0.5,
            isWin ? 0.5 : 0,
            isLoss ? 0.5 : 0,
            isPush ? 0.5 : 0,
            betProfit / 2
          )
        })
        return // Already processed
      }

      // For moneyline/spread bets on a specific team
      if (selectedTeam) {
        addTeamStats(
          selectedTeam,
          bet.sport,
          1,
          isWin ? 1 : 0,
          isLoss ? 1 : 0,
          isPush ? 1 : 0,
          betProfit
        )
      }
    }

    // Process comprehensive bets passed as props (all bets - settled and pending)
    propComprehensiveBets.forEach(processBetTeams)

    // Also process locally loaded pending bets
    pendingComprehensiveBets.forEach(processBetTeams)

    // Also process from unified bets if available
    unifiedBets.forEach(bet => {
      if (processedIds.has(bet.id)) return
      processedIds.add(bet.id)

      const selection = (bet as any).selection
      const homeTeam = (bet as any).homeTeam
      const awayTeam = (bet as any).awayTeam
      const sport = (bet as any).sport
      const betProfit = bet.actualReturn != null ? (bet.actualReturn - bet.stake) : 0
      const isWin = bet.outcome === 'win'
      const isLoss = bet.outcome === 'loss'
      const isPush = bet.outcome === 'push'

      let selectedTeam: string | null = null
      if (selection === 'home' && homeTeam && homeTeam !== "Unknown") {
        selectedTeam = homeTeam
      } else if (selection === 'away' && awayTeam && awayTeam !== "Unknown") {
        selectedTeam = awayTeam
      }

      if (selectedTeam) {
        addTeamStats(
          selectedTeam,
          sport,
          1,
          isWin ? 1 : 0,
          isLoss ? 1 : 0,
          isPush ? 1 : 0,
          betProfit
        )
      }
    })

    // Sort by number of bets and return top 10
    // Round fractional values from totals bets (over/under split between teams)
    return Array.from(teamMap.entries())
      .map(([team, stats]) => ({
        team,
        bets: Math.round(stats.bets),
        wins: Math.round(stats.wins),
        losses: Math.round(stats.losses),
        pushes: Math.round(stats.pushes),
        profit: Math.round(stats.profit * 100) / 100,
        winRate: stats.wins + stats.losses > 0
          ? (stats.wins / (stats.wins + stats.losses)) * 100
          : 0
      }))
      .filter(t => t.bets > 0) // Only show teams with at least 1 bet
      .sort((a, b) => b.bets - a.bets)
      .slice(0, 10)
  }, [propComprehensiveBets, pendingComprehensiveBets, unifiedBets])

  // Player betting statistics - count bets on specific players (props)
  const playerStats = useMemo(() => {
    const playerMap = new Map<string, { bets: number; wins: number; losses: number; pushes: number; profit: number }>()

    const addPlayerStats = (playerName: string, betsToAdd: number, wins: number, losses: number, pushes: number, profit: number) => {
      if (!playerMap.has(playerName)) {
        playerMap.set(playerName, { bets: 0, wins: 0, losses: 0, pushes: 0, profit: 0 })
      }
      const stats = playerMap.get(playerName)!
      stats.bets += betsToAdd
      stats.wins += wins
      stats.losses += losses
      stats.pushes += pushes
      stats.profit += profit
    }

    // Process all comprehensive bets (settled and pending)
    [...propComprehensiveBets, ...pendingComprehensiveBets].forEach(bet => {
      if (bet.playerName) {
        const betProfit = bet.actualReturn != null ? (bet.actualReturn - bet.stake) : 0
        addPlayerStats(
          bet.playerName,
          1,
          bet.outcome === 'win' ? 1 : 0,
          bet.outcome === 'loss' ? 1 : 0,
          bet.outcome === 'push' ? 1 : 0,
          betProfit
        )
      }
    })

    // Process parlay legs which often contain player props
    propParlays.forEach(parlay => {
      parlay.legs.forEach(leg => {
        if (leg.playerName) {
          addPlayerStats(
            leg.playerName,
            1,
            leg.outcome === 'won' ? 1 : 0,
            leg.outcome === 'lost' ? 1 : 0,
            leg.outcome === 'push' ? 1 : 0,
            0 // Leg-specific profit is complex to attribute in a parlay
          )
        }
      })
    })

    return Array.from(playerMap.entries())
      .map(([player, stats]) => ({
        player,
        bets: stats.bets,
        wins: stats.wins,
        losses: stats.losses,
        pushes: stats.pushes,
        profit: Math.round(stats.profit * 100) / 100,
        winRate: (stats.wins + stats.losses) > 0
          ? (stats.wins / (stats.wins + stats.losses)) * 100
          : 0
      }))
      .filter(p => p.bets > 0)
      .sort((a, b) => b.bets - a.bets)
      .slice(0, 10)
  }, [propComprehensiveBets, pendingComprehensiveBets, propParlays])

  // Bet type label mapping
  const formatBetTypeLabel = (bt: string): string => {
    const map: Record<string, string> = {
      moneyline: 'Moneyline', spread: 'Spread', total: 'Total (O/U)',
      parlay: 'Parlay', prop: 'Player Prop', player_prop: 'Player Prop',
      team_prop: 'Team Prop', future: 'Future', live: 'Live Bet',
      teaser: 'Teaser', alt_spread: 'Alt Spread', alt_total: 'Alt Total',
      system: 'System', round_robin: 'Round Robin', sgp: 'SGP', sgp_plus: 'SGP+',
      straight: 'Moneyline', other: 'Other',
    }
    return map[bt?.toLowerCase?.().replace(/[^a-z_]/g, '') ?? ''] ?? bt ?? 'Other'
  }

  // Performance by bet type
  const betTypePerformance = useMemo(() => {
    const typeMap = new Map<string, { wins: number; losses: number; pushes: number; pending: number; profit: number; staked: number }>()
    const processedIds = new Set<string>()

    const addEntry = (key: string, win: boolean, loss: boolean, push: boolean, pending: boolean, stake: number, profit: number) => {
      if (!typeMap.has(key)) typeMap.set(key, { wins: 0, losses: 0, pushes: 0, pending: 0, profit: 0, staked: 0 })
      const s = typeMap.get(key)!
      if (win) s.wins++; if (loss) s.losses++; if (push) s.pushes++; if (pending) s.pending++
      s.staked += stake; s.profit += profit
    }

    ;[...propComprehensiveBets, ...pendingComprehensiveBets].forEach(bet => {
      if (processedIds.has(bet.id)) return
      processedIds.add(bet.id)
      // Alt lines get their own category
      let label = formatBetTypeLabel(bet.betType)
      if (bet.variantType === 'alt_line' && (bet.betType === 'spread' || bet.betType === 'total')) {
        label = bet.betType === 'spread' ? 'Alt Spread' : 'Alt Total'
      }
      const p = bet.actualReturn != null ? bet.actualReturn - bet.stake : 0
      addEntry(label, bet.outcome === 'win', bet.outcome === 'loss', bet.outcome === 'push', !bet.outcome || bet.outcome === 'pending', bet.stake, p)
    })

    trades.forEach(trade => {
      if (processedIds.has(trade.id)) return
      processedIds.add(trade.id)
      const label = formatBetTypeLabel((trade as any).betType ?? 'other')
      const p = trade.actualReturn != null ? (trade.actualReturn - (trade.stake || 0)) : 0
      addEntry(label, trade.outcome === 'profit', trade.outcome === 'loss', trade.outcome === 'breakeven', !trade.outcome, trade.stake || 0, p)
    })

    return Array.from(typeMap.entries())
      .map(([type, s]) => ({
        type,
        wins: s.wins, losses: s.losses, pushes: s.pushes, pending: s.pending,
        totalBets: s.wins + s.losses + s.pushes + s.pending,
        profit: Math.round(s.profit * 100) / 100,
        roi: s.staked > 0 ? (s.profit / s.staked) * 100 : 0,
        winRate: (s.wins + s.losses) > 0 ? (s.wins / (s.wins + s.losses)) * 100 : 0,
      }))
      .filter(t => t.totalBets > 0)
      .sort((a, b) => b.totalBets - a.totalBets)
  }, [propComprehensiveBets, pendingComprehensiveBets, trades])

  // Live betting stats
  const liveBetStats = useMemo(() => {
    const liveBets = [...propComprehensiveBets, ...pendingComprehensiveBets].filter(b => b.isLiveBet)
    const settled = liveBets.filter(b => b.outcome && b.outcome !== 'pending')
    const wins = settled.filter(b => b.outcome === 'win').length
    const losses = settled.filter(b => b.outcome === 'loss').length
    const staked = settled.reduce((s, b) => s + b.stake, 0)
    const returned = settled.reduce((s, b) => s + (b.actualReturn ?? 0), 0)
    return { total: liveBets.length, settled: settled.length, wins, losses, winRate: settled.length > 0 ? (wins / settled.length) * 100 : 0, roi: staked > 0 ? ((returned - staked) / staked) * 100 : 0, profit: returned - staked }
  }, [propComprehensiveBets, pendingComprehensiveBets])

  // Futures tracker
  const futuresData = useMemo(() => {
    return [...propComprehensiveBets, ...pendingComprehensiveBets]
      .filter(b => b.marketLevel === 'future' || b.betType === 'future')
      .map(b => ({
        id: b.id,
        selection: b.description || [b.awayTeam, b.homeTeam].filter(Boolean).join(' / ') || 'Future Bet',
        sport: formatSportName(b.sport),
        odds: b.odds, stake: b.stake,
        outcome: b.outcome ?? 'pending',
        profit: b.actualReturn != null ? b.actualReturn - b.stake : 0,
        seasonId: b.seasonId,
      }))
      .sort((a, b) => (a.outcome === 'pending' ? -1 : 1) - (b.outcome === 'pending' ? -1 : 1))
  }, [propComprehensiveBets, pendingComprehensiveBets])

  // Alt line vs base line comparison
  const variantTypeStats = useMemo(() => {
    const allBets = [...propComprehensiveBets, ...pendingComprehensiveBets]
    const compute = (bets: ComprehensiveBet[]) => {
      const settled = bets.filter(b => b.outcome && b.outcome !== 'pending')
      const wins = settled.filter(b => b.outcome === 'win').length
      const staked = settled.reduce((s, b) => s + b.stake, 0)
      const returned = settled.reduce((s, b) => s + (b.actualReturn ?? 0), 0)
      return { total: bets.length, settled: settled.length, wins, winRate: settled.length > 0 ? (wins / settled.length) * 100 : 0, roi: staked > 0 ? ((returned - staked) / staked) * 100 : 0 }
    }
    return {
      base: compute(allBets.filter(b => !b.variantType || b.variantType === 'base_line')),
      alt: compute(allBets.filter(b => b.variantType === 'alt_line')),
    }
  }, [propComprehensiveBets, pendingComprehensiveBets])

  // Teaser & system parlay breakdown
  const advancedParlayStats = useMemo(() => {
    const computeParlayStats = (parlays: Parlay[]) => {
      const settled = parlays.filter(p => p.outcome !== 'pending')
      const wins = settled.filter(p => p.outcome === 'won').length
      const losses = settled.filter(p => p.outcome === 'lost').length
      const staked = settled.reduce((s, p) => s + (p.stake || 0), 0)
      const returned = settled.reduce((s, p) => s + (p.actualPayout || 0), 0)
      return { total: parlays.length, wins, losses, winRate: (wins + losses) > 0 ? (wins / (wins + losses)) * 100 : 0, roi: staked > 0 ? ((returned - staked) / staked) * 100 : 0, profit: returned - staked }
    }
    return {
      teasers: computeParlayStats(propParlays.filter(p => p.type === 'teaser')),
      systems: computeParlayStats(propParlays.filter(p => p.type === 'system' || p.type === 'round_robin')),
    }
  }, [propParlays])

  // Cumulative profit over time
  const cumulativeProfit = useMemo(() => {
    const sorted = [...trades]
      .filter(t => t.outcome && t.actualReturn != null)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    let cumulative = 0
    return sorted.map(trade => {
      const tradeProfit = (trade.actualReturn || 0) - (trade.stake || 0)
      cumulative += tradeProfit
      return {
        date: new Date(trade.timestamp).toLocaleDateString(),
        profit: cumulative
      }
    })
  }, [trades])

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-foreground">Betting Performance</h3>
            <p className="text-muted-foreground">Track your betting results and settle pending bets</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefreshData}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </div>
      </div>

      {/* Pending Bets Section */}
      {(pendingBets.length > 0 || pendingComprehensiveBets.length > 0) && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-orange-500" />
            <h4 className="text-lg font-semibold text-foreground">Settle Pending Bets</h4>
            <Badge variant="secondary">{pendingBets.length + pendingComprehensiveBets.length} pending</Badge>
          </div>

          <div className="space-y-3">
            {/* Show pending comprehensive bets first */}
            {pendingComprehensiveBets.map(bet => {
              // Helper to check if team name is valid/known
              const isValidTeam = (team: string | undefined) =>
                team && team.trim() !== "" && team !== "Unknown"

              // Determine display text: use description if teams are unknown/invalid
              const hasValidTeams = isValidTeam(bet.homeTeam) && isValidTeam(bet.awayTeam)
              const displayText = hasValidTeams
                ? `${bet.awayTeam} vs ${bet.homeTeam} - ${bet.betType}`
                : bet.description || `${bet.betType} bet`

              return (
              <Card key={bet.id} className="p-4 border-l-4 border-l-orange-500">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-foreground">
                      {displayText}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatSportName(bet.sport)} • ${bet.stake.toFixed(2)} • {bet.odds > 0 ? '+' : ''}{bet.odds}
                    </div>
                    {bet.emotions.before.emotion && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Pre-bet emotion: {bet.emotions.before.emotion}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleComprehensiveBetOutcome(bet.id, 'win')}
                      className="gap-1"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Win
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleComprehensiveBetOutcome(bet.id, 'loss')}
                      className="gap-1"
                    >
                      <XCircle className="h-4 w-4" />
                      Loss
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleComprehensiveBetOutcome(bet.id, 'push')}
                    >
                      Push
                    </Button>
                  </div>
                </div>
              </Card>
            )})}

            {/* Show legacy pending bet analyses */}
            {pendingBets.map(bet => (
              <Card key={bet.id} className="p-4 border-l-4 border-l-orange-500">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-foreground">{bet.description || 'Unknown Bet'}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatSportName(bet.sport || 'Unknown')} • ${bet.stake.toFixed(2)} • {(bet.odds ?? 0) > 0 ? '+' : ''}{bet.odds ?? 'N/A'}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleBetOutcome(bet.id, 'win')}
                      className="gap-1"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Win
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleBetOutcome(bet.id, 'loss')}
                      className="gap-1"
                    >
                      <XCircle className="h-4 w-4" />
                      Loss
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBetOutcome(bet.id, 'push')}
                    >
                      Push
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {(pendingBets.length + pendingComprehensiveBets.length) >= 5 && (
            <div className="mt-4 text-center">
              <Button variant="outline" size="sm">
                View All Pending Bets
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* KPI Cards */}
      <KPICardsGrid
        totalBets={metrics.totalBets}
        winRate={metrics.winRate}
        profit={metrics.profit}
        roi={metrics.roi}
        avgStake={avgStake}
        avgEV={metrics.avgEV}
        totalParlays={metrics.totalParlays}
        parlayWinRate={metrics.parlayWinRate}
        parlayROI={metrics.parlayROI}
        parlayPercentage={metrics.parlayPercentage}
      />

      {/* Outcome Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-primary" />
            <h4 className="font-semibold text-foreground">Outcome Distribution</h4>
          </div>
          {outcomeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={outcomeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {outcomeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'oklch(0.16 0.01 250)',
                    border: '1px solid oklch(0.18 0.01 250)',
                    borderRadius: '0.5rem',
                    color: 'oklch(0.98 0 0)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No bets recorded yet
            </div>
          )}
        </Card>

        {/* Cumulative Profit */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h4 className="font-semibold text-foreground">Cumulative Profit</h4>
          </div>
          {cumulativeProfit.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={cumulativeProfit}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.2 0.01 250)" />
                <XAxis
                  dataKey="date"
                  stroke="oklch(0.55 0.01 250)"
                  tick={{ fill: 'oklch(0.55 0.01 250)', fontSize: 12 }}
                />
                <YAxis
                  stroke="oklch(0.55 0.01 250)"
                  tick={{ fill: 'oklch(0.55 0.01 250)' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'oklch(0.16 0.01 250)',
                    border: '1px solid oklch(0.18 0.01 250)',
                    borderRadius: '0.5rem',
                    color: 'oklch(0.98 0 0)'
                  }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Profit']}
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="oklch(0.65 0.25 260)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No completed bets yet
            </div>
          )}
        </Card>
      </div>

      {/* Sport Performance */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h4 className="font-semibold text-foreground">Performance by Sport</h4>
        </div>
        {sportPerformance.length > 0 ? (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sportPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.2 0.01 250)" />
                <XAxis
                  dataKey="sport"
                  stroke="oklch(0.55 0.01 250)"
                  tick={{ fill: 'oklch(0.55 0.01 250)' }}
                />
                <YAxis
                  stroke="oklch(0.55 0.01 250)"
                  tick={{ fill: 'oklch(0.55 0.01 250)' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'oklch(0.16 0.01 250)',
                    border: '1px solid oklch(0.18 0.01 250)',
                    borderRadius: '0.5rem',
                    color: 'oklch(0.98 0 0)'
                  }}
                />
                <Legend />
                <Bar dataKey="wins" fill="oklch(0.65 0.18 150)" name="Wins" />
                <Bar dataKey="losses" fill="oklch(0.55 0.24 25)" name="Losses" />
              </BarChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sportPerformance.map(sport => (
                <Card key={sport.sport} className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h5 className="font-semibold text-foreground">{sport.sport}</h5>
                      <Badge variant="outline">{sport.totalBets} bets</Badge>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Win Rate:</span>
                        <Badge variant={sport.winRate >= 55 ? "default" : "secondary"}>
                          {sport.winRate.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Record:</span>
                        <span className="text-foreground">
                          {sport.wins}-{sport.losses}
                          {sport.pushes > 0 && `-${sport.pushes}P`}
                        </span>
                      </div>
                      {sport.pending > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Pending:</span>
                          <span className="text-orange-500">{sport.pending}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Profit:</span>
                        <span className={sport.profit >= 0 ? "text-success" : "text-destructive"}>
                          ${sport.profit.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            No sport data available yet
          </div>
        )}
      </Card>

      {/* Bet Type Performance */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h4 className="font-semibold text-foreground">Performance by Bet Type</h4>
        </div>
        {betTypePerformance.length > 0 ? (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={betTypePerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.2 0.01 250)" />
                <XAxis dataKey="type" stroke="oklch(0.55 0.01 250)" tick={{ fill: 'oklch(0.55 0.01 250)', fontSize: 11 }} />
                <YAxis stroke="oklch(0.55 0.01 250)" tick={{ fill: 'oklch(0.55 0.01 250)' }} />
                <Tooltip contentStyle={{ backgroundColor: 'oklch(0.16 0.01 250)', border: '1px solid oklch(0.18 0.01 250)', borderRadius: '0.5rem', color: 'oklch(0.98 0 0)' }} />
                <Legend />
                <Bar dataKey="wins" fill="oklch(0.65 0.18 150)" name="Wins" />
                <Bar dataKey="losses" fill="oklch(0.55 0.24 25)" name="Losses" />
              </BarChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {betTypePerformance.map(bt => (
                <Card key={bt.type} className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h5 className="font-semibold text-foreground">{bt.type}</h5>
                      <Badge variant="outline">{bt.totalBets} bets</Badge>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Win Rate:</span>
                        <Badge variant={bt.winRate >= 55 ? "default" : "secondary"}>{bt.winRate.toFixed(1)}%</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Record:</span>
                        <span className="text-foreground">{bt.wins}-{bt.losses}{bt.pushes > 0 ? `-${bt.pushes}P` : ''}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ROI:</span>
                        <span className={bt.roi >= 0 ? "text-success" : "text-destructive"}>{bt.roi.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Profit:</span>
                        <span className={bt.profit >= 0 ? "text-success" : "text-destructive"}>${bt.profit.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            No bet type data available yet
          </div>
        )}
      </Card>

      {/* Live Betting Performance */}
      {liveBetStats.total > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-primary" />
            <h4 className="font-semibold text-foreground">Live Betting Performance</h4>
            <Badge variant="secondary">{liveBetStats.total} live bets</Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/30">
              <div className="text-2xl font-bold text-foreground">{liveBetStats.total}</div>
              <div className="text-xs text-muted-foreground mt-1">Total Live Bets</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/30">
              <div className={`text-2xl font-bold ${liveBetStats.winRate >= 55 ? 'text-success' : 'text-foreground'}`}>
                {liveBetStats.winRate.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">Win Rate</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/30">
              <div className={`text-2xl font-bold ${liveBetStats.roi >= 0 ? 'text-success' : 'text-destructive'}`}>
                {liveBetStats.roi.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">ROI</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/30">
              <div className={`text-2xl font-bold ${liveBetStats.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                ${liveBetStats.profit.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Net Profit</div>
            </div>
          </div>
          {liveBetStats.settled > 0 && (
            <p className="text-xs text-muted-foreground mt-3">
              {liveBetStats.wins}W / {liveBetStats.losses}L from {liveBetStats.settled} settled live bets
            </p>
          )}
        </Card>
      )}

      {/* Futures Tracker */}
      {futuresData.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-primary" />
            <h4 className="font-semibold text-foreground">Futures Tracker</h4>
            <Badge variant="secondary">{futuresData.filter(f => f.outcome === 'pending').length} pending</Badge>
          </div>
          <div className="space-y-3">
            {futuresData.map(future => (
              <Card
                key={future.id}
                className={`p-4 border-l-4 ${future.outcome === 'pending' ? 'border-l-orange-500' : future.outcome === 'win' ? 'border-l-success' : 'border-l-destructive'}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate">{future.selection}</div>
                    <div className="text-sm text-muted-foreground">
                      {future.sport} • ${future.stake.toFixed(2)} @ {future.odds > 0 ? '+' : ''}{future.odds}
                      {future.seasonId ? ` • ${future.seasonId}` : ''}
                    </div>
                  </div>
                  <Badge variant={future.outcome === 'pending' ? 'secondary' : future.outcome === 'win' ? 'default' : 'destructive'}>
                    {future.outcome === 'pending'
                      ? 'Pending'
                      : future.outcome === 'win'
                        ? `+$${future.profit.toFixed(2)}`
                        : `-$${Math.abs(future.profit).toFixed(2)}`}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* Alt Lines vs Base Lines */}
      {variantTypeStats.alt.total > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h4 className="font-semibold text-foreground">Alt Lines vs Base Lines</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4 border-l-4 border-l-blue-500">
              <h5 className="font-semibold text-foreground mb-3">Base Lines</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Bets:</span>
                  <span>{variantTypeStats.base.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Win Rate:</span>
                  <Badge variant={variantTypeStats.base.winRate >= 55 ? "default" : "secondary"}>{variantTypeStats.base.winRate.toFixed(1)}%</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ROI:</span>
                  <span className={variantTypeStats.base.roi >= 0 ? "text-success" : "text-destructive"}>{variantTypeStats.base.roi.toFixed(1)}%</span>
                </div>
              </div>
            </Card>
            <Card className="p-4 border-l-4 border-l-purple-500">
              <h5 className="font-semibold text-foreground mb-3">Alt Lines</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Bets:</span>
                  <span>{variantTypeStats.alt.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Win Rate:</span>
                  <Badge variant={variantTypeStats.alt.winRate >= 55 ? "default" : "secondary"}>{variantTypeStats.alt.winRate.toFixed(1)}%</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ROI:</span>
                  <span className={variantTypeStats.alt.roi >= 0 ? "text-success" : "text-destructive"}>{variantTypeStats.alt.roi.toFixed(1)}%</span>
                </div>
              </div>
            </Card>
          </div>
        </Card>
      )}

      {/* Most Bet Teams */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-primary" />
          <h4 className="font-semibold text-foreground">Most Bet Teams</h4>
        </div>
        {teamStats.length > 0 ? (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={teamStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.2 0.01 250)" />
                <XAxis
                  type="number"
                  stroke="oklch(0.55 0.01 250)"
                  tick={{ fill: 'oklch(0.55 0.01 250)' }}
                />
                <YAxis
                  type="category"
                  dataKey="team"
                  stroke="oklch(0.55 0.01 250)"
                  tick={{ fill: 'oklch(0.55 0.01 250)', fontSize: 12 }}
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'oklch(0.16 0.01 250)',
                    border: '1px solid oklch(0.18 0.01 250)',
                    borderRadius: '0.5rem',
                    color: 'oklch(0.98 0 0)'
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'bets') return [value, 'Total Bets']
                    if (name === 'wins') return [value, 'Wins']
                    if (name === 'losses') return [value, 'Losses']
                    return [value, name]
                  }}
                />
                <Legend />
                <Bar dataKey="bets" fill="oklch(0.65 0.25 260)" name="Total Bets" />
              </BarChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamStats.slice(0, 6).map(team => (
                <Card key={team.team} className="p-4">
                  <div className="space-y-2">
                    <h5 className="font-semibold text-foreground truncate" title={team.team}>
                      {team.team}
                    </h5>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Bets:</span>
                        <Badge variant="outline">{team.bets}</Badge>
                      </div>
                      {(team.wins > 0 || team.losses > 0 || team.pushes > 0) && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Win Rate:</span>
                            <Badge variant={team.winRate >= 55 ? "default" : "secondary"}>
                              {team.winRate.toFixed(1)}%
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Record:</span>
                            <span className="text-foreground">
                              {team.wins}-{team.losses}
                              {team.pushes > 0 && `-${team.pushes}P`}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Profit:</span>
                            <span className={team.profit >= 0 ? "text-success" : "text-destructive"}>
                              ${team.profit.toFixed(2)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            No team data available yet. Log bets with team names to see statistics.
          </div>
        )}
      </Card>

      {/* Player Performance Insights */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-primary" />
          <h4 className="font-semibold text-foreground">Player Performance Insights</h4>
        </div>
        {playerStats.length > 0 ? (
          <div className="space-y-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={playerStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.2 0.01 250)" />
                <XAxis
                  dataKey="player"
                  stroke="oklch(0.55 0.01 250)"
                  tick={{ fill: 'oklch(0.55 0.01 250)', fontSize: 11 }}
                />
                <YAxis
                  stroke="oklch(0.55 0.01 250)"
                  tick={{ fill: 'oklch(0.55 0.01 250)' }}
                  label={{ value: 'Win Rate %', angle: -90, position: 'insideLeft', fill: 'oklch(0.55 0.01 250)' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'oklch(0.16 0.01 250)',
                    border: '1px solid oklch(0.18 0.01 250)',
                    borderRadius: '0.5rem',
                    color: 'oklch(0.98 0 0)'
                  }}
                />
                <Bar dataKey="winRate" name="Win Rate %">
                  {playerStats.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.winRate >= 50 ? 'oklch(0.65 0.18 150)' : 'oklch(0.55 0.24 25)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {playerStats.map(player => (
                <Card key={player.player} className="p-4 border-l-4 border-l-blue-500">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h5 className="font-semibold text-foreground truncate" title={player.player}>
                        {player.player}
                      </h5>
                      <Badge variant="outline">{player.bets} {player.bets === 1 ? 'bet' : 'bets'}</Badge>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Win Rate:</span>
                        <Badge variant={player.winRate >= 50 ? "default" : "secondary"}>
                          {player.winRate.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Record:</span>
                        <span className="text-foreground">{player.wins}-{player.losses}</span>
                      </div>
                      {player.profit !== 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Profit:</span>
                          <span className={player.profit >= 0 ? "text-success" : "text-destructive"}>
                            ${player.profit.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            <Target className="h-12 w-12 mx-auto opacity-20 mb-2" />
            <p>No player performance data available yet.</p>
            <p className="text-xs mt-1">Player statistics will appear here when you log player prop bets.</p>
          </div>
        )}
      </Card>

      {/* Advanced Parlay Breakdown */}
      {(advancedParlayStats.teasers.total > 0 || advancedParlayStats.systems.total > 0) && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-primary" />
            <h4 className="font-semibold text-foreground">Advanced Parlay Breakdown</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {advancedParlayStats.teasers.total > 0 && (
              <Card className="p-4 border-l-4 border-l-yellow-500">
                <h5 className="font-semibold text-foreground mb-3">Teasers</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Total:</span><Badge variant="outline">{advancedParlayStats.teasers.total}</Badge></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Record:</span><span>{advancedParlayStats.teasers.wins}-{advancedParlayStats.teasers.losses}</span></div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Win Rate:</span>
                    <Badge variant={advancedParlayStats.teasers.winRate >= 55 ? "default" : "secondary"}>{advancedParlayStats.teasers.winRate.toFixed(1)}%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ROI:</span>
                    <span className={advancedParlayStats.teasers.roi >= 0 ? "text-success" : "text-destructive"}>{advancedParlayStats.teasers.roi.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Profit:</span>
                    <span className={advancedParlayStats.teasers.profit >= 0 ? "text-success" : "text-destructive"}>${advancedParlayStats.teasers.profit.toFixed(2)}</span>
                  </div>
                </div>
              </Card>
            )}
            {advancedParlayStats.systems.total > 0 && (
              <Card className="p-4 border-l-4 border-l-green-500">
                <h5 className="font-semibold text-foreground mb-3">System / Round Robin</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Total:</span><Badge variant="outline">{advancedParlayStats.systems.total}</Badge></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Record:</span><span>{advancedParlayStats.systems.wins}-{advancedParlayStats.systems.losses}</span></div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Win Rate:</span>
                    <Badge variant={advancedParlayStats.systems.winRate >= 55 ? "default" : "secondary"}>{advancedParlayStats.systems.winRate.toFixed(1)}%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ROI:</span>
                    <span className={advancedParlayStats.systems.roi >= 0 ? "text-success" : "text-destructive"}>{advancedParlayStats.systems.roi.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Profit:</span>
                    <span className={advancedParlayStats.systems.profit >= 0 ? "text-success" : "text-destructive"}>${advancedParlayStats.systems.profit.toFixed(2)}</span>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </Card>
      )}

      {/* Emotion Check-In Dialog for settling bets */}
      <EmotionCheckInDialog
        open={emotionCheckInOpen}
        onOpenChange={(open) => {
          setEmotionCheckInOpen(open)
          if (!open) {
            setBetBeingSettled(null)
            setPreSelectedOutcome(undefined)
          }
        }}
        onComplete={handleEmotionCheckInComplete}
        onBettingDataSaved={() => {
          // Refresh analytics after betting data is saved
          analyticsEvents.emit(ANALYTICS_EVENTS.BETTING_DATA_SAVED)
          if (onRefreshData) {
            onRefreshData()
          }
        }}
        preSelectedBet={betBeingSettled || undefined}
        preSelectedOutcome={preSelectedOutcome}
      />
    </div>
  )
}

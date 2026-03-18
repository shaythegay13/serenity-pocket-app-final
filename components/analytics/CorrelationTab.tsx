"use client"

import { useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts"
import { Activity, TrendingUp, TrendingDown, AlertTriangle, Brain, Target, Users } from "lucide-react"
import type { EmotionLog, Trade } from "@/lib/types"
import type { Parlay } from "@/lib/types/ai-models"
import type { ComprehensiveBet } from "@/lib/types/bet-tracking"
import type { EmotionOutcomePoint } from "./types"
import { EMOTION_SCORE_LOOKUP, EMOTION_CATEGORIES } from "./constants"
import { getMatchFormat, normalizeSportKey } from "@/lib/sports-config"
import { EmotionDotPlot } from "./EmotionDotPlot"

interface CorrelationTabProps {
  emotionLogs: EmotionLog[]
  trades: Trade[]
  parlays?: Parlay[]
  comprehensiveBets?: ComprehensiveBet[]
}

// Threshold for "high tilt" emotions
const TILT_THRESHOLD = 45


interface EmotionMatrixData {
  emotion: string
  winRate: number
  avgStake: number
  totalBets: number
  profitLoss: number
  roi: number
  riskPattern: string
}

export function CorrelationTab({ emotionLogs, trades, parlays = [], comprehensiveBets = [] }: CorrelationTabProps) {
  // Process data for emotion-betting matrix
  const emotionMatrixData = useMemo(() => {
    // Group trades by emotion category
    const emotionMap = new Map<string, {
      wins: number
      losses: number
      pushes: number
      totalStake: number
      totalProfitLoss: number
      count: number
    }>()

    // Initialize all emotion categories
    const allEmotions = ['joy', 'calm', 'fear', 'greed', 'frustration', 'sadness']
    allEmotions.forEach(emotion => {
      emotionMap.set(emotion, {
        wins: 0,
        losses: 0,
        pushes: 0,
        totalStake: 0,
        totalProfitLoss: 0,
        count: 0
      })
    })

    // Process trades with associated emotions
    trades.forEach(trade => {
      if (trade.preTradeEmotion && trade.stake && trade.outcome) {
        const emotionCategory = EMOTION_CATEGORIES[trade.preTradeEmotion.toLowerCase()] || 'calm'
        const data = emotionMap.get(emotionCategory)

        if (data) {
          data.count++
          data.totalStake += trade.stake

          const profitLoss = (trade.actualReturn || 0) - trade.stake
          data.totalProfitLoss += profitLoss

          if (trade.outcome === 'profit') {
            data.wins++
          } else if (trade.outcome === 'loss') {
            data.losses++
          } else {
            data.pushes++
          }
        }
      }
    })

    // Convert to matrix data format - ensure all 6 emotions are included
    const result: EmotionMatrixData[] = []

    allEmotions.forEach(emotion => {
      const data = emotionMap.get(emotion)
      if (data && data.count > 0) {
        const winRate = ((data.wins + data.pushes * 0.5) / data.count) * 100
        const avgStake = data.totalStake / data.count
        const roi = data.totalStake > 0 ? (data.totalProfitLoss / data.totalStake) * 100 : 0

        let riskPattern = 'Disciplined'
        if (emotion === 'greed' || emotion === 'frustration') {
          riskPattern = 'Aggressive'
        } else if (emotion === 'fear' || emotion === 'sadness') {
          riskPattern = 'Hesitant'
        } else if (emotion === 'joy') {
          riskPattern = 'Confident'
        }

        result.push({
          emotion,
          winRate: Math.round(winRate * 10) / 10,
          avgStake: Math.round(avgStake),
          totalBets: data.count,
          profitLoss: Math.round(data.totalProfitLoss),
          roi: Math.round(roi * 10) / 10,
          riskPattern
        })
      } else {
        // Add emotion with zero data to ensure all 6 are displayed
        let riskPattern = 'Disciplined'
        if (emotion === 'greed' || emotion === 'frustration') {
          riskPattern = 'Aggressive'
        } else if (emotion === 'fear' || emotion === 'sadness') {
          riskPattern = 'Hesitant'
        } else if (emotion === 'joy') {
          riskPattern = 'Confident'
        }

        result.push({
          emotion,
          winRate: 0,
          avgStake: 0,
          totalBets: 0,
          profitLoss: 0,
          roi: 0,
          riskPattern
        })
      }
    })

    // Sort by predefined emotion order: joy, calm, fear, greed, frustration, sadness
    const emotionOrder = ['joy', 'calm', 'fear', 'greed', 'frustration', 'sadness']
    return result.sort((a, b) => emotionOrder.indexOf(a.emotion) - emotionOrder.indexOf(b.emotion))
  }, [trades])

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    if (emotionMatrixData.length === 0) {
      return {
        bestPerformingState: null,
        highestRiskState: null,
        emotionalImpactScore: 0
      }
    }

    // Only consider emotions with actual betting data
    const emotionsWithData = emotionMatrixData.filter(d => d.totalBets > 0)

    if (emotionsWithData.length === 0) {
      return {
        bestPerformingState: null,
        highestRiskState: null,
        emotionalImpactScore: 0
      }
    }

    const bestPerformingState = emotionsWithData.reduce((best, current) =>
      current.winRate > best.winRate ? current : best
    )

    // Highest risk = lowest win rate (worst performance)
    // Ensure it's different from bestPerformingState when possible
    const otherEmotions = emotionsWithData.filter(d => d.emotion !== bestPerformingState.emotion)

    let highestRiskState
    if (otherEmotions.length > 0) {
      // Find the emotion with the lowest win rate among other emotions
      highestRiskState = otherEmotions.reduce((riskiest, current) =>
        current.winRate < riskiest.winRate ? current : riskiest
      )
    } else {
      // Only one emotion has data - this is an edge case
      highestRiskState = bestPerformingState
    }

    // Calculate emotional impact score based on performance variance
    const positiveEmotions = emotionMatrixData.filter(d => ['joy', 'calm'].includes(d.emotion))
    const negativeEmotions = emotionMatrixData.filter(d => ['greed', 'frustration', 'fear', 'sadness'].includes(d.emotion))

    const positiveAvgWinRate = positiveEmotions.reduce((sum, d) => sum + d.winRate, 0) / positiveEmotions.length || 0
    const negativeAvgWinRate = negativeEmotions.reduce((sum, d) => sum + d.winRate, 0) / negativeEmotions.length || 0

    const impactScore = Math.min(100, Math.round(Math.abs(positiveAvgWinRate - negativeAvgWinRate) * 2))

    return {
      bestPerformingState,
      highestRiskState,
      emotionalImpactScore: impactScore
    }
  }, [emotionMatrixData])

  // Prepare data for charts
  const stakeSizeData = emotionMatrixData.map(d => ({
    emotion: d.emotion.charAt(0).toUpperCase() + d.emotion.slice(1),
    stake: d.avgStake,
    fill: d.emotion === 'joy' || d.emotion === 'calm' ? '#22c55e' : '#ef4444'
  }))

  const profitLossData = emotionMatrixData.map(d => ({
    emotion: d.emotion.charAt(0).toUpperCase() + d.emotion.slice(1),
    profit: d.profitLoss,
    fill: d.profitLoss >= 0 ? '#22c55e' : '#ef4444'
  }))

  // Player behavior by emotion
  const playerEmotionStats = useMemo(() => {
    const statsMap = new Map<string, Map<string, number>>() // Player -> Emotion -> Count

    // Process trades (mapped from comprehensive bets)
    trades.forEach(trade => {
      if (trade.playerName && trade.preTradeEmotion) {
        const player = trade.playerName
        const emotion = trade.preTradeEmotion.toLowerCase()
        if (!statsMap.has(player)) statsMap.set(player, new Map())
        const emotionMap = statsMap.get(player)!
        emotionMap.set(emotion, (emotionMap.get(emotion) || 0) + 1)
      }
    })

    // Process parlay legs directly for more coverage
    parlays.forEach(parlay => {
      if (parlay.emotionAtCreation) {
        const emotion = parlay.emotionAtCreation.toLowerCase()
        parlay.legs.forEach(leg => {
          if (leg.playerName) {
            const player = leg.playerName
            if (!statsMap.has(player)) statsMap.set(player, new Map())
            const emotionMap = statsMap.get(player)!
            emotionMap.set(emotion, (emotionMap.get(emotion) || 0) + 1)
          }
        })
      }
    })

    // Also process comprehensive bets for PLAYER_VS_PLAYER sports (tennis, boxing, UFC, darts).
    // For these sports homeTeam/awayTeam hold competitor names, not team names.
    comprehensiveBets?.forEach(bet => {
      const fmt = getMatchFormat(normalizeSportKey(bet.sport || ''))
      if (fmt !== 'PLAYER_VS_PLAYER') return
      const emotion = bet.emotions?.before?.emotion?.toLowerCase()
      if (!emotion) return

      // Attribute the bet to the competitor that was actually selected
      const competitor =
        bet.playerName ||
        (bet.selection === 'home' ? bet.homeTeam : bet.selection === 'away' ? bet.awayTeam : null)

      if (!competitor || competitor === 'Unknown') return
      if (!statsMap.has(competitor)) statsMap.set(competitor, new Map())
      const emotionMap = statsMap.get(competitor)!
      emotionMap.set(emotion, (emotionMap.get(emotion) || 0) + 1)
    })

    return Array.from(statsMap.entries()).map(([player, emotions]) => {
      const sortedEmotions = Array.from(emotions.entries())
        .sort((a, b) => b[1] - a[1])

      return {
        player,
        dominantEmotion: sortedEmotions[0][0],
        totalBets: Array.from(emotions.values()).reduce((a, b) => a + b, 0)
      }
    }).sort((a, b) => b.totalBets - a.totalBets).slice(0, 5)
  }, [trades, parlays, comprehensiveBets])

  // Calculate detailed AI insights based on specific sub-emotions
  const aiInsights = useMemo(() => {
    const insights: Array<{ type: string, title: string, message: string, advice: string }> = []

    // Analyze trades by their specific pre-trade emotion (sub-emotions)
    const emotionStats = new Map<string, {
      wins: number
      losses: number
      totalBets: number
      totalStake: number
      totalProfitLoss: number
    }>()

    trades.forEach(trade => {
      if (trade.preTradeEmotion && trade.outcome) {
        const emotion = trade.preTradeEmotion.toLowerCase()
        const stats = emotionStats.get(emotion) || {
          wins: 0,
          losses: 0,
          totalBets: 0,
          totalStake: 0,
          totalProfitLoss: 0
        }

        stats.totalBets++
        stats.totalStake += trade.stake || 0
        const profitLoss = (trade.actualReturn || 0) - (trade.stake || 0)
        stats.totalProfitLoss += profitLoss

        if (trade.outcome === 'profit') {
          stats.wins++
        } else if (trade.outcome === 'loss') {
          stats.losses++
        }

        emotionStats.set(emotion, stats)
      }
    })

    if (emotionStats.size === 0) return insights

    // Convert to array and calculate metrics
    const emotionData = Array.from(emotionStats.entries()).map(([emotion, stats]) => ({
      emotion,
      ...stats,
      winRate: stats.totalBets > 0 ? (stats.wins / stats.totalBets) * 100 : 0,
      avgStake: stats.totalBets > 0 ? stats.totalStake / stats.totalBets : 0,
      roi: stats.totalStake > 0 ? (stats.totalProfitLoss / stats.totalStake) * 100 : 0
    })).filter(d => d.totalBets >= 2) // Only consider emotions with at least 2 bets

    if (emotionData.length === 0) return insights

    // Find best and worst performing specific emotions
    const sortedByWinRate = [...emotionData].sort((a, b) => b.winRate - a.winRate)
    const bestEmotion = sortedByWinRate[0]
    const worstEmotion = sortedByWinRate[sortedByWinRate.length - 1]

    if (bestEmotion && bestEmotion.winRate >= 50) {
      insights.push({
        type: 'strength',
        title: `Your "${bestEmotion.emotion}" state is a strength`,
        message: `When feeling ${bestEmotion.emotion}, you have a ${bestEmotion.winRate.toFixed(0)}% win rate across ${bestEmotion.totalBets} bets with ${bestEmotion.roi >= 0 ? '+' : ''}${bestEmotion.roi.toFixed(1)}% ROI.`,
        advice: `Try to recognize when you're in this state and consider it a green light for betting decisions.`
      })
    }

    if (worstEmotion && worstEmotion.winRate < 50 && worstEmotion.emotion !== bestEmotion?.emotion) {
      insights.push({
        type: 'warning',
        title: `Avoid betting when "${worstEmotion.emotion}"`,
        message: `Your win rate drops to ${worstEmotion.winRate.toFixed(0)}% when feeling ${worstEmotion.emotion}, resulting in ${worstEmotion.roi >= 0 ? '+' : ''}${worstEmotion.roi.toFixed(1)}% ROI across ${worstEmotion.totalBets} bets.`,
        advice: `When you notice this feeling, take a 15-minute break before placing any bets.`
      })
    }

    // Find emotions with highest stakes (potential loss chasing)
    const sortedByStake = [...emotionData].sort((a, b) => b.avgStake - a.avgStake)
    const highStakeEmotion = sortedByStake[0]
    const lowStakeEmotion = sortedByStake[sortedByStake.length - 1]

    if (highStakeEmotion && lowStakeEmotion &&
      highStakeEmotion.avgStake > lowStakeEmotion.avgStake * 1.5 &&
      highStakeEmotion.emotion !== lowStakeEmotion.emotion) {
      const stakeIncrease = ((highStakeEmotion.avgStake / lowStakeEmotion.avgStake) - 1) * 100
      const isNegativeEmotion = ['anxious', 'frustrated', 'angry', 'fomo', 'impulsive', 'desperate', 'stressed', 'panicked', 'resentful', 'bitter'].includes(highStakeEmotion.emotion)

      if (isNegativeEmotion) {
        insights.push({
          type: 'loss-chasing',
          title: `Stake escalation when "${highStakeEmotion.emotion}"`,
          message: `You bet ${stakeIncrease.toFixed(0)}% more ($${highStakeEmotion.avgStake.toFixed(0)} avg) when feeling ${highStakeEmotion.emotion} compared to ${lowStakeEmotion.emotion} ($${lowStakeEmotion.avgStake.toFixed(0)} avg).`,
          advice: `Set a hard stake limit before betting when in this emotional state. Consider using a fixed unit size regardless of emotions.`
        })
      }
    }

    // Find FOMO-specific patterns
    const fomoEmotions = emotionData.filter(d => ['fomo', 'impulsive', 'eager', 'restless', 'craving'].includes(d.emotion))
    if (fomoEmotions.length > 0) {
      const fomoTotalBets = fomoEmotions.reduce((sum, d) => sum + d.totalBets, 0)
      const fomoWins = fomoEmotions.reduce((sum, d) => sum + d.wins, 0)
      const fomoWinRate = fomoTotalBets > 0 ? (fomoWins / fomoTotalBets) * 100 : 0
      const fomoTotalPL = fomoEmotions.reduce((sum, d) => sum + d.totalProfitLoss, 0)

      if (fomoTotalBets >= 3) {
        insights.push({
          type: 'fomo-pattern',
          title: 'FOMO betting pattern detected',
          message: `Across ${fomoTotalBets} bets made when feeling impulsive/FOMO, your win rate is ${fomoWinRate.toFixed(0)}% with a total ${fomoTotalPL >= 0 ? 'profit' : 'loss'} of $${Math.abs(fomoTotalPL).toFixed(0)}.`,
          advice: fomoWinRate < 45
            ? `FOMO is costing you money. When you feel the urge to chase a bet, write down why you want it and wait 10 minutes.`
            : `You handle FOMO reasonably well, but stay vigilant. Impulsive decisions rarely improve over time.`
        })
      }
    }

    // Find confident/overconfident patterns
    const confidentEmotions = emotionData.filter(d => ['confident', 'overconfident', 'optimistic', 'euphoric'].includes(d.emotion))
    if (confidentEmotions.length > 0) {
      const confidentData = confidentEmotions.reduce((acc, d) => ({
        totalBets: acc.totalBets + d.totalBets,
        wins: acc.wins + d.wins,
        totalStake: acc.totalStake + d.totalStake,
        totalProfitLoss: acc.totalProfitLoss + d.totalProfitLoss
      }), { totalBets: 0, wins: 0, totalStake: 0, totalProfitLoss: 0 })

      if (confidentData.totalBets >= 3) {
        const winRate = (confidentData.wins / confidentData.totalBets) * 100
        const overconfidentOnly = emotionData.find(d => d.emotion === 'overconfident')

        if (overconfidentOnly && overconfidentOnly.winRate < 40) {
          insights.push({
            type: 'overconfidence',
            title: 'Overconfidence is hurting your results',
            message: `When you feel "overconfident," your win rate is only ${overconfidentOnly.winRate.toFixed(0)}% across ${overconfidentOnly.totalBets} bets.`,
            advice: `True confidence comes from process, not feelings. When feeling invincible, reduce your stake size by 50%.`
          })
        } else if (winRate >= 55) {
          insights.push({
            type: 'confidence-strength',
            title: 'Your confidence is well-calibrated',
            message: `When betting confidently, you achieve a ${winRate.toFixed(0)}% win rate. Your self-assessment appears accurate.`,
            advice: `Keep trusting your analysis when you feel genuine confidence backed by research.`
          })
        }
      }
    }

    // Calculate potential savings
    const allTotalBets = emotionData.reduce((sum, d) => sum + d.totalBets, 0)
    const allTotalPL = emotionData.reduce((sum, d) => sum + d.totalProfitLoss, 0)
    const negativeEmotionData = emotionData.filter(d =>
      ['anxious', 'frustrated', 'angry', 'fomo', 'impulsive', 'desperate', 'stressed', 'panicked', 'bitter', 'resentful', 'overwhelmed', 'tense'].includes(d.emotion)
    )
    const negativePL = negativeEmotionData.reduce((sum, d) => sum + d.totalProfitLoss, 0)

    if (negativePL < -50 && negativeEmotionData.length > 0) {
      insights.push({
        type: 'opportunity',
        title: 'Opportunity: Emotional betting costs',
        message: `You've lost $${Math.abs(negativePL).toFixed(0)} betting while in negative emotional states (${negativeEmotionData.map(d => d.emotion).join(', ')}).`,
        advice: `If you had skipped these bets entirely, your bankroll would be $${Math.abs(negativePL).toFixed(0)} higher. Consider implementing a pre-bet emotional check-in.`
      })
    }

    // Player-specific emotional insights
    playerEmotionStats.forEach(stat => {
      const dangerousEmotions = ['greed', 'fomo', 'impulsive', 'frustration', 'angry', 'desperate']
      if (stat.totalBets >= 2 && dangerousEmotions.includes(stat.dominantEmotion)) {
        insights.push({
          type: 'player-behavior',
          title: `Emotional pattern with ${stat.player}`,
          message: `You tend to bet on ${stat.player} when feeling "${stat.dominantEmotion}".`,
          advice: `Ask yourself if you're betting on ${stat.player} because of data, or because they are a familiar "comfort bet" during emotional times.`
        })
      }
    })

    // Add a general insight if we have enough data but no other insights
    if (insights.length === 0 && emotionData.length >= 2) {
      const avgWinRate = emotionData.reduce((sum, d) => sum + d.winRate * d.totalBets, 0) / allTotalBets
      insights.push({
        type: 'summary',
        title: 'Your emotional betting profile',
        message: `Across ${allTotalBets} tracked bets with emotional data, your average win rate is ${avgWinRate.toFixed(0)}% with a net ${allTotalPL >= 0 ? 'profit' : 'loss'} of $${Math.abs(allTotalPL).toFixed(0)}.`,
        advice: `Keep logging emotions to unlock more personalized insights. The more data you track, the clearer your patterns become.`
      })
    }

    return insights
  }, [trades, playerEmotionStats])

  // Tilt predictor analysis using comprehensive bets
  const tiltPredictors = useMemo(() => {
    // Filter to completed bets with emotional data
    const completedBets = comprehensiveBets.filter(bet =>
      bet.emotions?.before?.emotion &&
      bet.outcome &&
      bet.outcome !== "pending"
    )

    if (completedBets.length === 0) return { highRisk: [], optimal: [] }

    // Group by pre-bet emotion
    const emotionOutcomes: Record<string, { wins: number; losses: number; pushes: number; totalStake: number; totalPL: number }> = {}

    completedBets.forEach(bet => {
      const emotion = bet.emotions.before.emotion.toLowerCase()
      if (!emotionOutcomes[emotion]) {
        emotionOutcomes[emotion] = { wins: 0, losses: 0, pushes: 0, totalStake: 0, totalPL: 0 }
      }

      if (bet.outcome === "win") emotionOutcomes[emotion].wins++
      else if (bet.outcome === "loss") emotionOutcomes[emotion].losses++
      else emotionOutcomes[emotion].pushes++

      emotionOutcomes[emotion].totalStake += bet.stake
      emotionOutcomes[emotion].totalPL += bet.profitLoss || 0
    })

    const results = Object.entries(emotionOutcomes)
      .map(([emotion, stats]) => {
        const total = stats.wins + stats.losses + stats.pushes
        const emotionScore = EMOTION_SCORE_LOOKUP[emotion] ?? 50
        return {
          emotion,
          emotionScore,
          winRate: total > 0 ? (stats.wins / total) * 100 : 0,
          totalBets: total,
          totalPL: stats.totalPL,
          roi: stats.totalStake > 0 ? (stats.totalPL / stats.totalStake) * 100 : 0
        }
      })
      .filter(e => e.totalBets >= 2) // Need at least 2 bets

    // High-risk: tilt emotions (score < TILT_THRESHOLD) with low win rates
    const highRisk = results
      .filter(e => e.emotionScore < TILT_THRESHOLD)
      .sort((a, b) => a.winRate - b.winRate)
      .slice(0, 5)

    // Optimal: positive emotions (score >= 60) with high win rates
    const optimal = results
      .filter(e => e.emotionScore >= 60)
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, 5)

    return { highRisk, optimal }
  }, [comprehensiveBets])

  const getRiskPatternColor = (pattern: string) => {
    switch (pattern) {
      case 'Disciplined': return 'text-green-600'
      case 'Confident': return 'text-blue-600'
      case 'Hesitant': return 'text-yellow-600'
      case 'Aggressive': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-bold text-foreground">Emotion-Betting Matrix</h3>
        <p className="text-sm text-muted-foreground">
          How your emotional state affects your betting results
        </p>
      </div>

      {/* Emotion vs Performance Heatmap */}
      <EmotionDotPlot trades={trades} comprehensiveBets={comprehensiveBets} />

      {emotionMatrixData.length > 0 ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Best Performing State */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="h-8 w-8 text-green-500" />
                <Badge variant="outline" className="text-green-600 border-green-200">
                  Best Performance
                </Badge>
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-semibold capitalize">
                  {summaryMetrics.bestPerformingState?.emotion || 'N/A'}
                </h4>
                <div className="text-2xl font-bold text-green-600">
                  {summaryMetrics.bestPerformingState?.winRate || 0}% win rate
                </div>
                <div className="text-sm text-muted-foreground">
                  ${summaryMetrics.bestPerformingState?.avgStake || 0} average stake
                </div>
                {summaryMetrics.bestPerformingState && (
                  <div className="text-xs text-green-600">
                    +{Math.round(summaryMetrics.bestPerformingState.roi)}% vs your average
                  </div>
                )}
              </div>
            </Card>

            {/* Highest Risk State */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <AlertTriangle className="h-8 w-8 text-red-500" />
                <Badge variant="outline" className="text-red-600 border-red-200">
                  Highest Risk
                </Badge>
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-semibold capitalize">
                  {summaryMetrics.highestRiskState?.emotion || 'N/A'}
                </h4>
                <div className="text-2xl font-bold text-red-600">
                  {summaryMetrics.highestRiskState?.winRate || 0}% win rate
                </div>
                <div className="text-sm text-muted-foreground">
                  ${summaryMetrics.highestRiskState?.avgStake || 0} average stake
                </div>
                {summaryMetrics.highestRiskState && summaryMetrics.bestPerformingState &&
                  summaryMetrics.highestRiskState.emotion !== summaryMetrics.bestPerformingState.emotion && (
                    <div className="text-xs text-red-600">
                      {Math.round(summaryMetrics.bestPerformingState.winRate - summaryMetrics.highestRiskState.winRate)}% lower win rate than {summaryMetrics.bestPerformingState.emotion}
                    </div>
                  )}
              </div>
            </Card>

            {/* Emotional Impact Score */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Brain className="h-8 w-8 text-blue-500" />
                <Badge variant="outline" className="text-blue-600 border-blue-200">
                  Impact Score
                </Badge>
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-semibold">Emotional Impact</h4>
                <div className="text-2xl font-bold text-blue-600">
                  {summaryMetrics.emotionalImpactScore}/100
                </div>
                <div className="text-sm text-muted-foreground">
                  {summaryMetrics.emotionalImpactScore > 70 ? 'Strong correlation detected' :
                    summaryMetrics.emotionalImpactScore > 40 ? 'Moderate correlation detected' :
                      'Weak correlation detected'}
                </div>
                <div className="text-xs text-blue-600">
                  Emotions significantly affect outcomes
                </div>
              </div>
            </Card>
          </div>

          {/* Complete Emotion-Betting Matrix Table */}
          <Card className="p-6">
            <h4 className="text-lg font-semibold text-foreground mb-4">Complete Emotion-Betting Matrix</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Emotion</th>
                    <th className="text-right p-2">Win Rate</th>
                    <th className="text-right p-2">Avg Stake</th>
                    <th className="text-right p-2">Total Bets</th>
                    <th className="text-right p-2">Profit/Loss</th>
                    <th className="text-right p-2">ROI</th>
                    <th className="text-left p-2">Risk Pattern</th>
                  </tr>
                </thead>
                <tbody>
                  {emotionMatrixData.map((row, index) => (
                    <tr key={row.emotion} className="border-b">
                      <td className="p-2 font-medium capitalize">{row.emotion}</td>
                      <td className={`text-right p-2 font-medium ${row.winRate >= 70 ? 'text-green-600' :
                        row.winRate >= 50 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                        {row.winRate}%
                      </td>
                      <td className="text-right p-2">${row.avgStake}</td>
                      <td className="text-right p-2">{row.totalBets}</td>
                      <td className={`text-right p-2 font-medium ${row.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                        {row.profitLoss >= 0 ? '+' : ''}{row.profitLoss}
                      </td>
                      <td className={`text-right p-2 font-medium ${row.roi >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                        {row.roi >= 0 ? '+' : ''}{row.roi}%
                      </td>
                      <td className={`p-2 ${getRiskPatternColor(row.riskPattern)}`}>
                        <Badge variant="outline" className="text-xs">
                          {row.riskPattern}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Parlay vs Single Bet Psychology */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="h-5 w-5 text-purple-500" />
                <h4 className="text-lg font-semibold text-foreground">Parlay vs Single Psychology</h4>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Single Bets', data: trades.filter(t => !t.isParlay) },
                  { label: 'Parlays', data: trades.filter(t => t.isParlay) }
                ].map(group => {
                  const completed = group.data.filter(t => t.outcome && t.actualReturn != null)
                  const wins = completed.filter(t => t.outcome === 'profit').length
                  const winRate = completed.length > 0 ? (wins / completed.length) * 100 : 0
                  const avgIntensity = group.data.reduce((sum, t) => sum + (t.preTradeIntensity || 0), 0) / (group.data.length || 1)

                  return (
                    <div key={group.label} className="p-3 rounded-lg border border-border bg-muted/30">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold">{group.label}</span>
                        <Badge variant="outline">{group.data.length} tracked</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Win Rate</p>
                          <p className={`font-bold ${winRate >= 30 ? 'text-success' : 'text-foreground'}`}>
                            {winRate.toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Avg Intensity</p>
                          <p className="font-bold text-foreground">
                            {avgIntensity.toFixed(1)}/10
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-5 w-5 text-blue-500" />
                <h4 className="text-lg font-semibold text-foreground">Tilt Risk Assessment</h4>
              </div>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">High-Intensity Losses</p>
                  <p className="text-2xl font-bold text-red-600">
                    {trades.filter(t => t.outcome === 'loss' && (t.preTradeIntensity || 0) >= 4).length}
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                    Bets lost when emotional intensity was 4 or higher (on 1-5 scale).
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">Disciplined Wins</p>
                  <p className="text-2xl font-bold text-green-600">
                    {trades.filter(t => t.outcome === 'profit' && (t.preTradeIntensity || 0) <= 2).length}
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                    Wins achieved when emotional intensity was 2 or lower.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stake Size by Emotion */}
            <Card className="p-6">
              <h4 className="text-lg font-semibold text-foreground mb-4">Stake Size by Emotion</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stakeSizeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="emotion" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "0.5rem"
                    }}
                    formatter={(value: any) => [`$${value}`, "Average Stake"]}
                  />
                  <Bar dataKey="stake">
                    {stakeSizeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 text-center">
                <p className="text-sm text-red-600">
                  You bet {Math.round(
                    (stakeSizeData.find(d => d.emotion === 'Greed')?.stake || 0) /
                    (stakeSizeData.find(d => d.emotion === 'Calm')?.stake || 1)
                  )}x more when feeling greed or frustration
                </p>
              </div>
            </Card>

            {/* Profit/Loss by Emotion */}
            <Card className="p-6">
              <h4 className="text-lg font-semibold text-foreground mb-4">Profit/Loss by Emotion</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={profitLossData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="emotion" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "0.5rem"
                    }}
                    formatter={(value: any) => [
                      `$${value >= 0 ? '+' : ''}${value}`,
                      "Profit/Loss"
                    ]}
                  />
                  <Bar dataKey="profit">
                    {profitLossData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* AI Pattern Analysis */}
          <Card className="p-6">
            <h4 className="text-lg font-semibold text-foreground mb-4">AI Pattern Analysis</h4>
            <div className="space-y-4">
              {aiInsights.length > 0 ? (
                aiInsights.map((insight, index) => {
                  const getInsightIcon = () => {
                    switch (insight.type) {
                      case 'strength':
                      case 'confidence-strength':
                        return <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
                      case 'warning':
                      case 'loss-chasing':
                      case 'overconfidence':
                        return <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                      case 'fomo-pattern':
                        return <TrendingDown className="h-5 w-5 text-orange-500 mt-0.5" />
                      case 'opportunity':
                        return <Activity className="h-5 w-5 text-blue-500 mt-0.5" />
                      case 'player-behavior':
                        return <Target className="h-5 w-5 text-indigo-500 mt-0.5" />
                      default:
                        return <Brain className="h-5 w-5 text-purple-500 mt-0.5" />
                    }
                  }

                  const getBgColor = () => {
                    switch (insight.type) {
                      case 'strength':
                      case 'confidence-strength':
                        return 'bg-green-50 dark:bg-green-950/50 border-l-4 border-green-400 dark:border-green-600'
                      case 'warning':
                      case 'loss-chasing':
                      case 'overconfidence':
                        return 'bg-red-50 dark:bg-red-950/50 border-l-4 border-red-400 dark:border-red-600'
                      case 'fomo-pattern':
                        return 'bg-orange-50 dark:bg-orange-950/50 border-l-4 border-orange-400 dark:border-orange-600'
                      case 'opportunity':
                        return 'bg-blue-50 dark:bg-blue-950/50 border-l-4 border-blue-400 dark:border-blue-600'
                      default:
                        return 'bg-gray-50 dark:bg-gray-800/50 border-l-4 border-gray-400 dark:border-gray-600'
                    }
                  }

                  return (
                    <div key={index} className={`p-4 rounded-lg ${getBgColor()}`}>
                      <div className="flex items-start gap-3">
                        {getInsightIcon()}
                        <div className="flex-1">
                          <h5 className="font-semibold mb-1">{insight.title}</h5>
                          <p className="text-sm text-muted-foreground mb-2">{insight.message}</p>
                          <div className="text-sm font-medium text-foreground bg-white/60 dark:bg-white/10 rounded p-2">
                            💡 {insight.advice}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Brain className="h-12 w-12 mx-auto opacity-50 mb-2" />
                  <p>Keep betting to generate AI insights about your patterns</p>
                </div>
              )}
            </div>
          </Card>

          {/* Pre-Bet Emotion Impact (Tilt Predictors) */}
          {(tiltPredictors.highRisk.length > 0 || tiltPredictors.optimal.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* High-Risk Pre-Bet Emotions */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <h4 className="text-lg font-semibold text-foreground">High-Risk Pre-Bet Emotions</h4>
                </div>
                {tiltPredictors.highRisk.length > 0 ? (
                  <div className="space-y-3">
                    {tiltPredictors.highRisk.map((emotion, idx) => (
                      <div key={emotion.emotion} className="flex items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-red-500">#{idx + 1}</span>
                          <div>
                            <p className="font-medium text-foreground capitalize">{emotion.emotion}</p>
                            <p className="text-xs text-muted-foreground">
                              {emotion.totalBets} bets • ROI: {emotion.roi > 0 ? '+' : ''}{emotion.roi.toFixed(0)}%
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-red-500">{emotion.winRate.toFixed(0)}%</p>
                          <p className="text-xs text-muted-foreground">win rate</p>
                        </div>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground mt-4">
                      Consider NOT betting when feeling these emotions - your outcomes suffer significantly.
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Brain className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Not enough tilt emotion data yet</p>
                  </div>
                )}
              </Card>

              {/* Optimal Pre-Bet Emotions */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <h4 className="text-lg font-semibold text-foreground">Optimal Pre-Bet Emotions</h4>
                </div>
                {tiltPredictors.optimal.length > 0 ? (
                  <div className="space-y-3">
                    {tiltPredictors.optimal.map((emotion, idx) => (
                      <div key={emotion.emotion} className="flex items-center justify-between p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-green-500">#{idx + 1}</span>
                          <div>
                            <p className="font-medium text-foreground capitalize">{emotion.emotion}</p>
                            <p className="text-xs text-muted-foreground">
                              {emotion.totalBets} bets • ROI: {emotion.roi > 0 ? '+' : ''}{emotion.roi.toFixed(0)}%
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-500">{emotion.winRate.toFixed(0)}%</p>
                          <p className="text-xs text-muted-foreground">win rate</p>
                        </div>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground mt-4">
                      You perform best when betting with these emotional states.
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Brain className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Not enough positive emotion data yet</p>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* Player Behavioral Correlations */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-5 w-5 text-indigo-500" />
              <h4 className="text-lg font-semibold text-foreground">Player Behavioral Correlations</h4>
            </div>
            {playerEmotionStats.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {playerEmotionStats.map(stat => (
                    <div key={stat.player} className="p-4 rounded-lg bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-foreground truncate max-w-[150px]" title={stat.player}>
                          {stat.player}
                        </span>
                        <Badge variant="outline" className="text-indigo-600 border-indigo-200">
                          {stat.totalBets} {stat.totalBets === 1 ? 'bet' : 'bets'}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Dominant state: <span className="font-medium text-indigo-600 capitalize">{stat.dominantEmotion}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs text-muted-foreground italic text-center">
                  Patterns are detected across single bets and individual parlay legs
                </p>
              </>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto opacity-20 mb-2" />
                <p>No player-specific behavioral patterns detected yet.</p>
                <p className="text-xs mt-1">Log bets with player names to see emotional correlations.</p>
              </div>
            )}
          </Card>
        </>
      ) : (
        <Card className="p-8 text-center">
          <div className="flex justify-center mb-4">
            <Activity className="h-12 w-12 text-muted-foreground opacity-50" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No Data Available</h3>
          <p className="text-muted-foreground">
            Start logging emotions and placing bets to see your emotion-betting matrix
          </p>
        </Card>
      )}
    </div>
  )
}

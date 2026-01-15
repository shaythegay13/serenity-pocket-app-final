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
import { Activity, TrendingUp, TrendingDown, AlertTriangle, Brain } from "lucide-react"
import type { EmotionLog, Trade } from "@/lib/types"
import type { EmotionOutcomePoint } from "./types"
import { EMOTION_SCORE_LOOKUP } from "./constants"

interface CorrelationTabProps {
  emotionLogs: EmotionLog[]
  trades: Trade[]
}

// Emotion categories for grouping
const EMOTION_CATEGORIES: Record<string, string> = {
  // Positive emotions
  'happy': 'joy',
  'excited': 'joy',
  'optimistic': 'joy',
  'grateful': 'joy',
  'confident': 'joy',
  'proud': 'joy',
  'hopeful': 'joy',
  'content': 'calm',
  'cheerful': 'joy',
  'inspired': 'joy',
  'peaceful': 'calm',
  'relaxed': 'calm',
  'centered': 'calm',
  'focused': 'calm',
  'balanced': 'calm',
  'serene': 'calm',
  'patient': 'calm',
  'composed': 'calm',
  'tranquil': 'calm',
  'stable': 'calm',
  
  // Negative emotions
  'anxious': 'fear',
  'worried': 'fear',
  'nervous': 'fear',
  'scared': 'fear',
  'uncertain': 'fear',
  'panicked': 'fear',
  'hesitant': 'fear',
  'overwhelmed': 'fear',
  'tense': 'fear',
  'uneasy': 'fear',
  'fomo': 'greed',
  'euphoric': 'greed',
  'impulsive': 'greed',
  'overconfident': 'greed',
  'eager': 'greed',
  'craving': 'greed',
  'obsessed': 'greed',
  'compulsive': 'greed',
  'restless': 'greed',
  'driven': 'greed',
  'angry': 'frustration',
  'irritated': 'frustration',
  'disappointed': 'frustration',
  'impatient': 'frustration',
  'stressed': 'frustration',
  'resentful': 'frustration',
  'annoyed': 'frustration',
  'agitated': 'frustration',
  'bitter': 'frustration',
  'exhausted': 'frustration',
  'down': 'sadness',
  'discouraged': 'sadness',
  'regretful': 'sadness',
  'defeated': 'sadness',
  'helpless': 'sadness',
  'lonely': 'sadness',
  'empty': 'sadness',
  'hopeless': 'sadness',
  'dejected': 'sadness',
  'grief': 'sadness'
}

interface EmotionMatrixData {
  emotion: string
  winRate: number
  avgStake: number
  totalBets: number
  profitLoss: number
  roi: number
  riskPattern: string
}

export function CorrelationTab({ emotionLogs, trades }: CorrelationTabProps) {
  // Process data for emotion-betting matrix
  const emotionMatrixData = useMemo(() => {
    // Group trades by emotion category
    const emotionMap = new Map<string, {
      wins: number
      losses: number
      breakevens: number
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
        breakevens: 0,
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
            data.breakevens++
          }
        }
      }
    })

    // Convert to matrix data format - ensure all 6 emotions are included
    const result: EmotionMatrixData[] = []
    
    allEmotions.forEach(emotion => {
      const data = emotionMap.get(emotion)
      if (data && data.count > 0) {
        const winRate = ((data.wins + data.breakevens * 0.5) / data.count) * 100
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

    const bestPerformingState = emotionMatrixData.reduce((best, current) => 
      current.winRate > best.winRate ? current : best
    )

    const highestRiskState = emotionMatrixData.reduce((riskiest, current) => 
      current.avgStake > riskiest.avgStake ? current : riskiest
    )

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

  // Calculate AI insights
  const aiInsights = useMemo(() => {
    const insights: Array<{type: string, message: string}> = []
    
    if (emotionMatrixData.length === 0) return insights

    // Loss chasing analysis
    const negativeEmotions = emotionMatrixData.filter(d => ['greed', 'frustration'].includes(d.emotion))
    const positiveEmotions = emotionMatrixData.filter(d => ['joy', 'calm'].includes(d.emotion))
    
    if (negativeEmotions.length > 0 && positiveEmotions.length > 0) {
      const negAvgStake = negativeEmotions.reduce((sum, d) => sum + d.avgStake, 0) / negativeEmotions.length
      const posAvgStake = positiveEmotions.reduce((sum, d) => sum + d.avgStake, 0) / positiveEmotions.length
      
      if (negAvgStake > posAvgStake * 1.4) {
        insights.push({
          type: 'loss-chasing',
          message: `You increase bet size by ${Math.round((negAvgStake / posAvgStake - 1) * 100)}% after losses when experiencing greed or frustration.`
        })
      }
    }

    // Emotional discipline gap
    const negativeLosses = negativeEmotions.reduce((sum, d) => sum + d.totalBets, 0)
    const totalBets = emotionMatrixData.reduce((sum, d) => sum + d.totalBets, 0)
    
    if (totalBets > 0 && (negativeLosses / totalBets) > 0.7) {
      insights.push({
        type: 'discipline-gap',
        message: `${Math.round((negativeLosses / totalBets) * 100)}% of your losses occur when betting in negative emotional states, but you continue betting in these states.`
      })
    }

    // Opportunity calculation
    const posROI = positiveEmotions.reduce((sum, d) => sum + d.roi, 0) / positiveEmotions.length || 0
    const totalROI = emotionMatrixData.reduce((sum, d) => sum + d.roi * d.totalBets, 0) / totalBets || 0
    
    if (posROI > totalROI * 1.5) {
      insights.push({
        type: 'opportunity',
        message: `If you only bet when calm or joyful, your projected ROI would increase from ${totalROI.toFixed(1)}% to ${posROI.toFixed(1)}%.`
      })
    }

    return insights
  }, [emotionMatrixData])

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
                {summaryMetrics.highestRiskState && summaryMetrics.bestPerformingState && (
                  <div className="text-xs text-red-600">
                    {Math.round(summaryMetrics.highestRiskState.avgStake / summaryMetrics.bestPerformingState.avgStake)}x higher stakes when {summaryMetrics.highestRiskState.emotion}
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
                      <td className={`text-right p-2 font-medium ${
                        row.winRate >= 70 ? 'text-green-600' : 
                        row.winRate >= 50 ? 'text-yellow-600' : 
                        'text-red-600'
                      }`}>
                        {row.winRate}%
                      </td>
                      <td className="text-right p-2">${row.avgStake}</td>
                      <td className="text-right p-2">{row.totalBets}</td>
                      <td className={`text-right p-2 font-medium ${
                        row.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {row.profitLoss >= 0 ? '+' : ''}{row.profitLoss}
                      </td>
                      <td className={`text-right p-2 font-medium ${
                        row.roi >= 0 ? 'text-green-600' : 'text-red-600'
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
                aiInsights.map((insight, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      {insight.type === 'loss-chasing' && <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />}
                      {insight.type === 'discipline-gap' && <Brain className="h-5 w-5 text-yellow-500 mt-0.5" />}
                      {insight.type === 'opportunity' && <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />}
                      <div className="flex-1">
                        <h5 className="font-medium mb-1">
                          {insight.type === 'loss-chasing' && 'Loss Chasing Detected'}
                          {insight.type === 'discipline-gap' && 'Emotional Discipline Gap'}
                          {insight.type === 'opportunity' && 'Opportunity'}
                        </h5>
                        <p className="text-sm text-muted-foreground">{insight.message}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Brain className="h-12 w-12 mx-auto opacity-50 mb-2" />
                  <p>Keep betting to generate AI insights about your patterns</p>
                </div>
              )}
            </div>
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

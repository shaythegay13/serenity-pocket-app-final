/**
 * Data Reconciliation Service
 *
 * Automatically scans all data sources and syncs any missing data
 * that may not have been properly saved or synced due to:
 * - Network issues during save
 * - Missing event emissions
 * - localStorage-only saves before Supabase sync
 *
 * This runs automatically and doesn't require user intervention.
 */

import { supabase } from "@/lib/supabase"
import { storageHybrid as storage } from "@/lib/storage-hybrid"
import { analyticsEvents, ANALYTICS_EVENTS } from "@/lib/events"
import type { EmotionLog, BetAnalysis, Trade } from "@/lib/types"
import type { ComprehensiveBet } from "@/lib/types/bet-tracking"

// Track reconciliation state to prevent multiple simultaneous runs
let isReconciling = false
let lastReconciliationTime = 0
const RECONCILIATION_COOLDOWN = 60000 // 1 minute cooldown between reconciliations

interface ReconciliationResult {
  emotionLogsReconciled: number
  betAnalysesReconciled: number
  comprehensiveBetsReconciled: number
  tradesReconciled: number
  errors: string[]
}

/**
 * Main reconciliation function - call this to trigger a full data sync check
 */
export async function reconcileAllData(): Promise<ReconciliationResult> {
  // Prevent concurrent reconciliations
  if (isReconciling) {
    console.log('[DataReconciliation] Already in progress, skipping...')
    return { emotionLogsReconciled: 0, betAnalysesReconciled: 0, comprehensiveBetsReconciled: 0, tradesReconciled: 0, errors: [] }
  }

  // Check cooldown
  const now = Date.now()
  if (now - lastReconciliationTime < RECONCILIATION_COOLDOWN) {
    console.log('[DataReconciliation] Cooldown active, skipping...')
    return { emotionLogsReconciled: 0, betAnalysesReconciled: 0, comprehensiveBetsReconciled: 0, tradesReconciled: 0, errors: [] }
  }

  isReconciling = true
  lastReconciliationTime = now

  const result: ReconciliationResult = {
    emotionLogsReconciled: 0,
    betAnalysesReconciled: 0,
    comprehensiveBetsReconciled: 0,
    tradesReconciled: 0,
    errors: []
  }

  try {
    console.log('[DataReconciliation] Starting automatic data reconciliation...')

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log('[DataReconciliation] User not authenticated, skipping Supabase sync')
      isReconciling = false
      return result
    }

    // Run all reconciliation tasks in parallel
    const [emotionResult, betAnalysisResult, comprehensiveBetResult, tradeResult] = await Promise.allSettled([
      reconcileEmotionLogs(user.id),
      reconcileBetAnalyses(user.id),
      reconcileComprehensiveBets(user.id),
      reconcileTrades(user.id)
    ])

    // Process results
    if (emotionResult.status === 'fulfilled') {
      result.emotionLogsReconciled = emotionResult.value
    } else {
      result.errors.push(`EmotionLogs: ${emotionResult.reason}`)
    }

    if (betAnalysisResult.status === 'fulfilled') {
      result.betAnalysesReconciled = betAnalysisResult.value
    } else {
      result.errors.push(`BetAnalyses: ${betAnalysisResult.reason}`)
    }

    if (comprehensiveBetResult.status === 'fulfilled') {
      result.comprehensiveBetsReconciled = comprehensiveBetResult.value
    } else {
      result.errors.push(`ComprehensiveBets: ${comprehensiveBetResult.reason}`)
    }

    if (tradeResult.status === 'fulfilled') {
      result.tradesReconciled = tradeResult.value
    } else {
      result.errors.push(`Trades: ${tradeResult.reason}`)
    }

    // If any data was reconciled, emit events to refresh analytics
    const totalReconciled = result.emotionLogsReconciled + result.betAnalysesReconciled +
                           result.comprehensiveBetsReconciled + result.tradesReconciled

    if (totalReconciled > 0) {
      console.log(`[DataReconciliation] Reconciled ${totalReconciled} records, refreshing analytics...`)
      analyticsEvents.emit(ANALYTICS_EVENTS.BETTING_DATA_SAVED)
      analyticsEvents.emit(ANALYTICS_EVENTS.EMOTION_LOGGED)
    }

    console.log('[DataReconciliation] Complete:', result)

  } catch (error) {
    console.error('[DataReconciliation] Error:', error)
    result.errors.push(error instanceof Error ? error.message : 'Unknown error')
  } finally {
    isReconciling = false
  }

  return result
}

/**
 * Reconcile emotion logs - sync localStorage to Supabase
 */
async function reconcileEmotionLogs(userId: string): Promise<number> {
  let reconciled = 0

  try {
    // Get localStorage emotion logs
    const localLogs = getLocalStorageData<EmotionLog[]>('serenity_emotion_logs') || []
    if (localLogs.length === 0) return 0

    // Get Supabase emotion logs
    const { data: supabaseLogs, error } = await supabase
      .from('emotion_logs')
      .select('id, timestamp, emotion')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(500)

    if (error) {
      console.error('[DataReconciliation] Error fetching emotion logs:', error)
      return 0
    }

    // Create a set of existing Supabase log identifiers (timestamp + emotion combo)
    const existingKeys = new Set(
      (supabaseLogs || []).map(log => `${new Date(log.timestamp).getTime()}-${log.emotion}`)
    )

    // Find local logs that don't exist in Supabase
    const missingLogs = localLogs.filter(log => {
      const key = `${new Date(log.timestamp).getTime()}-${log.emotion}`
      return !existingKeys.has(key)
    })

    // Sync missing logs to Supabase
    for (const log of missingLogs.slice(0, 50)) { // Limit batch size
      try {
        const { error: insertError } = await supabase
          .from('emotion_logs')
          .insert({
            user_id: userId,
            emotion: log.emotion,
            intensity: log.intensity,
            notes: log.context || '',
            phase: log.phase,
            timestamp: new Date(log.timestamp).toISOString()
          })

        if (!insertError) {
          reconciled++
        }
      } catch (e) {
        // Continue with other logs
      }
    }

  } catch (error) {
    console.error('[DataReconciliation] Error reconciling emotion logs:', error)
  }

  return reconciled
}

/**
 * Reconcile bet analyses - sync localStorage to Supabase
 */
async function reconcileBetAnalyses(userId: string): Promise<number> {
  let reconciled = 0

  try {
    // Get localStorage bet analyses
    const localAnalyses = getLocalStorageData<BetAnalysis[]>('serenity_bet_analyses') || []
    if (localAnalyses.length === 0) return 0

    // Get Supabase bet analyses
    const { data: supabaseAnalyses, error } = await supabase
      .from('bet_analyses')
      .select('id, timestamp, description, stake')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(500)

    if (error) {
      console.error('[DataReconciliation] Error fetching bet analyses:', error)
      return 0
    }

    // Create a set of existing identifiers
    const existingKeys = new Set(
      (supabaseAnalyses || []).map(a => `${new Date(a.timestamp).getTime()}-${a.description}-${a.stake}`)
    )

    // Find local analyses that don't exist in Supabase
    const missingAnalyses = localAnalyses.filter(analysis => {
      const key = `${new Date(analysis.timestamp).getTime()}-${analysis.description}-${analysis.stake}`
      return !existingKeys.has(key)
    })

    // Sync missing analyses to Supabase
    for (const analysis of missingAnalyses.slice(0, 50)) {
      try {
        const sanitizeNumber = (val: any): number | null => {
          if (val === null || val === undefined) return null
          const num = typeof val === 'number' ? val : parseFloat(val)
          return isNaN(num) ? null : num
        }

        const { error: insertError } = await supabase
          .from('bet_analyses')
          .insert({
            user_id: userId,
            bet_type: analysis.betType || 'straight',
            sport: analysis.sport || 'general',
            description: analysis.description || '',
            odds: sanitizeNumber(analysis.odds),
            stake: sanitizeNumber(analysis.stake),
            emotional_state: analysis.emotionalState || 'neutral',
            emotional_intensity: Math.round(analysis.emotionalIntensity ?? 5),
            bias_warnings: analysis.biasWarnings || [],
            ai_recommendation: analysis.aiRecommendation || '',
            expected_value: sanitizeNumber(analysis.expectedValue),
            probability_estimate: sanitizeNumber(analysis.probabilityEstimate),
            outcome: analysis.outcome || 'pending',
            actual_return: sanitizeNumber(analysis.actualReturn),
            timestamp: new Date(analysis.timestamp).toISOString()
          })

        if (!insertError) {
          reconciled++
        }
      } catch (e) {
        // Continue with other analyses
      }
    }

  } catch (error) {
    console.error('[DataReconciliation] Error reconciling bet analyses:', error)
  }

  return reconciled
}

/**
 * Reconcile comprehensive bets - sync localStorage to Supabase
 */
async function reconcileComprehensiveBets(userId: string): Promise<number> {
  let reconciled = 0

  try {
    // Get localStorage comprehensive bets
    const localBets = getLocalStorageData<ComprehensiveBet[]>('serenity_comprehensive_bets') || []
    if (localBets.length === 0) return 0

    // Get Supabase comprehensive bets
    const { data: supabaseBets, error } = await supabase
      .from('comprehensive_bets')
      .select('id')
      .eq('user_id', userId)
      .limit(500)

    if (error) {
      console.error('[DataReconciliation] Error fetching comprehensive bets:', error)
      return 0
    }

    // Create a set of existing IDs
    const existingIds = new Set((supabaseBets || []).map(b => b.id))

    // Find local bets that don't exist in Supabase
    const missingBets = localBets.filter(bet => !existingIds.has(bet.id))

    // Sync missing bets to Supabase
    for (const bet of missingBets.slice(0, 50)) {
      try {
        const { error: insertError } = await supabase
          .from('comprehensive_bets')
          .insert({
            id: bet.id,
            user_id: userId,
            timestamp: new Date(bet.timestamp).toISOString(),
            sport: bet.sport,
            league: bet.league,
            home_team: bet.homeTeam,
            away_team: bet.awayTeam,
            game_date: new Date(bet.gameDate).toISOString(),
            bet_type: bet.betType,
            selection: bet.selection,
            line: bet.line,
            odds: bet.odds,
            stake: bet.stake,
            emotions: bet.emotions,
            biases_identified: bet.biasesIdentified,
            confidence_level: bet.confidenceLevel,
            reasoning: bet.reasoning,
            is_live_bet: bet.isLiveBet,
            is_chasing_loss: bet.isChasingLoss,
            is_favorite_team: bet.isFavoriteTeam,
            outcome: bet.outcome,
            actual_return: bet.actualReturn,
            profit_loss: bet.profitLoss,
            ai_recommendation: bet.aiRecommendation,
            expected_value: bet.expectedValue,
            probability_estimate: bet.probabilityEstimate,
            risk_level: bet.riskLevel,
            source: bet.source,
            sportsbook: bet.sportsbook,
            completed_at: bet.completedAt ? new Date(bet.completedAt).toISOString() : null
          })

        if (!insertError) {
          reconciled++
        }
      } catch (e) {
        // Continue with other bets
      }
    }

  } catch (error) {
    console.error('[DataReconciliation] Error reconciling comprehensive bets:', error)
  }

  return reconciled
}

/**
 * Reconcile trades - sync localStorage to Supabase
 */
async function reconcileTrades(userId: string): Promise<number> {
  let reconciled = 0

  try {
    // Get localStorage trades
    const localTrades = getLocalStorageData<Trade[]>('serenity_trades') || []
    if (localTrades.length === 0) return 0

    // Get Supabase trades
    const { data: supabaseTrades, error } = await supabase
      .from('trades')
      .select('id, timestamp, pre_trade_emotion')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(500)

    if (error) {
      console.error('[DataReconciliation] Error fetching trades:', error)
      return 0
    }

    // Create a set of existing trade identifiers
    const existingKeys = new Set(
      (supabaseTrades || []).map(t => `${new Date(t.timestamp).getTime()}-${t.pre_trade_emotion}`)
    )

    // Find local trades that don't exist in Supabase
    const missingTrades = localTrades.filter(trade => {
      const key = `${new Date(trade.timestamp).getTime()}-${trade.preTradeEmotion}`
      return !existingKeys.has(key)
    })

    // Sync missing trades to Supabase
    for (const trade of missingTrades.slice(0, 50)) {
      try {
        const { error: insertError } = await supabase
          .from('trades')
          .insert({
            user_id: userId,
            pre_trade_emotion: trade.preTradeEmotion,
            pre_trade_intensity: trade.preTradeIntensity,
            pre_trade_confidence: trade.confidenceLevel,
            pre_trade_notes: trade.reasoning,
            biases_identified: trade.biasesIdentified,
            outcome: trade.outcome,
            post_trade_emotion: trade.postTradeEmotion,
            post_trade_intensity: trade.postTradeIntensity,
            post_trade_notes: trade.reflection,
            emotional_impact: trade.emotionalImpact,
            timestamp: new Date(trade.timestamp).toISOString()
          })

        if (!insertError) {
          reconciled++
        }
      } catch (e) {
        // Continue with other trades
      }
    }

  } catch (error) {
    console.error('[DataReconciliation] Error reconciling trades:', error)
  }

  return reconciled
}

/**
 * Helper to safely get data from localStorage
 */
function getLocalStorageData<T>(key: string): T | null {
  if (typeof window === 'undefined') return null

  try {
    const data = localStorage.getItem(key)
    if (!data) return null
    return JSON.parse(data) as T
  } catch (e) {
    console.warn(`[DataReconciliation] Error parsing localStorage key ${key}:`, e)
    return null
  }
}

/**
 * Force a reconciliation (bypasses cooldown)
 */
export async function forceReconciliation(): Promise<ReconciliationResult> {
  lastReconciliationTime = 0
  return reconcileAllData()
}

/**
 * Check if reconciliation is currently running
 */
export function isReconciliationInProgress(): boolean {
  return isReconciling
}

import type { UnifiedBet } from "../types"

/**
 * Calculate the total return for a winning bet based on stake and odds
 */
export function calculateWinReturn(stake: number, odds: number): number {
  if (odds > 0) {
    return stake + (stake * odds / 100)
  } else {
    return stake + (stake * 100 / Math.abs(odds))
  }
}

/**
 * Calculate betting performance metrics from unified bet data
 */
export function calculateBettingMetrics(unifiedBets: UnifiedBet[]) {
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

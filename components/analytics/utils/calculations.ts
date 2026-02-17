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

  // Parlay-specific calculations
  const parlays = unifiedBets.filter(bet => bet.isParlay || (bet.parlayLegsCount && bet.parlayLegsCount > 1) || bet.betType === 'parlay')
  const completedParlays = parlays.filter(bet => bet.outcome && bet.outcome !== 'pending')
  const parlayWins = completedParlays.filter(bet => bet.outcome === 'win')
  const parlayLosses = completedParlays.filter(bet => bet.outcome === 'loss')

  const totalStaked = completed.reduce((sum, bet) => sum + bet.stake, 0)
  const totalReturns = completed.reduce((sum, bet) => {
    // If actualReturn is not set, calculate it based on outcome, stake, and odds
    if (bet.actualReturn !== undefined) {
      return sum + bet.actualReturn
    }
    // Calculate missing actualReturn
    if (bet.outcome === 'win' && bet.odds && bet.stake) {
      return sum + calculateWinReturn(bet.stake, bet.odds)
    } else if (bet.outcome === 'loss') {
      return sum + 0
    } else if (bet.outcome === 'push') {
      return sum + bet.stake
    }
    return sum + 0
  }, 0)
  const profit = totalReturns - totalStaked
  const roi = totalStaked > 0 ? (profit / totalStaked) * 100 : 0
  const winRate = completed.length > 0 ? (wins.length / completed.length) * 100 : 0

  // Parlay-specific metrics
  const parlayWinRate = completedParlays.length > 0 ? (parlayWins.length / completedParlays.length) * 100 : 0
  const parlayROI = completedParlays.reduce((sum, bet) => sum + bet.stake, 0) > 0
    ? ((completedParlays.reduce((sum, bet) => sum + (bet.actualReturn || 0), 0) -
      completedParlays.reduce((sum, bet) => sum + bet.stake, 0)) /
      completedParlays.reduce((sum, bet) => sum + bet.stake, 0)) * 100
    : 0

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
    avgEV,
    // Parlay metrics
    totalParlays: parlays.length,
    completedParlays: completedParlays.length,
    parlayWins: parlayWins.length,
    parlayLosses: parlayLosses.length,
    parlayWinRate,
    parlayROI,
    parlayPercentage: unifiedBets.length > 0 ? (parlays.length / unifiedBets.length) * 100 : 0
  }
}

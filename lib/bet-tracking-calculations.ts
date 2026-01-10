import { ComprehensiveBet, BetPerformanceMetrics } from "@/lib/types/bet-tracking"
import { SupportedSportKey, GameBetMarketType } from "@/lib/types"

export function calculateBetMetrics(bets: ComprehensiveBet[]): BetPerformanceMetrics {
  const completedBets = bets.filter(bet => bet.outcome && bet.outcome !== "pending")
  const pendingBets = bets.filter(bet => bet.outcome === "pending")
  
  const wins = completedBets.filter(bet => bet.outcome === "win")
  const losses = completedBets.filter(bet => bet.outcome === "loss")
  const pushes = completedBets.filter(bet => bet.outcome === "push")
  
  const totalStaked = bets.reduce((sum, bet) => sum + bet.stake, 0)
  const totalReturned = completedBets.reduce((sum, bet) => sum + (bet.actualReturn || 0), 0)
  const profitLoss = totalReturned - totalStaked
  const roi = totalStaked > 0 ? (profitLoss / totalStaked) * 100 : 0
  
  const winRate = completedBets.length > 0 ? (wins.length / completedBets.length) * 100 : 0
  const averageStake = bets.length > 0 ? totalStaked / bets.length : 0
  const averageOdds = bets.length > 0 ? bets.reduce((sum, bet) => sum + Math.abs(bet.odds), 0) / bets.length : 0
  const expectedValue = bets.reduce((sum, bet) => sum + (bet.expectedValue || 0), 0)
  
  // Performance by sport
  const performanceBySport: Record<string, Partial<BetPerformanceMetrics>> = {}
  const sports = [...new Set(bets.map(bet => bet.sport))]
  
  sports.forEach(sport => {
    const sportBets = bets.filter(bet => bet.sport === sport)
    const sportCompleted = sportBets.filter(bet => bet.outcome && bet.outcome !== "pending")
    const sportWins = sportCompleted.filter(bet => bet.outcome === "win")
    const sportStaked = sportBets.reduce((sum, bet) => sum + bet.stake, 0)
    const sportReturned = sportCompleted.reduce((sum, bet) => sum + (bet.actualReturn || 0), 0)
    
    performanceBySport[sport] = {
      totalBets: sportBets.length,
      wins: sportWins.length,
      losses: sportCompleted.filter(bet => bet.outcome === "loss").length,
      winRate: sportCompleted.length > 0 ? (sportWins.length / sportCompleted.length) * 100 : 0,
      totalStaked: sportStaked,
      totalReturned: sportReturned,
      profitLoss: sportReturned - sportStaked,
      roi: sportStaked > 0 ? ((sportReturned - sportStaked) / sportStaked) * 100 : 0
    }
  })
  
  // Performance by bet type
  const performanceByBetType: Record<string, Partial<BetPerformanceMetrics>> = {}
  const betTypes = [...new Set(bets.map(bet => bet.betType))]
  
  betTypes.forEach(betType => {
    const typeBets = bets.filter(bet => bet.betType === betType)
    const typeCompleted = typeBets.filter(bet => bet.outcome && bet.outcome !== "pending")
    const typeWins = typeCompleted.filter(bet => bet.outcome === "win")
    const typeStaked = typeBets.reduce((sum, bet) => sum + bet.stake, 0)
    const typeReturned = typeCompleted.reduce((sum, bet) => sum + (bet.actualReturn || 0), 0)
    
    performanceByBetType[betType] = {
      totalBets: typeBets.length,
      wins: typeWins.length,
      losses: typeCompleted.filter(bet => bet.outcome === "loss").length,
      winRate: typeCompleted.length > 0 ? (typeWins.length / typeCompleted.length) * 100 : 0,
      totalStaked: typeStaked,
      totalReturned: typeReturned,
      profitLoss: typeReturned - typeStaked,
      roi: typeStaked > 0 ? ((typeReturned - typeStaked) / typeStaked) * 100 : 0
    }
  })
  
  // Performance by emotion
  const performanceByEmotion: Record<string, Partial<BetPerformanceMetrics>> = {}
  const emotions = [...new Set(bets.map(bet => bet.emotions.before.emotion))]
  
  emotions.forEach(emotion => {
    const emotionBets = bets.filter(bet => bet.emotions.before.emotion === emotion)
    const emotionCompleted = emotionBets.filter(bet => bet.outcome && bet.outcome !== "pending")
    const emotionWins = emotionCompleted.filter(bet => bet.outcome === "win")
    const emotionStaked = emotionBets.reduce((sum, bet) => sum + bet.stake, 0)
    const emotionReturned = emotionCompleted.reduce((sum, bet) => sum + (bet.actualReturn || 0), 0)
    
    performanceByEmotion[emotion] = {
      totalBets: emotionBets.length,
      wins: emotionWins.length,
      losses: emotionCompleted.filter(bet => bet.outcome === "loss").length,
      winRate: emotionCompleted.length > 0 ? (emotionWins.length / emotionCompleted.length) * 100 : 0,
      totalStaked: emotionStaked,
      totalReturned: emotionReturned,
      profitLoss: emotionReturned - emotionStaked,
      roi: emotionStaked > 0 ? ((emotionReturned - emotionStaked) / emotionStaked) * 100 : 0
    }
  })
  
  // Time-based metrics
  const dailyProfitLoss: Record<string, number> = {}
  const weeklyProfitLoss: Record<string, number> = {}
  const monthlyProfitLoss: Record<string, number> = {}
  
  completedBets.forEach(bet => {
    if (!bet.actualReturn) return
    
    const date = new Date(bet.timestamp)
    const dayKey = date.toISOString().split('T')[0]
    const weekKey = `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`
    
    const pnl = bet.actualReturn - bet.stake
    
    dailyProfitLoss[dayKey] = (dailyProfitLoss[dayKey] || 0) + pnl
    weeklyProfitLoss[weekKey] = (weeklyProfitLoss[weekKey] || 0) + pnl
    monthlyProfitLoss[monthKey] = (monthlyProfitLoss[monthKey] || 0) + pnl
  })
  
  return {
    totalBets: bets.length,
    wins: wins.length,
    losses: losses.length,
    pushes: pushes.length,
    pending: pendingBets.length,
    winRate,
    totalStaked,
    totalReturned,
    profitLoss,
    roi,
    averageStake,
    averageOdds,
    expectedValue,
    performanceBySport,
    performanceByBetType,
    performanceByEmotion,
    dailyProfitLoss,
    weeklyProfitLoss,
    monthlyProfitLoss
  }
}

export function calculateBetReturn(odds: number, stake: number, outcome: "win" | "loss" | "push" | "pending"): number {
  if (outcome === "pending") return 0
  if (outcome === "push") return stake
  if (outcome === "loss") return 0
  
  // Win calculation for American odds
  if (odds > 0) {
    return stake + (stake * odds / 100)
  } else {
    return stake + (stake * 100 / Math.abs(odds))
  }
}

export function calculateProfitLoss(odds: number, stake: number, outcome: "win" | "loss" | "push" | "pending"): number {
  const returned = calculateBetReturn(odds, stake, outcome)
  return returned - stake
}

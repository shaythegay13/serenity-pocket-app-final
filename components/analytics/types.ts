import type { BetAnalysis, AIServiceUsage, GameLineRecord } from "@/lib/types"

export type UnifiedBetSource = "analysis" | "trade"

export type UnifiedBet = BetAnalysis & {
  source: UnifiedBetSource
}

export type TimelineItem =
  | { kind: "bet"; ts: Date; bet: UnifiedBet }
  | { kind: "ai"; ts: Date; usage: AIServiceUsage }
  | { kind: "game"; ts: Date; game: GameLineRecord }

export type EmotionOutcomePoint = {
  day: string
  emotionScore?: number
  outcomeScore?: number
  betActivity?: number
  expectedValue?: number
  mentalHealthScore?: number
  profitLoss?: number
}

export interface DailyBucket {
  label: string
  wins: number
  losses: number
  breakeven: number
}

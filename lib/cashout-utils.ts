/**
 * lib/cashout-utils.ts
 *
 * Cash-out stub. Defines the CashOutOffer type and a stub implementation
 * of computeCashOutOffer() that always returns offeredAmount: null until
 * a real sportsbook API integration is wired in.
 */

import type { ParlayLeg } from './types/ai-models'
import type { LiveBettingOdds } from './types/live-betting'

// ============================================================================
// Types
// ============================================================================

export interface CashOutOffer {
  ticketId: string
  offeredAmount: number | null    // null = cash-out not available
  offeredAt: string               // ISO timestamp
  currentOdds: number             // Current market odds for the bet
  originalOdds: number            // Odds at time of placement
  originalStake: number
  impliedCashOutProfit: number    // offeredAmount - stake (0 when null)
  reason?: string                 // Why null if unavailable
}

// ============================================================================
// Stub implementation
// ============================================================================

/**
 * Returns a CashOutOffer for a ticket.
 *
 * Currently always returns offeredAmount: null — this is a stub.
 * Replace the function body with real sportsbook API integration when available
 * (e.g. DraftKings, FanDuel, BetMGM APIs).
 */
export function computeCashOutOffer(
  ticket: {
    id: string
    originalOdds: number
    stake: number
    legs: ParlayLeg[]
  },
  currentOddsSnapshot: LiveBettingOdds | null
): CashOutOffer {
  return {
    ticketId: ticket.id,
    offeredAmount: null,
    offeredAt: new Date().toISOString(),
    currentOdds: currentOddsSnapshot?.moneyline?.home ?? ticket.originalOdds,
    originalOdds: ticket.originalOdds,
    originalStake: ticket.stake,
    impliedCashOutProfit: 0,
    reason: 'Cash-out not yet integrated with sportsbook API',
  }
}

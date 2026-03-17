/**
 * AI-Guided Decision Pricing Configuration
 *
 * Centralised constants for marketplace product pricing and tier allocations.
 * Adjust values here to A/B test pricing — no other files need to change.
 */

export const DECISION_PRICING = {
  single: {
    price: 4.00,
    decisions: 1,
    productKey: 'decision_single',
    displayName: '1 AI Decision',
    description: 'Guide one bet with a full SmartSlip + TiltLab AI analysis',
  },
  fivePack: {
    price: 16.00,
    decisions: 5,
    productKey: 'decision_5pack',
    displayName: '5 AI Decisions',
    description: '5 AI-guided betting decisions — save vs. buying individually',
  },
  tenPack: {
    price: 28.00,
    decisions: 10,
    productKey: 'decision_10pack',
    displayName: '10 AI Decisions',
    description: '10 AI-guided betting decisions — best value pack',
  },
} as const

/** Weekly AI-guided decision allocation per subscription tier */
export const TIER_WEEKLY_DECISIONS: Record<string, number> = {
  free:         0,
  premium:      3,
  premium_plus: 7,
  elite:        14,
}

/** Product keys that belong to the new unified decision system */
export const DECISION_PRODUCT_KEYS = Object.values(DECISION_PRICING).map(
  (p) => p.productKey,
)

import type { SubscriptionTier } from "./types"

export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: "free",
    name: "Foundation",
    displayName: "Foundation",
    price: 0,
    interval: "month",
    description: "Build self-awareness and track your betting behavior to make safer, smarter decisions.",
    features: [
      "Emotion Tracking & Check-ins",
      "Betting History & Performance Tracking",
      "Emotional Wellness Score",
      "Cooldown Mode & Safety Controls",
    ],
  },
  {
    id: "premium",
    name: "Focus",
    displayName: "Focus",
    price: 19.99,
    interval: "month",
    description: "Real-time sports data, odds comparison, and analytical tools to bet smarter.",
    trialDays: 7,
    features: [
      "Everything in the Previous Tier and:",
      "Basic Analytics Dashboard",
      "TiltLab Emotional Analysis (1x/week)",
      "SmartSlip AI Picks (1x/week)",
    ],
  },
  {
    id: "premium_plus",
    name: "Mastery",
    displayName: "Mastery",
    price: 39.99,
    interval: "month",
    description: "Combine psychology insights with data analytics to reduce risk and improve outcomes.",
    features: [
      "Everything in the Previous Tier and:",
      "Emotional Volatility Warnings",
      "Behavior-to-Performance Correlation",
      "TiltLab Emotional Analysis (3x/week)",
      "SmartSlip AI Picks (3x/week)",
    ],
  },
  {
    id: "elite",
    name: "Apex",
    displayName: "Apex",
    price: 79.99,
    interval: "month",
    description: "AI-powered picks and analysis tailored to your psychological profile and betting style.",
    features: [
      "Everything in the Previous Tier and:",
      "Priority Support & Early Feature Access",
      "TiltLab Emotional Analysis (7x/week)",
      "SmartSlip AI Picks (7x/week)",
    ],
  },
]

export function getTierFeatures(tierId: "free" | "premium" | "premium_plus" | "elite"): string[] {
  const tier = SUBSCRIPTION_TIERS.find((t) => t.id === tierId)
  return tier?.features || []
}

export function canAccessFeature(
  userTier: "free" | "premium" | "premium_plus" | "elite",
  requiredTier: "free" | "premium" | "premium_plus" | "elite"
): boolean {
  const tierOrder = ["free", "premium", "premium_plus", "elite"]
  const userTierIndex = tierOrder.indexOf(userTier)
  const requiredTierIndex = tierOrder.indexOf(requiredTier)

  // If either tier is invalid (not found), deny access to be safe
  if (userTierIndex === -1 || requiredTierIndex === -1) {
    console.warn(`Invalid tier detected: userTier="${userTier}", requiredTier="${requiredTier}"`)
    return false
  }

  return userTierIndex >= requiredTierIndex
}

export function getUpgradeMessage(
  currentTier: "free" | "premium" | "premium_plus" | "elite",
  featureName: string
): string {
  const messages: Record<string, string> = {
    free: `Upgrade to Focus to unlock ${featureName} and real-time sports data tools.`,
    premium: `Upgrade to Mastery to unlock ${featureName} and behavioral psychology insights.`,
    premium_plus: `Upgrade to Apex to unlock ${featureName} and AI-powered bet suggestions.`,
    elite: "You have access to all features!",
  }
  return messages[currentTier] || messages.free
}

import type { SubscriptionTier } from "./types"

export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: "free",
    name: "Mindful Bettor",
    displayName: "Free Plan",
    price: 0,
    interval: "month",
    description: "Build self-awareness and track your betting behavior to make safer, smarter decisions.",
    features: [
      "Full Archetype Assessment (10 personality types)",
      "Emotion Tracking & Check-ins",
      "Bet Diary & Trade Logging",
      "Emotional Wellness Score",
      "Basic Analytics Dashboard",
      "Betting History & Performance Tracking",
    ],
  },
  {
    id: "premium",
    name: "Sharp Insights",
    displayName: "Premium",
    price: 19.99,
    interval: "month",
    description: "Real-time sports data, odds comparison, and analytical tools to bet smarter.",
    features: [
      "Everything in Free, plus:",
      "Live Odds Comparison (all major sportsbooks)",
      "Line Movement Charts & Timeline",
      "Analyze Your Bet (probability & EV calculator)",
      "Player Stats & Injury Reports",
      "Enhanced Performance Analytics",
      "SmartSlip (1x/week)",
      "TiltLab (1x/week)",
    ],
  },
  {
    id: "premium_plus",
    name: "Behavioral Advantage",
    displayName: "Premium Plus",
    price: 39.99,
    interval: "month",
    description: "Combine psychology insights with data analytics to reduce risk and improve outcomes.",
    features: [
      "Everything in Premium, plus:",
      "SmartSlip (3x/week)",
      "TiltLab (3x/week)",
      "Emotional Volatility Warnings",
      "Advanced Bias Detection & Triggers Map",
      "Behavior-to-Performance Analytics",
      "Betting Trends Dashboard",
      "Enhanced Line Movement Analysis",
    ],
  },
  {
    id: "elite",
    name: "AI Sharp Mode",
    displayName: "Elite",
    price: 79.99,
    interval: "month",
    description: "AI-powered picks and analysis tailored to your psychological profile and betting style.",
    features: [
      "Everything in Premium Plus, plus:",
      "SmartSlip (7x/week - daily access)",
      "TiltLab (7x/week - daily access)",
      "Emotionally-Aware Bet Recommendations",
      "EV-Ranked Picks with Bankroll Guidance",
      "Marketplace Access (buy additional uses)",
      "Priority Support & Early Feature Access",
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
  return userTierIndex >= requiredTierIndex
}

export function getUpgradeMessage(
  currentTier: "free" | "premium" | "premium_plus" | "elite",
  featureName: string
): string {
  const messages: Record<string, string> = {
    free: `Upgrade to Premium to unlock ${featureName} and real-time sports data tools.`,
    premium: `Upgrade to Premium Plus to unlock ${featureName} and behavioral psychology insights.`,
    premium_plus: `Upgrade to Elite to unlock ${featureName} and AI-powered bet suggestions.`,
    elite: "You have access to all features!",
  }
  return messages[currentTier] || messages.free
}

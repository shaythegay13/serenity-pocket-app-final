import type { SubscriptionTier } from "./types"

export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: "free",
    name: "Mindful Bettor",
    displayName: "Free Plan",
    price: 0,
    interval: "month",
    description: "Your seatbelt for safer betting. Build awareness, set guardrails, and track habits.",
    features: [
      "Archetype Snapshot (teaser)",
      "Daily Mood Check-ins",
      "Safety Guard (Cooldown Mode)",
      "Behavior Nudges",
      "Bet Diary & Journal",
    ],
  },
  {
    id: "premium",
    name: "Sharp Insights",
    displayName: "Premium",
    price: 19.99,
    interval: "month",
    description: "Real-time sports data + core analysis to make smarter, safer bets.",
    features: [
      "Everything in Free, plus:",
      "Real-time Odds (all books)",
      "Line Movement Timeline",
      "Analyze Your Bet (probability & EV)",
      "Parlay & Prop Tools",
      "Historical Performance Tracking",
    ],
  },
  {
    id: "premium_plus",
    name: "Behavioral Advantage",
    displayName: "Premium Plus",
    price: 39.99,
    interval: "month",
    description: "Fuse psychology + data to reduce risk and improve decision-making.",
    features: [
      "Everything in Premium, plus:",
      "Expert Commentary (Live Odds)",
      "Emotional Overlay & Volatility Warnings",
      "Bias Detection & Triggers Map",
      "Behavior → Performance Analytics",
      "Weekly Psychological Reports",
    ],
  },
  {
    id: "elite",
    name: "AI Sharp Mode",
    displayName: "Elite",
    price: 79.99,
    interval: "month",
    description: "Tailored AI picks filtered by your psychology + live data.",
    features: [
      "Everything in Premium Plus, plus:",
      "AI-Generated Picks (straight, parlays, props)",
      "Filtered by Emotional State",
      "EV-Ranked with Bankroll Guidance",
      "Priority Support & Early Access",
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

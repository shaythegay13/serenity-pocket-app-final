import type { SubscriptionTier } from "./types"

export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: "free",
    name: "Mindful Bettor",
    displayName: "Free",
    price: 0,
    interval: "month",
    description: "Build self-awareness and track your betting behavior to make safer, smarter decisions.",
    features: [
      "DSM-5 Based Assessment",
      "Emotion Tracking & Check-ins",
      "Betting History & Performance Tracking",
      "Emotional Wellness Score",
      "Cooldown Mode & Safety Controls",
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
      "Basic Analytics Dashboard",
      "Live Odds Comparison (all major sportsbooks)",
      "Line Movement Charts & Timeline",
      "Analyze Your Bet (AI-powered analysis)",
      "SmartSlip AI Picks (1x/week)",
      "TiltLab Emotional Analysis (1x/week)",
      "Enhanced Performance Analytics",
      "AI Marketplace (purchase additional credits)",
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
      "SmartSlip AI Picks (3x/week)",
      "TiltLab Emotional Analysis (3x/week)",
      "Advanced Bias Detection & Analysis",
      "Emotional Volatility Warnings",
      "Behavior-to-Performance Correlation Charts",
      "Enhanced Analytics with EV Tracking",
      "AI Marketplace (purchase additional credits)",
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
      "SmartSlip AI Picks (7x/week - daily access)",
      "TiltLab Emotional Analysis (7x/week - daily access)",
      "Emotionally-Aware AI Bet Recommendations",
      "EV-Ranked Picks with Confidence Scores",
      "AI Marketplace (purchase additional credits)",
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

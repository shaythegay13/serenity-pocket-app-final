// Minimal gamification file for backward compatibility
// These values are used in profile-tab.tsx for profile completion rewards

export const xpRewards = {
  completeLesson: 100,
}

export const tokenRewards = {
  completeLesson: 10,
}

// Level titles based on user level
export function getLevelTitle(level: number): string {
  if (level >= 50) return "Master Trader"
  if (level >= 40) return "Expert Analyst"
  if (level >= 30) return "Senior Strategist"
  if (level >= 20) return "Skilled Bettor"
  if (level >= 10) return "Rising Star"
  if (level >= 5) return "Apprentice"
  return "Beginner"
}

// Check if user completed a perfect day (all three rings at 100%)
export function checkPerfectDay(dailyRings: { emotionalAwareness: number; biasRecognition: number; mindfulness: number }): boolean {
  return (
    dailyRings.emotionalAwareness >= 100 &&
    dailyRings.biasRecognition >= 100 &&
    dailyRings.mindfulness >= 100
  )
}

// Check if rings should be reset (new day)
export function shouldResetRings(lastRingReset: Date | string | undefined): boolean {
  if (!lastRingReset) return true

  const lastReset = typeof lastRingReset === 'string' ? new Date(lastRingReset) : lastRingReset
  const now = new Date()

  // Reset if it's a new day (comparing dates, not times)
  return (
    lastReset.getFullYear() !== now.getFullYear() ||
    lastReset.getMonth() !== now.getMonth() ||
    lastReset.getDate() !== now.getDate()
  )
}

// Token milestones for rewards
export const TOKEN_MILESTONES = [
  { tokens: 100, reward: "Bronze Badge Frame", id: "bronze_frame" },
  { tokens: 250, reward: "Silver Badge Frame", id: "silver_frame" },
  { tokens: 500, reward: "Gold Badge Frame", id: "gold_frame" },
  { tokens: 1000, reward: "Premium Theme", id: "premium_theme" },
  { tokens: 2500, reward: "Elite Status", id: "elite_status" },
]

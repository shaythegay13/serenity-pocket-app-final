import type { UserData, Achievement } from "./types"

export const LEVEL_TITLES = [
  "Novice Trader",
  "Aware Investor",
  "Mindful Analyst",
  "Bias Detective",
  "Emotional Strategist",
  "Conscious Trader",
  "Zen Investor",
  "Master of Mind",
  "Psychology Expert",
  "Behavioral Finance Guru",
]

export const LEVEL_XP_REQUIREMENTS = [
  0, // Level 1
  500, // Level 2
  1000, // Level 3
  2000, // Level 4
  4000, // Level 5
  8000, // Level 6
  16000, // Level 7
  32000, // Level 8
  64000, // Level 9
  128000, // Level 10
]

export function calculateLevel(xp: number): number {
  for (let i = LEVEL_XP_REQUIREMENTS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_XP_REQUIREMENTS[i]) {
      return i + 1
    }
  }
  return 1
}

export function calculateXPForNextLevel(level: number): number {
  if (level >= LEVEL_XP_REQUIREMENTS.length) {
    return LEVEL_XP_REQUIREMENTS[LEVEL_XP_REQUIREMENTS.length - 1]
  }
  return LEVEL_XP_REQUIREMENTS[level]
}

export function getLevelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)]
}

export const xpRewards = {
  emotionLog: 10,
  emotionTrackComplete: 25, // Complete both pre-bet and post-bet emotion
  breathingExercise: 15,
  mindfulnessCheck: 25,
  identifyBias: 75,
  completeLesson: 100,
  weekStreak: 150,
  monthlyChallenge: 500,
  achievementUnlock: 100,
}

export const tokenRewards = {
  emotionLog: 1,
  emotionTrackComplete: 2, // Complete both pre-bet and post-bet emotion
  breathingExercise: 1,
  identifyBias: 5,
  completeLesson: 10,
}

export const TOKEN_MILESTONES = [
  { tokens: 100, reward: "Custom Badge Frames" },
  { tokens: 500, reward: "Profile Theme Colors" },
  { tokens: 1000, reward: "Advanced Analytics Dashboard" },
  { tokens: 2500, reward: "Exclusive Masterclass Previews" },
  { tokens: 5000, reward: "Personalized Coaching Session" },
]

export function checkAchievements(
  userData: UserData,
  achievements: Achievement[],
  emotionLogsCount: number,
  biasesIdentifiedCount: number,
  tradesCount: number,
): Achievement[] {
  const updatedAchievements = [...achievements]
  let hasChanges = false

  updatedAchievements.forEach((achievement) => {
    if (achievement.unlocked) return

    let newProgress = achievement.progress

    switch (achievement.id) {
      // Streak Badges
      case "7-day-streak":
        newProgress = userData.emotionalAwarenessStreak
        break
      case "30-day-streak":
        newProgress = userData.emotionalAwarenessStreak
        break
      case "60-day-streak":
        newProgress = userData.emotionalAwarenessStreak
        break
      case "100-day-streak":
        newProgress = userData.emotionalAwarenessStreak
        break

      // Bias Buster Badges
      case "anchoring-awareness":
        newProgress = biasesIdentifiedCount
        break
      case "fomo-fighter":
        newProgress = userData.mindfulTrades
        break
      case "loss-aversion-victor":
        newProgress = biasesIdentifiedCount
        break
      case "confirmation-crusher":
        newProgress = biasesIdentifiedCount
        break
      case "recency-defender":
        newProgress = biasesIdentifiedCount
        break

      // Behavior Change Badges
      case "pause-champion":
        newProgress = userData.mindfulTrades
        break
      case "pattern-breaker":
        newProgress = userData.mindfulTrades
        break
      case "cool-head":
        newProgress = userData.totalBreathingExercises
        break

      // Learning Badges
      case "knowledge-seeker":
        newProgress = userData.totalModulesCompleted
        break
      case "behavioral-scholar":
        newProgress = userData.totalModulesCompleted
        break
      case "psychology-master":
        newProgress = userData.totalModulesCompleted
        break
    }

    if (newProgress !== achievement.progress) {
      achievement.progress = newProgress
      hasChanges = true
    }

    if (newProgress >= achievement.maxProgress && !achievement.unlocked) {
      achievement.unlocked = true
      achievement.unlockedAt = new Date()
      hasChanges = true
    }
  })

  return hasChanges ? updatedAchievements : achievements
}

export function checkPerfectDay(userData: UserData): boolean {
  return (
    userData.dailyRings.emotionalAwareness >= 100 &&
    userData.dailyRings.biasRecognition >= 100 &&
    userData.dailyRings.mindfulness >= 100
  )
}

export function shouldResetRings(lastReset: Date): boolean {
  const now = new Date()
  const lastResetDate = new Date(lastReset)
  return now.toDateString() !== lastResetDate.toDateString()
}

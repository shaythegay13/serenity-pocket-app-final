"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Navigation } from "@/components/navigation"
import { DashboardTab } from "@/components/tabs/dashboard-tab"
import { EmotionsTab } from "@/components/tabs/emotions-tab"
import { BiasesTab } from "@/components/tabs/biases-tab"
import { JournalTab } from "@/components/tabs/journal-tab"
import { ProgressTab } from "@/components/tabs/progress-tab"
import { AchievementsTab } from "@/components/tabs/achievements-tab"
import { LevelUpCelebration } from "@/components/level-up-celebration"
import { AchievementUnlockDialog } from "@/components/achievement-unlock-dialog"
import { storage } from "@/lib/storage"
import { calculateLevel, calculateXPForNextLevel, checkAchievements, xpRewards } from "@/lib/gamification"
import type { UserData, Achievement } from "@/lib/types"
import { Toaster } from "sonner"

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [userData, setUserData] = useState<UserData | null>(null)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [newLevel, setNewLevel] = useState(1)
  const [showAchievement, setShowAchievement] = useState(false)
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null)

  useEffect(() => {
    setUserData(storage.getUserData())
  }, [])

  const updateUserData = (updates: Partial<UserData>) => {
    if (!userData) return

    const newData = { ...userData, ...updates }

    // Check for level up
    if (updates.xp !== undefined) {
      const oldLevel = userData.level
      const newLevelCalc = calculateLevel(newData.xp)

      if (newLevelCalc > oldLevel) {
        newData.level = newLevelCalc
        newData.xpToNextLevel = calculateXPForNextLevel(newLevelCalc)
        setNewLevel(newLevelCalc)
        setShowLevelUp(true)
      }
    }

    // Check for achievement unlocks
    const achievements = storage.getAchievements()
    const emotionLogs = storage.getEmotionLogs()
    const trades = storage.getTrades()
    const biasesCount = trades.reduce((acc, t) => acc + t.biasesIdentified.length, 0)

    const updatedAchievements = checkAchievements(newData, achievements, emotionLogs.length, biasesCount, trades.length)

    // Find newly unlocked achievements
    const newlyUnlocked = updatedAchievements.find((a, i) => a.unlocked && !achievements[i].unlocked)

    if (newlyUnlocked) {
      storage.setAchievements(updatedAchievements)
      setUnlockedAchievement(newlyUnlocked)
      setShowAchievement(true)
      newData.xp += xpRewards.achievementUnlock
    }

    setUserData(newData)
    storage.setUserData(newData)
  }

  const getUnlockedFeatures = (level: number): string[] => {
    const features: { [key: number]: string[] } = {
      2: ["Expanded emotion wheel with 8 core emotions"],
      3: ["Bias Profile Report showing your top 3 susceptible biases"],
      4: ["Community Challenges - participate in weekly group goals"],
      5: ["Advanced Analytics with correlation charts"],
      6: ["16-emotion wheel with intensity sliders"],
      7: ["Comprehensive Psychological Profile Report"],
      8: ["AI-Powered Bias Alerts based on your patterns"],
      9: ["Mentorship Status badge and community mentor features"],
      10: ["Behavioral Finance Guru certification", "Exclusive Masterclass content", "Priority expert coaching"],
    }
    return features[level] || []
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userData={userData} />
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-7xl">
        {activeTab === "dashboard" && <DashboardTab userData={userData} updateUserData={updateUserData} />}
        {activeTab === "emotions" && <EmotionsTab userData={userData} updateUserData={updateUserData} />}
        {activeTab === "biases" && <BiasesTab userData={userData} updateUserData={updateUserData} />}
        {activeTab === "journal" && <JournalTab userData={userData} updateUserData={updateUserData} />}
        {activeTab === "progress" && <ProgressTab userData={userData} />}
        {activeTab === "achievements" && <AchievementsTab userData={userData} updateUserData={updateUserData} />}
      </main>

      <LevelUpCelebration
        open={showLevelUp}
        onClose={() => setShowLevelUp(false)}
        newLevel={newLevel}
        unlockedFeatures={getUnlockedFeatures(newLevel)}
      />
      <AchievementUnlockDialog
        open={showAchievement}
        onOpenChange={setShowAchievement}
        achievement={unlockedAchievement}
      />

      <Toaster position="top-right" />
    </div>
  )
}

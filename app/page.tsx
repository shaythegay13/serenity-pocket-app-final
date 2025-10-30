"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Navigation } from "@/components/navigation"
import { DashboardTab } from "@/components/tabs/dashboard-tab"
import { EmotionsTab } from "@/components/tabs/emotions-tab"
import { BiasesTab } from "@/components/tabs/biases-tab"
import { JournalTab } from "@/components/tabs/journal-tab"
import { ProgressTab } from "@/components/tabs/progress-tab"
import { ProfileTab } from "@/components/tabs/profile-tab"
import { LevelUpCelebration } from "@/components/level-up-celebration"
import { AchievementUnlockDialog } from "@/components/achievement-unlock-dialog"
import { storageHybrid as storage } from "@/lib/storage-hybrid"
import { calculateLevel, calculateXPForNextLevel, checkAchievements, xpRewards } from "@/lib/gamification"
import type { UserData, Achievement } from "@/lib/types"
import { Toaster } from "sonner"
import { supabase } from "@/lib/supabase"
import { SignIn } from "@/components/auth/sign-in"

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [userData, setUserData] = useState<UserData | null>(null)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [newLevel, setNewLevel] = useState(1)
  const [showAchievement, setShowAchievement] = useState(false)
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null)
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const init = async () => {
      try {
        // Try to restore session from cookies first
        const accessToken = document.cookie
          .split('; ')
          .find(row => row.startsWith('sb-access-token='))
          ?.split('=')[1]
        
        const refreshToken = document.cookie
          .split('; ')
          .find(row => row.startsWith('sb-refresh-token='))
          ?.split('=')[1]
        
        if (accessToken && refreshToken) {
          console.log('Found session cookies, setting session')
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })
        }
        
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout')), 10000)
        )
        
        const authPromise = supabase.auth.getUser()
        
        const { data: { user } } = await Promise.race([authPromise, timeoutPromise]) as any
        setAuthed(!!user)
        
        if (user) {
          console.log('User authenticated:', user.email)
          // Load user data from database
          const data = await storage.getUserData()
          setUserData(data)
        } else {
          console.log('No user authenticated')
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        // If there's an error, assume not authenticated
        setAuthed(false)
      }
    }
    init()
    
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('Auth state changed:', _event, !!session?.user)
      setAuthed(!!session?.user)
      if (session?.user) {
        try {
          const data = await storage.getUserData()
          setUserData(data)
        } catch (error) {
          console.error('Error loading user data:', error)
        }
      }
    })
    
    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  const forceRefresh = () => setRefreshKey(prev => prev + 1)

  const updateUserData = async (updates: Partial<UserData>) => {
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
    const achievements = await storage.getAchievements()
    const emotionLogs = await storage.getEmotionLogs()
    const trades = await storage.getTrades()
    const biasesCount = trades.reduce((acc, t) => acc + t.biasesIdentified.length, 0)

    const updatedAchievements = checkAchievements(newData, achievements, emotionLogs.length, biasesCount, trades.length)

    // Always save updated achievements (even if just progress changed)
    await storage.setAchievements(updatedAchievements)

    // Find newly unlocked achievements
    const newlyUnlocked = updatedAchievements.find((a, i) => a.unlocked && !achievements[i].unlocked)

    if (newlyUnlocked) {
      setUnlockedAchievement(newlyUnlocked)
      setShowAchievement(true)
      newData.xp += xpRewards.achievementUnlock
    }

    setUserData(newData)
    await storage.setUserData(newData)
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

  if (authed === false) {
    return <SignIn />
  }

  if (!userData || authed === null) {
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
        {activeTab === "progress" && <ProgressTab userData={userData} updateUserData={updateUserData} refreshKey={refreshKey} />}
        {activeTab === "profile" && <ProfileTab userData={userData} updateUserData={updateUserData} forceRefresh={forceRefresh} />}
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

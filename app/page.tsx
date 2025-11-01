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
import { SignUp } from "@/components/auth/sign-up"
import { ForgotPassword } from "@/components/auth/forgot-password"
import { ResendConfirmation } from "@/components/auth/resend-confirmation"
import { initializeUserData } from "@/lib/init-user"

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [userData, setUserData] = useState<UserData | null>(null)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [newLevel, setNewLevel] = useState(1)
  const [showAchievement, setShowAchievement] = useState(false)
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null)
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [showSignUp, setShowSignUp] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [showResendConfirmation, setShowResendConfirmation] = useState(false)

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
        
        // Get user without timeout - initialization happens in background
        const { data: { user } } = await supabase.auth.getUser()
        setAuthed(!!user)
        
        if (user) {
          console.log('User authenticated:', user.email)
          
          // Try to load user data first - if it works, skip initialization
          try {
            console.log('Starting to load user data...')
            const data = await Promise.race([
              storage.getUserData(),
              new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error('Timeout loading user data')), 3000)
              )
            ])
            console.log('User data loaded successfully:', data)
            setUserData(data)
          } catch (loadError) {
            console.error('Error loading user data:', loadError)
            console.warn('Database may be slow or paused. Using default data.')
            
            // If database is timing out, just use default data immediately
            setUserData({
              name: "Trader",
              level: 1,
              xp: 0,
              xpToNextLevel: 500,
              emotionalAwarenessStreak: 0,
              biasRecognitionScore: 0,
              mindfulDecisionPercentage: 0,
              totalTrades: 0,
              mindfulTrades: 0,
              serenityTokens: 0,
              dailyRings: {
                emotionalAwareness: 0,
                biasRecognition: 0,
                mindfulness: 0,
              },
              lastRingReset: new Date(),
              perfectDays: 0,
              longestStreak: 0,
              totalEmotionsLogged: 0,
              totalBiasesIdentified: 0,
              totalJournalsCompleted: 0,
              totalModulesCompleted: 0,
              totalBreathingExercises: 0,
              mostProductiveDay: 0,
            })
          }
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
      // Don't do anything on auth state change - let the main init handle it
      // This prevents duplicate initialization calls
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
    if (showForgotPassword) {
      return <ForgotPassword onBack={() => setShowForgotPassword(false)} />
    }
    if (showResendConfirmation) {
      return <ResendConfirmation onBack={() => setShowResendConfirmation(false)} />
    }
    return showSignUp ? (
      <SignUp onSwitchToSignIn={() => setShowSignUp(false)} />
    ) : (
      <SignIn 
        onSwitchToSignUp={() => setShowSignUp(true)} 
        onForgotPassword={() => setShowForgotPassword(true)}
        onResendConfirmation={() => setShowResendConfirmation(true)}
      />
    )
  }

  if (!userData || authed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          {authed && (
            <p className="text-sm text-muted-foreground">Setting up your profile...</p>
          )}
        </div>
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

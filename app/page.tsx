"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Navigation } from "@/components/navigation"
import { DashboardTab } from "@/components/tabs/dashboard-tab"
import { EmotionsTab } from "@/components/tabs/emotions-tab"
import { BiasesTab } from "@/components/tabs/biases-tab"
import { ProgressTab } from "@/components/tabs/progress-tab"
import { RewardsTab } from "@/components/tabs/rewards-tab"
import { PremiumTab } from "@/components/tabs/premium-tab"
import { ProfileTab } from "@/components/tabs/profile-tab"
import { LevelUpCelebration } from "@/components/level-up-celebration"
import { AchievementUnlockDialog } from "@/components/achievement-unlock-dialog"
import { EmotionCheckInDialog } from "@/components/emotion-check-in-dialog"
import { checkAchievements, getLevelTitle } from "@/lib/gamification"
import { calculateLevel, calculateXPForNextLevel, xpRewards } from "@/lib/gamification"
import { storageHybrid as storage } from "@/lib/storage-hybrid"
import { calculateMindfulDecisionPercentage, calculateBiasRecognitionScore, getTotalBiasesIdentified } from "@/lib/bias-calculations"
import { Toaster } from "sonner"
import { supabase } from "@/lib/supabase"
import { SignIn } from "@/components/auth/sign-in"
import { SignUp } from "@/components/auth/sign-up"
import { ForgotPassword } from "@/components/auth/forgot-password"
import { ResendConfirmation } from "@/components/auth/resend-confirmation"
import { SerenitySurvey } from "@/components/serenity-survey"
import { TermsAgreement } from "@/components/terms-agreement"
import { OnboardingGate } from "@/components/onboarding-gate"
import type { SurveyData, UserData, Achievement } from "@/lib/types"
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
  const [authFlow, setAuthFlow] = useState<"survey" | "signup" | "signin" | "terms" | "forgot-password" | "resend-confirmation">("survey")
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null)
  const [showEmotionCheckIn, setShowEmotionCheckIn] = useState(false)

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
            
            // Check for pending survey data
            const pendingSurveyData = sessionStorage.getItem('pendingSurveyData')
            if (pendingSurveyData && !data.surveyData) {
              const parsedSurveyData = JSON.parse(pendingSurveyData)
              data.surveyData = parsedSurveyData
              await storage.setUserData(data)
              sessionStorage.removeItem('pendingSurveyData')
            }
            
            setUserData(data)
            
            // Check if user needs to do emotion check-in today
            const needsCheckIn = checkIfNeedsEmotionCheckIn(data.lastEmotionCheckIn)
            if (needsCheckIn) {
              // Delay showing the dialog slightly for better UX
              setTimeout(() => setShowEmotionCheckIn(true), 500)
            }
          } catch (loadError) {
            console.error('Error loading user data:', loadError)
            console.warn('Database may be slow or paused. Using default data.')
            
            // Check for pending survey data
            const pendingSurveyData = sessionStorage.getItem('pendingSurveyData')
            let parsedSurveyData = null
            if (pendingSurveyData) {
              parsedSurveyData = JSON.parse(pendingSurveyData)
              sessionStorage.removeItem('pendingSurveyData')
            }
            
            // If database is timing out, just use default data immediately
            setUserData({
              name: parsedSurveyData?.name || "Trader",
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
              surveyData: parsedSurveyData,
              subscriptionTier: "free",
              onboardingComplete: false,
              biographyComplete: false,
              emotionTrackComplete: false,
            })
            
            // Check if user needs emotion check-in (will show for default data too)
            setTimeout(() => setShowEmotionCheckIn(true), 500)
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
    const biasesCount = getTotalBiasesIdentified(trades)
    
    // Recalculate bias metrics
    const biasProfile = await storage.getBiasProfile()
    const mindfulDecisionPercentage = calculateMindfulDecisionPercentage(trades)
    const biasRecognitionScore = calculateBiasRecognitionScore(biasProfile, biasesCount, trades.length)
    
    // Update calculated metrics
    newData.mindfulDecisionPercentage = mindfulDecisionPercentage
    newData.biasRecognitionScore = biasRecognitionScore
    newData.totalBiasesIdentified = biasesCount

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
    
    // Trigger refresh for components that depend on updated data
    forceRefresh()
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

  const checkIfNeedsEmotionCheckIn = (lastCheckIn?: Date): boolean => {
    if (!lastCheckIn) return true
    
    const today = new Date()
    const lastCheckInDate = new Date(lastCheckIn)
    
    // Check if last check-in was on a different day
    return (
      today.getDate() !== lastCheckInDate.getDate() ||
      today.getMonth() !== lastCheckInDate.getMonth() ||
      today.getFullYear() !== lastCheckInDate.getFullYear()
    )
  }

  const handleEmotionCheckInComplete = async () => {
    if (!userData) return
    
    // Award XP for completing emotion check-in
    const updatedData = {
      ...userData,
      xp: userData.xp + xpRewards.emotionLog,
      totalEmotionsLogged: userData.totalEmotionsLogged + 1,
      lastEmotionCheckIn: new Date(),
      dailyRings: {
        ...userData.dailyRings,
        emotionalAwareness: Math.min(100, userData.dailyRings.emotionalAwareness + 25)
      }
    }
    
    await updateUserData(updatedData)
    setShowEmotionCheckIn(false)
    
    // Trigger refresh of emotion charts and progress tab
    setRefreshKey(prev => prev + 1)
  }

  if (authed === false) {
    // Survey Flow
    if (authFlow === "survey") {
      return (
        <SerenitySurvey
          onComplete={(data) => {
            setSurveyData(data)
            setAuthFlow("signup")
          }}
          onSwitchToSignIn={() => setAuthFlow("signin")}
        />
      )
    }

    // Sign Up with Survey Data
    if (authFlow === "signup") {
      return (
        <SignUp
          onSwitchToSignIn={() => setAuthFlow("signin")}
          surveyData={surveyData || undefined}
          onAccountCreated={() => setAuthFlow("terms")}
        />
      )
    }

    // Terms Agreement
    if (authFlow === "terms") {
      return (
        <TermsAgreement
          onAccept={() => {
            window.location.reload()
          }}
          onDecline={() => {
            setAuthFlow("survey")
            setSurveyData(null)
          }}
        />
      )
    }

    // Forgot Password
    if (authFlow === "forgot-password") {
      return <ForgotPassword onBack={() => setAuthFlow("signin")} />
    }

    // Resend Confirmation
    if (authFlow === "resend-confirmation") {
      return <ResendConfirmation onBack={() => setAuthFlow("signin")} />
    }

    // Sign In (default for returning users)
    return (
      <SignIn
        onSwitchToSignUp={() => setAuthFlow("survey")}
        onForgotPassword={() => setAuthFlow("forgot-password")}
        onResendConfirmation={() => setAuthFlow("resend-confirmation")}
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

  // Show onboarding gate if user hasn't completed it
  if (!userData.onboardingComplete) {
    return (
      <>
        <OnboardingGate
          userData={userData}
          updateUserData={updateUserData}
          onComplete={() => {
            // Force a refresh to show the full dashboard
            setRefreshKey(prev => prev + 1)
          }}
        />
        <Toaster position="top-right" />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userData={userData} />
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-7xl">
        {activeTab === "dashboard" && <DashboardTab userData={userData} updateUserData={updateUserData} onNavigateToEmotions={() => setActiveTab("emotions")} />}
        {activeTab === "emotions" && <EmotionsTab userData={userData} updateUserData={updateUserData} refreshKey={refreshKey} />}
        {activeTab === "biases" && <BiasesTab userData={userData} updateUserData={updateUserData} />}
        {activeTab === "progress" && <ProgressTab userData={userData} updateUserData={updateUserData} refreshKey={refreshKey} />}
        {activeTab === "rewards" && <RewardsTab userData={userData} updateUserData={updateUserData} />}
        {activeTab === "premium" && <PremiumTab userData={userData} updateUserData={updateUserData} />}
        {activeTab === "profile" && <ProfileTab userData={userData} updateUserData={updateUserData} forceRefresh={forceRefresh} />}
      </main>

      <EmotionCheckInDialog
        open={showEmotionCheckIn}
        onOpenChange={setShowEmotionCheckIn}
        onComplete={handleEmotionCheckInComplete}
      />
      
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

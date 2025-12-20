"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { DashboardHeader } from "@/components/dashboard-header"
import { Navigation } from "@/components/navigation"
import { HomeTab } from "@/components/tabs/home-tab"
import { LiveOddsTab } from "@/components/tabs/live-odds-tab"
import { AnalyzeBetTab } from "@/components/tabs/analyze-bet-tab"
import { BehaviorTab } from "@/components/tabs/behavior-tab"
import { AnalyticsTab } from "@/components/tabs/analytics-tab"
import { AIPicksTab } from "@/components/tabs/ai-picks-tab"
import { HistoryTab } from "@/components/tabs/history-tab"
import { AccountTab } from "@/components/tabs/account-tab"
// Legacy imports (kept for reference)
import { EmotionsTab } from "@/components/tabs/emotions-tab"
import { EmotionCheckInDialog } from "@/components/emotion-check-in-dialog"
// Gamification imports removed - system no longer used
import { storageHybrid as storage } from "@/lib/storage-hybrid"
import { calculateMindfulDecisionPercentage, calculateBiasRecognitionScore, getTotalBiasesIdentified } from "@/lib/bias-calculations"
import { Toaster } from "sonner"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { SignIn } from "@/components/auth/sign-in"
import { ForgotPassword } from "@/components/auth/forgot-password"
import { ResendConfirmation } from "@/components/auth/resend-confirmation"
import { IntegratedSurveyWrapper } from "@/components/integrated-survey-flow/IntegratedSurveyWrapper"
import { TermsAgreement } from "@/components/terms-agreement"
import { OnboardingGate } from "@/components/onboarding-gate"
import type { SurveyData, UserData, Achievement } from "@/lib/types"
import { initializeUserData } from "@/lib/init-user"
import { InstantProfileQuiz } from "@/components/onboarding/InstantProfileQuiz"
// Auth rate limit debug utilities (loads global debug functions)
import "@/lib/auth-rate-limit-utils"
import { ProfilePreview } from "@/components/onboarding/ProfilePreview"
import { SoftGate } from "@/components/onboarding/SoftGate"

export default function Home() {
  const [activeTab, setActiveTab] = useState("home")
  const [userData, setUserData] = useState<UserData | null>(null)
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [authFlow, setAuthFlow] = useState<
    | "instant-profile"
    | "profile-preview"
    | "soft-gate"
    | "survey"
    | "signup"
    | "signin"
    | "terms"
    | "forgot-password"
    | "resend-confirmation"
  >("survey")
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null)
  const [showEmotionCheckIn, setShowEmotionCheckIn] = useState(false)
  const [instantProfile, setInstantProfile] = useState<any | null>(null)

  const syncBiasMetricsIfNeeded = async (base: UserData) => {
    try {
      const trades = await storage.getTrades()
      const biasesCount = getTotalBiasesIdentified(trades)
      const biasProfile = await storage.getBiasProfile()
      const mindfulDecisionPercentage = calculateMindfulDecisionPercentage(trades)
      const biasRecognitionScore = calculateBiasRecognitionScore(
        biasProfile,
        biasesCount,
        trades.length,
      )

      const needsSync =
        base.mindfulDecisionPercentage !== mindfulDecisionPercentage ||
        base.biasRecognitionScore !== biasRecognitionScore ||
        base.totalBiasesIdentified !== biasesCount

      if (!needsSync) return

      const updated: UserData = {
        ...base,
        mindfulDecisionPercentage,
        biasRecognitionScore,
        totalBiasesIdentified: biasesCount,
      }

      await storage.setUserData(updated)
      setUserData(updated)
    } catch (e) {
      console.error("Error syncing bias metrics:", e)
    }
  }

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
            
            // Check for pending survey data (only in browser)
            if (typeof window !== 'undefined') {
              try {
                const pendingSurveyData = sessionStorage.getItem('pendingSurveyData')
                if (pendingSurveyData && !data.surveyData) {
                  const parsedSurveyData = JSON.parse(pendingSurveyData)
                  data.surveyData = parsedSurveyData
                  await storage.setUserData(data)
                  sessionStorage.removeItem('pendingSurveyData')
                }
              } catch (e) {
                console.error('Error accessing sessionStorage:', e)
              }
            }
            
            // Fetch survey results from database if not already loaded
            if (!data.surveyData) {
              try {
                const surveyResponse = await fetch('/api/survey/results')
                if (surveyResponse.ok) {
                  const surveyData = await surveyResponse.json()
                  if (surveyData && surveyData.score !== undefined) {
                    data.surveyData = {
                      score: surveyData.score,
                      level: surveyData.risk_level,
                      answers: surveyData.answers,
                      completedAt: surveyData.completed_at
                    }
                    console.log('Survey results loaded from database:', data.surveyData)
                  }
                }
              } catch (error) {
                console.error('Error fetching survey results:', error)
              }
            }
            
            setUserData(data)

            void syncBiasMetricsIfNeeded(data)
            
            // Only show emotion check-in on first login (when lastEmotionCheckIn is undefined)
            // After that, user can manually trigger it from the dashboard
            if (!data.lastEmotionCheckIn) {
              // Delay showing the dialog slightly for better UX
              setTimeout(() => setShowEmotionCheckIn(true), 500)
            }
          } catch (loadError) {
            console.error('Error loading user data:', loadError)
            console.warn('Database may be slow or paused. Using default data.')
            
            // Check for pending survey data (only in browser)
            let parsedSurveyData = null
            if (typeof window !== 'undefined') {
              try {
                const pendingSurveyData = sessionStorage.getItem('pendingSurveyData')
                if (pendingSurveyData) {
                  parsedSurveyData = JSON.parse(pendingSurveyData)
                  sessionStorage.removeItem('pendingSurveyData')
                }
              } catch (e) {
                console.error('Error accessing sessionStorage:', e)
              }
            }
            
            // If database is timing out, just use default data immediately
            const defaultUserData: UserData = {
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
            }
            
            // Try to fetch survey results even when database is slow
            try {
              const surveyResponse = await fetch('/api/survey/results')
              if (surveyResponse.ok) {
                const surveyData = await surveyResponse.json()
                if (surveyData && surveyData.score !== undefined) {
                  defaultUserData.surveyData = {
                    score: surveyData.score,
                    level: surveyData.risk_level,
                    answers: surveyData.answers,
                    completedAt: surveyData.completed_at
                  }
                  console.log('Survey results loaded from database (fallback):', defaultUserData.surveyData)
                }
              }
            } catch (error) {
              console.error('Error fetching survey results (fallback):', error)
            }
            
            setUserData(defaultUserData)
            
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

    // Gamification system removed - features are gated by subscription tiers only
    // Recalculate bias metrics for analytics
    const trades = await storage.getTrades()
    const biasesCount = getTotalBiasesIdentified(trades)
    const biasProfile = await storage.getBiasProfile()
    const mindfulDecisionPercentage = calculateMindfulDecisionPercentage(trades)
    const biasRecognitionScore = calculateBiasRecognitionScore(biasProfile, biasesCount, trades.length)
    
    // Update calculated metrics
    newData.mindfulDecisionPercentage = mindfulDecisionPercentage
    newData.biasRecognitionScore = biasRecognitionScore
    newData.totalBiasesIdentified = biasesCount

    setUserData(newData)
    await storage.setUserData(newData)
    
    // Trigger refresh for components that depend on updated data
    forceRefresh()
  }

  // Gamification system (XP, levels, achievements) removed
  // Features are gated by subscription tiers only

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
    
    // Track emotion check-in metadata: last check-in time and ring progress.
    // XP and totalEmotionsLogged are now handled inside EmotionCheckInDialog.
    await updateUserData({
      lastEmotionCheckIn: new Date(),
      dailyRings: {
        ...userData.dailyRings,
        emotionalAwareness: Math.min(100, userData.dailyRings.emotionalAwareness + 25)
      }
    })
    setShowEmotionCheckIn(false)
    
    // Trigger refresh of emotion charts and progress tab
    setRefreshKey(prev => prev + 1)
  }

  if (authed === false) {
    if (authFlow === "instant-profile") {
      return (
        <InstantProfileQuiz
          onComplete={(profile) => {
            setInstantProfile(profile)
            setAuthFlow("profile-preview")
          }}
        />
      )
    }

    if (authFlow === "profile-preview") {
      return (
        <ProfilePreview
          profile={instantProfile}
          onContinue={() => setAuthFlow("soft-gate")}
          onRetake={() => setAuthFlow("instant-profile")}
        />
      )
    }

    if (authFlow === "soft-gate") {
      return (
        <SoftGate
          onContinueToFull={() => setAuthFlow("survey")}
          onLogin={() => setAuthFlow("signin")}
        />
      )
    }

    // Survey Flow (Survey C only)
    if (authFlow === "survey") {
      return (
        <IntegratedSurveyWrapper
          onComplete={(score: number, level: string, email: string) => {
            // Store survey results for later account creation
            const data = {
              score,
              level,
              email,
              completedAt: new Date().toISOString()
            }
            setSurveyData(data as any)
            setAuthFlow("signup")
          }}
          onSwitchToLogin={() => setAuthFlow("signin")}
          onClose={() => {
            try {
              const pending = sessionStorage.getItem('pendingSurveyData')
              if (pending) {
                const parsed = JSON.parse(pending)
                const params = new URLSearchParams()
                if (parsed.email) params.set('email', parsed.email)
                if (parsed.surveyId) params.set('surveyId', parsed.surveyId)
                if (parsed.score !== undefined) params.set('score', String(parsed.score))
                window.location.href = `/gambling-survey/create-account${params.toString() ? `?${params.toString()}` : ''}`
                return
              }
            } catch {}
            window.location.href = '/gambling-survey/create-account'
          }}
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
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  // Show onboarding gate ONLY for NEW users who haven't completed it yet
  // Once completed, they go straight to dashboard on future logins
  if (userData.onboardingComplete === false) {
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
      {activeTab === "home" && (
        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-3 sm:px-4 py-4 max-w-7xl">
            <Image
              src="/home-hero.jpg"
              alt="Bet smarter, protect your mind"
              width={1024}
              height={517}
              className="w-full h-auto rounded-lg"
              priority
            />
          </div>
        </div>
      )}
      
      {/* Pending Emotion Completion Banner */}
      {userData?.pendingEmotionTradeId && (
        <div className="bg-linear-to-r from-amber-500/10 to-orange-500/10 border-b border-amber-500/20">
          <div className="container mx-auto px-3 sm:px-4 py-3 max-w-7xl">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-amber-500 text-white rounded-full p-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-sm">Complete Your Emotion Track</p>
                  <p className="text-xs text-muted-foreground">
                    You logged your pre-bet emotion. How are you feeling after your bet? Earn +25 XP!
                  </p>
                </div>
              </div>
              <Button 
                size="sm" 
                onClick={() => setShowEmotionCheckIn(true)}
                className="shrink-0"
              >
                Log Post-Bet Emotion
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-7xl">
        {activeTab === "home" && (
          <HomeTab
            userData={userData}
            updateUserData={updateUserData}
            onNavigateToTab={setActiveTab}
            refreshKey={refreshKey}
          />
        )}
        {activeTab === "odds" && <LiveOddsTab userData={userData} onNavigateToTab={setActiveTab} />}
        {activeTab === "analyze" && <AnalyzeBetTab userData={userData} onNavigateToTab={setActiveTab} />}
        {activeTab === "behavior" && <BehaviorTab userData={userData} updateUserData={updateUserData} refreshKey={refreshKey} />}
        {activeTab === "analytics" && <AnalyticsTab userData={userData} onNavigateToTab={setActiveTab} />}
        {activeTab === "ai-picks" && <AIPicksTab userData={userData} onNavigateToTab={setActiveTab} />}
        {activeTab === "account" && <AccountTab userData={userData} updateUserData={updateUserData} />}
      </main>

      <EmotionCheckInDialog
        open={showEmotionCheckIn}
        onOpenChange={setShowEmotionCheckIn}
        onComplete={handleEmotionCheckInComplete}
        userData={userData}
        updateUserData={updateUserData}
      />
      
      {/* Gamification system (achievements, levels, XP) removed - features gated by subscription tiers */}

      <Toaster position="top-right" />
    </div>
  )
}

"use client"

import { useState, useEffect, lazy, Suspense } from "react"
import Image from "next/image"
import dynamic from "next/dynamic"
import { DashboardHeader } from "@/components/dashboard-header"
import { Navigation } from "@/components/navigation"
import { BottomNav } from "@/components/bottom-nav"

// Lazy load all tab components for better performance
const HomeTab = dynamic(() => import("@/components/tabs/home-tab").then(mod => ({ default: mod.HomeTab })), {
  loading: () => <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>
})
const LiveOddsTab = dynamic(() => import("@/components/tabs/live-odds-tab").then(mod => ({ default: mod.LiveOddsTab })), {
  loading: () => <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>
})
const AnalyzeBetTab = dynamic(() => import("@/components/tabs/analyze-bet-tab").then(mod => ({ default: mod.AnalyzeBetTab })), {
  loading: () => <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>
})
const BehaviorTab = dynamic(() => import("@/components/tabs/behavior-tab").then(mod => ({ default: mod.BehaviorTab })), {
  loading: () => <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>
})
const AnalyticsTab = dynamic(() => import("@/components/tabs/analytics-tab").then(mod => ({ default: mod.AnalyticsTab })), {
  loading: () => <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>
})
const AIPicksTab = dynamic(() => import("@/components/tabs/ai-picks-tab").then(mod => ({ default: mod.AIPicksTab })), {
  loading: () => <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>
})
const HistoryTab = dynamic(() => import("@/components/tabs/history-tab").then(mod => ({ default: mod.HistoryTab })), {
  loading: () => <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>
})
const AccountTab = dynamic(() => import("@/components/tabs/account-tab").then(mod => ({ default: mod.AccountTab })), {
  loading: () => <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>
})
// Legacy imports (kept for reference)
const EmotionsTab = dynamic(() => import("@/components/tabs/emotions-tab").then(mod => ({ default: mod.EmotionsTab })), {
  loading: () => <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>
})
const EmotionCheckInDialog = dynamic(() => import("@/components/emotion-check-in-dialog").then(mod => ({ default: mod.EmotionCheckInDialog })), {
  ssr: false
})
// Lazy load auth and onboarding components
const SignIn = dynamic(() => import("@/components/auth/sign-in").then(mod => ({ default: mod.SignIn })), { ssr: false })
const ForgotPassword = dynamic(() => import("@/components/auth/forgot-password").then(mod => ({ default: mod.ForgotPassword })), { ssr: false })
const ResendConfirmation = dynamic(() => import("@/components/auth/resend-confirmation").then(mod => ({ default: mod.ResendConfirmation })), { ssr: false })
const IntegratedSurveyWrapper = dynamic(() => import("@/components/integrated-survey-flow/IntegratedSurveyWrapper").then(mod => ({ default: mod.IntegratedSurveyWrapper })), { ssr: false })
const TermsAgreement = dynamic(() => import("@/components/terms-agreement").then(mod => ({ default: mod.TermsAgreement })), { ssr: false })
const OnboardingGate = dynamic(() => import("@/components/onboarding-gate").then(mod => ({ default: mod.OnboardingGate })), { ssr: false })
const InstantProfileQuiz = dynamic(() => import("@/components/onboarding/InstantProfileQuiz").then(mod => ({ default: mod.InstantProfileQuiz })), { ssr: false })
const ProfilePreview = dynamic(() => import("@/components/onboarding/ProfilePreview").then(mod => ({ default: mod.ProfilePreview })), { ssr: false })
const SoftGate = dynamic(() => import("@/components/onboarding/SoftGate").then(mod => ({ default: mod.SoftGate })), { ssr: false })
const LandingPage = dynamic<any>(() => import("@/components/landing-page").then(mod => ({ default: mod.LandingPage })), { ssr: false })

// Gamification imports removed - system no longer used
import { storageHybrid as storage } from "@/lib/storage-hybrid"
import { calculateMindfulDecisionPercentage, calculateBiasRecognitionScore, getTotalBiasesIdentified } from "@/lib/bias-calculations"
import { Toaster } from "sonner"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import type { SurveyData, UserData, Achievement } from "@/lib/types"
import { initializeUserData } from "@/lib/init-user"
// Auth rate limit debug utilities (loads global debug functions)
import "@/lib/auth-rate-limit-utils"

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
    | "landing"
  >("landing")
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null)
  const [showEmotionCheckIn, setShowEmotionCheckIn] = useState(false)
  const [instantProfile, setInstantProfile] = useState<any | null>(null)

  const syncBiasMetricsIfNeeded = async (base: UserData) => {
    // Defer this to run after initial render to improve load time
    setTimeout(async () => {
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
    }, 1000) // Defer by 1 second to prioritize initial render
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
            
            // Load survey data directly from Supabase if not already loaded
            if (!data.surveyData) {
              try {
                console.log('Loading survey data from Supabase for user:', user.id)

                // Fetch user profile to get survey data including archetype
                const { data: profileData, error: profileError } = await supabase
                  .from('user_profiles')
                  .select('survey_data')
                  .eq('id', user.id)
                  .single()

                if (profileError) {
                  console.error('Error loading profile:', {
                    code: profileError.code,
                    message: profileError.message,
                    details: profileError.details,
                    hint: profileError.hint
                  })
                  console.log('Skipping survey data load due to error')
                } else if (profileData?.survey_data) {
                  const surveyData = profileData.survey_data as any
                  console.log('Profile data received:', surveyData)
                  if (surveyData.score !== undefined) {
                    data.surveyData = {
                      score: surveyData.score,
                      level: surveyData.level,
                      userType: surveyData.userType,
                      answers: surveyData.answers,
                      completedAt: surveyData.completedAt
                    }
                    console.log('✅ Survey data loaded successfully. Archetype:', surveyData.userType || 'none')

                    // Save to storage for future loads
                    await storage.setUserData(data)
                  } else {
                    console.log('Survey data exists but has no score')
                  }
                } else {
                  console.log('No survey_data field in user profile')
                }
              } catch (error: any) {
                console.error('Exception loading survey data:', error.message || error)
                // Don't fail initialization - continue without survey data
              }
            } else {
              console.log('Survey data already present in userData')
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

    if (authFlow === "landing") {
      return (
        <LandingPage 
          onStart={() => setAuthFlow("survey")} 
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
      <DashboardHeader userData={userData} onNavigateToTab={setActiveTab} />

      <div className="hidden md:block">
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
      
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
      
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-7xl pb-20 md:pb-0">
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

      <div className="md:hidden">
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

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

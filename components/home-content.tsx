"use client"

import { useState, useEffect, lazy, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import { DashboardHeader } from "@/components/dashboard-header"
import { Navigation } from "@/components/navigation"
import { BottomNav } from "@/components/bottom-nav"
import { supabase } from "@/lib/supabase"
import type { SurveyData, UserData, Achievement } from "@/lib/types"
import { initializeUserData } from "@/lib/init-user"
// Auth rate limit debug utilities (loads global debug functions)
import "@/lib/auth-rate-limit-utils"

export function HomeContent() {
  const searchParams = useSearchParams()
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
    | "landing"
  >("landing")
  const [showEmotionCheckIn, setShowEmotionCheckIn] = useState(false)
  const [showInstantProfile, setShowInstantProfile] = useState(false)
  const [showProfilePreview, setShowProfilePreview] = useState(false)
  const [showSoftGate, setShowSoftGate] = useState(false)
  const [showSurvey, setShowSurvey] = useState(false)
  const [showSignup, setShowSignup] = useState(false)
  const [showSignin, setShowSignin] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [showLanding, setShowLanding] = useState(false)
  const [loading, setLoading] = useState(true)

  // Dynamic imports for tab components
  const HomeTab = lazy(() => import("@/components/tabs/home-tab"))
  const OddsTab = lazy(() => import("@/components/tabs/live-odds-tab"))
  const AnalyzeTab = lazy(() => import("@/components/tabs/analyze-bet-tab"))
  const BehaviorTab = lazy(() => import("@/components/tabs/behavior-tab"))
  const AiPicksTab = lazy(() => import("@/components/tabs/ai-picks-tab"))
  const AnalyticsTab = lazy(() => import("@/components/tabs/analytics-tab"))
  const AccountTab = lazy(() => import("@/components/tabs/account-tab"))

  // Read tab parameter from URL
  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab && ["home", "odds", "analyze", "behavior", "ai-picks", "analytics", "account"].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  // Check for emotion check-in trigger
  useEffect(() => {
    const checkEmotionTrigger = async () => {
      if (!userData || activeTab !== "home") return
      
      try {
        const emotionLogs = await (await import('@/lib/storage-hybrid')).storageHybrid.getEmotionLogs()
        const data = await (await import('@/lib/storage-hybrid')).storageHybrid.getUserData()
        
        if (!data.lastEmotionCheckIn || !data.lastEmotionCheckIn.date) {
          const recentLogs = emotionLogs?.slice(-5) || []
          const hasRecentBets = recentLogs.some(log => log.type === 'bet' && 
            new Date(log.timestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000)
          
          if (hasRecentBets) {
            setShowEmotionCheckIn(true)
          }
        } else {
          const daysSinceCheckIn = Math.floor((Date.now() - new Date(data.lastEmotionCheckIn.date).getTime()) / (24 * 60 * 60 * 1000))
          if (daysSinceCheckIn >= 1) {
            setShowEmotionCheckIn(true)
          }
        }
      } catch (error) {
        console.error('Error checking emotion trigger:', error)
      }
    }

    checkEmotionTrigger()
  }, [userData, activeTab])

  // Initialize user data and check auth
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          setAuthed(false)
          setShowLanding(true)
          setLoading(false)
          return
        }

        setAuthed(true)
        
        const userData = await initializeUserData()
        setUserData(userData)
        
        // Determine auth flow
        if (!userData.surveyData) {
          setAuthFlow("survey")
          setShowSurvey(true)
        } else if (!userData.onboardingComplete) {
          setAuthFlow("instant-profile")
          setShowInstantProfile(true)
        } else if (!userData.hasCompletedFirstBet) {
          setAuthFlow("profile-preview")
          setShowProfilePreview(true)
        } else {
          setAuthFlow("landing")
          setShowLanding(true)
        }
        
      } catch (error) {
        console.error('Auth initialization error:', error)
        setAuthed(false)
        setShowLanding(true)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUserData(null)
          setAuthed(false)
          setShowLanding(true)
        } else if (session && event === 'SIGNED_IN') {
          try {
            const userData = await initializeUserData()
            setUserData(userData)
            setAuthed(true)
          } catch (error) {
            console.error('Error getting user data after sign in:', error)
            setAuthed(true)
            setUserData(null)
          }
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const handleNavigateToTab = (tab: string) => {
    setActiveTab(tab)
  }

  const handleEmotionCheckInComplete = () => {
    setShowEmotionCheckIn(false)
    setRefreshKey(prev => prev + 1)
  }

  const handleInstantProfileComplete = () => {
    setShowInstantProfile(false)
    setAuthFlow("profile-preview")
    setShowProfilePreview(true)
  }

  const handleProfilePreviewComplete = () => {
    setShowProfilePreview(false)
    setAuthFlow("soft-gate")
    setShowSoftGate(true)
  }

  const handleSoftGateComplete = () => {
    setShowSoftGate(false)
    setAuthFlow("landing")
    setShowLanding(true)
  }

  const handleSurveyComplete = (surveyData: SurveyData) => {
    setShowSurvey(false)
    setAuthFlow("instant-profile")
    setShowInstantProfile(true)
  }

  const handleSignupComplete = () => {
    setShowSignup(false)
    setShowSurvey(true)
  }

  const handleSigninComplete = () => {
    setShowSignin(false)
    setShowSurvey(true)
  }

  const handleTermsComplete = () => {
    setShowTerms(false)
    setShowSignup(true)
  }

  const handleLandingGetStarted = () => {
    setShowLanding(false)
    setShowTerms(true)
  }

  // Render different auth flows
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (showSurvey) {
    const SurveyComponent = lazy(() => import("@/components/integrated-survey-flow/IntegratedSurveyWrapper"))
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>}>
        <SurveyComponent 
          onComplete={(score, level, email) => {
            handleSurveyComplete({ score, level } as any)
          }}
          onSwitchToLogin={() => {
            setShowSurvey(false)
            setShowSignin(true)
          }}
        />
      </Suspense>
    )
  }

  if (showInstantProfile) {
    const InstantProfileComponent = lazy(() => import("@/components/tabs/profile-tab"))
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>}>
        <InstantProfileComponent 
          userData={userData || null}
          updateUserData={async () => {}}
          forceRefresh={() => {}}
        />
      </Suspense>
    )
  }

  if (showProfilePreview) {
    const ProfilePreviewComponent = lazy(() => import("@/components/tabs/profile-tab"))
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>}>
        <ProfilePreviewComponent 
          userData={userData || null}
          updateUserData={async () => {}}
          forceRefresh={() => {}}
        />
      </Suspense>
    )
  }

  if (showSoftGate) {
    const SoftGateComponent = lazy(() => import("@/components/integrated-survey-flow/IntegratedSurveyWrapper"))
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>}>
        <SoftGateComponent 
          onComplete={(score, level, email) => {
            handleSoftGateComplete()
          }}
          onSwitchToLogin={() => {
            setShowSoftGate(false)
            setShowSignin(true)
          }}
        />
      </Suspense>
    )
  }

  if (showSignup) {
    const SignupComponent = lazy(() => import("@/components/auth/sign-in"))
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>}>
        <SignupComponent 
          onSwitchToSignUp={() => {}}
          onForgotPassword={() => {}}
          onResendConfirmation={() => {}}
        />
      </Suspense>
    )
  }

  if (showSignin) {
    const SigninComponent = lazy(() => import("@/components/auth/sign-in"))
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>}>
        <SigninComponent 
          onSwitchToSignUp={() => {}}
          onForgotPassword={() => {}}
          onResendConfirmation={() => {}}
        />
      </Suspense>
    )
  }

  if (showTerms) {
    const TermsComponent = lazy(() => import("@/components/terms-agreement"))
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>}>
        <TermsComponent 
          onAccept={handleTermsComplete}
          onDecline={() => {}}
        />
      </Suspense>
    )
  }

  if (showLanding) {
    const LandingComponent = lazy(() => import("@/components/landing-page"))
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>}>
        <LandingComponent 
          onLogin={() => {}}
        />
      </Suspense>
    )
  }

  // Main dashboard
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userData={userData} onNavigateToTab={handleNavigateToTab} />
      
      <div className="hidden md:block">
        <Navigation activeTab={activeTab} onTabChange={handleNavigateToTab} />
      </div>
      
      <main className="pb-20 md:pb-0">
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>}>
          {activeTab === "home" && (
            <HomeTab 
              key={refreshKey}
              userData={userData} 
              onEmotionCheckInComplete={handleEmotionCheckInComplete}
              showEmotionCheckIn={showEmotionCheckIn}
            />
          )}
          {activeTab === "odds" && <OddsTab />}
          {activeTab === "analyze" && <AnalyzeTab />}
          {activeTab === "behavior" && <BehaviorTab />}
          {activeTab === "ai-picks" && <AiPicksTab />}
          {activeTab === "analytics" && <AnalyticsTab />}
          {activeTab === "account" && <AccountTab userData={userData} />}
        </Suspense>
      </main>
      
      <div className="md:hidden">
        <BottomNav activeTab={activeTab} onTabChange={handleNavigateToTab} />
      </div>
    </div>
  )
}

export { HomeContent }

"use client"

import { useState, useEffect, lazy, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import { DashboardHeader } from "@/components/dashboard-header"
import { Navigation } from "@/components/navigation"
import { BottomNav } from "@/components/bottom-nav"
import { supabase } from "@/lib/supabase"
import type { SurveyData, UserData, Achievement } from "@/lib/types"
import { ErrorBoundary } from "@/components/error-boundary"
import { storageHybrid as storage } from "@/lib/storage-hybrid"
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
  const HomeTab = lazy(() => import("@/components/tabs/home-tab").then((m) => ({ default: m.HomeTab })))
  const OddsTab = lazy(() => import("@/components/tabs/live-odds-tab").then((m) => ({ default: m.LiveOddsTab })))
  const AnalyzeTab = lazy(() => import("@/components/tabs/analyze-bet-tab").then((m) => ({ default: m.AnalyzeBetTab })))
  const BehaviorTab = lazy(() => import("@/components/tabs/behavior-tab").then((m) => ({ default: m.BehaviorTab })))
  const AiPicksTab = lazy(() => import("@/components/tabs/ai-picks-tab").then((m) => ({ default: m.AIPicksTab })))
  const AnalyticsTab = lazy(() => import("@/components/tabs/analytics-tab").then((m) => ({ default: m.AnalyticsTab })))
  const AccountTab = lazy(() => import("@/components/tabs/account-tab").then((m) => ({ default: m.AccountTab })))

  const updateUserData = async (updates: Partial<UserData>) => {
    setUserData((prev) => {
      if (!prev) return prev
      const merged = { ...prev, ...updates }
      void storage.setUserData(merged)
      return merged
    })
  }

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
        const data = await storage.getUserData()

        // lastEmotionCheckIn is stored as a Date (or may be missing)
        const last = data.lastEmotionCheckIn
        if (!last) {
          setShowEmotionCheckIn(true)
          return
        }

        const lastTime = last instanceof Date ? last.getTime() : new Date(last as any).getTime()
        const daysSinceCheckIn = Math.floor((Date.now() - lastTime) / (24 * 60 * 60 * 1000))
        if (daysSinceCheckIn >= 1) {
          setShowEmotionCheckIn(true)
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
        
        const profile = await storage.getUserData()
        setUserData(profile)
        
        // Determine auth flow
        if (!profile.surveyData) {
          setAuthFlow("survey")
          setShowSurvey(true)
        } else if (!profile.onboardingComplete) {
          setAuthFlow("instant-profile")
          setShowInstantProfile(true)
        } else if ((profile.totalTrades || 0) < 1) {
          setAuthFlow("profile-preview")
          setShowProfilePreview(true)
        } else {
          setAuthFlow("landing")
          setShowLanding(false)
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
            const profile = await storage.getUserData()
            setUserData(profile)
            setAuthed(true)
            setShowLanding(false)
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

  if (authed && !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (showSurvey) {
    const SurveyComponent = lazy(() =>
      import("@/components/integrated-survey-flow/IntegratedSurveyWrapper").then((m) => ({
        default: m.IntegratedSurveyWrapper,
      }))
    )
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
    const InstantProfileComponent = lazy(() =>
      import("@/components/tabs/profile-tab").then((m) => ({ default: m.ProfileTab }))
    )
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>}>
        <InstantProfileComponent 
          userData={userData as any}
          updateUserData={updateUserData}
          forceRefresh={() => setRefreshKey((k) => k + 1)}
        />
      </Suspense>
    )
  }

  if (showProfilePreview) {
    const ProfilePreviewComponent = lazy(() =>
      import("@/components/tabs/profile-tab").then((m) => ({ default: m.ProfileTab }))
    )
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>}>
        <ProfilePreviewComponent 
          userData={userData as any}
          updateUserData={updateUserData}
          forceRefresh={() => setRefreshKey((k) => k + 1)}
        />
      </Suspense>
    )
  }

  if (showSoftGate) {
    const SoftGateComponent = lazy(() =>
      import("@/components/integrated-survey-flow/IntegratedSurveyWrapper").then((m) => ({
        default: m.IntegratedSurveyWrapper,
      }))
    )
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
    const SignupComponent = lazy(() =>
      import("@/components/auth/sign-in").then((m) => ({ default: m.SignIn }))
    )
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
    const SigninComponent = lazy(() =>
      import("@/components/auth/sign-in").then((m) => ({ default: m.SignIn }))
    )
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
    const TermsComponent = lazy(() =>
      import("@/components/terms-agreement").then((m) => ({ default: m.TermsAgreement }))
    )
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
    const LandingComponent = lazy(() =>
      import("@/components/landing-page").then((m) => ({ default: m.LandingPage }))
    )
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>}>
        <LandingComponent 
          onLogin={() => {
            window.location.href = "/login"
          }}
        />
      </Suspense>
    )
  }

  // Main dashboard
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        <DashboardHeader userData={userData ?? undefined} onNavigateToTab={handleNavigateToTab} />
        
        <div className="hidden md:block">
          <Navigation activeTab={activeTab} onTabChange={handleNavigateToTab} />
        </div>
        
        <main className="pb-20 md:pb-0">
          <ErrorBoundary>
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
              <div className="animate-pulse text-muted-foreground">Loading...</div>
            </div>}>
              {activeTab === "home" && (
                <HomeTab 
                  key={refreshKey}
                  userData={userData as any}
                  updateUserData={updateUserData}
                  onNavigateToTab={handleNavigateToTab}
                  refreshKey={refreshKey}
                />
              )}
              {activeTab === "odds" && <OddsTab userData={userData as any} onNavigateToTab={handleNavigateToTab} />}
              {activeTab === "analyze" && <AnalyzeTab userData={userData as any} onNavigateToTab={handleNavigateToTab} />}
              {activeTab === "behavior" && (
                <BehaviorTab userData={userData as any} updateUserData={updateUserData} refreshKey={refreshKey} />
              )}
              {activeTab === "ai-picks" && <AiPicksTab userData={userData as any} onNavigateToTab={handleNavigateToTab} />}
              {activeTab === "analytics" && <AnalyticsTab userData={userData as any} onNavigateToTab={handleNavigateToTab} />}
              {activeTab === "account" && <AccountTab userData={userData as any} updateUserData={updateUserData} />}
            </Suspense>
          </ErrorBoundary>
        </main>
        
        <div className="md:hidden">
          <BottomNav activeTab={activeTab} onTabChange={handleNavigateToTab} />
        </div>
      </div>
    </ErrorBoundary>
  )
}

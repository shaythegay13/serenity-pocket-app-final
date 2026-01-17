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
    
    // Redirect old history tab to analytics performance tab
    if (tab === "history") {
      window.history.replaceState(null, "", "/?tab=analytics")
      setActiveTab("analytics")
      return
    }
    
    if (tab && ["home", "odds", "analyze", "behavior", "ai-picks", "analytics", "account"].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  // Check for signup trigger
  useEffect(() => {
    const signup = searchParams.get("signup")
    
    if (signup === "true" && !loading && authed === false) {
      setShowLanding(false)
      setShowTerms(true)
      // Clean up the URL
      window.history.replaceState(null, "", "/")
    }
  }, [searchParams, loading, authed])

  // Check for emotion check-in trigger
  useEffect(() => {
    const checkEmotionTrigger = async () => {
      if (!userData || activeTab !== "home") return
      
      try {
        const data = await storage.getUserData()

        // Check if user data exists before accessing properties
        if (!data) {
          setShowEmotionCheckIn(true)
          return
        }

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
    console.log('🏠 HomeContent: Starting auth initialization...')
    
    const initAuth = async () => {
      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.log('🔐 Auth initialization timeout - forcing loading to false')
        setLoading(false)
        setAuthed(false)
        setShowLanding(true)
      }, 10000) // 10 second timeout

      try {
        console.log('🔐 Getting session and user data...')
        // Run auth check and user data fetch in parallel
        const [sessionResult, userDataResult] = await Promise.allSettled([
          supabase.auth.getSession(),
          storage.getUserData().catch(() => null)
        ])

        clearTimeout(timeoutId)

        const session = sessionResult.status === 'fulfilled' ? sessionResult.value.data.session : null
        console.log('🔐 Session result:', session ? 'found' : 'not found')
        
        // Check for refresh token errors
        if (sessionResult.status === 'rejected') {
          const error = sessionResult.reason
          console.log('🔐 Session rejected:', error)
          if (error?.message?.includes('Invalid Refresh Token') || error?.message?.includes('Refresh Token Not Found')) {
            console.log('Clearing stale auth tokens due to refresh error')
            const { clearStaleAuth } = await import('@/lib/supabase')
            await clearStaleAuth()
          }
        }
        
        if (!session) {
          console.log('🔐 No session found, showing landing')
          setAuthed(false)
          setShowLanding(true)
          setLoading(false)
          return
        }

        console.log('🔐 Session found, setting authed to true')
        setAuthed(true)
        
        const profile = userDataResult.status === 'fulfilled' ? userDataResult.value : null
        console.log('🔐 User data result:', profile ? 'found' : 'not found')
        setUserData(profile)

        // Authenticated users should see the main dashboard
        // Don't set any auth flow - let user see main dashboard
        setShowSurvey(false)
        setShowInstantProfile(false)
        setShowProfilePreview(false)
        setShowSoftGate(false)
        setShowSignup(false)
        setShowSignin(false)
        setShowTerms(false)
        setShowLanding(false) // Explicitly hide landing page
        
      } catch (error) {
        clearTimeout(timeoutId)
        console.error('Auth initialization error:', error)
        setAuthed(false)
        setShowLanding(true)
      } finally {
        console.log('🔐 Auth initialization complete, setting loading to false')
        setLoading(false)
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state change:', event, session ? 'with session' : 'no session')
        if (event === 'SIGNED_OUT') {
          setUserData(null)
          setAuthed(false)
          setShowLanding(true)
        } else if (session && event === 'SIGNED_IN') {
          console.log('🔐 User signed in, showing dashboard')
          try {
            const profile = await storage.getUserData()
            setUserData(profile)
            setAuthed(true)
            // Don't set any auth flow - let user see main dashboard
            setShowSurvey(false)
            setShowInstantProfile(false)
            setShowProfilePreview(false)
            setShowSoftGate(false)
            setShowSignup(false)
            setShowSignin(false)
            setShowTerms(false)
            setShowLanding(false) // Explicitly hide landing page
          } catch (error) {
            console.error('Error getting user data after sign in:', error)
            setAuthed(true)
            setUserData(null)
            setShowLanding(false) // Still hide landing even if user data fails
          }
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const handleNavigateToTab = (tab: string) => {
    console.log('🔄 Navigating to tab:', tab)
    setActiveTab(tab)
  }

  const handleEmotionCheckInComplete = () => {
    setShowEmotionCheckIn(false)
    // Only refresh if not on the behavior tab to avoid interfering with emotion logging
    if (activeTab !== "behavior") {
      setRefreshKey(prev => prev + 1)
    }
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
  // Debug logging to track auth state
  console.log('🔐 Current auth state:', { 
    authed, 
    loading, 
    showLanding, 
    hasUserData: !!userData,
    activeTab 
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <div className="animate-pulse text-muted-foreground">Loading...</div>
          <button 
            onClick={() => {
              console.log('🔄 Manual retry triggered')
              setLoading(false)
              setAuthed(false)
              setShowLanding(true)
            }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Having trouble? Click here
          </button>
        </div>
      </div>
    )
  }

  if (authed && !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <div className="animate-pulse text-muted-foreground">Loading profile...</div>
        </div>
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
      import("@/components/AccountCreationFlow").then((m) => ({ default: m.default }))
    )
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>}>
        <SignupComponent 
          email=""
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

  if (showLanding && !authed) {
    console.log('🔐 Showing landing page - showLanding:', showLanding, 'authed:', authed)
    const LandingComponent = lazy(() =>
      import("@/components/landing-page").then((m) => ({ default: m.LandingPage }))
    )
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>}>
        <LandingComponent 
          onLogin={() => {
            console.log('🔐 Landing page login clicked')
            window.location.href = "/login"
          }}
        />
      </Suspense>
    )
  }

  console.log('🔐 Showing main dashboard - showLanding:', showLanding, 'authed:', authed)

  // Main dashboard
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        <DashboardHeader userData={userData ?? undefined} onNavigateToTab={handleNavigateToTab} />
        
        <div className="hidden md:block">
          <Navigation />
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
              {activeTab === "account" && (
                <Suspense fallback={
                  <div className="min-h-[60vh] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <div className="animate-pulse text-muted-foreground">Loading Account...</div>
                    </div>
                  </div>
                }>
                  <AccountTab userData={userData as any} updateUserData={updateUserData} />
                </Suspense>
              )}
            </Suspense>
          </ErrorBoundary>
        </main>
        
        <div className="md:hidden">
          <BottomNav />
        </div>
      </div>
    </ErrorBoundary>
  )
}

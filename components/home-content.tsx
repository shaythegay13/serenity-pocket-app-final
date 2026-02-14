"use client"

import { useState, useEffect, lazy, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Image from "next/image"
import { DashboardHeader } from "@/components/dashboard-header"
import { Navigation } from "@/components/navigation"
import { BottomNav } from "@/components/bottom-nav"
import { supabase } from "@/lib/supabase"
import type { SurveyData, UserData, Achievement } from "@/lib/types"
import { ErrorBoundary } from "@/components/error-boundary"
import { storageHybrid as storage } from "@/lib/storage-hybrid"
import { reconcileAllData } from "@/lib/services/data-reconciliation-service"
import { hasAnonymousSession, getAnonymousSessionId, clearAnonymousSession } from "@/lib/anonymous-session"
// Auth rate limit debug utilities (loads global debug functions)
import "@/lib/auth-rate-limit-utils"

export function HomeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
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
  const BehaviorTab = lazy(() => import("@/components/tabs/behavior-tab").then((m) => ({ default: m.BehaviorTab })))
  const AiPicksTab = lazy(() => import("@/components/tabs/ai-picks-tab").then((m) => ({ default: m.AIPicksTab })))
  const AnalyticsTab = lazy(() => import("@/components/tabs/analytics-tab").then((m) => ({ default: m.AnalyticsTab })))
  const AccountTab = lazy(() => import("@/components/tabs/account-tab").then((m) => ({ default: m.AccountTab })))

  // Emotion check-in dialog
  const EmotionCheckInDialog = lazy(() => import("@/components/emotion-check-in-dialog").then((m) => ({ default: m.EmotionCheckInDialog })))

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
    const section = searchParams.get("section")

    // Redirect old history tab to analytics performance tab
    if (tab === "history") {
      window.history.replaceState(null, "", "/?tab=analytics")
      setActiveTab("analytics")
      return
    }

    if (tab && ["home", "behavior", "ai-picks", "analytics", "account"].includes(tab)) {
      setActiveTab(tab)

      // If we have a section parameter and the tab is ai-picks, we need to handle it
      if (tab === "ai-picks" && section) {
        // We'll handle this in the AiPicksTab component by checking URL params
        // Store the section in sessionStorage for the AiPicksTab to pick up
        sessionStorage.setItem("targetSection", section)
      }
    }
  }, [searchParams])

  // Check for signup trigger
  useEffect(() => {
    const signup = searchParams.get("signup")
    const flow = searchParams.get("flow")

    console.log('🔧 Home-content signup check:', { signup, flow, loading, authed, userData })

    if (signup === "true" && !loading) {
      console.log('🔧 Signup flow detected in home-content!')
      if (authed === false) {
        // User is not authenticated, start signup flow
        console.log('🔧 Starting signup flow for unauthenticated user')
        setShowLanding(false)
        setShowSignin(false) // Ensure signin is hidden
        setShowTerms(true)
        // Store the flow for after signup completion
        if (flow === "tiltlab" || flow === "smartslip") {
          localStorage.setItem("entry_flow", flow)
        }
        // Clean up the URL but preserve /home for authenticated users
        window.history.replaceState(null, "", "/home")
      } else if (authed === true && userData) {
        // User is already authenticated, go directly to the feature
        console.log('🔧 Authenticated user detected, but should show survey first')
        // For now, let's not redirect - let the survey show first
        // The survey will handle navigation after completion
      }
    }
  }, [searchParams, loading, authed, userData])

  // Old entry_flow logic removed - users now go to /home after survey

  // Check for emotion check-in trigger (once per login session)
  useEffect(() => {
    const checkEmotionTrigger = async () => {
      if (!userData || activeTab !== "home") return

      try {
        // Check if we've already shown emotion check-in this login session
        const sessionShown = sessionStorage.getItem('emotionCheckInShown')
        if (sessionShown) {
          setShowEmotionCheckIn(false)
          return
        }

        // Show emotion check-in for this login session (first visit to /home)
        setShowEmotionCheckIn(true)
        // Mark that we've shown it this session
        sessionStorage.setItem('emotionCheckInShown', 'true')
      } catch (error) {
        console.error('Error checking emotion trigger:', error)
      }
    }

    checkEmotionTrigger()
  }, [userData, activeTab])

  // Initialize user data and check auth
  useEffect(() => {
    const initAuth = async () => {
      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        setLoading(false)
        setAuthed(false)
        setShowLanding(true)
      }, 5000) // 5 second timeout

      try {
        // Run auth check and user data fetch in parallel
        const [sessionResult, userDataResult] = await Promise.allSettled([
          supabase.auth.getSession(),
          storage.getUserData()
        ])

        clearTimeout(timeoutId)

        const session = sessionResult.status === 'fulfilled' ? sessionResult.value.data.session : null

        // Check for refresh token errors
        if (sessionResult.status === 'rejected') {
          const error = sessionResult.reason
          if (error?.message?.includes('Invalid Refresh Token') || error?.message?.includes('Refresh Token Not Found')) {
            const { clearStaleAuth } = await import('@/lib/supabase')
            await clearStaleAuth()
          }
        }

        if (!session) {
          setAuthed(false)
          setShowLanding(true)
          setLoading(false)
          return
        }

        setAuthed(true)

        const profile = userDataResult.status === 'fulfilled' ? userDataResult.value : null
        setUserData(profile)

        // Authenticated users should see the main dashboard
        setShowSignup(false)
        setShowSignin(false)
        setShowTerms(false)
        setShowLanding(false) // Explicitly hide landing page

      } catch (error) {
        clearTimeout(timeoutId)
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
            // Migrate anonymous session data if present
            if (hasAnonymousSession()) {
              try {
                const anonId = getAnonymousSessionId()
                const res = await fetch('/api/public/migrate-session', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                  },
                  body: JSON.stringify({ anonymous_session_id: anonId }),
                })
                if (res.ok) {
                  clearAnonymousSession()
                }
              } catch (migrationErr) {
                console.error('Anonymous session migration error:', migrationErr)
              }
            }

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
            setAuthed(true)
            setUserData(null)
            setShowLanding(false) // Still hide landing even if user data fails
          }
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Automatically reconcile any missing data when user is authenticated
  // This runs in the background and catches any localStorage data that wasn't synced
  useEffect(() => {
    if (!authed || loading) return

    // Run reconciliation in background after a short delay
    const timeoutId = setTimeout(async () => {
      try {
        const result = await reconcileAllData()
        const total = result.emotionLogsReconciled + result.betAnalysesReconciled +
                     result.comprehensiveBetsReconciled + result.tradesReconciled

        if (total > 0) {
          console.log(`[Home] Auto-reconciled ${total} missing records`)
        }
      } catch (error) {
        // Silently fail - this is a background optimization
        console.warn('[Home] Background reconciliation error:', error)
      }
    }, 3000) // 3 second delay to not interfere with initial load

    return () => clearTimeout(timeoutId)
  }, [authed, loading])

  const handleNavigateToTab = (tab: string, subtab?: string) => {
    // Update the active tab state immediately
    setActiveTab(tab)

    // Update URL with clean paths for other tabs
    if (subtab) {
      window.history.replaceState(null, '', `/${tab}/${subtab}`)
    } else {
      window.history.replaceState(null, '', `/${tab}`)
    }
  }

  const handleEmotionCheckInComplete = () => {
    setShowEmotionCheckIn(false)
    // sessionStorage flag already prevents showing again this session
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
    // For new users, always redirect to /home after survey completion
    // They can access premium features later when they subscribe
    localStorage.removeItem("entry_flow")
    router.push("/home")
  }

  const handleSignupComplete = () => {
    console.log('🔧 handleSignupComplete called - redirecting to /survey')
    // The AccountCreationFlow will handle redirecting to /survey
    // No need to manage survey state here anymore
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
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <div className="animate-pulse text-muted-foreground">Loading...</div>
          <button
            onClick={() => {
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
    console.log('🔧 Rendering survey component - showSurvey is true')
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
            console.log('🔧 Survey completed with:', { score, level, email })
            handleSurveyComplete({ score, level } as any)
          }}
          onSwitchToLogin={() => {
            console.log('🔧 Survey switch to login')
            setShowSurvey(false)
            setShowSignin(true)
          }}
        />
      </Suspense>
    )
  } else {
    console.log('🔧 Not rendering survey - showSurvey is false')
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
          onComplete={handleSignupComplete}
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
          onSwitchToSignUp={() => {
            console.log('🔧 Signup button clicked - starting signup flow')
            // Use URL parameter to ensure signup flow persists across auth checks
            if (typeof window !== 'undefined') {
              window.history.pushState(null, '', '/?signup=true')
            }
            // Immediately update states to prevent race conditions
            setShowSignin(false)
            setShowLanding(false)
            setAuthFlow('signup')
            setShowSignup(true)
            console.log('🔧 Signup flow states updated')
          }}
          onForgotPassword={() => {
            // TODO: Implement forgot password flow
          }}
          onResendConfirmation={() => {
            // TODO: Implement resend confirmation flow
          }}
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
          onDecline={() => {
            console.log('🔧 Terms declined - redirecting to landing page')
            // Clear signup flow and redirect to landing page
            setShowTerms(false)
            setShowSignup(false)
            setAuthFlow('landing')
            setShowLanding(true)
            // Clean up URL
            if (typeof window !== 'undefined') {
              window.history.replaceState(null, '', '/')
            }
          }}
        />
      </Suspense>
    )
  }

  // Redirect unauthenticated users to landing page at root URL
  // SECURITY: This must catch ALL unauthenticated states
  if (!authed) {
    // Check if we're in a signup flow - if so, continue showing terms/signup flow
    const signup = searchParams.get("signup")
    const inSignupFlow = signup === "true" || showTerms || showSignup || authFlow === 'signup'
    
    console.log('🔧 Auth check:', { authed, signup, showTerms, showSignup, authFlow, inSignupFlow })
    
    if (!inSignupFlow) {
      // Not in signup flow, redirect to landing page
      console.log('🔧 Not in signup flow - redirecting to landing')
      router.push("/")
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Redirecting...</div>
        </div>
      )
    } else {
      console.log('🔧 In signup flow - allowing access to signup components')
    }
  }

  // SECURITY: Explicit authentication check before rendering dashboard
  // This ensures NO unauthenticated user can ever see the dashboard
  if (authed !== true) {
    // Check if we're in a signup flow - if so, allow signup components to render
    const signup = searchParams.get("signup")
    const inSignupFlow = signup === "true" || showTerms || showSignup || authFlow === 'signup'
    
    if (!inSignupFlow) {
      // This should never happen, but provides a safety net
      console.error('[HomeContent] Invalid auth state - redirecting to landing')
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Verifying authentication...</div>
        </div>
      )
    }
  }

  // Main dashboard - ONLY renders when authed === true
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        <DashboardHeader userData={userData ?? undefined} onNavigateToTab={handleNavigateToTab} />

        <div className="hidden md:block">
          <Navigation onNavigateToTab={handleNavigateToTab} isHomePage={true} />
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

        {/* Emotion Check-in Dialog */}
        {showEmotionCheckIn && (
          <Suspense fallback={null}>
            <EmotionCheckInDialog
              open={showEmotionCheckIn}
              onOpenChange={setShowEmotionCheckIn}
              onComplete={handleEmotionCheckInComplete}
              userData={userData ?? undefined}
              updateUserData={updateUserData}
            />
          </Suspense>
        )}
      </div>
    </ErrorBoundary>
  )
}

"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Navigation } from "@/components/navigation"
import { BottomNav } from "@/components/bottom-nav"
import { ErrorBoundary } from "@/components/error-boundary"
import { supabase } from "@/lib/supabase"
import type { UserData } from "@/lib/types"
import { storageHybrid as storage } from "@/lib/storage-hybrid"
import { AnalyticsTab } from "@/components/tabs/analytics-tab"

// Default user data for fallback when fetch fails but user is authenticated
const DEFAULT_USER_DATA: UserData = {
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
  dailyRings: { emotionalAwareness: 0, biasRecognition: 0, mindfulness: 0 },
  lastRingReset: new Date(),
  perfectDays: 0,
  longestStreak: 0,
  totalEmotionsLogged: 0,
  totalBiasesIdentified: 0,
  totalJournalsCompleted: 0,
  totalModulesCompleted: 0,
  totalBreathingExercises: 0,
  mostProductiveDay: 0,
  subscriptionTier: 'free',
  subscriptionStatus: 'active',
}

export function AnalyticsContent() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [authed, setAuthed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const checkAuth = async () => {
      try {
        // Step 1: Check session (same as home page)
        const { data: { session } } = await supabase.auth.getSession()

        if (!isMounted) return

        if (!session) {
          setAuthed(false)
          return
        }

        setAuthed(true)

        // Step 2: Fetch user data (only if authenticated)
        try {
          const data = await storage.getUserData()
          if (isMounted) setUserData(data)
        } catch (err) {
          console.warn('Failed to load user data, using defaults:', err)
          if (isMounted) setUserData(DEFAULT_USER_DATA)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        if (isMounted) setAuthed(false)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    // Safety timeout: guarantee loading clears after 5s no matter what
    const safetyTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('[Analytics] Safety timeout fired after 5s')
        setLoading(false)
      }
    }, 5000)

    checkAuth().finally(() => clearTimeout(safetyTimeout))

    return () => {
      isMounted = false
      clearTimeout(safetyTimeout)
    }
  }, [])

  // Show loading state only during initial auth check
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        <DashboardHeader userData={userData || undefined} />
        <Navigation />

        <main className="container mx-auto px-4 py-6">
          {authed && userData ? (
            <AnalyticsTab userData={userData} />
          ) : (
            <div className="text-center py-12">
              <p>Please sign in to access the analytics feature.</p>
            </div>
          )}
        </main>

        <BottomNav />
      </div>
    </ErrorBoundary>
  )
}

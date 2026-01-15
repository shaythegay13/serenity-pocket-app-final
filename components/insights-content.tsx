"use client"

import { useState, useEffect, Suspense } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Navigation } from "@/components/navigation"
import { BottomNav } from "@/components/bottom-nav"
import { ErrorBoundary } from "@/components/error-boundary"
import { supabase } from "@/lib/supabase"
import type { UserData } from "@/lib/types"
import { storageHybrid as storage } from "@/lib/storage-hybrid"
import dynamic from "next/dynamic"

// Lazy load the AI picks tab component
const AIPicksTab = dynamic(() => import("@/components/tabs/ai-picks-tab").then(mod => ({ default: mod.AIPicksTab })), {
  loading: () => (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <div className="animate-pulse text-muted-foreground">Loading AI Insights...</div>
      </div>
    </div>
  ),
  ssr: false
})

export function InsightsContent() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    
    const checkAuth = async () => {
      try {
        // Run auth check and user data fetch in parallel
        const [sessionResult, userDataResult] = await Promise.allSettled([
          supabase.auth.getSession(),
          storage.getUserData().catch(() => null)
        ])

        if (!isMounted) return

        const session = sessionResult.status === 'fulfilled' ? sessionResult.value.data.session : null
        const storedUserData = userDataResult.status === 'fulfilled' ? userDataResult.value : null
        
        setAuthed(!!session)
        
        if (session) {
          setUserData(storedUserData)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        setAuthed(false)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    checkAuth()

    return () => {
      isMounted = false
    }
  }, [])

  const handleNavigateToTab = (tab: string) => {
    // Handle navigation to other tabs if needed
    window.location.href = `/${tab === 'odds' ? 'sports-dashboard' : tab}`
  }

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
          {userData ? (
            <Suspense fallback={
              <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <div className="animate-pulse text-muted-foreground">Loading AI Insights...</div>
                </div>
              </div>
            }>
              <AIPicksTab userData={userData} onNavigateToTab={handleNavigateToTab} />
            </Suspense>
          ) : (
            <div className="text-center py-12">
              <p>Please sign in to access the AI insights feature.</p>
            </div>
          )}
        </main>

        <BottomNav />
      </div>
    </ErrorBoundary>
  )
}

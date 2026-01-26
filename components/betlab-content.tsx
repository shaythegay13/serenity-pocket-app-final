"use client"

import { useState, useEffect, Suspense } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Navigation } from "@/components/navigation"
import { BottomNav } from "@/components/bottom-nav"
import { ErrorBoundary } from "@/components/error-boundary"
import { PremiumFeatureWall } from "@/components/premium-feature-wall"
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
        <div className="animate-pulse text-muted-foreground">Loading BetLab...</div>
      </div>
    </div>
  ),
  ssr: false
})

export function BetLabContent() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    
    const checkAuth = async () => {
      try {
        // Simple auth check first
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!isMounted) return
        
        setAuthed(!!session)
        
        if (session) {
          // Fetch user data in background
          try {
            const storedUserData = await storage.getUserData()
            if (isMounted) {
              setUserData(storedUserData)
            }
          } catch (error) {
            console.error('Failed to fetch user data:', error)
          }
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
    if (tab === 'account' || tab === 'pricing') {
      window.location.href = "/pricing"
    } else {
      window.location.href = `/${tab === 'odds' ? 'sports-dashboard' : tab}`
    }
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
            userData.subscriptionTier === 'free' ? (
              <PremiumFeatureWall 
                title="BetLab"
                description="Personalized bet suggestions based on your psychology + real-time data"
                featureName="SmartSlip and TiltLab"
              />
            ) : (
              <Suspense fallback={
                <div className="min-h-[60vh] flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <div className="animate-pulse text-muted-foreground">Loading BetLab...</div>
                  </div>
                </div>
              }>
                <div>
                  <div className="text-center space-y-2 mb-6">
                    <h2 className="text-3xl font-bold text-foreground">BetLab</h2>
                    <p className="text-muted-foreground">
                      Get AI-generated picks or analyze your own bets with comprehensive psychological insights
                    </p>
                  </div>
                  <AIPicksTab userData={userData} onNavigateToTab={handleNavigateToTab} />
                </div>
              </Suspense>
            )
          ) : (
            <div className="text-center py-12">
              <p>Please sign in to access the BetLab feature.</p>
            </div>
          )}
        </main>

        <BottomNav />
      </div>
    </ErrorBoundary>
  )
}

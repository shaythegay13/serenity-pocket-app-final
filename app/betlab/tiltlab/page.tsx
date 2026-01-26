"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Navigation } from "@/components/navigation"
import { BottomNav } from "@/components/bottom-nav"
import { ErrorBoundary } from "@/components/error-boundary"
import { PremiumFeatureWall } from "@/components/premium-feature-wall"
import { supabase } from "@/lib/supabase"
import type { UserData } from "@/lib/types"
import { storageHybrid as storage } from "@/lib/storage-hybrid"
import dynamic from "next/dynamic"

// Lazy load the AI bet advisor component
const AIBetAdvisor = dynamic(() => import("@/components/ai-bet-advisor").then(mod => ({ default: mod.AIBetAdvisor })), {
  loading: () => (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <div className="animate-pulse text-muted-foreground">Loading AI Bet Analyzer...</div>
      </div>
    </div>
  ),
  ssr: false
})

export default function TiltLabPage() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!isMounted) return
        
        setAuthed(!!session)
        
        if (session) {
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
            // TEMPORARILY DISABLED: userData.subscriptionTier === 'free' ? (
            //   <PremiumFeatureWall 
            //     title="AI Bet Analyzer"
            //     description="Comprehensive bet analysis with emotional psychology insights"
            //     featureName="AI Bet Analyzer and Psychology Analysis"
            //   />
            // ) : (
              <div>
                <div className="text-center space-y-2 mb-6">
                  <h2 className="text-3xl font-bold text-foreground">AI Bet Analyzer</h2>
                  <p className="text-muted-foreground">
                    Get comprehensive bet analysis with emotional psychology insights and risk assessment
                  </p>
                </div>
                <AIBetAdvisor />
              </div>
            // )
          ) : (
            <div className="text-center py-12">
              <p>Please sign in to access the AI Bet Analyzer.</p>
            </div>
          )}
        </main>

        <BottomNav />
      </div>
    </ErrorBoundary>
  )
}

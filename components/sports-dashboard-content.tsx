"use client"

import { useState, useEffect, Suspense } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Navigation } from "@/components/navigation"
import { BottomNav } from "@/components/bottom-nav"
import { ErrorBoundary } from "@/components/error-boundary"
import { supabase } from "@/lib/supabase"
import type { UserData } from "@/lib/types"
import { storageHybrid as storage } from "@/lib/storage-hybrid"

// Lazy load the sports dashboard to improve initial load time
import dynamic from "next/dynamic"

const SportsDashboard = dynamic(() => import("@/components/sports-dashboard").then(mod => ({ default: mod.SportsDashboard })), {
  loading: () => (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <div className="animate-pulse text-muted-foreground">Loading Sports Dashboard...</div>
      </div>
    </div>
  ),
  ssr: false
})

export function SportsDashboardContent() {
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
          <Suspense fallback={
            <div className="min-h-[60vh] flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <div className="animate-pulse text-muted-foreground">Loading Sports Dashboard...</div>
              </div>
            </div>
          }>
            <SportsDashboard />
          </Suspense>
        </main>

        <BottomNav />
      </div>
    </ErrorBoundary>
  )
}

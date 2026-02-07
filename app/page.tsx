"use client"

import { Suspense, useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { LandingPage } from "@/components/landing-page"

function HomeContent() {
  const [isNavigating, setIsNavigating] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)

  // Stable login handler that prevents double-clicks and race conditions
  const handleLogin = useCallback(() => {
    if (isNavigating) return
    setIsNavigating(true)
    window.location.href = "/login"
  }, [isNavigating])

  useEffect(() => {
    // Prevent running auth check multiple times
    if (authChecked) return

    const checkAuthAndFlow = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        // Only redirect authenticated users to /home
        // Unauthenticated users stay on landing page - they must go through login first
        if (session) {
          window.location.href = "/home"
          return
        }
        // No session - show landing page, user must click login/signup
      } catch (error) {
        console.error('Auth check error:', error)
      } finally {
        setAuthChecked(true)
      }
    }

    checkAuthAndFlow()
  }, [authChecked])

  return <LandingPage onLogin={handleLogin} />
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>}>
      <HomeContent />
    </Suspense>
  )
}

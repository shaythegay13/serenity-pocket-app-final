"use client"

import { Suspense, useEffect, useState, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { LandingPage } from "@/components/landing-page"

function HomeContent() {
  const [isNavigating, setIsNavigating] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()

  // Stable login handler that prevents double-clicks and race conditions
  const handleLogin = useCallback(() => {
    if (isNavigating) return
    setIsNavigating(true)
    router.push("/login")
  }, [isNavigating, router])

  useEffect(() => {
    // Prevent running auth check multiple times
    if (authChecked) return

    const checkAuthAndFlow = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        // Only redirect authenticated users to /home
        // Unauthenticated users stay on landing page - they must go through login first
        if (session) {
          router.replace("/home")
          return
        }

        // If signup=true is in the URL, forward to /home so the signup flow can start
        const signup = searchParams.get("signup")
        if (signup === "true") {
          const flow = searchParams.get("flow")
          const signupUrl = flow ? `/home?signup=true&flow=${flow}` : "/home?signup=true"
          router.replace(signupUrl)
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
  }, [authChecked, searchParams])

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

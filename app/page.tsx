"use client"

import React, { Suspense, useEffect, useState, useCallback } from "react"
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
    // Auth check removed to prioritize landing page viewership.
    // Redirection now happens exclusively on the /login route.
    setAuthChecked(true)
  }, [])

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

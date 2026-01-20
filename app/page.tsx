"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { LandingPage } from "@/components/landing-page"

export default function Home() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const checkAuthAndFlow = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      // Check for signup flow parameters
      const signup = searchParams.get("signup")
      const flow = searchParams.get("flow")
      
      console.log('Main page auth check:', { session: !!session, signup, flow, currentUrl: window.location.href })
      
      if (signup === "true" && flow && (flow === "tiltlab" || flow === "smartslip")) {
        console.log('🔧 Signup flow detected!')
        if (session) {
          // User is authenticated, go to home page for signup flow (not insights)
          console.log('🔧 Authenticated user, redirecting to home for signup flow:', flow)
          console.log('🔧 Redirecting to:', `/home?signup=true&flow=${flow}`)
          window.location.href = `/home?signup=true&flow=${flow}`
        } else {
          // User is not authenticated, continue to landing page for signup
          console.log('🔧 Unauthenticated user, showing landing page for signup')
        }
      } else if (session) {
        console.log('🔧 Regular authenticated user, redirecting to home')
        // Regular authenticated user without signup flow, redirect to home
        router.push("/home")
      } else {
        console.log('🔧 No session, no signup flow - showing landing page')
      }
    }
    checkAuthAndFlow()
  }, [router, searchParams])

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>}>
      <LandingPage onLogin={() => window.location.href = "/login"} />
    </Suspense>
  )
}

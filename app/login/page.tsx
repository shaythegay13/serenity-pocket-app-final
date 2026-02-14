"use client"

import { useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { SignIn } from "@/components/auth/sign-in"
import { supabase } from "@/lib/supabase"

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    let mounted = true;
    
    const check = async () => {
      try {
        // Very short timeout - if auth is slow, just show login form
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Auth timeout')), 800)
        );
        
        const { data: { session } } = await Promise.race([
          supabase.auth.getSession(),
          timeoutPromise
        ]) as any;
        
        if (mounted && session) {
          router.replace("/home")
        }
      } catch (error) {
        // Silently continue - login form is already visible
      }
    }
    
    // Run auth check in background without blocking
    check();
    
    return () => {
      mounted = false;
    };
  }, [router])

  // Get flow from URL parameters
  const flow = searchParams?.get("flow") || "default"

  return (
    <SignIn
      onSwitchToSignUp={() => {
        // Redirect to home with signup flow trigger, preserving the flow parameter
        const signupUrl = flow ? `/?signup=true&flow=${flow}` : "/?signup=true"
        router.push(signupUrl)
      }}
      onForgotPassword={() => {
        router.push("/auth/reset-password")
      }}
      onResendConfirmation={() => {
        router.push("/")
      }}
    />
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  )
}

"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { SignIn } from "@/components/auth/sign-in"
import { supabase } from "@/lib/supabase"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) window.location.href = "/home"
    }
    check()
  }, [router])

  // Get flow from URL parameters
  const flow = searchParams.get("flow")

  return (
    <SignIn
      onSwitchToSignUp={() => {
        // Redirect to home with signup flow trigger, preserving the flow parameter
        const signupUrl = flow ? `/?signup=true&flow=${flow}` : "/?signup=true"
        window.location.href = signupUrl
      }}
      onForgotPassword={() => {
        window.location.href = "/auth/reset-password"
      }}
      onResendConfirmation={() => {
        window.location.href = "/"
      }}
    />
  )
}

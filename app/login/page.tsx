"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { SignIn } from "@/components/auth/sign-in"
import { supabase } from "@/lib/supabase"

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) window.location.href = "/"
    }
    check()
  }, [router])

  return (
    <SignIn
      onSwitchToSignUp={() => {
        window.location.href = "/"
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

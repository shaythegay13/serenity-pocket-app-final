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
      if (session) router.replace("/")
    }
    check()
  }, [router])

  return (
    <SignIn
      onSwitchToSignUp={() => router.replace("/")}
      onForgotPassword={() => router.push("/auth/reset-password")}
      onResendConfirmation={() => router.replace("/")}
    />
  )
}

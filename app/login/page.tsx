"use client"

import { SignIn } from "@/components/auth/sign-in"

export default function LoginPage() {
  return <SignIn onSwitchToSignUp={() => (window.location.href = '/')} onForgotPassword={() => (window.location.href = '/auth/reset-password')} onResendConfirmation={() => (window.location.href = '/')} />
}

"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ForgotPasswordProps {
  onBack: () => void
}

export function ForgotPassword({ onBack }: ForgotPasswordProps) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleResetPassword = async () => {
    setLoading(true)
    setError(null)
    
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email")
      setLoading(false)
      return
    }

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (resetError) throw resetError

      setSent(true)
    } catch (e: any) {
      console.error("Password reset error:", e)
      setError(e.message || "Failed to send reset email. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Reset Password</h1>
          <p className="text-sm text-muted-foreground">
            {sent 
              ? "Check your email for a password reset link"
              : "Enter your email to receive a password reset link"}
          </p>
        </div>

        {sent ? (
          <div className="space-y-3">
            <p className="text-sm text-green-600">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              Click the link in the email to reset your password. The link will expire in 1 hour.
            </p>
            <Button onClick={onBack} variant="outline" className="w-full">
              Back to Sign In
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button 
              onClick={handleResetPassword} 
              disabled={!email || loading} 
              className="w-full"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>

            <div className="text-center">
              <button
                onClick={onBack}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                disabled={loading}
              >
                Back to Sign In
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

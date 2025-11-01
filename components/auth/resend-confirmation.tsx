"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ResendConfirmationProps {
  onBack: () => void
}

export function ResendConfirmation({ onBack }: ResendConfirmationProps) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleResendConfirmation = async () => {
    setLoading(true)
    setError(null)
    
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email")
      setLoading(false)
      return
    }

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      })

      if (resendError) throw resendError

      setSent(true)
    } catch (e: any) {
      console.error("Resend confirmation error:", e)
      setError(e.message || "Failed to resend confirmation email. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Resend Confirmation</h1>
          <p className="text-sm text-muted-foreground">
            {sent 
              ? "Check your email for a new confirmation link"
              : "Enter your email to receive a new confirmation link"}
          </p>
        </div>

        {sent ? (
          <div className="space-y-3">
            <p className="text-sm text-green-600">
              We've sent a new confirmation email to <strong>{email}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              Click the link in the email to confirm your account. Make sure to check your spam folder.
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
              onClick={handleResendConfirmation} 
              disabled={!email || loading} 
              className="w-full"
            >
              {loading ? "Sending..." : "Resend Confirmation Email"}
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

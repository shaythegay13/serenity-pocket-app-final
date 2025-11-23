"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ResendConfirmationProps {
  onBack: () => void
}

const RATE_LIMIT_KEY = 'resend_confirmation_attempts'
const MAX_ATTEMPTS = 8
const COOLDOWN_MINUTES = 10

export function ResendConfirmation({ onBack }: ResendConfirmationProps) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null)
  const [secondsRemaining, setSecondsRemaining] = useState(0)
  
  useEffect(() => {
    const storedCooldown = localStorage.getItem(RATE_LIMIT_KEY)
    if (storedCooldown) {
      try {
        const cooldownData = JSON.parse(storedCooldown)
        const now = Date.now()
        
        // Clean up old attempts
        if (cooldownData.attempts && Array.isArray(cooldownData.attempts)) {
          cooldownData.attempts = cooldownData.attempts.filter(
            (timestamp: number) => timestamp > now - (COOLDOWN_MINUTES * 60 * 1000)
          )
        }
        
        // Check if cooldown is still active
        if (cooldownData.cooldownUntil && cooldownData.cooldownUntil > now) {
          setCooldownUntil(cooldownData.cooldownUntil)
          if (cooldownData.attempts?.length > 0) {
            localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(cooldownData))
          }
        } else {
          if (cooldownData.attempts?.length > 0) {
            delete cooldownData.cooldownUntil
            localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(cooldownData))
          } else {
            localStorage.removeItem(RATE_LIMIT_KEY)
          }
        }
      } catch (e) {
        console.warn('Invalid rate limit data, clearing:', e)
        localStorage.removeItem(RATE_LIMIT_KEY)
      }
    }
  }, [])
  
  useEffect(() => {
    if (!cooldownUntil) return
    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000))
      setSecondsRemaining(remaining)
      if (remaining === 0) {
        setCooldownUntil(null)
        localStorage.removeItem(RATE_LIMIT_KEY)
      }
    }
    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [cooldownUntil])
  
  const checkRateLimit = () => {
    const stored = localStorage.getItem(RATE_LIMIT_KEY)
    if (!stored) return { allowed: true, attempts: 0 }
    const data = JSON.parse(stored)
    if (data.cooldownUntil && data.cooldownUntil > Date.now()) {
      return { allowed: false, inCooldown: true, cooldownUntil: data.cooldownUntil }
    }
    const recentAttempts = (data.attempts || []).filter(
      (timestamp: number) => timestamp > Date.now() - (COOLDOWN_MINUTES * 60 * 1000)
    )
    return { allowed: recentAttempts.length < MAX_ATTEMPTS, attempts: recentAttempts.length }
  }
  
  const recordAttempt = (wasRateLimited: boolean = false) => {
    const stored = localStorage.getItem(RATE_LIMIT_KEY)
    const data = stored ? JSON.parse(stored) : { attempts: [] }
    data.attempts = [...(data.attempts || []), Date.now()]
    if (wasRateLimited || data.attempts.length >= MAX_ATTEMPTS) {
      const cooldownEnd = Date.now() + (COOLDOWN_MINUTES * 60 * 1000)
      data.cooldownUntil = cooldownEnd
      setCooldownUntil(cooldownEnd)
    }
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data))
  }

  const handleResendConfirmation = async () => {
    const rateLimitCheck = checkRateLimit()
    if (!rateLimitCheck.allowed) {
      if (rateLimitCheck.inCooldown) {
        setError(`Too many resend attempts. Please wait ${Math.ceil((rateLimitCheck.cooldownUntil! - Date.now()) / 60000)} minutes.`)
      } else {
        setError(`Too many attempts. Please wait before trying again.`)
      }
      return
    }
    
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

      if (resendError) {
        const isRateLimitError = 
          resendError.message?.toLowerCase().includes('rate limit') ||
          resendError.message?.toLowerCase().includes('too many requests') ||
          resendError.status === 429
        
        if (isRateLimitError) {
          recordAttempt(true)
          throw new Error(`Too many resend attempts. Please wait ${COOLDOWN_MINUTES} minutes.`)
        } else {
          recordAttempt(false)
          throw resendError
        }
      }

      localStorage.removeItem(RATE_LIMIT_KEY)
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
            
            {cooldownUntil && secondsRemaining > 0 && (
              <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                <p className="text-sm text-orange-600 dark:text-orange-400">
                  ⏱️ Cooldown: {Math.floor(secondsRemaining / 60)}m {secondsRemaining % 60}s
                </p>
              </div>
            )}

            <Button 
              onClick={handleResendConfirmation} 
              disabled={!email || loading || (cooldownUntil !== null && secondsRemaining > 0)} 
              className="w-full"
            >
              {loading ? "Sending..." : (cooldownUntil && secondsRemaining > 0) ? "Cooldown Active" : "Resend Confirmation Email"}
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

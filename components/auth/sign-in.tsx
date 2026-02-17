"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from "lucide-react"

interface SignInProps {
  onSwitchToSignUp: () => void
  onForgotPassword: () => void
  onResendConfirmation: () => void
}

const RATE_LIMIT_KEY = 'sign_in_attempts'
const MAX_ATTEMPTS = 8
const COOLDOWN_MINUTES = 10
const DEV_BYPASS_KEY = 'dev_bypass_rate_limit' // Set to 'true' in localStorage to bypass

export function SignIn({ onSwitchToSignUp, onForgotPassword, onResendConfirmation }: SignInProps) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null)
  const [secondsRemaining, setSecondsRemaining] = useState(0)

  useEffect(() => {
    // Check if Supabase is properly configured
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    console.log('Supabase URL configured:', url ? 'Yes' : 'No')
    if (!url || url.includes('placeholder')) {
      setError('Supabase is not properly configured. Please check your .env.local file.')
    }

    // Check for existing cooldown and clean up stale data
    const storedCooldown = localStorage.getItem(RATE_LIMIT_KEY)
    if (storedCooldown) {
      try {
        const cooldownData = JSON.parse(storedCooldown)
        const now = Date.now()

        // Clean up old attempts (older than cooldown period)
        if (cooldownData.attempts && Array.isArray(cooldownData.attempts)) {
          cooldownData.attempts = cooldownData.attempts.filter(
            (timestamp: number) => timestamp > now - (COOLDOWN_MINUTES * 60 * 1000)
          )
        }

        // Check if cooldown is still active
        if (cooldownData.cooldownUntil && cooldownData.cooldownUntil > now) {
          // Cooldown still active
          setCooldownUntil(cooldownData.cooldownUntil)
          // Update stored data with cleaned attempts
          if (cooldownData.attempts.length > 0) {
            localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(cooldownData))
          }
        } else {
          // Cooldown expired or no active cooldown
          if (cooldownData.attempts.length > 0) {
            // Keep cleaned attempts but remove cooldown
            delete cooldownData.cooldownUntil
            localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(cooldownData))
          } else {
            // No recent attempts, clear everything
            localStorage.removeItem(RATE_LIMIT_KEY)
          }
        }
      } catch (e) {
        // Invalid data, clear it
        console.warn('Invalid rate limit data, clearing:', e)
        localStorage.removeItem(RATE_LIMIT_KEY)
      }
    }
  }, [])

  // Countdown timer for cooldown
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

    // Check if in cooldown
    if (data.cooldownUntil && data.cooldownUntil > Date.now()) {
      return { allowed: false, inCooldown: true, cooldownUntil: data.cooldownUntil }
    }

    // Clean old attempts (older than 15 minutes)
    const recentAttempts = (data.attempts || []).filter(
      (timestamp: number) => timestamp > Date.now() - (COOLDOWN_MINUTES * 60 * 1000)
    )

    return { allowed: recentAttempts.length < MAX_ATTEMPTS, attempts: recentAttempts.length }
  }

  const recordAttempt = (wasRateLimited: boolean = false) => {
    const stored = localStorage.getItem(RATE_LIMIT_KEY)
    const data = stored ? JSON.parse(stored) : { attempts: [] }

    data.attempts = [...(data.attempts || []), Date.now()]

    // If we got rate limited or hit max attempts, set cooldown
    if (wasRateLimited || data.attempts.length >= MAX_ATTEMPTS) {
      const cooldownEnd = Date.now() + (COOLDOWN_MINUTES * 60 * 1000)
      data.cooldownUntil = cooldownEnd
      setCooldownUntil(cooldownEnd)
    }

    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data))
  }

  const handleSignIn = async () => {
    // Dev bypass for testing (won't bypass Supabase's server-side limit)
    const devBypass = localStorage.getItem(DEV_BYPASS_KEY) === 'true'

    // Check rate limit before attempting
    const rateLimitCheck = checkRateLimit()
    console.log('Rate limit check:', rateLimitCheck)
    console.log('Dev bypass enabled:', devBypass)

    if (!rateLimitCheck.allowed && !devBypass) {
      if (rateLimitCheck.inCooldown) {
        const minutesRemaining = Math.ceil((rateLimitCheck.cooldownUntil! - Date.now()) / 60000)
        console.warn(`Client-side cooldown active. ${minutesRemaining} minutes remaining`)
        setError(`Client-side cooldown active. ${minutesRemaining} minutes remaining. To bypass for dev: localStorage.setItem('dev_bypass_rate_limit', 'true')`)
      } else {
        setError(`Too many attempts. Please wait before trying again.`)
      }
      return
    }

    if (devBypass) {
      console.warn('🚨 DEV MODE: Client-side rate limit bypassed')
    }

    setLoading(true)
    setError(null)
    try {
      let loginEmail = email.trim()
      const isEmail = loginEmail.includes('@')

      // If it's not an email, assume it's a username and try to find the associated email
      if (!isEmail) {
        console.log('🔍 Input is not an email, searching for username:', loginEmail)
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('email')
          .eq('username', loginEmail)
          .maybeSingle()

        if (profileError) {
          console.error('Error looking up username:', profileError)
          throw new Error('An error occurred during username lookup. Please try using your email.')
        }

        if (!profile || !profile.email) {
          console.warn('Username not found or has no email:', loginEmail)
          throw new Error('Username not found. Please check your spelling or use your email address.')
        }

        console.log('✅ Username found, using email:', profile.email)
        loginEmail = profile.email
      }

      console.log('Attempting to sign in with:', loginEmail)
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password
      })

      if (signInError) {
        console.error('Supabase error:', signInError)
        console.error('Error status:', signInError.status)
        console.error('Error message:', signInError.message)

        // Detect rate limit errors from Supabase
        const isRateLimitError =
          signInError.message?.toLowerCase().includes('rate limit') ||
          signInError.message?.toLowerCase().includes('too many requests') ||
          signInError.status === 429

        console.log('Is rate limit error?', isRateLimitError)

        if (isRateLimitError) {
          // DON'T record attempt if this is a persistent Supabase block
          console.error('⚠️ Supabase rate limit detected - this is a server-side block')
          throw new Error(`Supabase has blocked sign-in attempts from your IP. This is a server-side rate limit that may take 1-24 hours to expire. Try: 1) Wait longer, 2) Try from a different network/IP, or 3) Contact support to reset the limit.`)
        } else {
          recordAttempt(false) // Normal attempt tracking
          throw new Error('Invalid username/email or password.')
        }
      }

      if (data.user) {
        console.log('Sign in successful')
        // Clear rate limit tracking on success
        localStorage.removeItem(RATE_LIMIT_KEY)
        // Navigate into the app (hard redirect is most reliable across deployments)
        window.location.href = "/home"
      }
    } catch (e: any) {
      console.error('Full error:', e)
      setError(e.message || 'Failed to sign in. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && email && password) {
      handleSignIn()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome Back</h1>
          <p className="text-sm text-muted-foreground">Sign in with your username or email address</p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="email">Username or Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="username or email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                disabled={loading}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="space-y-2">
              <p className="text-sm text-red-500">{error}</p>
              {error.toLowerCase().includes('email not confirmed') && (
                <button
                  onClick={onResendConfirmation}
                  className="text-sm text-blue-600 hover:text-blue-700 underline"
                  type="button"
                >
                  Resend confirmation email
                </button>
              )}
            </div>
          )}

          {cooldownUntil && secondsRemaining > 0 && (
            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
              <p className="text-sm text-orange-600 dark:text-orange-400">
                ⏱️ Rate limit cooldown: {Math.floor(secondsRemaining / 60)}m {secondsRemaining % 60}s remaining
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Too many sign-in attempts detected. Please wait before trying again.
              </p>
              <button
                onClick={() => {
                  localStorage.removeItem(RATE_LIMIT_KEY)
                  setCooldownUntil(null)
                  setSecondsRemaining(0)
                  setError(null)
                }}
                className="text-xs text-blue-600 hover:text-blue-700 underline mt-2"
                type="button"
              >
                Clear cooldown (if you've waited long enough)
              </button>
            </div>
          )}

          <Button
            onClick={handleSignIn}
            disabled={!email || !password || loading || (cooldownUntil !== null && secondsRemaining > 0)}
            className="w-full"
          >
            {loading ? "Signing in..." : (cooldownUntil && secondsRemaining > 0) ? "Cooldown Active" : "Sign in"}
          </Button>

          <div className="text-center space-y-2">
            <button
              onClick={onForgotPassword}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors block w-full"
              disabled={loading}
              type="button"
            >
              <span className="underline">Forgot password?</span>
            </button>
            <button
              onClick={onSwitchToSignUp}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors block w-full"
              disabled={loading}
              type="button"
            >
              Don't have an account? <span className="underline">Sign up</span>
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}

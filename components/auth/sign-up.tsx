"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from "lucide-react"

interface SignUpProps {
  onSwitchToSignIn: () => void
}

export function SignUp({ onSwitchToSignIn }: SignUpProps) {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const validateForm = () => {
    if (!username || username.length < 3) {
      setError("Username must be at least 3 characters")
      return false
    }
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email")
      return false
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters")
      return false
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return false
    }
    return true
  }

  const handleSignUp = async () => {
    setError(null)
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      // Check if username is already taken
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", username)
        .maybeSingle()

      if (existingProfile) {
        setError("Username is already taken")
        setLoading(false)
        return
      }

      // Create user account
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
          },
        },
      })

      if (signUpError) throw signUpError

      if (data.user) {
        // Check if email confirmation is required
        if (data.user.identities && data.user.identities.length === 0) {
          // Email confirmation is required
          setError(null)
          alert("Account created! Please check your email to confirm your account before signing in.")
          onSwitchToSignIn()
          return
        }

        // Create profile entry with username
        const { error: profileError } = await supabase.from("profiles").insert({
          id: data.user.id,
          username: username,
          name: username, // Set initial name to username
        })

        if (profileError) {
          console.error("Profile creation error:", profileError)
          // Continue even if profile creation fails - user can update it later
        }

        // Try to auto sign in after successful sign up
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) {
          // If auto sign-in fails, redirect to sign-in page
          alert("Account created! Please sign in with your credentials.")
          onSwitchToSignIn()
          return
        }

        // Reload page to show authenticated state
        window.location.reload()
      }
    } catch (e: any) {
      console.error("Sign up error:", e)
      setError(e.message || "Failed to create account. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="text-sm text-muted-foreground">
            Sign up to start your trading journey
          </p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>

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

          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

          <div className="space-y-1">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                disabled={loading}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button 
            onClick={handleSignUp} 
            disabled={loading} 
            className="w-full"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </Button>

          <div className="text-center">
            <button
              onClick={onSwitchToSignIn}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              disabled={loading}
            >
              Already have an account? <span className="underline">Sign in</span>
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}

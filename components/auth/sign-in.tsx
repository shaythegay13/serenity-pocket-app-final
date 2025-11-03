"use client"

import { useState, useEffect } from "react"
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

export function SignIn({ onSwitchToSignUp, onForgotPassword, onResendConfirmation }: SignInProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  
  useEffect(() => {
    // Check if Supabase is properly configured
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    console.log('Supabase URL configured:', url ? 'Yes' : 'No')
    if (!url || url.includes('placeholder')) {
      setError('Supabase is not properly configured. Please check your .env.local file.')
    }
  }, [])

  const handleSignIn = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('Attempting to sign in with email:', email)
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ 
        email, 
        password
      })
      
      if (signInError) {
        console.error('Supabase error:', signInError)
        throw signInError
      }
      
      if (data.user) {
        console.log('Sign in successful')
        // Reload page to show authenticated state
        window.location.reload()
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
          <h1 className="text-2xl font-bold">Sign in</h1>
          <p className="text-sm text-muted-foreground">Enter your credentials to access your account</p>
        </div>
        
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
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
          
          <Button 
            onClick={handleSignIn} 
            disabled={!email || !password || loading} 
            className="w-full"
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>
          
          <div className="text-center space-y-2">
            <button
              onClick={onForgotPassword}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors block w-full"
              disabled={loading}
            >
              <span className="underline">Forgot password?</span>
            </button>
            <button
              onClick={onSwitchToSignUp}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors block w-full"
              disabled={loading}
            >
              Don't have an account? <span className="underline">Sign up</span>
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}

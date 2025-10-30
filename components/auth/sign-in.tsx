"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function SignIn() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
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
      console.log('Attempting to send magic link to:', email)
      const { error } = await supabase.auth.signInWithOtp({ 
        email, 
        options: { 
          emailRedirectTo: `${window.location.origin}/auth/callback` 
        } 
      })
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      setSent(true)
    } catch (e: any) {
      console.error('Full error:', e)
      setError(e.message || 'Failed to send magic link. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Sign in</h1>
          <p className="text-sm text-muted-foreground">We'll email you a magic link to sign in.</p>
        </div>
        {sent ? (
          <p className="text-sm">Check your email for a sign-in link.</p>
        ) : (
          <>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button onClick={handleSignIn} disabled={!email || loading} className="w-full">
              {loading ? "Sending..." : "Send magic link"}
            </Button>
          </>
        )}
      </Card>
    </div>
  )
}

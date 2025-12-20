"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    let cancelled = false

    const initRecoverySession = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        if (data.session) return

        if (typeof window === "undefined") return

        const url = window.location.href
        if (url.includes("code=") || url.includes("type=recovery")) {
          const { error } = await supabase.auth.exchangeCodeForSession(url)
          if (error && !cancelled) {
            console.error("Password recovery session exchange error:", error)
            setError(error.message)
          }
        }
      } catch (e) {
        if (!cancelled) {
          console.error("Password recovery init error:", e)
        }
      }
    }

    void initRecoverySession()

    return () => {
      cancelled = true
    }
  }, [])

  const handleResetPassword = async () => {
    setError(null)
    
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        throw new Error("Your reset link is invalid or expired. Please request a new password reset email.")
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) throw updateError

      setSuccess(true)
      
      // Redirect to home after 2 seconds
      setTimeout(() => {
        router.push("/")
      }, 2000)
    } catch (e: any) {
      console.error("Password reset error:", e)
      setError(e.message || "Failed to reset password. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-sm p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Set New Password</h1>
          <p className="text-sm text-muted-foreground">
            Enter your new password below
          </p>
        </div>

        {success ? (
          <div className="space-y-3">
            <p className="text-sm text-green-600">
              ✓ Password updated successfully!
            </p>
            <p className="text-sm text-muted-foreground">
              Redirecting you to sign in...
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button 
              onClick={handleResetPassword} 
              disabled={!password || !confirmPassword || loading} 
              className="w-full"
            >
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}

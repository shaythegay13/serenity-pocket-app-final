"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Navigation } from "@/components/navigation"
import { supabase } from "@/lib/supabase"
import type { UserData } from "@/lib/types"
import { storageHybrid as storage } from "@/lib/storage-hybrid"

interface AuthenticatedLayoutProps {
  children: React.ReactNode
  activeTab?: string
}

export function AuthenticatedLayout({ children, activeTab = "" }: AuthenticatedLayoutProps) {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    let timeoutId: NodeJS.Timeout
    
    const checkAuth = async () => {
      console.log('🔐 AuthenticatedLayout: Starting auth check...')
      
      // Add timeout to prevent infinite loading
      timeoutId = setTimeout(() => {
        if (mounted && loading) {
          console.log('🔐 Auth check timeout - forcing loading to false')
          setLoading(false)
          setAuthed(false)
        }
      }, 10000) // 10 second timeout
      
      try {
        // Get session and user data in parallel
        console.log('🔐 Getting session and user data...')
        const [{ data: { session } }, userData] = await Promise.all([
          supabase.auth.getSession(),
          storage.getUserData().catch((error) => {
            console.log('🔐 getUserData failed:', error)
            return null
          })
        ])
        
        console.log('🔐 Session:', session ? 'found' : 'not found')
        console.log('🔐 UserData:', userData ? 'found' : 'not found')
        
        if (!mounted) return
        
        if (!session) {
          setAuthed(false)
          setLoading(false)
          return
        }

        setAuthed(true)
        setUserData(userData)
        
      } catch (error) {
        console.error('🔐 Auth check error:', error)
        
        // Check if this is an invalid refresh token error
        if (error instanceof Error && error.message.includes('Invalid Refresh Token')) {
          console.log('🔐 Invalid refresh token detected, clearing auth state...')
          // Clear all auth state
          await supabase.auth.signOut()
          if (typeof window !== 'undefined') {
            localStorage.clear()
            sessionStorage.clear()
          }
        }
        
        if (mounted) {
          setAuthed(false)
        }
      } finally {
        if (mounted) {
          console.log('🔐 Auth check complete, setting loading to false')
          clearTimeout(timeoutId)
          setLoading(false)
        }
      }
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        
        if (event === 'SIGNED_OUT') {
          setUserData(null)
          setAuthed(false)
          window.location.href = "/"
        } else if (session && event === 'SIGNED_IN') {
          try {
            const userData = await storage.getUserData()
            if (mounted) {
              setUserData(userData)
              setAuthed(true)
            }
          } catch (error) {
            console.error('Error getting user data:', error)
            
            // Check if this is an invalid refresh token error
            if (error instanceof Error && error.message.includes('Invalid Refresh Token')) {
              console.log('🔐 Invalid refresh token detected in auth state change, clearing auth state...')
              // Clear all auth state
              await supabase.auth.signOut()
              if (typeof window !== 'undefined') {
                localStorage.clear()
                sessionStorage.clear()
              }
              if (mounted) {
                setAuthed(false)
                setUserData(null)
              }
              return
            }
            
            if (mounted) {
              setAuthed(true)
              setUserData(null)
            }
          }
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const handleNavigateToTab = (tab: string) => {
    // Route to specific functional pages based on tab
    switch (tab) {
      case "home":
        window.location.href = "/"
        break
      case "odds": // Sports
        window.location.href = "/?tab=odds"
        break
      case "analyze":
        window.location.href = "/?tab=analyze"
        break
      case "behavior":
        window.location.href = "/?tab=behavior"
        break
      case "ai-picks": // Insights
        window.location.href = "/?tab=ai-picks"
        break
      case "analytics":
        window.location.href = "/?tab=analytics"
        break
      case "account":
        window.location.href = "/?tab=account"
        break
      default:
        window.location.href = "/"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!authed || !userData) {
    // Redirect to home for authentication
    window.location.href = "/"
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userData={userData} onNavigateToTab={handleNavigateToTab} />
      
      <div className="hidden md:block">
        <Navigation />
      </div>
      
      <main className="pb-20 md:pb-0">
        {children}
      </main>
    </div>
  )
}

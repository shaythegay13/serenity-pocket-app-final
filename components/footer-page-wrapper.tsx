"use client"

import { useState, useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { Navigation } from "@/components/navigation"
import { BottomNav } from "@/components/bottom-nav"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { storageHybrid as storage } from "@/lib/storage-hybrid"
import type { UserData } from "@/lib/types"
import Link from "next/link"

interface FooterPageWrapperProps {
  children: ReactNode
}

export function FooterPageWrapper({ children }: FooterPageWrapperProps) {
  const router = useRouter()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const checkAuth = async () => {
      const timeoutId = setTimeout(() => {
        if (isMounted && loading) {
          console.warn('Auth check timed out, forcing loading state to false')
          setLoading(false)
        }
      }, 5000)

      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!isMounted) return

        setAuthed(!!session)

        if (session) {
          try {
            const storedUserData = await storage.getUserData()
            if (isMounted) {
              setUserData(storedUserData)
            }
          } catch (error) {
            console.error('Failed to fetch user data:', error)
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        if (isMounted) {
          setAuthed(false)
        }
      } finally {
        clearTimeout(timeoutId)
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    checkAuth()

    return () => {
      isMounted = false
    }
  }, [])

  const handleNavigateToTab = (tab: string) => {
    router.push(`/${tab === 'odds' ? 'sports-dashboard' : tab}`)
  }

  // Always render children immediately for SEO crawlability.
  // The header/nav chrome loads in once auth resolves.
  return (
    <div className="min-h-screen bg-background">
      {/* Header: show dashboard nav for authed users, back button for unauthed, nothing while loading */}
      {!loading && authed && userData ? (
        <>
          <DashboardHeader userData={userData} onNavigateToTab={handleNavigateToTab} />
          <div className="hidden md:block">
            <Navigation />
          </div>
        </>
      ) : !loading ? (
        <div className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-3">
            <Link href="/">
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Main Page
              </Button>
            </Link>
          </div>
        </div>
      ) : null}

      {/* Page content always renders immediately — never blocked by auth check */}
      <main className={!loading && authed && userData ? "pb-20 md:pb-0" : ""}>
        {children}
      </main>

      {!loading && authed && userData && <BottomNav />}
    </div>
  )
}

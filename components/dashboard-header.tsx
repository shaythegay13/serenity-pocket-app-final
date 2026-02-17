"use client"

import { useEffect, useRef, useState } from "react"
import { Moon, Sun, User, ClipboardList } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import type { UserData } from "@/lib/types"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { useEmotionalStability } from "@/lib/hooks/use-emotional-stability"
import { ArchetypeAvatar } from "@/components/archetype-avatar"

interface DashboardHeaderProps {
  userData?: UserData
  onNavigateToTab?: (tab: string) => void
}

export function DashboardHeader({ userData, onNavigateToTab }: DashboardHeaderProps) {
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const { score: emotionalWellness, loading } = useEmotionalStability(userData || null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!menuOpen) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false)
    }

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null
      if (!target) return
      if (menuRef.current && !menuRef.current.contains(target)) setMenuOpen(false)
    }

    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("mousedown", onPointerDown)
    window.addEventListener("touchstart", onPointerDown)

    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("mousedown", onPointerDown)
      window.removeEventListener("touchstart", onPointerDown)
    }
  }, [menuOpen])

  // Add emergency logout to window for testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).emergencyLogout = () => {
        console.log('🔧 Emergency logout triggered!')
        handleLogout()
      }
    }
  }, [])

  const handleLogout = async () => {
    console.log('🔧 Logout button clicked - starting logout process')

    // Clear storage first to ensure we don't get stuck
    if (typeof window !== "undefined") {
      console.log('🔧 Clearing storage...')
      sessionStorage.clear()
      localStorage.clear()
      console.log('🔧 All storage cleared')
    }

    try {
      // Reset any error handling flags that might interfere
      try {
        const { resetErrorHandling } = await import('@/lib/auth-utils')
        resetErrorHandling()
      } catch {
        // Continue with logout anyway
      }

      // Use local scope for faster, more reliable logout with timeout
      console.log('🔧 Signing out from Supabase...')

      const signOutPromise = supabase.auth.signOut({ scope: 'local' })
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Logout timeout')), 3000)
      )

      await Promise.race([signOutPromise, timeoutPromise])
      console.log('🔧 Supabase sign out completed')

    } catch (error) {
      console.error("🔧 Error during sign out:", error)
      // Continue with redirect anyway since storage is already cleared
    }

    // Always redirect, regardless of signOut result
    console.log('🔧 Redirecting to /')
    window.location.href = "/"
  }

  const toggleTheme = () => {
    const current = resolvedTheme ?? "light"
    setTheme(current === "dark" ? "light" : "dark")
  }

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-32 h-16 overflow-hidden">
              <Image
                src="/logo.png"
                alt="PlayMind Labs"
                fill
                className="object-cover object-center logo-dark-mode-auto"
                priority
              />
            </div>
          </div>

          <div className="relative" ref={menuRef}>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full p-0 h-11 w-11 min-h-[44px] min-w-[44px] sm:h-14 sm:w-14 md:h-16 md:w-16 lg:h-20 lg:w-20"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              type="button"
            >
              <ArchetypeAvatar
                archetype={userData?.surveyData?.userType}
                size="responsive"
                className="ring-2 ring-border hover:ring-primary transition-all"
              />
              <span className="sr-only">Open user menu</span>
            </Button>

            {menuOpen && (
              <div
                className={cn(
                  "absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-56 max-w-[14rem] overflow-hidden rounded-md border border-border bg-popover shadow-md",
                  "origin-top-right z-50 max-h-[calc(100vh-5rem)] overflow-y-auto",
                )}
                role="menu"
                aria-label="User menu"
              >
                {/* User Stats Section */}
                {userData && (
                  <div className="px-3 py-3 border-b border-border bg-muted/50">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-muted-foreground">Archetype</span>
                        <span className="font-semibold text-foreground">
                          {userData.surveyData?.userType || 'Take survey'}
                        </span>
                      </div>
                      {userData.surveyData && (
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <span className="text-muted-foreground">Risk Level</span>
                          <span className="font-semibold text-foreground">{userData.surveyData.level || 'N/A'}</span>
                        </div>
                      )}
                      {userData.surveyData && (
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <span className="text-muted-foreground">Score</span>
                          <span className="font-semibold text-foreground">{userData.surveyData.score !== undefined ? userData.surveyData.score : 'N/A'}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-muted-foreground">Emotional Wellness</span>
                        <span className="font-semibold text-foreground">
                          {loading ? 'Calculating...' : emotionalWellness !== null ? `${emotionalWellness}%` : 'N/A'}
                        </span>
                      </div>
                      {userData.emotionalAwarenessStreak !== undefined && (
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <span className="text-muted-foreground">Awareness Streak</span>
                          <span className="font-semibold text-foreground">{userData.emotionalAwarenessStreak} days</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm sm:text-base text-popover-foreground hover:bg-accent hover:text-accent-foreground"
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    onNavigateToTab?.("account")
                  }}
                >
                  <User className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                  <span>Account</span>
                </button>

                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm sm:text-base text-popover-foreground hover:bg-accent hover:text-accent-foreground"
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    router.push("/gambling-survey")
                  }}
                >
                  <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                  <span>Retake Serenity Survey</span>
                </button>

                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm sm:text-base text-popover-foreground hover:bg-accent hover:text-accent-foreground"
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    router.push("/pgsi-survey")
                  }}
                >
                  <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                  <span>Sports Betting Survey</span>
                </button>

                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm sm:text-base text-popover-foreground hover:bg-accent hover:text-accent-foreground"
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    toggleTheme()
                  }}
                >
                  {mounted && resolvedTheme === "dark" ? (
                    <Sun className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                  ) : (
                    <Moon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                  )}
                  <span>{mounted && resolvedTheme === "dark" ? "Light mode" : "Dark mode"}</span>
                </button>

                <div className="h-px bg-border" />

                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm sm:text-base text-red-600 hover:bg-accent"
                  role="menuitem"
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    console.log('🔧 Logout button clicked!')
                    setMenuOpen(false)
                    handleLogout()
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      console.log('🔧 Logout button activated via keyboard!')
                      setMenuOpen(false)
                      handleLogout()
                    }
                  }}
                >
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

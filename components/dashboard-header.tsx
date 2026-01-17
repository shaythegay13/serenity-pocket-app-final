"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Moon, Sun, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import type { UserData } from "@/lib/types"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { useEmotionalStability } from "@/lib/hooks/use-emotional-stability"

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

  const initials = useMemo(() => {
    const name = (userData?.name || "").trim()
    if (!name) return "U"
    const parts = name.split(/\s+/).filter(Boolean)
    const a = parts[0]?.[0] || "U"
    const b = parts.length > 1 ? parts[parts.length - 1]?.[0] : ""
    return (a + b).toUpperCase()
  }, [userData?.name])

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

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      if (typeof window !== "undefined") {
        sessionStorage.clear()
        localStorage.clear()
      }
      window.location.href = "/"
    } catch (error) {
      console.error("Error logging out:", error)
    }
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
            <Image
              src="/logo.png"
              alt="Serenity Pocket"
              width={162}
              height={162}
              className="h-[108px] w-[108px] sm:h-[126px] sm:w-[126px]"
              priority
            />
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              Serenity Pocket
            </h1>
          </div>

          <div className="relative" ref={menuRef}>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              type="button"
            >
              <span
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-full",
                  "bg-muted text-foreground",
                )}
              >
                <span className="text-xs font-semibold" aria-hidden="true">
                  {initials}
                </span>
                <span className="sr-only">Open user menu</span>
              </span>
            </Button>

            {menuOpen && (
              <div
                className={cn(
                  "absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-md border border-border bg-popover shadow-md",
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
                  <span>Retake Test</span>
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
                  onClick={() => {
                    setMenuOpen(false)
                    void handleLogout()
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

"use client"

import { Home, TrendingUp, Target, Activity, Sparkles, History, RefreshCw, LogOut, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

interface NavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const navItems = [
  { id: "home", label: "Home", icon: Home },
  { id: "odds", label: "Sports Dashboard", icon: TrendingUp },
  { id: "analyze", label: "Analyze (Basic)", icon: Target },
  { id: "behavior", label: "Behavior", icon: Activity },
  { id: "ai-picks", label: "Insight Hub", icon: Sparkles },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
]

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      // Clear any local storage or session data
      if (typeof window !== 'undefined') {
        sessionStorage.clear()
        localStorage.clear()
      }
      // Reload the page to reset to unauthenticated state
      window.location.href = '/'
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/80">
      <div className="container mx-auto px-2 sm:px-4 max-w-7xl">
        <div className="flex items-center justify-center gap-0.5 sm:gap-1 w-full">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap min-w-[60px] sm:min-w-0",
                  "hover:text-foreground active:scale-95",
                  activeTab === item.id ? "text-primary border-b-2 border-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4 sm:h-4 sm:w-4" />
                <span className="text-[10px] sm:text-sm">{item.label}</span>
              </button>
            )
          })}
          
          {/* Retake Survey Button */}
          {false && (
            <button
              onClick={() => router.push('/gambling-survey')}
              className={cn(
                "flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap min-w-[60px] sm:min-w-0",
                "hover:text-foreground active:scale-95 text-muted-foreground",
              )}
              title="Retake Survey"
              type="button"
            >
              <RefreshCw className="h-4 w-4 sm:h-4 sm:w-4" />
              <span className="text-[10px] sm:text-sm">Retake</span>
            </button>
          )}

          {/* Logout Button */}
          {false && (
            <button
              onClick={handleLogout}
              className={cn(
                "flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap min-w-[60px] sm:min-w-0",
                "hover:text-red-600 active:scale-95 text-muted-foreground",
              )}
              title="Logout"
              type="button"
            >
              <LogOut className="h-4 w-4 sm:h-4 sm:w-4" />
              <span className="text-[10px] sm:text-sm">Logout</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}

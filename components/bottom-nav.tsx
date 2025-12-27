"use client"

import { Home, Trophy, Sparkles, Brain, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"

interface BottomNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const navItems = [
  { id: "home", label: "Home", icon: Home },
  { id: "odds", label: "Sports", icon: Trophy },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "ai-picks", label: "Insight Hub", icon: Sparkles },
  { id: "behavior", label: "My Mind", icon: Brain },
]

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "border-t border-border bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/80",
        "pb-[env(safe-area-inset-bottom)]",
      )}
      aria-label="Bottom navigation"
    >
      <div className="mx-auto flex max-w-7xl items-stretch justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex w-full flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors",
                "active:scale-95",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
              aria-current={isActive ? "page" : undefined}
              type="button"
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

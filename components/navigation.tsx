"use client"

import { cn } from "@/lib/utils"
import { Home, TrendingUp, Target, Activity, Sparkles, BarChart3 } from "lucide-react"
import Image from "next/image"

const navItems = [
  { tab: "home", label: "Home", icon: Home },
  { tab: "odds", label: "Live Odds", icon: TrendingUp },
  { tab: "analyze", label: "Analyze", icon: Target },
  { tab: "behavior", label: "Behavior", icon: Activity },
  { tab: "ai-picks", label: "AI Picks", icon: Sparkles },
  { tab: "analytics", label: "Analytics", icon: BarChart3 },
]

interface NavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  return (
    <nav className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.tab
              return (
                <button
                  key={item.tab}
                  onClick={() => onTabChange(item.tab)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}

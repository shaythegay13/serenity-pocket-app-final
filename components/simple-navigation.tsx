"use client"

import { cn } from "@/lib/utils"
import { Home, TrendingUp, Target, Activity, Sparkles, BarChart3 } from "lucide-react"
import Link from "next/link"

const navItems = [
  { tab: "home", label: "Home", href: "/", icon: Home },
  { tab: "odds", label: "Sports", href: "/account", icon: TrendingUp },
  { tab: "analyze", label: "Analyze", href: "/account", icon: Target },
  { tab: "behavior", label: "Behavior", href: "/account", icon: Activity },
  { tab: "ai-picks", label: "Insights", href: "/account", icon: Sparkles },
  { tab: "analytics", label: "Analytics", href: "/account", icon: BarChart3 },
]

export function SimpleNavigation() {
  return (
    <nav className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.tab}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}

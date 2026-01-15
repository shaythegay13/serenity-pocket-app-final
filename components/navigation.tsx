"use client"

import { cn } from "@/lib/utils"
import { Home, TrendingUp, Target, Activity, Sparkles, BarChart3 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = [
  { tab: "home", label: "Home", icon: Home, href: "/" },
  { tab: "odds", label: "Sports", icon: TrendingUp, href: "/sports-dashboard" },
  { tab: "analyze", label: "Analyze", icon: Target, href: "/analyze" },
  { tab: "behavior", label: "Behavior", icon: Activity, href: "/behavior" },
  { tab: "ai-picks", label: "Insights", icon: Sparkles, href: "/insights" },
  { tab: "analytics", label: "Analytics", icon: BarChart3, href: "/analytics" },
]

export function Navigation() {
  const pathname = usePathname()
  
  // Determine active tab based on current pathname
  const getActiveTab = () => {
    if (pathname === "/") return "home"
    if (pathname === "/sports-dashboard") return "odds"
    if (pathname === "/analyze") return "analyze"
    if (pathname === "/behavior") return "behavior"
    if (pathname === "/insights") return "ai-picks"
    if (pathname === "/analytics") return "analytics"
    return "home"
  }

  const activeTab = getActiveTab()

  return (
    <nav className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.tab
              return (
                <Link
                  key={item.tab}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
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

"use client"

import { cn } from "@/lib/utils"
import { Home, Activity, Sparkles, BarChart3 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = [
  { tab: "home", label: "Home", icon: Home, href: "/home" },
  { tab: "behavior", label: "Behavior", icon: Activity, href: "/behavior" },
  { tab: "ai-picks", label: "BetLab", icon: Sparkles, href: "/betlab" },
  { tab: "analytics", label: "Analytics", icon: BarChart3, href: "/analytics" },
]

interface NavigationProps {
  onNavigateToTab?: (tab: string) => void
  isHomePage?: boolean
}

export function Navigation({ onNavigateToTab, isHomePage = false }: NavigationProps) {
  const pathname = usePathname()
  
  // Determine active tab based on current pathname
  const getActiveTab = () => {
    if (pathname === "/home") return "home"
    if (pathname === "/") return "home"
    if (pathname === "/behavior") return "behavior"
    if (pathname?.startsWith("/betlab")) return "ai-picks"
    if (pathname === "/analytics") return "analytics"
    return "home"
  }

  const activeTab = getActiveTab()

  const handleNavClick = (tab: string, href: string) => {
    if (isHomePage && onNavigateToTab) {
      // Use direct navigation for betlab, internal navigation for other tabs
      if (tab === 'ai-picks') {
        window.location.href = '/betlab'
      } else {
        onNavigateToTab(tab)
      }
    } else {
      // Use regular navigation for other pages
      window.location.href = href
    }
  }

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
                  onClick={() => handleNavClick(item.tab, item.href)}
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

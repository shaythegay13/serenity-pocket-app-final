"use client"

import { Home, Sparkles, Brain, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = [
  { id: "home", label: "Home", icon: Home, href: "/" },
  { id: "behavior", label: "My Mind", icon: Brain, href: "/behavior" },
  { id: "ai-picks", label: "Insight Hub", icon: Sparkles, href: "/insights" },
  { id: "analytics", label: "Analytics", icon: BarChart3, href: "/analytics" },
]

export function BottomNav() {
  const pathname = usePathname()
  
  // Determine active tab based on current pathname
  const getActiveTab = () => {
    if (pathname === "/") return "home"
    if (pathname === "/behavior") return "behavior"
    if (pathname === "/insights") return "ai-picks"
    if (pathname === "/analytics") return "analytics"
    return "home"
  }

  const activeTab = getActiveTab()

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "border-t border-border bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/80",
        "pb-[env(safe-area-inset-bottom)]",
        "md:hidden" // Hide on medium screens and larger (tablet and desktop)
      )}
      aria-label="Bottom navigation"
    >
      <div className="mx-auto flex max-w-7xl items-stretch justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex w-full flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors",
                "active:scale-95",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

"use client"

import { Home, Heart, Brain, BookOpen, Trophy, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "emotions", label: "Emotions", icon: Heart },
  { id: "biases", label: "Biases", icon: Brain },
  { id: "journal", label: "Journal", icon: BookOpen },
  { id: "progress", label: "Progress", icon: BarChart3 },
  { id: "achievements", label: "Achievements", icon: Trophy },
]

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container mx-auto px-2 sm:px-4 max-w-7xl">
        <div className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto scrollbar-hide">
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
        </div>
      </div>
    </nav>
  )
}

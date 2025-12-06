"use client"

import React from "react"
import { SportTabs } from "./SportTabs"
import { SportTabRouter } from "./SportTabRouter"
import { FeaturePanels } from "./FeaturePanels"
import { useSportsStore } from "@/lib/stores/sports-store"
import { BarChart3 } from "lucide-react"

/**
 * SportsDashboard Component
 * 
 * Main container for the Sports Data Dashboard.
 * Manages sport tab navigation and renders active sport content.
 * 
 * Features:
 * - Header with logo and title
 * - Sport tab navigation (NFL, NBA, MLB, NHL)
 * - Dynamic sport content area
 * - Responsive padding and layout
 * - Connects to Zustand store for state management
 * 
 * @example
 * // In a Next.js page
 * import { SportsDashboard } from '@/components/sports-dashboard/SportsDashboard'
 * 
 * export default function DashboardPage() {
 *   return <SportsDashboard />
 * }
 */
export function SportsDashboard() {
  const activeSport = useSportsStore((state) => state.activeSport)
  const setActiveSport = useSportsStore((state) => state.setActiveSport)

  return (
    <div 
      className="min-h-screen w-full bg-[#1b212c]"
      style={{ fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif" }}
    >
      {/* Header */}
      <header className="border-b border-white/10 bg-[#1b212c] sticky top-0 z-50">
        <div className="px-4 md:px-6 py-4">
          <div className="flex items-center gap-3">
            {/* Logo/Icon */}
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#20B2AA]/10 border border-[#20B2AA]/30">
              <BarChart3 className="h-6 w-6 text-[#20B2AA]" aria-hidden="true" />
            </div>

            {/* Title */}
            <div>
              <h1 className="text-2xl font-bold text-[#F5F5F5] tracking-tight">
                Sports Dashboard
              </h1>
              <p className="text-sm text-gray-400 hidden md:block">
                Live odds, analytics, and insights across all major sports
              </p>
            </div>
          </div>
        </div>

        {/* Sport Tabs Navigation */}
        <SportTabs
          activeSport={activeSport}
          onSportChange={setActiveSport}
        />
      </header>

      {/* Main Content Area */}
      <main 
        className="w-full"
        role="main"
        aria-label="Sports data content"
      >
        <SportTabRouter activeSport={activeSport} />
        <FeaturePanels />
      </main>
    </div>
  )
}

SportsDashboard.displayName = "SportsDashboard"

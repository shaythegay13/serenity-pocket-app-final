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
      className="min-h-screen w-full bg-[#0B0E14]"
      style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
    >
      {/* Header - Databallr Command Center Style */}
      <header className="border-b border-white/5 bg-[#0B0E14]/95 sticky top-0 z-50 backdrop-blur-lg">
        <div className="px-4 md:px-6 py-4">
          <div className="flex items-center gap-3">
            {/* Logo/Icon */}
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#00FF41]/10 border border-[#00FF41]/30">
              <BarChart3 className="h-5 w-5 text-[#00FF41]" aria-hidden="true" />
            </div>

            {/* Title */}
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Sports Command Center
              </h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider hidden md:block" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                Live Odds Terminal
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

      {/* Data Disclaimer Banner */}
      <div className="bg-[#161B22] border-b border-white/5 px-4 md:px-6 py-3">
        <p className="text-xs text-gray-400 text-center leading-relaxed max-w-4xl mx-auto">
          The information on this dashboard is sourced from industry‑standard sports data providers and, while monitored for quality, may occasionally be updated or corrected as new data is received.
        </p>
      </div>

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

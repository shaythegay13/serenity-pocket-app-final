"use client"

import React, { Suspense } from "react"
import { FeatureCard } from "../shared/FeatureCard"
import { FeatureCardGrid } from "../shared/FeatureCardGrid"
import { useSportsStore } from "@/lib/stores/sports-store"
import {
  TrendingUp,
  Users,
  Target,
  BarChart3,
  Activity,
  Calendar,
  Clock,
  Shield,
  LineChart
} from "lucide-react"

/**
 * MLBTab Component
 * 
 * MLB-specific sports data dashboard tab.
 * Displays 9 feature cards in a 3x3 grid for different MLB data views.
 */
export default function MLBTab() {
  const activeSport = useSportsStore((state) => state.activeSport)
  const isLoading = useSportsStore((state) => state.gamesLoading[activeSport])

  const handleFeatureClick = (featureName: string) => {
    console.log(`MLB Feature clicked: ${featureName}`)
  }

  return (
    <Suspense fallback={<FeatureCardGrid isLoading={true} skeletonCount={9} />}>
      <FeatureCardGrid isLoading={isLoading}>
        <FeatureCard
          icon={<TrendingUp className="h-10 w-10" />}
          title="Live Odds"
          description="Real-time MLB run lines, totals, and moneylines across all major sportsbooks for every game."
          badge="LIVE"
          onClick={() => handleFeatureClick("Live Odds")}
        />

        <FeatureCard
          icon={<Users className="h-10 w-10" />}
          title="Player Props"
          description="Strikeouts, hits, home runs, and RBIs. Comprehensive pitcher and batter prop markets."
          onClick={() => handleFeatureClick("Player Props")}
        />

        <FeatureCard
          icon={<Target className="h-10 w-10" />}
          title="Matchups"
          description="Pitcher vs lineup analysis, bullpen strength, and head-to-head statistical breakdowns."
          onClick={() => handleFeatureClick("Matchups")}
        />

        <FeatureCard
          icon={<BarChart3 className="h-10 w-10" />}
          title="Game Dashboard"
          description="Complete MLB game center with weather conditions, park factors, and betting trends."
          badge="POPULAR"
          onClick={() => handleFeatureClick("Game Dashboard")}
        />

        <FeatureCard
          icon={<Activity className="h-10 w-10" />}
          title="Injury Reports"
          description="Latest injury news, lineup confirmations, and starting rotation updates before first pitch."
          badge="UPDATED"
          onClick={() => handleFeatureClick("Injury Reports")}
        />

        <FeatureCard
          icon={<Calendar className="h-10 w-10" />}
          title="Upcoming Games"
          description="Full MLB schedule with probable pitchers, series previews, and day/night game splits."
          onClick={() => handleFeatureClick("Upcoming Games")}
        />

        <FeatureCard
          icon={<Clock className="h-10 w-10" />}
          title="Historical Trends"
          description="Run line performance, over/under trends, and situational betting angles for all 30 teams."
          onClick={() => handleFeatureClick("Historical Trends")}
        />

        <FeatureCard
          icon={<Shield className="h-10 w-10" />}
          title="Team Analytics"
          description="Advanced stats including wOBA, FIP, team ERA, bullpen metrics, and platoon splits."
          onClick={() => handleFeatureClick("Team Analytics")}
        />

        <FeatureCard
          icon={<LineChart className="h-10 w-10" />}
          title="Line Movement History"
          description="Monitor how run lines and totals move throughout the day. Track steam moves and line freezes."
          onClick={() => handleFeatureClick("Line Movement")}
        />
      </FeatureCardGrid>
    </Suspense>
  )
}

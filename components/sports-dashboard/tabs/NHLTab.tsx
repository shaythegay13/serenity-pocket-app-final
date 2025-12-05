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
 * NHLTab Component
 * 
 * NHL-specific sports data dashboard tab.
 * Displays 9 feature cards in a 3x3 grid for different NHL data views.
 */
export default function NHLTab() {
  const activeSport = useSportsStore((state) => state.activeSport)
  const isLoading = useSportsStore((state) => state.gamesLoading[activeSport])

  const handleFeatureClick = (featureName: string) => {
    console.log(`NHL Feature clicked: ${featureName}`)
  }

  return (
    <Suspense fallback={<FeatureCardGrid isLoading={true} skeletonCount={9} />}>
      <FeatureCardGrid isLoading={isLoading}>
        <FeatureCard
          icon={<TrendingUp className="h-10 w-10" />}
          title="Live Odds"
          description="Real-time NHL puck lines, totals, and moneylines from all major sportsbooks for every matchup."
          badge="LIVE"
          onClick={() => handleFeatureClick("Live Odds")}
        />

        <FeatureCard
          icon={<Users className="h-10 w-10" />}
          title="Player Props"
          description="Goals, assists, shots on goal, and goalie saves. In-depth player prop markets and trends."
          onClick={() => handleFeatureClick("Player Props")}
        />

        <FeatureCard
          icon={<Target className="h-10 w-10" />}
          title="Matchups"
          description="Goalie vs team analysis, special teams matchups, and head-to-head statistical edges."
          onClick={() => handleFeatureClick("Matchups")}
        />

        <FeatureCard
          icon={<BarChart3 className="h-10 w-10" />}
          title="Game Dashboard"
          description="Complete NHL game center with goalie starters, rest days, and real-time betting action."
          badge="POPULAR"
          onClick={() => handleFeatureClick("Game Dashboard")}
        />

        <FeatureCard
          icon={<Activity className="h-10 w-10" />}
          title="Injury Reports"
          description="Latest injury updates, lineup confirmations, and goalie starter announcements before puck drop."
          badge="UPDATED"
          onClick={() => handleFeatureClick("Injury Reports")}
        />

        <FeatureCard
          icon={<Calendar className="h-10 w-10" />}
          title="Upcoming Games"
          description="Full NHL schedule with back-to-back tracking, road trip analysis, and series previews."
          onClick={() => handleFeatureClick("Upcoming Games")}
        />

        <FeatureCard
          icon={<Clock className="h-10 w-10" />}
          title="Historical Trends"
          description="Puck line performance, over/under trends, and home/away splits for all NHL teams."
          onClick={() => handleFeatureClick("Historical Trends")}
        />

        <FeatureCard
          icon={<Shield className="h-10 w-10" />}
          title="Team Analytics"
          description="Advanced metrics including Corsi, Fenwick, PDO, power play efficiency, and penalty kill rates."
          onClick={() => handleFeatureClick("Team Analytics")}
        />

        <FeatureCard
          icon={<LineChart className="h-10 w-10" />}
          title="Line Movement History"
          description="Track puck line and total movements from opening to faceoff. Identify sharp money moves."
          onClick={() => handleFeatureClick("Line Movement")}
        />
      </FeatureCardGrid>
    </Suspense>
  )
}

"use client"

import React, { Suspense } from "react"
import { FeatureCard } from "../shared/FeatureCard"
import { FeatureCardGrid } from "../shared/FeatureCardGrid"
import { useSportsStore, type SportsFeatureView } from "@/lib/stores/sports-store"
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
  const setActiveFeature = useSportsStore((state) => state.setActiveFeature)

  const handleFeatureClick = (feature: SportsFeatureView) => {
    setActiveFeature(feature)
  }

  return (
    <Suspense fallback={<FeatureCardGrid isLoading={true} skeletonCount={9} />}>
      <FeatureCardGrid isLoading={isLoading}>
        <FeatureCard
          icon={<TrendingUp className="h-10 w-10" />}
          title="Live Odds"
          description="Real-time NHL puck lines, totals, and moneylines from all major sportsbooks for every matchup."
          badge="LIVE"
          onClick={() => handleFeatureClick("live_odds")}
        />

        <FeatureCard
          icon={<Users className="h-10 w-10" />}
          title="Player Props"
          description="Goals, assists, shots on goal, and goalie saves. In-depth player prop markets and trends."
          onClick={() => handleFeatureClick("player_props")}
        />

        <FeatureCard
          icon={<Target className="h-10 w-10" />}
          title="Matchups"
          description="Goalie vs team analysis, special teams matchups, and head-to-head statistical edges."
          onClick={() => handleFeatureClick("matchups")}
        />

        <FeatureCard
          icon={<BarChart3 className="h-10 w-10" />}
          title="Game Dashboard"
          description="Complete NHL game center with goalie starters, rest days, and real-time betting action."
          badge="POPULAR"
          onClick={() => handleFeatureClick("game_dashboard")}
        />

        <FeatureCard
          icon={<Activity className="h-10 w-10" />}
          title="Injury Reports"
          description="Latest injury updates, lineup confirmations, and goalie starter announcements before puck drop."
          badge="UPDATED"
          onClick={() => handleFeatureClick("injuries")}
        />

        <FeatureCard
          icon={<Calendar className="h-10 w-10" />}
          title="Upcoming Games"
          description="Full NHL schedule with back-to-back tracking, road trip analysis, and series previews."
          onClick={() => handleFeatureClick("upcoming_games")}
        />

        <FeatureCard
          icon={<Clock className="h-10 w-10" />}
          title="Historical Trends"
          description="Puck line performance, over/under trends, and home/away splits for all NHL teams."
          onClick={() => handleFeatureClick("historical_trends")}
        />

        <FeatureCard
          icon={<Shield className="h-10 w-10" />}
          title="Team Analytics"
          description="Advanced metrics including Corsi, Fenwick, PDO, power play efficiency, and penalty kill rates."
          onClick={() => handleFeatureClick("team_analytics")}
        />

        <FeatureCard
          icon={<LineChart className="h-10 w-10" />}
          title="Line Movement History"
          description="Track puck line and total movements from opening to faceoff. Identify sharp money moves."
          onClick={() => handleFeatureClick("line_movement")}
        />
      </FeatureCardGrid>
    </Suspense>
  )
}

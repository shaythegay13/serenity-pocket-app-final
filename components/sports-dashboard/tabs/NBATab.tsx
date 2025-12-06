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
 * NBATab Component
 * 
 * NBA-specific sports data dashboard tab.
 * Displays 9 feature cards in a 3x3 grid for different NBA data views.
 */
export default function NBATab() {
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
          description="Real-time NBA betting lines from all major sportsbooks. Compare spreads, totals, and moneylines instantly."
          badge="LIVE"
          onClick={() => handleFeatureClick("live_odds")}
        />

        <FeatureCard
          icon={<Users className="h-10 w-10" />}
          title="Player Props"
          description="Points, rebounds, assists, and threes. Advanced player prop markets with statistical breakdowns."
          onClick={() => handleFeatureClick("player_props")}
        />

        <FeatureCard
          icon={<Target className="h-10 w-10" />}
          title="Matchups"
          description="Team-vs-team analysis with pace, efficiency ratings, and defensive matchup advantages."
          onClick={() => handleFeatureClick("matchups")}
        />

        <FeatureCard
          icon={<BarChart3 className="h-10 w-10" />}
          title="Game Dashboard"
          description="Comprehensive NBA game center with live stats, betting trends, and real-time line movements."
          badge="POPULAR"
          onClick={() => handleFeatureClick("game_dashboard")}
        />

        <FeatureCard
          icon={<Activity className="h-10 w-10" />}
          title="Injury Reports"
          description="Up-to-the-minute injury updates and probable/questionable player designations before tip-off."
          badge="UPDATED"
          onClick={() => handleFeatureClick("injuries")}
        />

        <FeatureCard
          icon={<Calendar className="h-10 w-10" />}
          title="Upcoming Games"
          description="Full NBA schedule with previews, rest days analysis, and back-to-back game tracking."
          onClick={() => handleFeatureClick("upcoming_games")}
        />

        <FeatureCard
          icon={<Clock className="h-10 w-10" />}
          title="Historical Trends"
          description="ATS performance, home/away splits, and situational betting trends for every NBA team."
          onClick={() => handleFeatureClick("historical_trends")}
        />

        <FeatureCard
          icon={<Shield className="h-10 w-10" />}
          title="Team Analytics"
          description="Advanced metrics including offensive rating, defensive rating, pace, and four factors analysis."
          onClick={() => handleFeatureClick("team_analytics")}
        />

        <FeatureCard
          icon={<LineChart className="h-10 w-10" />}
          title="Line Movement History"
          description="Track line movements from opening to tip-off. Identify sharp action and public betting patterns."
          onClick={() => handleFeatureClick("line_movement")}
        />
      </FeatureCardGrid>
    </Suspense>
  )
}

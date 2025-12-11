"use client"

import React, { Suspense } from "react"
import { FeatureCard } from "../shared/FeatureCard"
import { FeatureCardGrid } from "../shared/FeatureCardGrid"
import { useSportsStore, type SportsFeatureView } from "@/lib/stores/sports-store"
import {
  TrendingUp,
  Users,
  LineChart,
  PieChart,
  CloudRain,
  Zap
} from "lucide-react"

/**
 * NHLTab Component
 *
 * NHL-specific sports data dashboard tab.
 * Displays 6 feature cards in a grid for different NHL data views.
 *
 * Feature Cards:
 * 1. Live Scores - In-game scores and live betting
 * 2. Upcoming Games & Odds - Consolidated live odds, schedule, matchups, and game dashboard
 * 3. Team & Player Analytics - Consolidated player props, team analytics, and injuries
 * 4. Line Movement - Historical line tracking
 * 5. Betting Trends - Public betting percentages and sharp action
 * 6. Weather Conditions - Weather impact on game totals
 */
export default function NHLTab() {
  const activeSport = useSportsStore((state) => state.activeSport)
  const isLoading = useSportsStore((state) => state.gamesLoading[activeSport])
  const setActiveFeature = useSportsStore((state) => state.setActiveFeature)

  const handleFeatureClick = (feature: SportsFeatureView) => {
    setActiveFeature(feature)
  }

  return (
    <Suspense fallback={<FeatureCardGrid isLoading={true} skeletonCount={6} />}>
      <FeatureCardGrid isLoading={isLoading}>
        {/* 1. Live Scores */}
        <FeatureCard
          icon={<Zap className="h-10 w-10" />}
          title="Live Scores"
          description="In-game scores, live betting lines, and real-time updates. Track your action as games unfold."
          badge="LIVE"
          onClick={() => handleFeatureClick("live_scores")}
        />

        {/* 2. Upcoming Games & Odds - CONSOLIDATED */}
        <FeatureCard
          icon={<TrendingUp className="h-10 w-10" />}
          title="Upcoming Games & Odds"
          description="Live betting lines across all sportsbooks with complete schedule, matchup breakdowns, spreads, totals, and moneylines."
          badge="POPULAR"
          onClick={() => handleFeatureClick("upcoming_games_odds")}
        />

        {/* 3. Team & Player Analytics - CONSOLIDATED with Injuries */}
        <FeatureCard
          icon={<Users className="h-10 w-10" />}
          title="Team & Player Analytics"
          description="Advanced team stats, player props, and injury reports. Offensive ratings, defensive metrics, and lineup confirmations."
          onClick={() => handleFeatureClick("team_player_analytics")}
        />

        {/* 4. Line Movement */}
        <FeatureCard
          icon={<LineChart className="h-10 w-10" />}
          title="Line Movement"
          description="Track how betting lines move from opening to kickoff. Identify sharp money and public action."
          onClick={() => handleFeatureClick("line_movement")}
        />

        {/* 5. Betting Trends - NEW */}
        <FeatureCard
          icon={<PieChart className="h-10 w-10" />}
          title="Betting Trends"
          description="Public betting percentages, sharp vs public action, and consensus picks. See where the money is going."
          badge="NEW"
          onClick={() => handleFeatureClick("betting_trends")}
        />

        {/* 6. Weather Impact */}
        <FeatureCard
          icon={<CloudRain className="h-10 w-10" />}
          title="Weather Impact"
          description="Real-time weather forecasts and historical data on how conditions affect scoring and game totals."
          onClick={() => handleFeatureClick("weather_conditions")}
        />
      </FeatureCardGrid>
    </Suspense>
  )
}

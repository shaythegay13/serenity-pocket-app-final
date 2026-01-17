"use client"

import React, { Suspense } from "react"
import { FeatureCard } from "../shared/FeatureCard"
import { FeatureCardGrid } from "../shared/FeatureCardGrid"
import { TiltLabBanner } from "../shared/TiltLabBanner"
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
 * NBATab Component
 *
 * NBA-specific sports data dashboard tab.
 * Displays 6 feature cards in a grid for different NBA data views.
 *
 * Feature Cards:
 * 1. Live Scores - In-game scores and live betting
 * 2. Upcoming Games & Odds - Consolidated live odds, schedule, matchups, and game dashboard
 * 3. Team & Player Analytics - Consolidated player props, team analytics, and injuries
 * 4. Line Movement - Historical line tracking
 * 5. Betting Trends - Public betting percentages and sharp action
 * 6. Weather Conditions - Weather impact on game totals
 */
interface NBATabProps {
  userData?: {
    subscriptionTier?: string
  }
}

export default function NBATab({ userData }: NBATabProps) {
  const activeSport = useSportsStore((state) => state.activeSport)
  const isLoading = useSportsStore((state) => state.gamesLoading[activeSport] || false)
  const setActiveFeature = useSportsStore((state) => state.setActiveFeature)

  const handleFeatureClick = (feature: SportsFeatureView) => {
    setActiveFeature(feature)
  }

  return (
    <Suspense fallback={<FeatureCardGrid isLoading={true} skeletonCount={6} />}>
      <div className="px-4 md:px-6 pb-6">
        <FeatureCardGrid isLoading={isLoading}>
          {/* 1. Live Scores */}
          <FeatureCard
          icon={<Zap className="h-10 w-10" />}
          title="Live Scores"
          description="In-game scores, live betting lines, and real-time updates. Track your action as games unfold."
          badge="LIVE"
          onClick={() => handleFeatureClick("live_scores")}
          />

          {/* 2. Upcoming Games & Odds */}
          <FeatureCard
          icon={<TrendingUp className="h-10 w-10" />}
          title="Upcoming Games & Odds"
          description="Consolidated live odds, schedule, matchups, and game dashboard for all upcoming NBA games."
          badge="ODDS"
          onClick={() => handleFeatureClick("upcoming_games_odds")}
          />

          {/* 3. Team & Player Analytics */}
          <FeatureCard
          icon={<Users className="h-10 w-10" />}
          title="Team & Player Analytics"
          description="Consolidated player props, team analytics, and injury reports for comprehensive NBA insights."
          badge="ANALYTICS"
          onClick={() => handleFeatureClick("team_player_analytics")}
          />

          {/* 4. Line Movement */}
          <FeatureCard
          icon={<LineChart className="h-10 w-10" />}
          title="Line Movement"
          description="Historical line tracking and movement analysis to identify betting trends and value opportunities."
          badge="TRENDS"
          onClick={() => handleFeatureClick("line_movement")}
          />

          {/* 5. Betting Trends */}
          <FeatureCard
          icon={<PieChart className="h-10 w-10" />}
          title="Betting Trends"
          description="Public betting percentages, sharp action indicators, and market sentiment analysis."
          badge="INSIGHTS"
          onClick={() => handleFeatureClick("betting_trends")}
          />

          {/* 6. Weather Conditions */}
          <FeatureCard
            icon={<CloudRain className="h-10 w-10" />}
            title="Weather Conditions"
            description="Weather impact analysis on game totals and scoring expectations with detailed forecasts."
            badge="WEATHER"
            onClick={() => handleFeatureClick("weather_conditions")}
          />
        </FeatureCardGrid>

        {/* TiltLab Banner */}
        <TiltLabBanner />
      </div>
    </Suspense>
  )
}

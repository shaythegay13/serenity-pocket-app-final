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
 * NFLTab Component
 * 
 * NFL-specific sports data dashboard tab.
 * Displays 9 feature cards in a 3x3 grid for different NFL data views.
 * 
 * Feature Cards:
 * 1. Live Odds - Real-time betting lines
 * 2. Player Props - Individual player prop markets
 * 3. Matchups - Head-to-head game analysis
 * 4. Game Dashboard - Comprehensive game data
 * 5. Injury Reports - Latest injury updates
 * 6. Upcoming Games - Schedule and previews
 * 7. Historical Trends - ATS, O/U performance
 * 8. Team Analytics - Advanced team statistics
 * 9. Line Movement - Historical line tracking
 */
export default function NFLTab() {
  const activeSport = useSportsStore((state) => state.activeSport)
  const isLoading = useSportsStore((state) => state.gamesLoading[activeSport])
  const setActiveFeature = useSportsStore((state) => state.setActiveFeature)

  const handleFeatureClick = (feature: SportsFeatureView) => {
    setActiveFeature(feature)
  }

  return (
    <Suspense fallback={<FeatureCardGrid isLoading={true} skeletonCount={9} />}>
      <FeatureCardGrid isLoading={isLoading}>
        {/* 1. Live Odds */}
        <FeatureCard
          icon={<TrendingUp className="h-10 w-10" />}
          title="Live Odds"
          description="Compare real-time betting lines across DraftKings, FanDuel, BetMGM, and more. Find the best value for your NFL bets."
          badge="LIVE"
          onClick={() => handleFeatureClick("live_odds")}
        />

        {/* 2. Player Props */}
        <FeatureCard
          icon={<Users className="h-10 w-10" />}
          title="Player Props"
          description="Explore passing yards, touchdowns, receptions, and rushing props. Data-driven insights for every position."
          onClick={() => handleFeatureClick("player_props")}
        />

        {/* 3. Matchups */}
        <FeatureCard
          icon={<Target className="h-10 w-10" />}
          title="Matchups"
          description="Deep-dive analysis of team matchups, offensive vs defensive rankings, and key statistical edges."
          onClick={() => handleFeatureClick("matchups")}
        />

        {/* 4. Game Dashboard */}
        <FeatureCard
          icon={<BarChart3 className="h-10 w-10" />}
          title="Game Dashboard"
          description="All-in-one view of spreads, totals, moneylines, and key game metrics for every NFL contest."
          badge="POPULAR"
          onClick={() => handleFeatureClick("game_dashboard")}
        />

        {/* 5. Injury Reports */}
        <FeatureCard
          icon={<Activity className="h-10 w-10" />}
          title="Injury Reports"
          description="Stay updated with the latest injury news and probable/questionable designations before kickoff."
          badge="UPDATED"
          onClick={() => handleFeatureClick("injuries")}
        />

        {/* 6. Upcoming Games */}
        <FeatureCard
          icon={<Calendar className="h-10 w-10" />}
          title="Upcoming Games"
          description="Full NFL schedule with game previews, betting trends, and expert picks for every matchup."
          onClick={() => handleFeatureClick("upcoming_games")}
        />

        {/* 7. Historical Trends */}
        <FeatureCard
          icon={<Clock className="h-10 w-10" />}
          title="Historical Trends"
          description="Against-the-spread records, over/under performance, and situational betting trends."
          onClick={() => handleFeatureClick("historical_trends")}
        />

        {/* 8. Team Analytics */}
        <FeatureCard
          icon={<Shield className="h-10 w-10" />}
          title="Team Analytics"
          description="Advanced stats including DVOA, EPA, success rates, and red zone efficiency for all 32 teams."
          onClick={() => handleFeatureClick("team_analytics")}
        />

        {/* 9. Line Movement */}
        <FeatureCard
          icon={<LineChart className="h-10 w-10" />}
          title="Line Movement History"
          description="Track how betting lines move from opening to kickoff. Identify sharp money and public action."
          onClick={() => handleFeatureClick("line_movement")}
        />
      </FeatureCardGrid>
    </Suspense>
  )
}

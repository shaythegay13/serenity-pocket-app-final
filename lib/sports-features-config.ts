import {
  TrendingUp,
  Users,
  Target,
  Activity,
  Calendar,
  BarChart3,
  Zap,
  Trophy,
  LineChart,
  AlertCircle,
  Clock,
  Archive,
  Shield,
  type LucideIcon
} from "lucide-react"

export type SportType = "nba" | "nfl" | "mlb" | "nhl"
export type FeatureModule =
  | "live-games"
  | "upcoming-games"
  | "past-games"
  | "player-matchups"
  | "performance-analytics"
  | "team-analytics"
  | "lineup-impact"
  | "betting-odds"
  | "line-movement"
  | "injury-reports"
  | "game-trends"
  | "live-scoreboards"

export interface FeatureModuleConfig {
  id: FeatureModule
  title: string
  description: string
  icon: LucideIcon
  category: "Player" | "Game" | "Team" | "Betting" | "Live"
  accentColor: "gold" | "teal" | "blue" | "purple"
  enabled: boolean
}

// Feature modules available across all sports
export const FEATURE_MODULES: Record<FeatureModule, FeatureModuleConfig> = {
  // LIVE MODULES
  "live-scoreboards": {
    id: "live-scoreboards",
    title: "Live Scoreboards",
    description: "Real-time game scores, play-by-play updates, and current stats as games unfold.",
    icon: Zap,
    category: "Live",
    accentColor: "gold",
    enabled: true
  },
  "live-games": {
    id: "live-games",
    title: "Live Game Dashboard",
    description: "Comprehensive in-game analysis with real-time stats, momentum tracking, and betting implications.",
    icon: Activity,
    category: "Live",
    accentColor: "gold",
    enabled: true
  },

  // GAME MODULES
  "upcoming-games": {
    id: "upcoming-games",
    title: "Upcoming Games",
    description: "Schedule, matchup previews, betting lines, and predictive analytics for future games.",
    icon: Calendar,
    category: "Game",
    accentColor: "teal",
    enabled: true
  },
  "past-games": {
    id: "past-games",
    title: "Past Games Archive",
    description: "Historical results, box scores, detailed game logs organized by season for comprehensive analysis.",
    icon: Archive,
    category: "Game",
    accentColor: "teal",
    enabled: true
  },
  "game-trends": {
    id: "game-trends",
    title: "Historical Game Trends",
    description: "Season-long patterns, head-to-head records, opponent analysis, and strength of schedule insights.",
    icon: LineChart,
    category: "Game",
    accentColor: "teal",
    enabled: true
  },

  // PLAYER MODULES
  "player-matchups": {
    id: "player-matchups",
    title: "Matchup Matrix",
    description: "Head-to-head player comparisons with performance metrics, recent form, and matchup advantages.",
    icon: Users,
    category: "Player",
    accentColor: "purple",
    enabled: true
  },
  "performance-analytics": {
    id: "performance-analytics",
    title: "Performance Showcase",
    description: "Deep dive into player stats, advanced metrics, recent game trends, and season-long trajectories.",
    icon: BarChart3,
    category: "Player",
    accentColor: "purple",
    enabled: true
  },
  "lineup-impact": {
    id: "lineup-impact",
    title: "Lineup Synergy",
    description: "On/off court data showing how players perform together and individual lineup impact metrics.",
    icon: Target,
    category: "Player",
    accentColor: "purple",
    enabled: false // Note: Limited data currently available
  },

  // TEAM MODULES
  "team-analytics": {
    id: "team-analytics",
    title: "Team Analytics Hub",
    description: "Aggregate season statistics, team rankings, trend analysis, and comparative performance metrics.",
    icon: Shield,
    category: "Team",
    accentColor: "blue",
    enabled: true
  },
  "injury-reports": {
    id: "injury-reports",
    title: "Injury & Availability",
    description: "Real-time roster status, injury reports, lineup changes, and availability updates.",
    icon: AlertCircle,
    category: "Team",
    accentColor: "blue",
    enabled: false // Note: Requires additional API integration
  },

  // BETTING MODULES
  "betting-odds": {
    id: "betting-odds",
    title: "Odds Comparison",
    description: "Live odds across multiple sportsbooks with best price highlighting and arbitrage opportunities.",
    icon: TrendingUp,
    category: "Betting",
    accentColor: "gold",
    enabled: true
  },
  "line-movement": {
    id: "line-movement",
    title: "Line Movement Tracker",
    description: "Historical odds tracking showing how betting lines evolved leading up to game time.",
    icon: Clock,
    category: "Betting",
    accentColor: "gold",
    enabled: true
  }
}

// Sport-specific feature order and visibility
export const SPORT_FEATURES: Record<SportType, FeatureModule[]> = {
  nba: [
    "live-scoreboards",
    "live-games",
    "betting-odds",
    "upcoming-games",
    "player-matchups",
    "performance-analytics",
    "team-analytics",
    "line-movement",
    "past-games",
    "game-trends",
    "lineup-impact",
    "injury-reports"
  ],
  nfl: [
    "live-scoreboards",
    "live-games",
    "betting-odds",
    "upcoming-games",
    "player-matchups",
    "performance-analytics",
    "team-analytics",
    "line-movement",
    "past-games",
    "game-trends",
    "injury-reports"
  ],
  mlb: [
    "live-scoreboards",
    "live-games",
    "betting-odds",
    "upcoming-games",
    "player-matchups",
    "performance-analytics",
    "team-analytics",
    "line-movement",
    "past-games",
    "game-trends",
    "injury-reports"
  ],
  nhl: [
    "live-scoreboards",
    "live-games",
    "betting-odds",
    "upcoming-games",
    "player-matchups",
    "performance-analytics",
    "team-analytics",
    "line-movement",
    "past-games",
    "game-trends",
    "injury-reports"
  ]
}

// Helper to get enabled features for a sport
export function getEnabledFeaturesForSport(sport: SportType): FeatureModuleConfig[] {
  return SPORT_FEATURES[sport]
    .map((featureId) => FEATURE_MODULES[featureId])
    .filter((feature) => feature.enabled)
}

// Helper to get features by category
export function getFeaturesByCategory(
  sport: SportType,
  category: "Player" | "Game" | "Team" | "Betting" | "Live"
): FeatureModuleConfig[] {
  return getEnabledFeaturesForSport(sport).filter((f) => f.category === category)
}

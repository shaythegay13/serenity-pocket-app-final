/**
 * Player Prop Types for Serenity Pocket App
 *
 * Supports player-level betting data for SGP (Same Game Parlay) and parlay recommendations.
 * Integrates with TheOddsAPI player props markets.
 */

import { PropCategory, RiskLevel } from './ai-models'

// ==================== Player Information ====================

export interface PlayerInfo {
  id: string                    // External player ID (from TheOddsAPI or other source)
  name: string                  // Full display name (e.g., "Patrick Mahomes")
  team: string                  // Team abbreviation (e.g., "KC", "LAL")
  teamFullName?: string         // Full team name (e.g., "Kansas City Chiefs")
  position: string              // Position abbreviation (e.g., "QB", "WR", "PG", "C")
  sport: string                 // Sport key (e.g., "americanfootball_nfl", "basketball_nba")
  imageUrl?: string             // Player headshot URL
  jerseyNumber?: string         // Jersey number
}

// ==================== Player Prop Lines ====================

/**
 * Represents a single player prop betting line
 * Maps to TheOddsAPI player prop markets
 */
export interface PlayerPropLine {
  // Identification
  playerId: string              // Player identifier
  playerName: string            // Display name
  gameId: string                // Associated game/event ID

  // Prop details
  stat: string                  // Stat type (e.g., "player_pass_yds", "player_points")
  statDisplayName: string       // Human-readable stat name (e.g., "Passing Yards", "Points")
  category: PropCategory        // Category for correlation detection
  line: number                  // The prop line (e.g., 250.5)

  // Odds
  overOdds: number              // American odds for over (e.g., -110)
  underOdds: number             // American odds for under (e.g., -110)
  bookmaker?: string            // Bookmaker name (e.g., "fanduel", "draftkings")

  // AI/Analysis fields
  aiOverProbability?: number    // AI-estimated probability for over (0-1)
  aiUnderProbability?: number   // AI-estimated probability for under (0-1)
  historicalHitRate?: number    // Historical hit rate for this line (0-1)
  recentPerformance?: number[]  // Last N game stats for this prop
  averageStat?: number          // Season average for this stat

  // Metadata
  lastUpdated?: string          // ISO timestamp of last odds update

  // Market schema
  timeFrame?: import("../types/ai-models").TimeFrame
  variantType?: import("../types/ai-models").VariantType  // 'base_line' | 'alt_line'
  marketLevel?: import("../types/ai-models").MarketLevel  // always 'player' for props
}

// ==================== Player Prop Recommendations ====================

/**
 * AI-generated player prop recommendation
 */
export interface PlayerPropRecommendation {
  // Player info
  player: PlayerInfo

  // Prop details
  propLine: PlayerPropLine
  direction: 'over' | 'under'   // Recommended direction

  // Analysis
  confidence: number            // 0-100 confidence score
  emotionalAlignment: number    // 0-100 emotional alignment
  suggestedStake: number        // Suggested stake in dollars
  suggestedStakeFraction: number // As fraction of budget
  reasoning: string             // AI explanation
  riskLevel: RiskLevel

  // Value metrics
  ev: number                    // Expected value in dollars
  evPercentage: number          // EV as percentage
  trueWinProbability: number    // AI's probability estimate (0-1)
  impliedProbability: number    // Book's implied probability (0-1)

  // Correlation info
  correlatedWith?: string[]     // IDs of correlated props in same parlay
  correlationWarning?: string   // Warning message if highly correlated
}

// ==================== TheOddsAPI Market Types ====================

/**
 * Supported player prop markets from TheOddsAPI
 * These map to the `markets` query parameter
 */
export type PlayerPropMarket =
  // NFL Player Props
  | 'player_pass_yds'           // Passing Yards
  | 'player_pass_tds'           // Passing Touchdowns
  | 'player_pass_completions'   // Pass Completions
  | 'player_pass_attempts'      // Pass Attempts
  | 'player_pass_interceptions' // Interceptions Thrown
  | 'player_rush_yds'           // Rushing Yards
  | 'player_rush_attempts'      // Rush Attempts
  | 'player_rush_tds'           // Rushing Touchdowns
  | 'player_receptions'         // Receptions
  | 'player_reception_yds'      // Receiving Yards
  | 'player_reception_tds'      // Receiving Touchdowns
  | 'player_anytime_td'         // Anytime Touchdown Scorer
  | 'player_first_td'           // First Touchdown Scorer
  | 'player_tackles_assists'    // Tackles + Assists
  | 'player_sacks'              // Sacks
  // NBA Player Props
  | 'player_points'             // Points
  | 'player_rebounds'           // Rebounds
  | 'player_assists'            // Assists
  | 'player_threes'             // Three Pointers Made
  | 'player_blocks'             // Blocks
  | 'player_steals'             // Steals
  | 'player_turnovers'          // Turnovers
  | 'player_points_rebounds_assists' // PRA Combined
  | 'player_points_rebounds'    // Points + Rebounds
  | 'player_points_assists'     // Points + Assists
  | 'player_rebounds_assists'   // Rebounds + Assists
  | 'player_double_double'      // Double-Double
  | 'player_triple_double'      // Triple-Double
  // MLB Player Props
  | 'pitcher_strikeouts'        // Pitcher Strikeouts
  | 'pitcher_hits_allowed'      // Hits Allowed
  | 'pitcher_earned_runs'       // Earned Runs
  | 'batter_hits'               // Batter Hits
  | 'batter_runs_scored'        // Runs Scored
  | 'batter_rbis'               // RBIs
  | 'batter_total_bases'        // Total Bases
  | 'batter_home_runs'          // Home Runs
  | 'batter_stolen_bases'       // Stolen Bases
  // NHL Player Props
  | 'player_goals'              // Goals
  | 'player_assists_hockey'     // Assists
  | 'player_points_hockey'      // Points (Goals + Assists)
  | 'player_shots_on_goal'      // Shots on Goal
  | 'goalie_saves'              // Goalie Saves
  | 'goalie_goals_against'      // Goals Against

/**
 * Map prop markets to their categories for correlation detection
 */
export const PROP_MARKET_CATEGORIES: Record<PlayerPropMarket, PropCategory> = {
  // NFL
  'player_pass_yds': 'passing',
  'player_pass_tds': 'passing',
  'player_pass_completions': 'passing',
  'player_pass_attempts': 'passing',
  'player_pass_interceptions': 'passing',
  'player_rush_yds': 'rushing',
  'player_rush_attempts': 'rushing',
  'player_rush_tds': 'touchdown',
  'player_receptions': 'receiving',
  'player_reception_yds': 'receiving',
  'player_reception_tds': 'touchdown',
  'player_anytime_td': 'touchdown',
  'player_first_td': 'touchdown',
  'player_tackles_assists': 'defense',
  'player_sacks': 'defense',
  // NBA
  'player_points': 'scoring',
  'player_rebounds': 'rebounding',
  'player_assists': 'playmaking',
  'player_threes': 'scoring',
  'player_blocks': 'defense',
  'player_steals': 'defense',
  'player_turnovers': 'playmaking',
  'player_points_rebounds_assists': 'combined',
  'player_points_rebounds': 'combined',
  'player_points_assists': 'combined',
  'player_rebounds_assists': 'combined',
  'player_double_double': 'combined',
  'player_triple_double': 'combined',
  // MLB
  'pitcher_strikeouts': 'pitching',
  'pitcher_hits_allowed': 'pitching',
  'pitcher_earned_runs': 'pitching',
  'batter_hits': 'hitting',
  'batter_runs_scored': 'hitting',
  'batter_rbis': 'hitting',
  'batter_total_bases': 'hitting',
  'batter_home_runs': 'hitting',
  'batter_stolen_bases': 'hitting',
  // NHL
  'player_goals': 'skating',
  'player_assists_hockey': 'skating',
  'player_points_hockey': 'skating',
  'player_shots_on_goal': 'skating',
  'goalie_saves': 'goaltending',
  'goalie_goals_against': 'goaltending',
}

/**
 * Human-readable display names for prop markets
 */
export const PROP_MARKET_DISPLAY_NAMES: Record<PlayerPropMarket, string> = {
  // NFL
  'player_pass_yds': 'Passing Yards',
  'player_pass_tds': 'Passing TDs',
  'player_pass_completions': 'Completions',
  'player_pass_attempts': 'Pass Attempts',
  'player_pass_interceptions': 'Interceptions',
  'player_rush_yds': 'Rushing Yards',
  'player_rush_attempts': 'Rush Attempts',
  'player_rush_tds': 'Rushing TDs',
  'player_receptions': 'Receptions',
  'player_reception_yds': 'Receiving Yards',
  'player_reception_tds': 'Receiving TDs',
  'player_anytime_td': 'Anytime TD',
  'player_first_td': 'First TD',
  'player_tackles_assists': 'Tackles + Assists',
  'player_sacks': 'Sacks',
  // NBA
  'player_points': 'Points',
  'player_rebounds': 'Rebounds',
  'player_assists': 'Assists',
  'player_threes': '3-Pointers Made',
  'player_blocks': 'Blocks',
  'player_steals': 'Steals',
  'player_turnovers': 'Turnovers',
  'player_points_rebounds_assists': 'Pts + Reb + Ast',
  'player_points_rebounds': 'Pts + Reb',
  'player_points_assists': 'Pts + Ast',
  'player_rebounds_assists': 'Reb + Ast',
  'player_double_double': 'Double-Double',
  'player_triple_double': 'Triple-Double',
  // MLB
  'pitcher_strikeouts': 'Strikeouts',
  'pitcher_hits_allowed': 'Hits Allowed',
  'pitcher_earned_runs': 'Earned Runs',
  'batter_hits': 'Hits',
  'batter_runs_scored': 'Runs',
  'batter_rbis': 'RBIs',
  'batter_total_bases': 'Total Bases',
  'batter_home_runs': 'Home Runs',
  'batter_stolen_bases': 'Stolen Bases',
  // NHL
  'player_goals': 'Goals',
  'player_assists_hockey': 'Assists',
  'player_points_hockey': 'Points',
  'player_shots_on_goal': 'Shots on Goal',
  'goalie_saves': 'Saves',
  'goalie_goals_against': 'Goals Against',
}

// ==================== API Response Types ====================

/**
 * TheOddsAPI player props response structure
 */
export interface OddsAPIPlayerPropsResponse {
  id: string                    // Event ID
  sport_key: string             // Sport key
  sport_title: string           // Sport display name
  commence_time: string         // ISO timestamp
  home_team: string
  away_team: string
  bookmakers: OddsAPIBookmaker[]
}

export interface OddsAPIBookmaker {
  key: string                   // Bookmaker key (e.g., "fanduel")
  title: string                 // Bookmaker display name
  markets: OddsAPIMarket[]
}

export interface OddsAPIMarket {
  key: string                   // Market key (e.g., "player_pass_yds")
  last_update: string           // ISO timestamp
  outcomes: OddsAPIOutcome[]
}

export interface OddsAPIOutcome {
  name: string                  // "Over" or "Under"
  description: string           // Player name
  price: number                 // American odds
  point?: number                // Line value
}

// ==================== Utility Functions ====================

/**
 * Get the category for a given prop market
 */
export function getPropCategory(market: string): PropCategory {
  return PROP_MARKET_CATEGORIES[market as PlayerPropMarket] || 'other'
}

/**
 * Get the display name for a prop market
 */
export function getPropDisplayName(market: string): string {
  return PROP_MARKET_DISPLAY_NAMES[market as PlayerPropMarket] || market
}

/**
 * Check if a prop market is supported
 */
export function isSupportedPropMarket(market: string): market is PlayerPropMarket {
  return market in PROP_MARKET_CATEGORIES
}

/**
 * Get all prop markets for a sport
 */
export function getPropMarketsForSport(sport: string): PlayerPropMarket[] {
  const sportPrefix = sport.toLowerCase()

  if (sportPrefix.includes('football') || sportPrefix.includes('nfl')) {
    return [
      'player_pass_yds', 'player_pass_tds', 'player_pass_completions',
      'player_rush_yds', 'player_rush_tds', 'player_receptions',
      'player_reception_yds', 'player_reception_tds', 'player_anytime_td'
    ]
  }

  if (sportPrefix.includes('basketball') || sportPrefix.includes('nba')) {
    return [
      'player_points', 'player_rebounds', 'player_assists', 'player_threes',
      'player_points_rebounds_assists', 'player_points_rebounds',
      'player_points_assists', 'player_rebounds_assists'
    ]
  }

  if (sportPrefix.includes('baseball') || sportPrefix.includes('mlb')) {
    return [
      'pitcher_strikeouts', 'batter_hits', 'batter_runs_scored',
      'batter_rbis', 'batter_total_bases', 'batter_home_runs'
    ]
  }

  if (sportPrefix.includes('hockey') || sportPrefix.includes('nhl')) {
    return [
      'player_goals', 'player_assists_hockey', 'player_points_hockey',
      'player_shots_on_goal', 'goalie_saves'
    ]
  }

  return []
}

/**
 * Get alternate prop markets for a sport (alt lines use same base keys with _alternate suffix).
 * Only NFL and NBA have meaningful alternate player prop markets on TheOddsAPI.
 */
export function getAltPropMarketsForSport(sport: string): string[] {
  const sportPrefix = sport.toLowerCase()

  if (sportPrefix.includes('football') || sportPrefix.includes('nfl')) {
    return [
      'player_pass_yds_alternate', 'player_rush_yds_alternate',
      'player_reception_yds_alternate', 'player_receptions_alternate'
    ]
  }

  if (sportPrefix.includes('basketball') || sportPrefix.includes('nba')) {
    return [
      'player_points_alternate', 'player_rebounds_alternate',
      'player_assists_alternate', 'player_threes_alternate'
    ]
  }

  return []
}

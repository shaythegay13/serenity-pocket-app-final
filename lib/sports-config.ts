/**
 * Dynamic Sports Configuration System
 * Centralized sports definitions for all AI systems
 */

import type { FormatType } from './types/ai-models'

export interface SportConfig {
  id: string;
  name: string;
  displayName: string;
  category: 'team' | 'individual' | 'combat';
  oddsApiSport: string;
  oddsApiLeague?: string;
  hasLiveOdds: boolean;
  hasPlayerProps: boolean;
  hasSGP: boolean;              // Supports Same Game Parlays
  hasParlays: boolean;          // Supports parlays in general
  popularMarkets: string[];
  supportedMarkets?: string[];
  teamCount?: number;
  seasonActive?: boolean;
  icon?: string;
  /**
   * Structural format of events for this sport.
   * Omit to inherit the default (TEAM_VS_TEAM).
   * Prefer the FORMAT_BY_SPORT lookup for built-in sports;
   * set this field for custom/extended sport entries.
   */
  matchFormat?: FormatType;
}

export const SUPPORTED_SPORTS: Record<string, SportConfig> = {
  // =====================================================================
  // MAJOR US SPORTS (Big 4)
  // =====================================================================
  basketball_nba: {
    id: 'basketball_nba',
    name: 'NBA',
    displayName: 'NBA Basketball',
    category: 'team',
    oddsApiSport: 'basketball',
    oddsApiLeague: 'nba',
    hasLiveOdds: true,
    hasPlayerProps: true,
    hasSGP: true,
    hasParlays: true,
    popularMarkets: ['Moneyline', 'Spread', 'Over/Under', 'Player Props'],
    supportedMarkets: ['moneyline', 'spread', 'total'],
    teamCount: 30,
    seasonActive: true,
    icon: '🏀'
  },
  americanfootball_nfl: {
    id: 'americanfootball_nfl',
    name: 'NFL',
    displayName: 'NFL Football',
    category: 'team',
    oddsApiSport: 'americanfootball',
    oddsApiLeague: 'nfl',
    hasLiveOdds: true,
    hasPlayerProps: true,
    hasSGP: true,
    hasParlays: true,
    popularMarkets: ['Moneyline', 'Spread', 'Over/Under', 'Player Props'],
    supportedMarkets: ['moneyline', 'spread', 'total'],
    teamCount: 32,
    seasonActive: true,
    icon: '🏈'
  },
  baseball_mlb: {
    id: 'baseball_mlb',
    name: 'MLB',
    displayName: 'MLB Baseball',
    category: 'team',
    oddsApiSport: 'baseball',
    oddsApiLeague: 'mlb',
    hasLiveOdds: true,
    hasPlayerProps: true,
    hasSGP: true,
    hasParlays: true,
    popularMarkets: ['Moneyline', 'Run Line', 'Over/Under', 'Player Props'],
    supportedMarkets: ['moneyline', 'spread', 'total'],
    teamCount: 30,
    seasonActive: true,
    icon: '⚾'
  },
  icehockey_nhl: {
    id: 'icehockey_nhl',
    name: 'NHL',
    displayName: 'NHL Hockey',
    category: 'team',
    oddsApiSport: 'icehockey',
    oddsApiLeague: 'nhl',
    hasLiveOdds: true,
    hasPlayerProps: true,
    hasSGP: true,
    hasParlays: true,
    popularMarkets: ['Moneyline', 'Puck Line', 'Over/Under', 'Player Props'],
    supportedMarkets: ['moneyline', 'spread', 'total'],
    teamCount: 32,
    seasonActive: true,
    icon: '🏒'
  },

  // =====================================================================
  // COLLEGE SPORTS
  // =====================================================================
  basketball_ncaab: {
    id: 'basketball_ncaab',
    name: 'NCAAB',
    displayName: 'College Basketball',
    category: 'team',
    oddsApiSport: 'basketball',
    oddsApiLeague: 'ncaab',
    hasLiveOdds: true,
    hasPlayerProps: false, // Most states restrict college player props
    hasSGP: true,
    hasParlays: true,
    popularMarkets: ['Moneyline', 'Spread', 'Over/Under'],
    supportedMarkets: ['moneyline', 'spread', 'total'],
    teamCount: 350,
    seasonActive: true,
    icon: '🎓'
  },
  americanfootball_ncaaf: {
    id: 'americanfootball_ncaaf',
    name: 'NCAAF',
    displayName: 'College Football',
    category: 'team',
    oddsApiSport: 'americanfootball',
    oddsApiLeague: 'ncaaf',
    hasLiveOdds: true,
    hasPlayerProps: false, // Most states restrict college player props
    hasSGP: true,
    hasParlays: true,
    popularMarkets: ['Moneyline', 'Spread', 'Over/Under'],
    supportedMarkets: ['moneyline', 'spread', 'total'],
    teamCount: 130,
    seasonActive: true,
    icon: '🎓'
  },

  // =====================================================================
  // ADDITIONAL US SPORTS
  // =====================================================================
  basketball_wnba: {
    id: 'basketball_wnba',
    name: 'WNBA',
    displayName: 'WNBA Basketball',
    category: 'team',
    oddsApiSport: 'basketball',
    oddsApiLeague: 'wnba',
    hasLiveOdds: true,
    hasPlayerProps: true,
    hasSGP: true,
    hasParlays: true,
    popularMarkets: ['Moneyline', 'Spread', 'Over/Under', 'Player Props'],
    supportedMarkets: ['moneyline', 'spread', 'total'],
    teamCount: 12,
    seasonActive: true,
    icon: '🏀'
  },
  americanfootball_cfl: {
    id: 'americanfootball_cfl',
    name: 'CFL',
    displayName: 'Canadian Football League',
    category: 'team',
    oddsApiSport: 'americanfootball',
    oddsApiLeague: 'cfl',
    hasLiveOdds: true,
    hasPlayerProps: false,
    hasSGP: false,
    hasParlays: true,
    popularMarkets: ['Moneyline', 'Spread', 'Over/Under'],
    supportedMarkets: ['moneyline', 'spread', 'total'],
    teamCount: 9,
    seasonActive: true,
    icon: '🏈'
  },
  americanfootball_xfl: {
    id: 'americanfootball_xfl',
    name: 'XFL/UFL',
    displayName: 'XFL/UFL Football',
    category: 'team',
    oddsApiSport: 'americanfootball',
    oddsApiLeague: 'xfl',
    hasLiveOdds: true,
    hasPlayerProps: false,
    hasSGP: false,
    hasParlays: true,
    popularMarkets: ['Moneyline', 'Spread', 'Over/Under'],
    supportedMarkets: ['moneyline', 'spread', 'total'],
    teamCount: 8,
    seasonActive: false, // Seasonal
    icon: '🏈'
  },

  // =====================================================================
  // SOCCER - COMPREHENSIVE
  // =====================================================================
  soccer_epl: {
    id: 'soccer_epl',
    name: 'EPL',
    displayName: 'English Premier League',
    category: 'team',
    oddsApiSport: 'soccer',
    oddsApiLeague: 'soccer_epl',
    hasLiveOdds: true,
    hasPlayerProps: true,
    hasSGP: true,
    hasParlays: true,
    popularMarkets: ['Moneyline', 'Asian Handicap', 'Over/Under', 'Both Teams to Score', 'Corners', 'Cards'],
    supportedMarkets: ['moneyline', 'spread', 'total'],
    teamCount: 20,
    seasonActive: true,
    icon: '⚽'
  },
  soccer_mls: {
    id: 'soccer_mls',
    name: 'MLS',
    displayName: 'Major League Soccer',
    category: 'team',
    oddsApiSport: 'soccer',
    oddsApiLeague: 'soccer_usa_mls',
    hasLiveOdds: true,
    hasPlayerProps: true,
    hasSGP: true,
    hasParlays: true,
    popularMarkets: ['Moneyline', 'Asian Handicap', 'Over/Under', 'Player Props', 'Corners', 'Cards'],
    supportedMarkets: ['moneyline', 'spread', 'total'],
    teamCount: 29,
    seasonActive: true,
    icon: '⚽'
  },
  soccer_champions_league: {
    id: 'soccer_champions_league',
    name: 'UCL',
    displayName: 'UEFA Champions League',
    category: 'team',
    oddsApiSport: 'soccer',
    oddsApiLeague: 'soccer_uefa_champs_league',
    hasLiveOdds: true,
    hasPlayerProps: true,
    hasSGP: true,
    hasParlays: true,
    popularMarkets: ['Moneyline', 'Asian Handicap', 'Over/Under', 'Both Teams to Score', 'Corners', 'Cards'],
    supportedMarkets: ['moneyline', 'spread', 'total'],
    teamCount: 32,
    seasonActive: false,
    icon: '🏆'
  },
  soccer_la_liga: {
    id: 'soccer_la_liga',
    name: 'La Liga',
    displayName: 'Spanish La Liga',
    category: 'team',
    oddsApiSport: 'soccer',
    oddsApiLeague: 'soccer_spain_la_liga',
    hasLiveOdds: true,
    hasPlayerProps: true,
    hasSGP: true,
    hasParlays: true,
    popularMarkets: ['Moneyline', 'Asian Handicap', 'Over/Under', 'Both Teams to Score', 'Corners', 'Cards'],
    supportedMarkets: ['moneyline', 'spread', 'total'],
    teamCount: 20,
    seasonActive: true,
    icon: '⚽'
  },
  soccer_serie_a: {
    id: 'soccer_serie_a',
    name: 'Serie A',
    displayName: 'Italian Serie A',
    category: 'team',
    oddsApiSport: 'soccer',
    oddsApiLeague: 'soccer_italy_serie_a',
    hasLiveOdds: true,
    hasPlayerProps: true,
    hasSGP: true,
    hasParlays: true,
    popularMarkets: ['Moneyline', 'Asian Handicap', 'Over/Under', 'Both Teams to Score', 'Corners', 'Cards'],
    supportedMarkets: ['moneyline', 'spread', 'total'],
    teamCount: 20,
    seasonActive: true,
    icon: '⚽'
  },
  soccer_bundesliga: {
    id: 'soccer_bundesliga',
    name: 'Bundesliga',
    displayName: 'German Bundesliga',
    category: 'team',
    oddsApiSport: 'soccer',
    oddsApiLeague: 'soccer_germany_bundesliga',
    hasLiveOdds: true,
    hasPlayerProps: true,
    hasSGP: true,
    hasParlays: true,
    popularMarkets: ['Moneyline', 'Asian Handicap', 'Over/Under', 'Both Teams to Score', 'Corners', 'Cards'],
    supportedMarkets: ['moneyline', 'spread', 'total'],
    teamCount: 18,
    seasonActive: true,
    icon: '⚽'
  },
  soccer_ligue_1: {
    id: 'soccer_ligue_1',
    name: 'Ligue 1',
    displayName: 'French Ligue 1',
    category: 'team',
    oddsApiSport: 'soccer',
    oddsApiLeague: 'soccer_france_ligue_one',
    hasLiveOdds: true,
    hasPlayerProps: true,
    hasSGP: true,
    hasParlays: true,
    popularMarkets: ['Moneyline', 'Asian Handicap', 'Over/Under', 'Both Teams to Score', 'Corners', 'Cards'],
    supportedMarkets: ['moneyline', 'spread', 'total'],
    teamCount: 18,
    seasonActive: true,
    icon: '⚽'
  },

  // =====================================================================
  // COMBAT SPORTS
  // =====================================================================
  mma_ufc: {
    id: 'mma_ufc',
    name: 'UFC',
    displayName: 'UFC/MMA',
    category: 'combat',
    oddsApiSport: 'mma',
    oddsApiLeague: 'mma_mixed_martial_arts',
    hasLiveOdds: true,
    hasPlayerProps: true,
    hasSGP: true,
    hasParlays: true,
    popularMarkets: ['Moneyline', 'Method of Victory', 'Round Betting', 'Fight Duration'],
    supportedMarkets: ['moneyline', 'total'],
    teamCount: 0,
    seasonActive: true,
    icon: '🥊'
  },
  boxing: {
    id: 'boxing',
    name: 'Boxing',
    displayName: 'Professional Boxing',
    category: 'combat',
    oddsApiSport: 'boxing',
    hasLiveOdds: true,
    hasPlayerProps: true,
    hasSGP: true,
    hasParlays: true,
    popularMarkets: ['Moneyline', 'Method of Victory', 'Round Betting', 'Fight Duration'],
    supportedMarkets: ['moneyline', 'total'],
    teamCount: 0,
    seasonActive: true,
    icon: '🥊'
  },

  // =====================================================================
  // TENNIS
  // =====================================================================
  tennis_atp: {
    id: 'tennis_atp',
    name: 'ATP',
    displayName: 'ATP Tennis',
    category: 'individual',
    oddsApiSport: 'tennis',
    oddsApiLeague: 'atp',
    hasLiveOdds: true,
    hasPlayerProps: true,
    hasSGP: true,
    hasParlays: true,
    popularMarkets: ['Moneyline', 'Set Betting', 'Total Games'],
    supportedMarkets: ['moneyline', 'spread', 'total'],
    teamCount: 0,
    seasonActive: true,
    icon: '🎾'
  },
  tennis_wta: {
    id: 'tennis_wta',
    name: 'WTA',
    displayName: 'WTA Tennis',
    category: 'individual',
    oddsApiSport: 'tennis',
    oddsApiLeague: 'wta',
    hasLiveOdds: true,
    hasPlayerProps: true,
    hasSGP: true,
    hasParlays: true,
    popularMarkets: ['Moneyline', 'Set Betting', 'Total Games'],
    supportedMarkets: ['moneyline', 'spread', 'total'],
    teamCount: 0,
    seasonActive: true,
    icon: '🎾'
  },
  tennis_itf: {
    id: 'tennis_itf',
    name: 'ITF',
    displayName: 'ITF/Challengers Tennis',
    category: 'individual',
    oddsApiSport: 'tennis',
    oddsApiLeague: 'itf',
    hasLiveOdds: true,
    hasPlayerProps: true,
    hasSGP: false,
    hasParlays: true,
    popularMarkets: ['Moneyline', 'Set Betting', 'Total Games', 'Player Props'],
    supportedMarkets: ['moneyline', 'total'],
    teamCount: 0,
    seasonActive: true,
    icon: '🎾'
  },

  // =====================================================================
  // GOLF
  // =====================================================================
  golf_pga: {
    id: 'golf_pga',
    name: 'PGA',
    displayName: 'PGA Tour Golf',
    category: 'individual',
    oddsApiSport: 'golf',
    oddsApiLeague: 'pga',
    hasLiveOdds: true,
    hasPlayerProps: true,
    hasSGP: false, // Golf doesn't have traditional SGPs
    hasParlays: true,
    popularMarkets: ['To Win Tournament', 'Top 5/10/20', 'Head-to-Head', 'Round Score O/U'],
    supportedMarkets: ['outright', 'matchup', 'total'],
    teamCount: 0,
    seasonActive: true,
    icon: '⛳'
  },
  golf_lpga: {
    id: 'golf_lpga',
    name: 'LPGA',
    displayName: 'LPGA Tour Golf',
    category: 'individual',
    oddsApiSport: 'golf',
    oddsApiLeague: 'lpga',
    hasLiveOdds: true,
    hasPlayerProps: false,
    hasSGP: false,
    hasParlays: true,
    popularMarkets: ['To Win Tournament', 'Top 5/10/20', 'Head-to-Head', 'Round Score O/U'],
    supportedMarkets: ['outright', 'matchup', 'total'],
    teamCount: 0,
    seasonActive: true,
    icon: '⛳'
  },
  golf_dp_world: {
    id: 'golf_dp_world',
    name: 'DP World',
    displayName: 'DP World Tour (European)',
    category: 'individual',
    oddsApiSport: 'golf',
    oddsApiLeague: 'dp_world',
    hasLiveOdds: true,
    hasPlayerProps: false,
    hasSGP: false,
    hasParlays: true,
    popularMarkets: ['To Win Tournament', 'Top 5/10/20', 'Head-to-Head', 'Round Score O/U'],
    supportedMarkets: ['outright', 'matchup', 'total'],
    teamCount: 0,
    seasonActive: true,
    icon: '⛳'
  },

  // =====================================================================
  // MOTORSPORTS
  // =====================================================================
  motorsports_f1: {
    id: 'motorsports_f1',
    name: 'F1',
    displayName: 'Formula 1',
    category: 'individual',
    oddsApiSport: 'motorsports',
    oddsApiLeague: 'f1',
    hasLiveOdds: true,
    hasPlayerProps: true,
    hasSGP: true,
    hasParlays: true,
    popularMarkets: ['To Win Race', 'Podium Finish', 'Fastest Lap'],
    supportedMarkets: ['outright', 'matchup'],
    teamCount: 20,
    seasonActive: true,
    icon: '🏎️'
  },
  motorsports_nascar: {
    id: 'motorsports_nascar',
    name: 'NASCAR',
    displayName: 'NASCAR',
    category: 'individual',
    oddsApiSport: 'motorsports',
    oddsApiLeague: 'nascar',
    hasLiveOdds: true,
    hasPlayerProps: true,
    hasSGP: true,
    hasParlays: true,
    popularMarkets: ['To Win Race', 'Top 10 Finish', 'Head-to-Head'],
    supportedMarkets: ['outright', 'matchup'],
    teamCount: 40,
    seasonActive: true,
    icon: '🏁'
  },
  motorsports_indycar: {
    id: 'motorsports_indycar',
    name: 'IndyCar',
    displayName: 'IndyCar Series',
    category: 'individual',
    oddsApiSport: 'motorsports',
    oddsApiLeague: 'indycar',
    hasLiveOdds: true,
    hasPlayerProps: false,
    hasSGP: false,
    hasParlays: true,
    popularMarkets: ['To Win Race', 'Podium Finish', 'Head-to-Head'],
    supportedMarkets: ['outright', 'matchup'],
    teamCount: 24,
    seasonActive: true,
    icon: '🏁'
  },

  // =====================================================================
  // INTERNATIONAL/NICHE SPORTS
  // =====================================================================
  darts_pdc: {
    id: 'darts_pdc',
    name: 'Darts',
    displayName: 'PDC Darts',
    category: 'individual',
    oddsApiSport: 'darts',
    oddsApiLeague: 'pdc',
    hasLiveOdds: true,
    hasPlayerProps: true,
    hasSGP: true,
    hasParlays: true,
    popularMarkets: ['Moneyline', '180s Over/Under', 'Checkout Percentage'],
    supportedMarkets: ['moneyline', 'total'],
    teamCount: 0,
    seasonActive: true,
    icon: '🎯'
  },
  table_tennis: {
    id: 'table_tennis',
    name: 'Table Tennis',
    displayName: 'Table Tennis',
    category: 'individual',
    oddsApiSport: 'tabletennis',
    hasLiveOdds: true,
    hasPlayerProps: false,
    hasSGP: false,
    hasParlays: true,
    popularMarkets: ['Moneyline', 'Total Points'],
    supportedMarkets: ['moneyline', 'total'],
    teamCount: 0,
    seasonActive: true,
    icon: '🏓'
  },
  // =====================================================================
  // CRICKET - COMPREHENSIVE (Domestic, International, T20 Leagues)
  // =====================================================================
  cricket_ipl: {
    id: 'cricket_ipl',
    name: 'IPL',
    displayName: 'Indian Premier League',
    category: 'team',
    oddsApiSport: 'cricket',
    oddsApiLeague: 'cricket_ipl',
    hasLiveOdds: true,
    hasPlayerProps: true,
    hasSGP: true,
    hasParlays: true,
    popularMarkets: ['Moneyline', 'Total Runs', 'Top Batsman', 'Top Bowler'],
    supportedMarkets: ['moneyline', 'total'],
    teamCount: 10,
    seasonActive: true,
    icon: '🏏'
  },
  cricket_mlc: {
    id: 'cricket_mlc',
    name: 'MLC',
    displayName: 'Major League Cricket',
    category: 'team',
    oddsApiSport: 'cricket',
    oddsApiLeague: 'cricket_mlc',
    hasLiveOdds: true,
    hasPlayerProps: true,
    hasSGP: true,
    hasParlays: true,
    popularMarkets: ['Moneyline', 'Total Runs', 'Top Batsman', 'Top Bowler'],
    supportedMarkets: ['moneyline', 'total'],
    teamCount: 6,
    seasonActive: true,
    icon: '🏏'
  },
  cricket_big_bash: {
    id: 'cricket_big_bash',
    name: 'BBL',
    displayName: 'Big Bash League',
    category: 'team',
    oddsApiSport: 'cricket',
    oddsApiLeague: 'cricket_big_bash',
    hasLiveOdds: true,
    hasPlayerProps: true,
    hasSGP: true,
    hasParlays: true,
    popularMarkets: ['Moneyline', 'Total Runs', 'Top Batsman', 'Top Bowler'],
    supportedMarkets: ['moneyline', 'total'],
    teamCount: 8,
    seasonActive: true,
    icon: '🏏'
  },
  cricket_cpl: {
    id: 'cricket_cpl',
    name: 'CPL',
    displayName: 'Caribbean Premier League',
    category: 'team',
    oddsApiSport: 'cricket',
    oddsApiLeague: 'cricket_caribbean_premier_league',
    hasLiveOdds: true,
    hasPlayerProps: true,
    hasSGP: true,
    hasParlays: true,
    popularMarkets: ['Moneyline', 'Total Runs', 'Top Batsman'],
    supportedMarkets: ['moneyline', 'total'],
    teamCount: 6,
    seasonActive: true,
    icon: '🏏'
  },
  cricket_the_hundred: {
    id: 'cricket_the_hundred',
    name: 'The Hundred',
    displayName: 'The Hundred',
    category: 'team',
    oddsApiSport: 'cricket',
    oddsApiLeague: 'cricket_the_hundred',
    hasLiveOdds: true,
    hasPlayerProps: true,
    hasSGP: true,
    hasParlays: true,
    popularMarkets: ['Moneyline', 'Total Runs', 'Top Batsman'],
    supportedMarkets: ['moneyline', 'total'],
    teamCount: 8,
    seasonActive: true,
    icon: '🏏'
  },
  cricket_psl: {
    id: 'cricket_psl',
    name: 'PSL',
    displayName: 'Pakistan Super League',
    category: 'team',
    oddsApiSport: 'cricket',
    oddsApiLeague: 'cricket_psl',
    hasLiveOdds: true,
    hasPlayerProps: true,
    hasSGP: true,
    hasParlays: true,
    popularMarkets: ['Moneyline', 'Total Runs', 'Top Batsman'],
    supportedMarkets: ['moneyline', 'total'],
    teamCount: 6,
    seasonActive: true,
    icon: '🏏'
  },
  cricket_sa20: {
    id: 'cricket_sa20',
    name: 'SA20',
    displayName: 'SA20 League',
    category: 'team',
    oddsApiSport: 'cricket',
    oddsApiLeague: 'cricket_sa20',
    hasLiveOdds: true,
    hasPlayerProps: false,
    hasSGP: false,
    hasParlays: true,
    popularMarkets: ['Moneyline', 'Total Runs'],
    supportedMarkets: ['moneyline', 'total'],
    teamCount: 6,
    seasonActive: true,
    icon: '🏏'
  },
  cricket_icc_odi: {
    id: 'cricket_icc_odi',
    name: 'ICC ODI',
    displayName: 'ICC One Day Internationals',
    category: 'team',
    oddsApiSport: 'cricket',
    oddsApiLeague: 'cricket_odi',
    hasLiveOdds: true,
    hasPlayerProps: true,
    hasSGP: true,
    hasParlays: true,
    popularMarkets: ['Moneyline', 'Total Runs', 'Top Batsman', 'Top Bowler'],
    supportedMarkets: ['moneyline', 'total'],
    teamCount: 0,
    seasonActive: true,
    icon: '🏏'
  },
  cricket_icc_t20: {
    id: 'cricket_icc_t20',
    name: 'ICC T20',
    displayName: 'ICC T20 World Cup',
    category: 'team',
    oddsApiSport: 'cricket',
    oddsApiLeague: 'cricket_icc_world_t20',
    hasLiveOdds: true,
    hasPlayerProps: true,
    hasSGP: true,
    hasParlays: true,
    popularMarkets: ['Moneyline', 'Total Runs', 'Top Batsman', 'Top Bowler'],
    supportedMarkets: ['moneyline', 'total'],
    teamCount: 0,
    seasonActive: true,
    icon: '🏏'
  },
  cricket_test: {
    id: 'cricket_test',
    name: 'Test Cricket',
    displayName: 'International Test Matches',
    category: 'team',
    oddsApiSport: 'cricket',
    oddsApiLeague: 'cricket_test_match',
    hasLiveOdds: true,
    hasPlayerProps: true,
    hasSGP: false,
    hasParlays: true,
    popularMarkets: ['Moneyline', 'Draw No Bet', 'Top Batsman', 'Top Bowler'],
    supportedMarkets: ['moneyline'],
    teamCount: 0,
    seasonActive: true,
    icon: '🏏'
  },
  cricket_icc_world_cup: {
    id: 'cricket_icc_world_cup',
    name: 'ICC World Cup',
    displayName: 'ICC Cricket World Cup',
    category: 'team',
    oddsApiSport: 'cricket',
    oddsApiLeague: 'cricket_icc_world_cup',
    hasLiveOdds: true,
    hasPlayerProps: true,
    hasSGP: true,
    hasParlays: true,
    popularMarkets: ['Moneyline', 'Total Runs', 'Top Batsman', 'Outright Winner'],
    supportedMarkets: ['moneyline', 'total'],
    teamCount: 0,
    seasonActive: false,
    icon: '🏏'
  },
  rugby_union: {
    id: 'rugby_union',
    name: 'Rugby Union',
    displayName: 'Rugby Union',
    category: 'team',
    oddsApiSport: 'rugby',
    oddsApiLeague: 'rugby_union',
    hasLiveOdds: true,
    hasPlayerProps: true,
    hasSGP: true,
    hasParlays: true,
    popularMarkets: ['Moneyline', 'Spread', 'Total Points'],
    supportedMarkets: ['moneyline', 'spread', 'total'],
    teamCount: 0,
    seasonActive: true,
    icon: '🏉'
  },
  rugby_league: {
    id: 'rugby_league',
    name: 'Rugby League',
    displayName: 'Rugby League (NRL)',
    category: 'team',
    oddsApiSport: 'rugby',
    oddsApiLeague: 'rugby_league',
    hasLiveOdds: true,
    hasPlayerProps: true,
    hasSGP: true,
    hasParlays: true,
    popularMarkets: ['Moneyline', 'Spread', 'Total Points'],
    supportedMarkets: ['moneyline', 'spread', 'total'],
    teamCount: 17,
    seasonActive: true,
    icon: '🏉'
  },
  aussie_rules: {
    id: 'aussie_rules',
    name: 'AFL',
    displayName: 'Australian Rules Football',
    category: 'team',
    oddsApiSport: 'aussierules',
    oddsApiLeague: 'afl',
    hasLiveOdds: true,
    hasPlayerProps: true,
    hasSGP: true,
    hasParlays: true,
    popularMarkets: ['Moneyline', 'Spread', 'Total Points'],
    supportedMarkets: ['moneyline', 'spread', 'total'],
    teamCount: 18,
    seasonActive: true,
    icon: '🏈'
  },
  volleyball: {
    id: 'volleyball',
    name: 'Volleyball',
    displayName: 'International Volleyball',
    category: 'team',
    oddsApiSport: 'volleyball',
    hasLiveOdds: true,
    hasPlayerProps: true,
    hasSGP: false,
    hasParlays: true,
    popularMarkets: ['Moneyline', 'Set Betting', 'Total Points', 'Player Props'],
    supportedMarkets: ['moneyline', 'total'],
    teamCount: 0,
    seasonActive: true,
    icon: '🏐'
  },
  handball: {
    id: 'handball',
    name: 'Handball',
    displayName: 'European Handball',
    category: 'team',
    oddsApiSport: 'handball',
    hasLiveOdds: true,
    hasPlayerProps: true,
    hasSGP: false,
    hasParlays: true,
    popularMarkets: ['Moneyline', 'Spread', 'Total Goals', 'Player Props'],
    supportedMarkets: ['moneyline', 'spread', 'total'],
    teamCount: 0,
    seasonActive: true,
    icon: '🤾'
  },
  cycling: {
    id: 'cycling',
    name: 'Cycling',
    displayName: 'Professional Cycling',
    category: 'individual',
    oddsApiSport: 'cycling',
    hasLiveOdds: true,
    hasPlayerProps: false,
    hasSGP: false,
    hasParlays: true,
    popularMarkets: ['To Win Stage', 'To Win Tour', 'Top 3'],
    supportedMarkets: ['outright'],
    teamCount: 0,
    seasonActive: true,
    icon: '🚴'
  },

  // =====================================================================
  // ESPORTS
  // =====================================================================
  esports_lol: {
    id: 'esports_lol',
    name: 'LoL',
    displayName: 'League of Legends',
    category: 'team',
    oddsApiSport: 'esports',
    oddsApiLeague: 'lol',
    hasLiveOdds: true,
    hasPlayerProps: true,
    hasSGP: true,
    hasParlays: true,
    popularMarkets: ['Moneyline', 'Map Betting', 'First Blood'],
    supportedMarkets: ['moneyline', 'spread', 'total'],
    teamCount: 0,
    seasonActive: true,
    icon: '🎮'
  },
  esports_csgo: {
    id: 'esports_csgo',
    name: 'CS:GO',
    displayName: 'Counter-Strike',
    category: 'team',
    oddsApiSport: 'esports',
    oddsApiLeague: 'csgo',
    hasLiveOdds: true,
    hasPlayerProps: true,
    hasSGP: true,
    hasParlays: true,
    popularMarkets: ['Moneyline', 'Map Betting', 'Total Rounds'],
    supportedMarkets: ['moneyline', 'spread', 'total'],
    teamCount: 0,
    seasonActive: true,
    icon: '🎮'
  },
  esports_dota2: {
    id: 'esports_dota2',
    name: 'Dota 2',
    displayName: 'Dota 2',
    category: 'team',
    oddsApiSport: 'esports',
    oddsApiLeague: 'dota2',
    hasLiveOdds: true,
    hasPlayerProps: true,
    hasSGP: true,
    hasParlays: true,
    popularMarkets: ['Moneyline', 'Map Betting', 'First Blood', 'Kill/Assist Combos'],
    supportedMarkets: ['moneyline', 'total'],
    teamCount: 0,
    seasonActive: true,
    icon: '🎮'
  },
  esports_valorant: {
    id: 'esports_valorant',
    name: 'Valorant',
    displayName: 'Valorant',
    category: 'team',
    oddsApiSport: 'esports',
    oddsApiLeague: 'valorant',
    hasLiveOdds: true,
    hasPlayerProps: true,
    hasSGP: true,
    hasParlays: true,
    popularMarkets: ['Moneyline', 'Map Betting', 'Total Rounds', 'Kill/Assist Combos'],
    supportedMarkets: ['moneyline', 'total'],
    teamCount: 0,
    seasonActive: true,
    icon: '🎮'
  }
};

// =====================================================================
// HELPER FUNCTIONS
// =====================================================================

export function getSportById(sportId: string): SportConfig | undefined {
  return SUPPORTED_SPORTS[sportId];
}

export function getSportsByCategory(category: SportConfig['category']): SportConfig[] {
  return Object.values(SUPPORTED_SPORTS).filter(sport => sport.category === category);
}

export function getSportsWithLiveOdds(): SportConfig[] {
  return Object.values(SUPPORTED_SPORTS).filter(sport => sport.hasLiveOdds);
}

export function getSportsWithPlayerProps(): SportConfig[] {
  return Object.values(SUPPORTED_SPORTS).filter(sport => sport.hasPlayerProps);
}

/**
 * Get all sports that support parlays.
 * This is the canonical source for parlay eligibility.
 */
export function getSportsWithParlays(): SportConfig[] {
  return Object.values(SUPPORTED_SPORTS).filter(sport => sport.hasParlays);
}

/**
 * Get all sports that support Same Game Parlays (SGP).
 */
export function getSportsWithSGP(): SportConfig[] {
  return Object.values(SUPPORTED_SPORTS).filter(sport => sport.hasSGP);
}

/**
 * Check if a sport is parlay-eligible.
 * Use this for validation in SmartSlip and TiltLab.
 *
 * @param sportId - The sport key (e.g., "basketball_nba")
 * @returns true if the sport supports parlays
 */
export function isParlayEligible(sportId: string): boolean {
  const sport = getSportById(sportId);
  return sport?.hasParlays ?? false;
}

/**
 * Check if a sport supports Same Game Parlays.
 *
 * @param sportId - The sport key
 * @returns true if the sport supports SGP
 */
export function isSGPEligible(sportId: string): boolean {
  const sport = getSportById(sportId);
  return sport?.hasSGP ?? false;
}

/**
 * Get all parlay-eligible sport IDs.
 * Useful for quick eligibility checks.
 */
export function getParlayEligibleSportIds(): string[] {
  return Object.keys(SUPPORTED_SPORTS).filter(id => SUPPORTED_SPORTS[id].hasParlays);
}

/**
 * Get all SGP-eligible sport IDs.
 */
export function getSGPEligibleSportIds(): string[] {
  return Object.keys(SUPPORTED_SPORTS).filter(id => SUPPORTED_SPORTS[id].hasSGP);
}

export function getActiveSports(): SportConfig[] {
  return Object.values(SUPPORTED_SPORTS).filter(sport =>
    sport.seasonActive !== false // Include year-round and seasonal sports
  );
}

export function getPopularSports(): SportConfig[] {
  // Return all supported sports for maximum coverage
  return Object.values(SUPPORTED_SPORTS);
}

export interface SportGroup {
  label: string
  icon: string
  sports: SportConfig[]
}

/**
 * Groups all supported sports by their top-level sport category.
 * Used for the grouped dropdown in the SmartSlip picker UI.
 */
export function getSportsGrouped(): SportGroup[] {
  const groupDefs: { prefix: string; label: string; icon: string }[] = [
    { prefix: 'basketball', label: 'Basketball', icon: '🏀' },
    { prefix: 'americanfootball', label: 'Football', icon: '🏈' },
    { prefix: 'baseball', label: 'Baseball', icon: '⚾' },
    { prefix: 'icehockey', label: 'Hockey', icon: '🏒' },
    { prefix: 'soccer', label: 'Soccer', icon: '⚽' },
    { prefix: 'cricket', label: 'Cricket', icon: '🏏' },
    { prefix: 'tennis', label: 'Tennis', icon: '🎾' },
    { prefix: 'golf', label: 'Golf', icon: '⛳' },
    { prefix: 'motorsports', label: 'Motorsports', icon: '🏎️' },
    { prefix: 'rugby', label: 'Rugby', icon: '🏉' },
    { prefix: 'esports', label: 'Esports', icon: '🎮' },
  ]

  const allSports = Object.values(SUPPORTED_SPORTS)
  const used = new Set<string>()
  const groups: SportGroup[] = []

  for (const def of groupDefs) {
    const matching = allSports.filter(s => s.id.startsWith(def.prefix + '_') || s.id === def.prefix)
    if (matching.length > 0) {
      groups.push({ label: def.label, icon: def.icon, sports: matching })
      matching.forEach(s => used.add(s.id))
    }
  }

  // Collect remaining sports into "Other"
  const remaining = allSports.filter(s => !used.has(s.id))
  if (remaining.length > 0) {
    groups.push({ label: 'Other', icon: '🏆', sports: remaining })
  }

  return groups
}

export function searchSports(query: string): SportConfig[] {
  const lowerQuery = query.toLowerCase();
  return Object.values(SUPPORTED_SPORTS).filter(sport =>
    sport.name.toLowerCase().includes(lowerQuery) ||
    sport.displayName.toLowerCase().includes(lowerQuery) ||
    sport.category.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Determines if a sport is currently in season based on the current date.
 * Uses typical season schedules for major sports leagues.
 *
 * @param sportId - The sport key (e.g., "basketball_nba")
 * @returns true if the sport is currently in season
 */
export function isSportInSeason(sportId: string): boolean {
  const sport = getSportById(sportId);
  if (!sport) return false;

  const now = new Date();
  const month = now.getMonth(); // 0-indexed (0 = January, 11 = December)

  // Define season ranges for each sport
  // Format: [startMonth, endMonth] (inclusive, 0-indexed)
  // For sports that span year-end, we check if month is >= start OR <= end
  const seasonRanges: Record<string, { start: number; end: number; spansYearEnd: boolean }> = {
    // NFL: September (8) - February (1) - includes playoffs/Super Bowl
    'americanfootball_nfl': { start: 8, end: 1, spansYearEnd: true },

    // NBA: October (9) - June (5)
    'basketball_nba': { start: 9, end: 5, spansYearEnd: true },

    // MLB: March (2) - November (10) - includes playoffs/World Series
    'baseball_mlb': { start: 2, end: 10, spansYearEnd: false },

    // NHL: October (9) - June (5)
    'icehockey_nhl': { start: 9, end: 5, spansYearEnd: true },

    // College Football: August (7) - January (0) - includes bowl games
    'americanfootball_ncaaf': { start: 7, end: 0, spansYearEnd: true },

    // College Basketball: November (10) - April (3) - includes March Madness
    'basketball_ncaab': { start: 10, end: 3, spansYearEnd: true },

    // WNBA: May (4) - October (9)
    'basketball_wnba': { start: 4, end: 9, spansYearEnd: false },

    // CFL: June (5) - November (10)
    'americanfootball_cfl': { start: 5, end: 10, spansYearEnd: false },

    // XFL/UFL: February (1) - May (4)
    'americanfootball_xfl': { start: 1, end: 4, spansYearEnd: false },

    // European Soccer (EPL, La Liga, Serie A, Bundesliga, Ligue 1): August (7) - May (4)
    'soccer_epl': { start: 7, end: 4, spansYearEnd: true },
    'soccer_la_liga': { start: 7, end: 4, spansYearEnd: true },
    'soccer_serie_a': { start: 7, end: 4, spansYearEnd: true },
    'soccer_bundesliga': { start: 7, end: 4, spansYearEnd: true },
    'soccer_ligue_1': { start: 7, end: 4, spansYearEnd: true },

    // MLS: February (1) - November (10)
    'soccer_mls': { start: 1, end: 10, spansYearEnd: false },

    // UEFA Champions League: September (8) - June (5)
    'soccer_champions_league': { start: 8, end: 5, spansYearEnd: true },

    // F1: March (2) - December (11)
    'motorsports_f1': { start: 2, end: 11, spansYearEnd: false },

    // NASCAR: February (1) - November (10)
    'motorsports_nascar': { start: 1, end: 10, spansYearEnd: false },

    // IndyCar: March (2) - September (8)
    'motorsports_indycar': { start: 2, end: 8, spansYearEnd: false },

    // AFL (Aussie Rules): March (2) - September (8)
    'aussie_rules': { start: 2, end: 8, spansYearEnd: false },

    // Rugby League (NRL): March (2) - October (9)
    'rugby_league': { start: 2, end: 9, spansYearEnd: false },

    // Cricket Leagues
    // IPL: March (2) - May (4)
    'cricket_ipl': { start: 2, end: 4, spansYearEnd: false },
    // MLC: July (6) - August (7)
    'cricket_mlc': { start: 6, end: 7, spansYearEnd: false },
    // Big Bash League: December (11) - February (1)
    'cricket_big_bash': { start: 11, end: 1, spansYearEnd: true },
    // CPL: August (7) - October (9)
    'cricket_cpl': { start: 7, end: 9, spansYearEnd: false },
    // The Hundred: July (6) - August (7)
    'cricket_the_hundred': { start: 6, end: 7, spansYearEnd: false },
    // PSL: February (1) - March (2)
    'cricket_psl': { start: 1, end: 2, spansYearEnd: false },
    // SA20: January (0) - February (1)
    'cricket_sa20': { start: 0, end: 1, spansYearEnd: false },
  };

  const range = seasonRanges[sportId];

  if (range) {
    if (range.spansYearEnd) {
      // Season spans year-end (e.g., NFL: Sep-Feb)
      // In season if month >= start OR month <= end
      return month >= range.start || month <= range.end;
    } else {
      // Season within same year (e.g., MLB: Mar-Oct)
      return month >= range.start && month <= range.end;
    }
  }

  // For sports not in the list, assume year-round:
  // UFC, Boxing, Tennis (ATP, WTA, ITF), Golf (PGA, LPGA, DP World),
  // Darts, Table Tennis, Cricket, Rugby Union, Volleyball, Handball, Cycling, Esports
  return true;
}

// =====================================================================
// TILTLAB SPORT MAPPING (display name → sport key)
// =====================================================================
export const TILTLAB_SPORT_MAPPING: Record<string, string> = {
  // Big 4
  'NFL': 'americanfootball_nfl',
  'NBA': 'basketball_nba',
  'MLB': 'baseball_mlb',
  'NHL': 'icehockey_nhl',
  // College
  'College Football': 'americanfootball_ncaaf',
  'NCAAF': 'americanfootball_ncaaf',
  'College Basketball': 'basketball_ncaab',
  'NCAAB': 'basketball_ncaab',
  // Additional US
  'WNBA': 'basketball_wnba',
  'CFL': 'americanfootball_cfl',
  'XFL': 'americanfootball_xfl',
  'UFL': 'americanfootball_xfl',
  // Soccer
  'Soccer': 'soccer_epl',
  'EPL': 'soccer_epl',
  'Premier League': 'soccer_epl',
  'MLS': 'soccer_mls',
  'UCL': 'soccer_champions_league',
  'Champions League': 'soccer_champions_league',
  'La Liga': 'soccer_la_liga',
  'Serie A': 'soccer_serie_a',
  'Bundesliga': 'soccer_bundesliga',
  'Ligue 1': 'soccer_ligue_1',
  // Combat
  'UFC': 'mma_ufc',
  'MMA': 'mma_ufc',
  'Boxing': 'boxing',
  // Tennis
  'Tennis': 'tennis_atp',
  'ATP': 'tennis_atp',
  'WTA': 'tennis_wta',
  'ITF': 'tennis_itf',
  // Golf
  'Golf': 'golf_pga',
  'PGA': 'golf_pga',
  'LPGA': 'golf_lpga',
  'DP World': 'golf_dp_world',
  // Motorsports
  'F1': 'motorsports_f1',
  'Formula 1': 'motorsports_f1',
  'NASCAR': 'motorsports_nascar',
  'IndyCar': 'motorsports_indycar',
  // Niche
  'Darts': 'darts_pdc',
  'Table Tennis': 'table_tennis',
  'Ping Pong': 'table_tennis',
  'Cricket': 'cricket_ipl',
  'IPL': 'cricket_ipl',
  'Indian Premier League': 'cricket_ipl',
  'MLC': 'cricket_mlc',
  'Major League Cricket': 'cricket_mlc',
  'BBL': 'cricket_big_bash',
  'Big Bash': 'cricket_big_bash',
  'Big Bash League': 'cricket_big_bash',
  'CPL': 'cricket_cpl',
  'Caribbean Premier League': 'cricket_cpl',
  'The Hundred': 'cricket_the_hundred',
  'PSL': 'cricket_psl',
  'Pakistan Super League': 'cricket_psl',
  'SA20': 'cricket_sa20',
  'ICC ODI': 'cricket_icc_odi',
  'ODI': 'cricket_icc_odi',
  'ICC T20': 'cricket_icc_t20',
  'T20 World Cup': 'cricket_icc_t20',
  'Test Cricket': 'cricket_test',
  'Test Match': 'cricket_test',
  'ICC World Cup': 'cricket_icc_world_cup',
  'Rugby': 'rugby_union',
  'Rugby Union': 'rugby_union',
  'Rugby League': 'rugby_league',
  'NRL': 'rugby_league',
  'AFL': 'aussie_rules',
  'Aussie Rules': 'aussie_rules',
  'Volleyball': 'volleyball',
  'Handball': 'handball',
  'Cycling': 'cycling',
  // Esports
  'LoL': 'esports_lol',
  'League of Legends': 'esports_lol',
  'CS:GO': 'esports_csgo',
  'Counter-Strike': 'esports_csgo',
  'CS2': 'esports_csgo',
  'Dota 2': 'esports_dota2',
  'Dota': 'esports_dota2',
  'Valorant': 'esports_valorant',

  // ----------------------------------------------------------------------
  // API KEY ALIASES (Mappings from TheOddsAPI/SportsDB keys to internal IDs)
  // ----------------------------------------------------------------------
  // Cricket
  'cricket_odi': 'cricket_icc_odi',
  'cricket_icc_world_t20': 'cricket_icc_t20',
  'cricket_test_match': 'cricket_test',
  // Soccer
  'soccer_usa_mls': 'soccer_mls',
  'soccer_uefa_champs_league': 'soccer_champions_league',
  'soccer_spain_la_liga': 'soccer_la_liga',
  'soccer_italy_serie_a': 'soccer_serie_a',
  'soccer_germany_bundesliga': 'soccer_bundesliga',
  'soccer_france_ligue_one': 'soccer_ligue_1',
  // Combat
  'mma_mixed_martial_arts': 'mma_ufc',
};

/**
 * Map a display name or abbreviation to a SportConfig.
 * Used by TiltLab and other components that receive user-facing sport names.
 */
export function mapTiltLabSportToConfig(sportName: string): SportConfig | undefined {
  // Direct lookup in mapping
  const mappedId = TILTLAB_SPORT_MAPPING[sportName];
  if (mappedId) {
    return SUPPORTED_SPORTS[mappedId];
  }

  // Try case-insensitive lookup
  const lowerName = sportName.toLowerCase();
  const mappedKey = Object.keys(TILTLAB_SPORT_MAPPING).find(
    key => key.toLowerCase() === lowerName
  );
  if (mappedKey) {
    return SUPPORTED_SPORTS[TILTLAB_SPORT_MAPPING[mappedKey]];
  }

  // Fallback: search by name or ID
  return searchSports(sportName)[0] || getSportById(sportName);
}

/**
 * Normalize any sport input to a valid sport key.
 * Handles abbreviations, display names, and existing keys.
 */
export function normalizeSportKey(input?: string): string {
  if (!input) return 'basketball_nba';

  // Already a valid key?
  if (SUPPORTED_SPORTS[input]) return input;

  // Check TiltLab mapping (includes API aliases)
  const mapped = TILTLAB_SPORT_MAPPING[input];
  if (mapped) return mapped;

  // NEW: Check by oddsApiLeague
  const leagueMatch = Object.values(SUPPORTED_SPORTS).find(
    s => s.oddsApiLeague === input || (s.oddsApiSport && `${s.oddsApiSport}_${s.oddsApiLeague}` === input)
  );
  if (leagueMatch) return leagueMatch.id;

  // Try case-insensitive mapping
  const lowerInput = input.toLowerCase();
  const mappedKey = Object.keys(TILTLAB_SPORT_MAPPING).find(
    key => key.toLowerCase() === lowerInput
  );
  if (mappedKey) return TILTLAB_SPORT_MAPPING[mappedKey];

  // Try partial match
  const partialMatch = Object.keys(SUPPORTED_SPORTS).find(
    key => key.toLowerCase().includes(lowerInput) ||
      SUPPORTED_SPORTS[key].name.toLowerCase().includes(lowerInput)
  );
  if (partialMatch) return partialMatch;

  return input; // Return as-is if no match
}

// =====================================================================
// MATCH FORMAT ROUTING
// =====================================================================

/**
 * Canonical FormatType for built-in sports that are NOT TEAM_VS_TEAM.
 * All unlisted sports default to TEAM_VS_TEAM.
 */
const FORMAT_BY_SPORT: Partial<Record<string, FormatType>> = {
  // 1-on-1 individual matchups
  mma_ufc:         'PLAYER_VS_PLAYER',
  boxing:          'PLAYER_VS_PLAYER',
  tennis_atp:      'PLAYER_VS_PLAYER',
  tennis_wta:      'PLAYER_VS_PLAYER',
  tennis_itf:      'PLAYER_VS_PLAYER',
  darts_pdc:       'PLAYER_VS_PLAYER',
  table_tennis:    'PLAYER_VS_PLAYER',
  // Whole-field leaderboard events (golf stroke play, motorsports, cycling)
  golf_pga:             'FIELD_LEADERBOARD',
  golf_lpga:            'FIELD_LEADERBOARD',
  golf_dp_world:        'FIELD_LEADERBOARD',
  motorsports_f1:       'FIELD_LEADERBOARD',
  motorsports_nascar:   'FIELD_LEADERBOARD',
  motorsports_indycar:  'FIELD_LEADERBOARD',
  cycling:              'FIELD_LEADERBOARD',
  // Bo3/Bo5 esports map series
  esports_lol:      'ESPORTS_MAP_SERIES',
  esports_csgo:     'ESPORTS_MAP_SERIES',
  esports_dota2:    'ESPORTS_MAP_SERIES',
  esports_valorant: 'ESPORTS_MAP_SERIES',
}

/**
 * Returns the matchup FormatType for a given sport ID.
 * Checks FORMAT_BY_SPORT first, then the SportConfig.matchFormat override,
 * and falls back to TEAM_VS_TEAM for any standard team sport.
 */
export function getMatchFormat(sportId: string): FormatType {
  return FORMAT_BY_SPORT[sportId] ?? SUPPORTED_SPORTS[sportId]?.matchFormat ?? 'TEAM_VS_TEAM'
}

/**
 * Infer match format from a raw matchup string and an optional sport ID.
 * Sport config is authoritative; string-pattern heuristic used as fallback.
 *
 * @example
 *   detectMatchFormat('Djokovic vs Nadal', 'tennis_atp') → 'PLAYER_VS_PLAYER'
 *   detectMatchFormat('', 'golf_pga') → 'FIELD_LEADERBOARD'
 *   detectMatchFormat('Lakers vs Celtics', 'basketball_nba') → 'TEAM_VS_TEAM'
 */
export function detectMatchFormat(matchupStr: string, sportId?: string): FormatType {
  if (sportId) {
    const fmt = getMatchFormat(normalizeSportKey(sportId))
    if (fmt !== 'TEAM_VS_TEAM') return fmt
  }
  // String-pattern fallback: no separator → likely a field/solo event
  if (!matchupStr || (!matchupStr.includes(' @ ') && !/\bvs\.?\b/i.test(matchupStr))) {
    return 'FIELD_LEADERBOARD'
  }
  return 'TEAM_VS_TEAM'
}

/**
 * Convert a sport key (e.g., "americanfootball_nfl") to its display name (e.g., "NFL").
 * Falls back to the input if no match is found.
 */
export function getSportDisplayName(sportKey?: string): string {
  if (!sportKey) return 'Unknown';

  // Direct lookup in SUPPORTED_SPORTS
  const sport = SUPPORTED_SPORTS[sportKey];
  if (sport) return sport.name;

  // Try normalizing first then looking up
  const normalizedKey = normalizeSportKey(sportKey);
  const normalizedSport = SUPPORTED_SPORTS[normalizedKey];
  if (normalizedSport) return normalizedSport.name;

  // If it looks like a database key, try to extract a readable name
  // e.g., "americanfootball_nfl" -> "NFL"
  if (sportKey.includes('_')) {
    const parts = sportKey.split('_');
    const lastPart = parts[parts.length - 1].toUpperCase();
    // Check if the last part is a known abbreviation
    if (['NFL', 'NBA', 'MLB', 'NHL', 'NCAAB', 'NCAAF', 'MLS', 'EPL', 'UFC'].includes(lastPart)) {
      return lastPart;
    }
  }

  return sportKey; // Return as-is if no match
}

// =====================================================================
// SPORT AVAILABILITY STATUS
// =====================================================================

export type SportAvailabilityStatus = 'available' | 'in_season_no_data' | 'off_season';

export interface SportAvailabilityInfo {
  status: SportAvailabilityStatus;
  inSeason: boolean;
  hasData: boolean;
  message: string;
}

/**
 * Get the availability status for a sport.
 * Combines season check with data availability.
 *
 * @param sportId - The sport key
 * @param sportsWithData - Set of sport IDs that have live data available
 * @param dynamicSportsInSeason - Optional set of sport IDs that are in season (from API/database).
 *                                If provided and non-empty, uses this instead of hardcoded dates.
 * @returns SportAvailabilityInfo with status and details
 */
export function getSportAvailabilityStatus(
  sportId: string,
  sportsWithData: Set<string>,
  dynamicSportsInSeason?: Set<string>
): SportAvailabilityInfo {
  const hasData = sportsWithData.has(sportId);

  // Use dynamic season data if available, otherwise fall back to hardcoded
  const inSeason = dynamicSportsInSeason && dynamicSportsInSeason.size > 0
    ? dynamicSportsInSeason.has(sportId)
    : isSportInSeason(sportId);

  if (hasData) {
    return {
      status: 'available',
      inSeason: true,
      hasData: true,
      message: 'Live odds available'
    };
  }

  if (inSeason) {
    return {
      status: 'in_season_no_data',
      inSeason: true,
      hasData: false,
      message: 'In season - no games scheduled'
    };
  }

  return {
    status: 'off_season',
    inSeason: false,
    hasData: false,
    message: 'Off season'
  };
}

/**
 * Get CSS classes for the availability status dot.
 * Green = available, Yellow = in season no data, Red = off season
 */
export function getAvailabilityDotClasses(status: SportAvailabilityStatus): string {
  switch (status) {
    case 'available':
      return 'bg-green-500';
    case 'in_season_no_data':
      return 'bg-yellow-500';
    case 'off_season':
      return 'bg-red-500';
  }
}

/**
 * Get CSS classes for the availability status text.
 */
export function getAvailabilityTextClasses(status: SportAvailabilityStatus): string {
  switch (status) {
    case 'available':
      return 'text-green-600 dark:text-green-400';
    case 'in_season_no_data':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'off_season':
      return 'text-red-500 dark:text-red-400 opacity-70';
  }
}

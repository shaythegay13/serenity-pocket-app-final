/**
 * Dynamic Sports Configuration System
 * Centralized sports definitions for all AI systems
 */

export interface SportConfig {
  id: string;
  name: string;
  displayName: string;
  category: 'team' | 'individual' | 'combat';
  oddsApiSport: string;
  oddsApiLeague?: string;
  hasLiveOdds: boolean;
  hasPlayerProps: boolean;
  popularMarkets: string[];
  teamCount?: number;
  seasonActive?: boolean;
  icon?: string;
}

export const SUPPORTED_SPORTS: Record<string, SportConfig> = {
  // Major US Sports (Current)
  basketball_nba: {
    id: 'basketball_nba',
    name: 'NBA',
    displayName: 'NBA Basketball',
    category: 'team',
    oddsApiSport: 'basketball',
    oddsApiLeague: 'nba',
    hasLiveOdds: true,
    hasPlayerProps: true,
    popularMarkets: ['Moneyline', 'Spread', 'Over/Under', 'Player Props'],
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
    popularMarkets: ['Moneyline', 'Spread', 'Over/Under', 'Player Props'],
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
    popularMarkets: ['Moneyline', 'Run Line', 'Over/Under', 'Player Props'],
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
    popularMarkets: ['Moneyline', 'Puck Line', 'Over/Under', 'Player Props'],
    teamCount: 32,
    seasonActive: true,
    icon: '🏒'
  },

  // College Sports
  basketball_ncaab: {
    id: 'basketball_ncaab',
    name: 'NCAAB',
    displayName: 'College Basketball',
    category: 'team',
    oddsApiSport: 'basketball',
    oddsApiLeague: 'ncaab',
    hasLiveOdds: true,
    hasPlayerProps: false,
    popularMarkets: ['Moneyline', 'Spread', 'Over/Under'],
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
    hasPlayerProps: false,
    popularMarkets: ['Moneyline', 'Spread', 'Over/Under'],
    teamCount: 130,
    seasonActive: true,
    icon: '🎓'
  },

  // Soccer
  soccer_epl: {
    id: 'soccer_epl',
    name: 'EPL',
    displayName: 'English Premier League',
    category: 'team',
    oddsApiSport: 'soccer',
    oddsApiLeague: 'epl',
    hasLiveOdds: true,
    hasPlayerProps: true,
    popularMarkets: ['Moneyline', 'Spread', 'Over/Under', 'Both Teams to Score'],
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
    oddsApiLeague: 'mls',
    hasLiveOdds: true,
    hasPlayerProps: false,
    popularMarkets: ['Moneyline', 'Spread', 'Over/Under'],
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
    oddsApiLeague: 'uefa_champions_league',
    hasLiveOdds: true,
    hasPlayerProps: true,
    popularMarkets: ['Moneyline', 'Spread', 'Over/Under'],
    teamCount: 32,
    seasonActive: false, // Tournament-based
    icon: '🏆'
  },

  // Combat Sports
  mma_ufc: {
    id: 'mma_ufc',
    name: 'UFC',
    displayName: 'UFC/MMA',
    category: 'combat',
    oddsApiSport: 'mma',
    oddsApiLeague: 'ufc',
    hasLiveOdds: true,
    hasPlayerProps: true,
    popularMarkets: ['Moneyline', 'Method of Victory', 'Round Betting'],
    teamCount: 0, // Individual fighters
    seasonActive: true, // Events year-round
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
    popularMarkets: ['Moneyline', 'Method of Victory', 'Round Betting'],
    teamCount: 0,
    seasonActive: true,
    icon: '🥊'
  },

  // International Sports
  tennis_atp: {
    id: 'tennis_atp',
    name: 'ATP',
    displayName: 'ATP Tennis',
    category: 'individual',
    oddsApiSport: 'tennis',
    oddsApiLeague: 'atp',
    hasLiveOdds: true,
    hasPlayerProps: true,
    popularMarkets: ['Moneyline', 'Set Betting', 'Total Games'],
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
    popularMarkets: ['Moneyline', 'Set Betting', 'Total Games'],
    teamCount: 0,
    seasonActive: true,
    icon: '🎾'
  },
  golf_pga: {
    id: 'golf_pga',
    name: 'PGA',
    displayName: 'PGA Tour Golf',
    category: 'individual',
    oddsApiSport: 'golf',
    oddsApiLeague: 'pga',
    hasLiveOdds: true,
    hasPlayerProps: true,
    popularMarkets: ['To Win Tournament', 'Top 5/10/20', 'Head-to-Head'],
    teamCount: 0,
    seasonActive: true,
    icon: '⛳'
  },

  // Motorsports
  motorsports_f1: {
    id: 'motorsports_f1',
    name: 'F1',
    displayName: 'Formula 1',
    category: 'individual',
    oddsApiSport: 'motorsports',
    oddsApiLeague: 'f1',
    hasLiveOdds: true,
    hasPlayerProps: true,
    popularMarkets: ['To Win Race', 'Podium Finish', 'Fastest Lap'],
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
    popularMarkets: ['To Win Race', 'Top 10 Finish', 'Head-to-Head'],
    teamCount: 40,
    seasonActive: true,
    icon: '🏁'
  },

  // Emerging/Other Sports
  esports_lol: {
    id: 'esports_lol',
    name: 'LoL',
    displayName: 'League of Legends',
    category: 'team',
    oddsApiSport: 'esports',
    oddsApiLeague: 'lol',
    hasLiveOdds: true,
    hasPlayerProps: true,
    popularMarkets: ['Moneyline', 'Map Betting', 'First Blood'],
    teamCount: 0, // Varies by tournament
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
    popularMarkets: ['Moneyline', 'Map Betting', 'Total Rounds'],
    teamCount: 0,
    seasonActive: true,
    icon: '🎮'
  }
};

// Helper functions
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

export function getActiveSports(): SportConfig[] {
  return Object.values(SUPPORTED_SPORTS).filter(sport => 
    sport.seasonActive !== false // Include year-round and seasonal sports
  );
}

export function getPopularSports(): SportConfig[] {
  // Return all supported sports for maximum coverage
  return Object.values(SUPPORTED_SPORTS);
}

export function searchSports(query: string): SportConfig[] {
  const lowerQuery = query.toLowerCase();
  return Object.values(SUPPORTED_SPORTS).filter(sport =>
    sport.name.toLowerCase().includes(lowerQuery) ||
    sport.displayName.toLowerCase().includes(lowerQuery) ||
    sport.category.toLowerCase().includes(lowerQuery)
  );
}

// TiltLab-specific sport mapping
export const TILTLAB_SPORT_MAPPING: Record<string, string> = {
  'NFL': 'americanfootball_nfl',
  'NBA': 'basketball_nba',
  'MLB': 'baseball_mlb',
  'NHL': 'icehockey_nhl',
  'College Football': 'americanfootball_ncaaf',
  'College Basketball': 'basketball_ncaab',
  'Soccer': 'soccer_epl', // Default to EPL
  'UFC': 'mma_ufc',
  'Tennis': 'tennis_atp', // Default to ATP
  'Golf': 'golf_pga',
  'F1': 'motorsports_f1',
  'NASCAR': 'motorsports_nascar',
  'LoL': 'esports_lol',
  'CS:GO': 'esports_csgo',
  'Boxing': 'boxing'
};

export function mapTiltLabSportToConfig(sportName: string): SportConfig | undefined {
  const mappedId = TILTLAB_SPORT_MAPPING[sportName];
  if (mappedId) {
    return SUPPORTED_SPORTS[mappedId];
  }
  
  // Fallback: search by name
  return searchSports(sportName)[0];
}

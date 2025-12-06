// src/data/dashboard-config.ts

export type SportKey = 'nfl' | 'nba' | 'mlb' | 'nhl';

export interface DashboardModule {
  id: string;
  title: string;
  description: string;
  iconName: string;
  path: string;
  category: 'Live' | 'Analysis' | 'History' | 'Betting';
  badge?: string;
}

export const DASHBOARD_CONFIG: Record<SportKey, DashboardModule[]> = {
  nfl: [
    {
      id: 'live-dashboard',
      title: 'Live Dashboard',
      description: 'Real-time scores, play-by-play, and in-game win probability for all NFL games.',
      iconName: 'Radio',
      path: '/nfl/live',
      category: 'Live',
      badge: 'LIVE'
    },
    {
      id: 'player-matchups',
      title: 'Player Matchups',
      description: 'Head-to-head comparison matrix for key player battles including WR vs CB and OL vs DL.',
      iconName: 'Swords',
      path: '/nfl/player-matchups',
      category: 'Analysis'
    },
    {
      id: 'red-zone',
      title: 'Red Zone Efficiency',
      description: 'TD conversion rates, play breakdowns, and success probability inside the 20-yard line.',
      iconName: 'Target',
      path: '/nfl/redzone',
      category: 'Analysis',
      badge: 'New'
    },
    {
      id: 'odds-comparison',
      title: 'Odds Comparison',
      description: 'Live lines from DraftKings, FanDuel, and MGM for spreads, totals, and moneylines.',
      iconName: 'DollarSign',
      path: '/nfl/odds',
      category: 'Betting'
    },
    {
      id: 'team-analytics',
      title: 'Team Analytics',
      description: 'DVOA, EPA/play, success rates, and other advanced team efficiency metrics.',
      iconName: 'Shield',
      path: '/nfl/teams',
      category: 'Analysis'
    },
    {
      id: 'line-movement',
      title: 'Line Movement',
      description: 'Track spread and total changes from opening to current across sportsbooks.',
      iconName: 'TrendingUp',
      path: '/nfl/line-movement',
      category: 'Betting'
    },
    {
      id: 'injury-tracker',
      title: 'Injury Tracker',
      description: 'Real-time injury status, practice participation, and roster availability.',
      iconName: 'Stethoscope',
      path: '/nfl/injuries',
      category: 'Live'
    },
    {
      id: 'game-archive',
      title: 'Game Archive',
      description: 'Historical box scores, drive charts, and season results for all NFL games.',
      iconName: 'Archive',
      path: '/nfl/archive',
      category: 'History'
    },
    {
      id: 'public-betting',
      title: 'Public Betting',
      description: 'See where the money and tickets are flowing for spreads, totals, and props.',
      iconName: 'PieChart',
      path: '/nfl/public',
      category: 'Betting'
    },
    {
      id: 'matchup-matrix',
      title: 'Matchup Matrix',
      description: 'Team vs Team historical records, trends, and head-to-head statistical edges.',
      iconName: 'GitCompare',
      path: '/nfl/matchups',
      category: 'History'
    }
  ],
  nba: [
    {
      id: 'live-dashboard',
      title: 'Live Dashboard',
      description: 'Real-time scores, play-by-play, and win probability for all NBA games.',
      iconName: 'Radio',
      path: '/nba/live',
      category: 'Live',
      badge: 'LIVE'
    },
    {
      id: 'shot-quality',
      title: 'Shot Quality',
      description: 'Expected points per shot based on defender distance, shot location, and contest level.',
      iconName: 'Crosshair',
      path: '/nba/shot-quality',
      category: 'Analysis',
      badge: 'New'
    },
    {
      id: 'player-matchups',
      title: 'Player Matchups',
      description: 'Head-to-head comparisons including defensive assignments and efficiency splits.',
      iconName: 'Users',
      path: '/nba/player-matchups',
      category: 'Analysis'
    },
    {
      id: 'odds-comparison',
      title: 'Odds Comparison',
      description: 'Live lines from major sportsbooks for spreads, totals, and player props.',
      iconName: 'DollarSign',
      path: '/nba/odds',
      category: 'Betting'
    },
    {
      id: 'team-analytics',
      title: 'Team Analytics',
      description: 'ORTG, DRTG, pace, four factors, and other advanced team metrics.',
      iconName: 'Shield',
      path: '/nba/teams',
      category: 'Analysis'
    },
    {
      id: 'lineup-impact',
      title: 'Lineup Impact',
      description: 'On/off net ratings and lineup efficiency stats for all combinations.',
      iconName: 'Activity',
      path: '/nba/lineups',
      category: 'Analysis'
    },
    {
      id: 'injury-tracker',
      title: 'Injury Tracker',
      description: 'Real-time injury updates, probable/questionable designations, and rotations.',
      iconName: 'Stethoscope',
      path: '/nba/injuries',
      category: 'Live'
    },
    {
      id: 'game-archive',
      title: 'Game Archive',
      description: 'Historical box scores, shot charts, and season results for all NBA games.',
      iconName: 'Archive',
      path: '/nba/archive',
      category: 'History'
    },
    {
      id: 'public-betting',
      title: 'Public Betting',
      description: 'Betting splits showing where public money is flowing for NBA markets.',
      iconName: 'PieChart',
      path: '/nba/public',
      category: 'Betting'
    },
    {
      id: 'performance-showcase',
      title: 'Performance Showcase',
      description: 'Recent game logs, advanced stat trends, and player efficiency ratings.',
      iconName: 'BarChart3',
      path: '/nba/performance',
      category: 'Analysis'
    }
  ],
  mlb: [
    {
      id: 'live-dashboard',
      title: 'Live Dashboard',
      description: 'Real-time scores, play-by-play, and win probability for all MLB games.',
      iconName: 'Radio',
      path: '/mlb/live',
      category: 'Live',
      badge: 'LIVE'
    },
    {
      id: 'pitcher-batter',
      title: 'Pitcher vs Batter',
      description: 'Historical matchups, splits, and expected stats for all pitcher-batter combinations.',
      iconName: 'Swords',
      path: '/mlb/pitcher-batter',
      category: 'Analysis',
      badge: 'Premium'
    },
    {
      id: 'odds-comparison',
      title: 'Odds Comparison',
      description: 'Live run lines, totals, and moneylines across major sportsbooks.',
      iconName: 'DollarSign',
      path: '/mlb/odds',
      category: 'Betting'
    },
    {
      id: 'team-analytics',
      title: 'Team Analytics',
      description: 'wOBA, FIP, bullpen metrics, and other advanced team statistics.',
      iconName: 'Shield',
      path: '/mlb/teams',
      category: 'Analysis'
    },
    {
      id: 'line-movement',
      title: 'Line Movement',
      description: 'Track run line and total movements from opening to first pitch.',
      iconName: 'TrendingUp',
      path: '/mlb/line-movement',
      category: 'Betting'
    },
    {
      id: 'injury-tracker',
      title: 'Injury Tracker',
      description: 'Starting pitcher updates, IL stints, and lineup availability.',
      iconName: 'Stethoscope',
      path: '/mlb/injuries',
      category: 'Live'
    },
    {
      id: 'game-archive',
      title: 'Game Archive',
      description: 'Historical box scores, play logs, and season results for all MLB games.',
      iconName: 'Archive',
      path: '/mlb/archive',
      category: 'History'
    },
    {
      id: 'public-betting',
      title: 'Public Betting',
      description: 'Betting splits showing public money distribution on MLB markets.',
      iconName: 'PieChart',
      path: '/mlb/public',
      category: 'Betting'
    },
    {
      id: 'park-factors',
      title: 'Park Factors',
      description: 'Stadium-specific run environments and hitter/pitcher park adjustments.',
      iconName: 'ParkingCircle',
      path: '/mlb/parks',
      category: 'Analysis'
    },
    {
      id: 'upcoming-slate',
      title: 'Upcoming Slate',
      description: 'Probable pitchers, weather reports, and betting previews for upcoming games.',
      iconName: 'Calendar',
      path: '/mlb/schedule',
      category: 'Live'
    }
  ],
  nhl: [
    {
      id: 'live-dashboard',
      title: 'Live Dashboard',
      description: 'Real-time scores, play-by-play, and win probability for all NHL games.',
      iconName: 'Radio',
      path: '/nhl/live',
      category: 'Live',
      badge: 'LIVE'
    },
    {
      id: 'goalie-analytics',
      title: 'Goalie Analytics',
      description: 'GSAA, high-danger save %, and performance trends for all NHL goalies.',
      iconName: 'Shield',
      path: '/nhl/goalies',
      category: 'Analysis',
      badge: 'New'
    },
    {
      id: 'odds-comparison',
      title: 'Odds Comparison',
      description: 'Live puck lines, totals, and moneylines from major sportsbooks.',
      iconName: 'DollarSign',
      path: '/nhl/odds',
      category: 'Betting'
    },
    {
      id: 'team-analytics',
      title: 'Team Analytics',
      description: 'Corsi, Fenwick, PDO, and other advanced metrics for all NHL teams.',
      iconName: 'Shield',
      path: '/nhl/teams',
      category: 'Analysis'
    },
    {
      id: 'line-movement',
      title: 'Line Movement',
      description: 'Track puck line and total movements from opening to faceoff.',
      iconName: 'TrendingUp',
      path: '/nhl/line-movement',
      category: 'Betting'
    },
    {
      id: 'injury-tracker',
      title: 'Injury Tracker',
      description: 'Goalie confirmations, lineup changes, and IR updates.',
      iconName: 'Stethoscope',
      path: '/nhl/injuries',
      category: 'Live'
    },
    {
      id: 'game-archive',
      title: 'Game Archive',
      description: 'Historical box scores, shot maps, and season results for all NHL games.',
      iconName: 'Archive',
      path: '/nhl/archive',
      category: 'History'
    },
    {
      id: 'public-betting',
      title: 'Public Betting',
      description: 'Betting splits showing public money distribution on NHL markets.',
      iconName: 'PieChart',
      path: '/nhl/public',
      category: 'Betting'
    },
    {
      id: 'special-teams',
      title: 'Special Teams',
      description: 'Power play and penalty kill efficiency metrics and matchup advantages.',
      iconName: 'Bolt',
      path: '/nhl/special-teams',
      category: 'Analysis'
    },
    {
      id: 'matchup-matrix',
      title: 'Matchup Matrix',
      description: 'Team vs Team historical records, trends, and head-to-head statistical edges.',
      iconName: 'GitCompare',
      path: '/nhl/matchups',
      category: 'History'
    }
  ]
};
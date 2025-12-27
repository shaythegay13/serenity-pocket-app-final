export interface Team {
  id: string;
  name: string;
  code: string;
  logo: string;
}

export interface Game {
  id: string;
  sport: 'nfl' | 'nba' | 'mlb' | 'nhl';
  startTime: string;
  status: 'scheduled' | 'live' | 'final';
  clock?: string;
  homeTeam: Team;
  awayTeam: Team;
  homeScore?: number;
  awayScore?: number;
  spread?: string;
  spreadMovement?: 'up' | 'down' | null;
  moneyline?: string;
  moneylineMovement?: 'up' | 'down' | null;
  overUnder?: string;
  overUnderMovement?: 'up' | 'down' | null;
  favorableOdds?: boolean;
}

export interface TeamStats {
  id: string;
  name: string;
  abbreviation: string;
  logo: string;
  wins: number;
  losses: number;
  trend: number[];
  offenseRating: number;
  defenseRating: number;
}

export interface PlayerStats {
  id: string;
  name: string;
  position: string;
  team: string;
  teamLogo: string;
  stats: string[];
  trend: number[];
}

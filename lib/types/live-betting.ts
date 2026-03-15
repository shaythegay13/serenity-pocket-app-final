export interface LiveBettingOdds {
  id: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
  moneyline: {
    home: number;
    away: number;
  };
  spread: {
    home: {
      line: number;
      odds: number;
    };
    away: {
      line: number;
      odds: number;
    };
  };
  totals: {
    over: {
      line: number;
      odds: number;
    };
    under: {
      line: number;
      odds: number;
    };
  };
  // Live game state (populated when game is in progress)
  scoreSnapshot?: { home: number; away: number; period?: string; clock?: string };
  isInProgress?: boolean;
  lastOddsUpdate?: string;  // ISO timestamp of the latest odds refresh
}

export interface OddsSnapshot {
  timestamp: string;
  moneyline: {
    home: number;
    away: number;
  };
  spread: {
    home: {
      line: number;
      odds: number;
    };
    away: {
      line: number;
      odds: number;
    };
  };
  totals: {
    over: {
      line: number;
      odds: number;
    };
    under: {
      line: number;
      odds: number;
    };
  };
}

export interface BettingTrends {
  gameId: string;
  sport: string;
  market: 'moneyline' | 'spread' | 'total';
  publicBets: {
    home: number;
    away: number;
  };
  publicMoney: {
    home: number;
    away: number;
  };
  sharpMoney: {
    home: number;
    away: number;
  };
  reverseLineMovement: boolean;
}

export interface LineMovementData {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  sport: string;
  commenceTime: string;
  snapshots: OddsSnapshot[];
}

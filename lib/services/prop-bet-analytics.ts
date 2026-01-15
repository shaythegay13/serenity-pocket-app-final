/**
 * Prop Bet Analytics Service
 * Calculates real prop bet hit rates from historical player performance data
 */

export interface PropBetLine {
  stat: string;
  line: number;
  overOdds?: number;
  underOdds?: number;
}

export interface PropBetResult {
  stat: string;
  line: number;
  actualValue: number;
  result: 'OVER' | 'UNDER' | 'PUSH';
  date: string;
}

export interface PropBetHitRate {
  label: string;
  stat: string;
  line: number;
  hitRate: number;
  totalBets: number;
  wins: number;
  losses: number;
  pushes: number;
  avgActual: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
}

export interface PlayerPerformanceHistory {
  [stat: string]: number[];
}

/**
 * Calculate prop bet hit rates from historical player data
 */
export class PropBetAnalytics {
  
  /**
   * Get standard prop bet lines for each sport and position
   */
  static getStandardLines(sport: string, position?: string): PropBetLine[] {
    const lines: Record<string, Record<string, PropBetLine[]>> = {
      'americanfootball_nfl': {
        'QB': [
          { stat: 'passingYards', line: 250.5 },
          { stat: 'passingTDs', line: 1.5 },
          { stat: 'rushingYards', line: 25.5 }
        ],
        'RB': [
          { stat: 'rushingYards', line: 65.5 },
          { stat: 'receptions', line: 3.5 },
          { stat: 'receivingYards', line: 45.5 }
        ],
        'WR': [
          { stat: 'receptions', line: 5.5 },
          { stat: 'receivingYards', line: 75.5 },
          { stat: 'rushYards', line: 10.5 }
        ],
        'default': [
          { stat: 'tackles', line: 4.5 },
          { stat: 'sacks', line: 0.5 },
          { stat: 'interceptions', line: 0.5 }
        ]
      },
      'basketball_nba': {
        'default': [
          { stat: 'pointsPerGame', line: 20.5 },
          { stat: 'reboundsPerGame', line: 8.5 },
          { stat: 'assistsPerGame', line: 6.5 }
        ]
      },
      'baseball_mlb': {
        'P': [
          { stat: 'strikeouts', line: 5.5 },
          { stat: 'wins', line: 0.5 },
          { stat: 'era', line: 4.5 }
        ],
        'default': [
          { stat: 'hits', line: 1.5 },
          { stat: 'homeRuns', line: 0.5 },
          { stat: 'rbis', line: 2.5 }
        ]
      },
      'icehockey_nhl': {
        'G': [
          { stat: 'saves', line: 25.5 },
          { stat: 'goalsAgainst', line: 2.5 },
          { stat: 'savePct', line: 0.9 }
        ],
        'default': [
          { stat: 'goals', line: 0.5 },
          { stat: 'assists', line: 0.5 },
          { stat: 'shots', line: 3.5 }
        ]
      }
    };

    const sportLines = lines[sport] || lines['americanfootball_nfl'];
    return sportLines[position || 'default'] || sportLines['default'] || [];
  }

  /**
   * Calculate hit rates for a player's prop bets
   */
  static async calculatePlayerHitRates(
    sport: string,
    playerId: string,
    position?: string,
    gamesBack: number = 20
  ): Promise<PropBetHitRate[]> {
    try {
      // Fetch historical performance data from our API
      const historicalData = await this.fetchHistoricalPerformance(sport, playerId, gamesBack);
      
      // If no historical data available, return empty array
      if (Object.keys(historicalData).length === 0) {
        return [];
      }
      
      const lines = this.getStandardLines(sport, position);
      const hitRates: PropBetHitRate[] = [];

      for (const line of lines) {
        const hitRate = this.calculateSingleStatHitRate(
          line.stat,
          line.line,
          historicalData,
          {} // No current stats needed for historical hit rates
        );
        
        hitRates.push(hitRate);
      }

      return hitRates;
    } catch (error) {
      console.error('Error calculating player hit rates:', error);
      return [];
    }
  }

  /**
   * Calculate hit rate for a single statistic
   */
  private static calculateSingleStatHitRate(
    stat: string,
    line: number,
    historicalData: PlayerPerformanceHistory,
    currentStats: any
  ): PropBetHitRate {
    const values = historicalData[stat] || [];
    const results: PropBetResult[] = [];

    // Calculate results for each game
    values.forEach((value, index) => {
      let result: 'OVER' | 'UNDER' | 'PUSH';
      if (Math.abs(value - line) < 0.01) {
        result = 'PUSH';
      } else if (value > line) {
        result = 'OVER';
      } else {
        result = 'UNDER';
      }

      results.push({
        stat,
        line,
        actualValue: value,
        result,
        date: `Game ${index + 1}`
      });
    });

    // Calculate statistics
    const wins = results.filter(r => r.result === 'OVER').length;
    const losses = results.filter(r => r.result === 'UNDER').length;
    const pushes = results.filter(r => r.result === 'PUSH').length;
    const totalBets = results.length;
    const hitRate = totalBets > 0 ? (wins / totalBets) * 100 : 0;
    const avgActual = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;

    // Calculate trend
    const trend = this.calculateTrend(values, line);

    // Generate label
    const label = this.generateStatLabel(stat);

    return {
      label,
      stat,
      line,
      hitRate: Math.round(hitRate),
      totalBets,
      wins,
      losses,
      pushes,
      avgActual: Math.round(avgActual * 10) / 10,
      trend
    };
  }

  /**
   * Calculate trend based on recent performance
   */
  private static calculateTrend(values: number[], line: number): 'UP' | 'DOWN' | 'STABLE' {
    if (values.length < 5) return 'STABLE';

    const recent = values.slice(-5);
    const older = values.slice(-10, -5);

    if (older.length === 0) return 'STABLE';

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

    const difference = recentAvg - olderAvg;
    const threshold = line * 0.1; // 10% of the line

    if (difference > threshold) return 'UP';
    if (difference < -threshold) return 'DOWN';
    return 'STABLE';
  }

  /**
   * Generate user-friendly stat labels
   */
  private static generateStatLabel(stat: string): string {
    const labels: Record<string, string> = {
      'passingYards': 'Pass Yards Over',
      'passingTDs': 'Pass TDs Over',
      'rushingYards': 'Rush Yards Over',
      'receptions': 'Receptions Over',
      'receivingYards': 'Rec Yards Over',
      'tackles': 'Tackles Over',
      'sacks': 'Sacks Over',
      'interceptions': 'Interceptions Over',
      'pointsPerGame': 'Points Over',
      'reboundsPerGame': 'Rebounds Over',
      'assistsPerGame': 'Assists Over',
      'hits': 'Hits Over',
      'homeRuns': 'Home Runs Over',
      'rbis': 'RBIs Over',
      'strikeouts': 'Strikeouts Over',
      'goals': 'Goals Over',
      'assists': 'Assists Over',
      'shots': 'Shots Over',
      'saves': 'Saves Over'
    };

    return labels[stat] || `${stat} Over`;
  }

  /**
   * Fetch historical performance data from API
   */
  private static async fetchHistoricalPerformance(
    sport: string,
    playerId: string,
    gamesBack: number
  ): Promise<PlayerPerformanceHistory> {
    try {
      const response = await fetch(`/api/player-history?sport=${sport}&playerId=${playerId}&gamesBack=${gamesBack}`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        return data.data;
      } else {
        console.warn('API returned no data:', data.message || 'Unknown reason');
        return {};
      }
    } catch (error) {
      console.error('Error fetching historical performance:', error);
      return {};
    }
  }

  /**
   * Get fallback hit rates when API data is not available
   */
  private static getFallbackHitRates(sport: string, position?: string): PropBetHitRate[] {
    // Return empty array - no hardcoded data
    return [];
  }

  /**
   * Format hit rate for display
   */
  static formatHitRate(hitRate: PropBetHitRate): string {
    if (hitRate.totalBets === 0) {
      return 'This information is currently unavailable';
    }
    return `${hitRate.hitRate}%`;
  }

  /**
   * Get trend indicator for display
   */
  static getTrendIndicator(trend: 'UP' | 'DOWN' | 'STABLE'): string {
    switch (trend) {
      case 'UP': return '📈';
      case 'DOWN': return '📉';
      case 'STABLE': return '➡️';
    }
  }

  /**
   * Get confidence level based on sample size
   */
  static getConfidenceLevel(totalBets: number): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (totalBets >= 20) return 'HIGH';
    if (totalBets >= 10) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Get confidence color
   */
  static getConfidenceColor(level: 'HIGH' | 'MEDIUM' | 'LOW'): string {
    switch (level) {
      case 'HIGH': return 'text-green-600';
      case 'MEDIUM': return 'text-yellow-600';
      case 'LOW': return 'text-red-600';
    }
  }
}

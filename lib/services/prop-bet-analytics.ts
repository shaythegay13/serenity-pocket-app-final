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
      // ── Major US Sports (Big 4) ──
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
          { stat: 'assistsPerGame', line: 6.5 },
          { stat: 'threePointers', line: 2.5 },
          { stat: 'steals', line: 1.5 },
          { stat: 'blocks', line: 1.5 }
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
          { stat: 'rbis', line: 2.5 },
          { stat: 'totalBases', line: 1.5 },
          { stat: 'stolenBases', line: 0.5 }
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
          { stat: 'shots', line: 3.5 },
          { stat: 'hitsHockey', line: 2.5 },
          { stat: 'blockedShots', line: 1.5 }
        ]
      },

      // ── College Sports ──
      // NCAAB: functionally same as NBA-style props
      'basketball_ncaab': {
        'default': [
          { stat: 'pointsPerGame', line: 16.5 },
          { stat: 'reboundsPerGame', line: 6.5 },
          { stat: 'assistsPerGame', line: 4.5 },
          { stat: 'threePointers', line: 2.5 },
          { stat: 'steals', line: 1.5 }
        ]
      },
      // NCAAF: same structure as NFL props
      'americanfootball_ncaaf': {
        'QB': [
          { stat: 'passingYards', line: 225.5 },
          { stat: 'passingTDs', line: 1.5 },
          { stat: 'rushingYards', line: 30.5 }
        ],
        'RB': [
          { stat: 'rushingYards', line: 75.5 },
          { stat: 'receptions', line: 2.5 },
          { stat: 'receivingYards', line: 25.5 }
        ],
        'WR': [
          { stat: 'receptions', line: 4.5 },
          { stat: 'receivingYards', line: 65.5 }
        ],
        'default': [
          { stat: 'tackles', line: 5.5 },
          { stat: 'sacks', line: 0.5 }
        ]
      },

      // ── Additional US Sports ──
      // WNBA: similar structure to NBA, lower volume lines
      'basketball_wnba': {
        'default': [
          { stat: 'pointsPerGame', line: 15.5 },
          { stat: 'reboundsPerGame', line: 6.5 },
          { stat: 'assistsPerGame', line: 4.5 },
          { stat: 'threePointers', line: 1.5 },
          { stat: 'steals', line: 1.5 }
        ]
      },
      // CFL: NFL-style props with slightly different norms
      'americanfootball_cfl': {
        'QB': [
          { stat: 'passingYards', line: 275.5 },
          { stat: 'passingTDs', line: 1.5 },
          { stat: 'rushingYards', line: 20.5 }
        ],
        'default': [
          { stat: 'rushingYards', line: 55.5 },
          { stat: 'receptions', line: 4.5 },
          { stat: 'receivingYards', line: 65.5 }
        ]
      },
      // XFL/UFL: NFL-style props
      'americanfootball_xfl': {
        'QB': [
          { stat: 'passingYards', line: 200.5 },
          { stat: 'passingTDs', line: 1.5 }
        ],
        'default': [
          { stat: 'rushingYards', line: 50.5 },
          { stat: 'receivingYards', line: 55.5 },
          { stat: 'receptions', line: 3.5 }
        ]
      },

      // ── Soccer (all leagues share same prop structure) ──
      'soccer_epl': {
        'FW': [
          { stat: 'goalsScored', line: 0.5 },
          { stat: 'shotsOnTarget', line: 1.5 },
          { stat: 'totalShots', line: 2.5 }
        ],
        'MF': [
          { stat: 'assistsSoccer', line: 0.5 },
          { stat: 'shotsOnTarget', line: 0.5 },
          { stat: 'totalShots', line: 1.5 }
        ],
        'default': [
          { stat: 'goalsScored', line: 0.5 },
          { stat: 'assistsSoccer', line: 0.5 },
          { stat: 'shotsOnTarget', line: 1.5 },
          { stat: 'cards', line: 0.5 }
        ]
      },

      // ── Combat Sports ──
      // UFC/MMA: method of victory and fight-level props
      'mma_ufc': {
        'default': [
          { stat: 'significantStrikes', line: 45.5 },
          { stat: 'takedowns', line: 1.5 },
          { stat: 'totalRounds', line: 2.5 }
        ]
      },
      // Boxing: round-based and KO props
      'boxing': {
        'default': [
          { stat: 'totalRounds', line: 8.5 },
          { stat: 'knockdowns', line: 0.5 },
          { stat: 'significantStrikes', line: 100.5 }
        ]
      },

      // ── Tennis ──
      'tennis_atp': {
        'default': [
          { stat: 'gamesWon', line: 10.5 },
          { stat: 'aces', line: 5.5 },
          { stat: 'doubleFaults', line: 2.5 },
          { stat: 'setsWon', line: 1.5 }
        ]
      },
      'tennis_wta': {
        'default': [
          { stat: 'gamesWon', line: 10.5 },
          { stat: 'aces', line: 2.5 },
          { stat: 'doubleFaults', line: 3.5 },
          { stat: 'setsWon', line: 1.5 }
        ]
      },

      // ── Golf ──
      'golf_pga': {
        'default': [
          { stat: 'roundScore', line: 70.5 },
          { stat: 'bogeyFreeRound', line: 0.5 },
          { stat: 'topFinish', line: 10.5 }
        ]
      },

      // ── Motorsports ──
      'motorsports_f1': {
        'default': [
          { stat: 'topFinish', line: 5.5 },
          { stat: 'podiumFinish', line: 0.5 },
          { stat: 'fastestLap', line: 0.5 },
          { stat: 'lapsLed', line: 5.5 }
        ]
      },
      'motorsports_nascar': {
        'default': [
          { stat: 'topFinish', line: 10.5 },
          { stat: 'lapsLed', line: 10.5 },
          { stat: 'stageWins', line: 0.5 },
          { stat: 'podiumFinish', line: 0.5 }
        ]
      },
      'cycling': {
        'default': [
          { stat: 'stageWin', line: 0.5 },
          { stat: 'topFinish', line: 3.5 },
          { stat: 'podiumFinish', line: 0.5 }
        ]
      },
      'table_tennis': {
        'default': [
          { stat: 'totalPoints', line: 75.5 },
          { stat: 'setsWon', line: 2.5 }
        ]
      },

      // ── Cricket (all leagues share same structure) ──
      'cricket_ipl': {
        'BAT': [
          { stat: 'battingRuns', line: 25.5 },
          { stat: 'sixes', line: 1.5 },
          { stat: 'fours', line: 3.5 },
          { stat: 'toScoreFifty', line: 0.5 }
        ],
        'BOWL': [
          { stat: 'wickets', line: 1.5 },
          { stat: 'bowlerWicket', line: 0.5 }
        ],
        'default': [
          { stat: 'battingRuns', line: 20.5 },
          { stat: 'wickets', line: 0.5 },
          { stat: 'sixes', line: 1.5 }
        ]
      },

      // ── Rugby ──
      'rugby_union': {
        'default': [
          { stat: 'tries', line: 0.5 },
          { stat: 'pointsRugby', line: 5.5 },
          { stat: 'tacklesRugby', line: 8.5 }
        ]
      },
      'rugby_league': {
        'default': [
          { stat: 'tries', line: 0.5 },
          { stat: 'pointsRugby', line: 5.5 },
          { stat: 'tacklesRugby', line: 10.5 }
        ]
      },

      // ── AFL (Australian Rules Football) ──
      'aussie_rules': {
        'default': [
          { stat: 'disposals', line: 18.5 },
          { stat: 'goalsAFL', line: 1.5 },
          { stat: 'marks', line: 4.5 },
          { stat: 'handballs', line: 8.5 }
        ]
      },

      // ── Volleyball ──
      'volleyball': {
        'default': [
          { stat: 'killsVolleyball', line: 10.5 },
          { stat: 'acesVolleyball', line: 1.5 },
          { stat: 'digs', line: 8.5 }
        ]
      },

      // ── Handball ──
      'handball': {
        'default': [
          { stat: 'goalsHandball', line: 4.5 },
          { stat: 'assistsHandball', line: 2.5 }
        ]
      },

      // ── Darts ──
      'darts_pdc': {
        'default': [
          { stat: 'oneEighties', line: 3.5 },
          { stat: 'checkoutPct', line: 35.5 }
        ]
      },

      // ── Esports ──
      // MOBA: LoL, Dota 2 — kills/assists/deaths + objectives
      'esports_lol': {
        'default': [
          { stat: 'killsEsports', line: 3.5 },
          { stat: 'assistsEsports', line: 8.5 },
          { stat: 'deathsEsports', line: 2.5 },
          { stat: 'objectivesEsports', line: 1.5 }
        ]
      },
      'esports_dota2': {
        'default': [
          { stat: 'killsEsports', line: 5.5 },
          { stat: 'assistsEsports', line: 12.5 },
          { stat: 'deathsEsports', line: 4.5 },
          { stat: 'objectivesEsports', line: 2.5 }
        ]
      },
      // FPS: CS:GO/CS2, Valorant — kills/assists/deaths + rounds won
      'esports_csgo': {
        'default': [
          { stat: 'killsEsports', line: 18.5 },
          { stat: 'assistsEsports', line: 4.5 },
          { stat: 'deathsEsports', line: 16.5 },
          { stat: 'roundsWonEsports', line: 12.5 }
        ]
      },
      'esports_valorant': {
        'default': [
          { stat: 'killsEsports', line: 16.5 },
          { stat: 'assistsEsports', line: 5.5 },
          { stat: 'deathsEsports', line: 14.5 },
          { stat: 'roundsWonEsports', line: 12.5 }
        ]
      },
    };

    // Soccer leagues all share the same prop structure
    const soccerAliases = [
      'soccer_mls', 'soccer_champions_league', 'soccer_la_liga',
      'soccer_serie_a', 'soccer_bundesliga', 'soccer_ligue_1'
    ];
    for (const alias of soccerAliases) {
      lines[alias] = lines['soccer_epl'];
    }

    // Cricket leagues all share the same prop structure
    const cricketAliases = [
      'cricket_mlc', 'cricket_big_bash', 'cricket_cpl', 'cricket_the_hundred',
      'cricket_psl', 'cricket_icc_odi', 'cricket_icc_t20', 'cricket_test',
      'cricket_icc_world_cup'
    ];
    for (const alias of cricketAliases) {
      lines[alias] = lines['cricket_ipl'];
    }

    // Tennis ITF uses WTA-like lines
    lines['tennis_itf'] = lines['tennis_wta'];

    // Golf aliases
    const golfAliases = ['golf_lpga', 'golf_dp_world'];
    for (const alias of golfAliases) {
      lines[alias] = lines['golf_pga'];
    }

    // Motorsports aliases
    lines['motorsports_indycar'] = lines['motorsports_f1'];

    const sportLines = lines[sport] || lines['basketball_nba'];
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
      // Football (NFL/NCAAF/CFL/XFL)
      'passingYards': 'Pass Yards Over',
      'passingTDs': 'Pass TDs Over',
      'rushingYards': 'Rush Yards Over',
      'rushYards': 'Rush Yards Over',
      'receptions': 'Receptions Over',
      'receivingYards': 'Rec Yards Over',
      'tackles': 'Tackles Over',
      'sacks': 'Sacks Over',
      'interceptions': 'Interceptions Over',
      // Basketball (NBA/NCAAB/WNBA)
      'pointsPerGame': 'Points Over',
      'reboundsPerGame': 'Rebounds Over',
      'assistsPerGame': 'Assists Over',
      'threePointers': '3-Pointers Over',
      'steals': 'Steals Over',
      'blocks': 'Blocks Over',
      // Baseball (MLB)
      'hits': 'Hits Over',
      'homeRuns': 'Home Runs Over',
      'rbis': 'RBIs Over',
      'strikeouts': 'Strikeouts Over',
      'totalBases': 'Total Bases Over',
      'stolenBases': 'Stolen Bases Over',
      'wins': 'Wins Over',
      'era': 'ERA Under',
      // Hockey (NHL)
      'goals': 'Goals Over',
      'assists': 'Assists Over',
      'shots': 'Shots Over',
      'saves': 'Saves Over',
      'goalsAgainst': 'Goals Against Under',
      'savePct': 'Save % Over',
      'hitsHockey': 'Hits Over',
      'blockedShots': 'Blocked Shots Over',
      // Soccer
      'goalsScored': 'Goals Over',
      'assistsSoccer': 'Assists Over',
      'shotsOnTarget': 'Shots on Target Over',
      'totalShots': 'Total Shots Over',
      'cards': 'Cards Over',
      // Combat Sports (UFC/Boxing)
      'significantStrikes': 'Sig. Strikes Over',
      'takedowns': 'Takedowns Over',
      'totalRounds': 'Total Rounds Over',
      'knockdowns': 'Knockdowns Over',
      // Tennis
      'gamesWon': 'Games Won Over',
      'aces': 'Aces Over',
      'doubleFaults': 'Double Faults Over',
      'setsWon': 'Sets Won Over',
      // Golf
      'roundScore': 'Round Score Under',
      'bogeyFreeRound': 'Bogey Free Round',
      'stageWin': 'Stage Win',
      // Motorsports
      'podiumFinish': 'Podium Finish',
      'fastestLap': 'Fastest Lap',
      'lapsLed': 'Laps Led Over',
      'stageWins': 'Stage Wins Over',
      // Cricket
      'battingRuns': 'Batting Runs Over',
      'wickets': 'Wickets Over',
      'sixes': 'Sixes Over',
      'fours': 'Fours Over',
      'toScoreFifty': 'To Score 50+',
      'bowlerWicket': 'Bowler to Take Wicket',
      // Rugby
      'tries': 'Tries Over',
      'pointsRugby': 'Points Over',
      'tacklesRugby': 'Tackles Over',
      // AFL
      'disposals': 'Disposals Over',
      'goalsAFL': 'Goals Over',
      'marks': 'Marks Over',
      'handballs': 'Handballs Over',
      // Volleyball
      'killsVolleyball': 'Kills Over',
      'acesVolleyball': 'Aces Over',
      'digs': 'Digs Over',
      // Handball
      'goalsHandball': 'Goals Over',
      'assistsHandball': 'Assists Over',
      // Darts
      'oneEighties': '180s Over',
      'checkoutPct': 'Checkout % Over',
      // Esports
      'killsEsports': 'Kills Over',
      'player_kills_esports': 'Kills Over',
      'assistsEsports': 'Assists Over',
      'player_assists_esports': 'Assists Over',
      'deathsEsports': 'Deaths Under',
      'player_deaths_esports': 'Deaths Under',
      'objectivesEsports': 'Objectives Over',
      'player_objectives_esports': 'Objectives Over',
      'roundsWonEsports': 'Rounds Won Over',
      'player_rounds_won_esports': 'Rounds Won Over',
      'firstBloodEsports': 'First Blood',
      'player_first_blood_esports': 'First Blood',
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

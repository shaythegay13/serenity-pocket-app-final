import { LiveBettingOdds, BettingTrends, LineMovementData } from '@/lib/types/live-betting';

export class DataAggregator {
  private cache = new Map<string, any>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  // Aggregate betting trends based on line movement
  aggregateBettingTrends(odds: LiveBettingOdds, historicalData?: LineMovementData): BettingTrends {
    const cacheKey = `trends_${odds.id}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    // Simulate betting trends based on line movement patterns
    const trends: BettingTrends = {
      gameId: odds.id,
      sport: odds.sport,
      market: 'moneyline',
      publicBets: {
        home: Math.random() * 100,
        away: Math.random() * 100
      },
      publicMoney: {
        home: Math.random() * 100,
        away: Math.random() * 100
      },
      sharpMoney: {
        home: Math.random() * 100,
        away: Math.random() * 100
      },
      reverseLineMovement: Math.random() > 0.7
    };

    // Normalize percentages
    const normalize = (home: number, away: number) => {
      const total = home + away;
      return {
        home: Math.round((home / total) * 100),
        away: Math.round((away / total) * 100)
      };
    };

    trends.publicBets = normalize(trends.publicBets.home, trends.publicBets.away);
    trends.publicMoney = normalize(trends.publicMoney.home, trends.publicMoney.away);
    trends.sharpMoney = normalize(trends.sharpMoney.home, trends.sharpMoney.away);

    // Cache the result
    this.cache.set(cacheKey, {
      data: trends,
      timestamp: Date.now()
    });

    return trends;
  }

  // Process odds data for line movement analysis
  processLineMovement(odds: LiveBettingOdds, historicalData?: LineMovementData): LineMovementData {
    const cacheKey = `movement_${odds.id}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    const lineMovement: LineMovementData = {
      gameId: odds.id,
      homeTeam: odds.homeTeam,
      awayTeam: odds.awayTeam,
      sport: odds.sport,
      commenceTime: odds.commenceTime,
      snapshots: historicalData?.snapshots || [{
        timestamp: new Date().toISOString(),
        moneyline: odds.moneyline,
        spread: odds.spread,
        totals: odds.totals
      }]
    };

    // Cache the result
    this.cache.set(cacheKey, {
      data: lineMovement,
      timestamp: Date.now()
    });

    return lineMovement;
  }

  // Clear cache for specific game or all cache
  clearCache(gameId?: string) {
    if (gameId) {
      this.cache.delete(`trends_${gameId}`);
      this.cache.delete(`movement_${gameId}`);
    } else {
      this.cache.clear();
    }
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const dataAggregator = new DataAggregator();

/**
 * Sports Data Cache Service
 * Caches API responses for team and player data to support prop bet calculations
 */

interface CachedTeamData {
  id: string;
  name: string;
  sport: string;
  data: any;
  fetchedAt: Date;
  expiresAt: Date;
}

interface CachedPlayerData {
  id: string;
  name: string;
  position: string;
  team: string;
  sport: string;
  data: any;
  fetchedAt: Date;
  expiresAt: Date;
}

interface CachedGameData {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  sport: string;
  data: any;
  fetchedAt: Date;
  expiresAt: Date;
}

class SportsDataCache {
  private teamCache = new Map<string, CachedTeamData>();
  private playerCache = new Map<string, CachedPlayerData>();
  private gameCache = new Map<string, CachedGameData>();
  
  // Cache duration: 5 minutes for live data, 1 hour for historical data
  private readonly LIVE_DATA_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly HISTORICAL_DATA_TTL = 60 * 60 * 1000; // 1 hour

  /**
   * Cache team data
   */
  setTeamData(teamId: string, sport: string, data: any, isLive: boolean = true): void {
    const ttl = isLive ? this.LIVE_DATA_TTL : this.HISTORICAL_DATA_TTL;
    const expiresAt = new Date(Date.now() + ttl);
    
    this.teamCache.set(`${sport}:${teamId}`, {
      id: teamId,
      name: data.name || 'Unknown Team',
      sport,
      data,
      fetchedAt: new Date(),
      expiresAt
    });
    
    console.log(`[SportsDataCache] Cached team data for ${sport}:${teamId} (expires: ${expiresAt.toISOString()})`);
  }

  /**
   * Get cached team data
   */
  getTeamData(teamId: string, sport: string): CachedTeamData | null {
    const cached = this.teamCache.get(`${sport}:${teamId}`);
    
    if (!cached) {
      return null;
    }
    
    // Check if cache is expired
    if (Date.now() > cached.expiresAt.getTime()) {
      this.teamCache.delete(`${sport}:${teamId}`);
      console.log(`[SportsDataCache] Expired team cache for ${sport}:${teamId}`);
      return null;
    }
    
    console.log(`[SportsDataCache] Hit team cache for ${sport}:${teamId}`);
    return cached;
  }

  /**
   * Cache player data
   */
  setPlayerData(playerId: string, sport: string, data: any, isLive: boolean = true): void {
    const ttl = isLive ? this.LIVE_DATA_TTL : this.HISTORICAL_DATA_TTL;
    const expiresAt = new Date(Date.now() + ttl);
    
    this.playerCache.set(`${sport}:${playerId}`, {
      id: playerId,
      name: data.name || 'Unknown Player',
      position: data.position || 'Unknown',
      team: data.team || 'Unknown Team',
      sport,
      data,
      fetchedAt: new Date(),
      expiresAt
    });
    
    console.log(`[SportsDataCache] Cached player data for ${sport}:${playerId} (expires: ${expiresAt.toISOString()})`);
  }

  /**
   * Get cached player data
   */
  getPlayerData(playerId: string, sport: string): CachedPlayerData | null {
    const cached = this.playerCache.get(`${sport}:${playerId}`);
    
    if (!cached) {
      return null;
    }
    
    // Check if cache is expired
    if (Date.now() > cached.expiresAt.getTime()) {
      this.playerCache.delete(`${sport}:${playerId}`);
      console.log(`[SportsDataCache] Expired player cache for ${sport}:${playerId}`);
      return null;
    }
    
    console.log(`[SportsDataCache] Hit player cache for ${sport}:${playerId}`);
    return cached;
  }

  /**
   * Cache game data
   */
  setGameData(gameId: string, sport: string, data: any, isLive: boolean = true): void {
    const ttl = isLive ? this.LIVE_DATA_TTL : this.HISTORICAL_DATA_TTL;
    const expiresAt = new Date(Date.now() + ttl);
    
    this.gameCache.set(`${sport}:${gameId}`, {
      gameId,
      homeTeam: data.homeTeam || 'Unknown',
      awayTeam: data.awayTeam || 'Unknown',
      sport,
      data,
      fetchedAt: new Date(),
      expiresAt
    });
    
    console.log(`[SportsDataCache] Cached game data for ${sport}:${gameId} (expires: ${expiresAt.toISOString()})`);
  }

  /**
   * Get cached game data
   */
  getGameData(gameId: string, sport: string): CachedGameData | null {
    const cached = this.gameCache.get(`${sport}:${gameId}`);
    
    if (!cached) {
      return null;
    }
    
    // Check if cache is expired
    if (Date.now() > cached.expiresAt.getTime()) {
      this.gameCache.delete(`${sport}:${gameId}`);
      console.log(`[SportsDataCache] Expired game cache for ${sport}:${gameId}`);
      return null;
    }
    
    console.log(`[SportsDataCache] Hit game cache for ${sport}:${gameId}`);
    return cached;
  }

  /**
   * Get all cached data for a sport
   */
  getSportData(sport: string): {
    teams: CachedTeamData[];
    players: CachedPlayerData[];
    games: CachedGameData[];
  } {
    const teams = Array.from(this.teamCache.values()).filter(t => t.sport === sport);
    const players = Array.from(this.playerCache.values()).filter(p => p.sport === sport);
    const games = Array.from(this.gameCache.values()).filter(g => g.sport === sport);
    
    return { teams, players, games };
  }

  /**
   * Clear expired cache entries
   */
  clearExpired(): void {
    const now = Date.now();
    
    // Clear expired team data
    for (const [key, cached] of this.teamCache.entries()) {
      if (now > cached.expiresAt.getTime()) {
        this.teamCache.delete(key);
      }
    }
    
    // Clear expired player data
    for (const [key, cached] of this.playerCache.entries()) {
      if (now > cached.expiresAt.getTime()) {
        this.playerCache.delete(key);
      }
    }
    
    // Clear expired game data
    for (const [key, cached] of this.gameCache.entries()) {
      if (now > cached.expiresAt.getTime()) {
        this.gameCache.delete(key);
      }
    }
    
    console.log('[SportsDataCache] Cleared expired cache entries');
  }

  /**
   * Clear all cache for a sport
   */
  clearSport(sport: string): void {
    // Clear team data
    for (const [key] of this.teamCache.entries()) {
      if (key.startsWith(`${sport}:`)) {
        this.teamCache.delete(key);
      }
    }
    
    // Clear player data
    for (const [key] of this.playerCache.entries()) {
      if (key.startsWith(`${sport}:`)) {
        this.playerCache.delete(key);
      }
    }
    
    // Clear game data
    for (const [key] of this.gameCache.entries()) {
      if (key.startsWith(`${sport}:`)) {
        this.gameCache.delete(key);
      }
    }
    
    console.log(`[SportsDataCache] Cleared all cache for sport: ${sport}`);
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    totalTeams: number;
    totalPlayers: number;
    totalGames: number;
    expiredCount: number;
  } {
    const now = Date.now();
    let expiredCount = 0;
    
    // Count expired entries
    for (const cached of this.teamCache.values()) {
      if (now > cached.expiresAt.getTime()) expiredCount++;
    }
    for (const cached of this.playerCache.values()) {
      if (now > cached.expiresAt.getTime()) expiredCount++;
    }
    for (const cached of this.gameCache.values()) {
      if (now > cached.expiresAt.getTime()) expiredCount++;
    }
    
    return {
      totalTeams: this.teamCache.size,
      totalPlayers: this.playerCache.size,
      totalGames: this.gameCache.size,
      expiredCount
    };
  }
}

// Export singleton instance
export const sportsDataCache = new SportsDataCache();

// Auto-clear expired cache every 5 minutes
setInterval(() => {
  sportsDataCache.clearExpired();
}, 5 * 60 * 1000);

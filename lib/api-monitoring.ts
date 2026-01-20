/**
 * API Threshold Monitoring System
 * 
 * Monitors API usage and triggers alerts when thresholds are exceeded
 */

import { sendAPIWarning } from './email-alerts';

export interface APIUsageStats {
  theOddsAPI: {
    used: number;
    remaining: number;
    total: number;
    lastReset: Date;
  };
  rapidAPI: {
    used: number;
    total: number;
    lastReset: Date;
  };
}

export interface ThresholdConfig {
  theOddsWarningPct: number; // Default: 25 (75% used)
  rapidAPIWarningPct: number; // Default: 75
  theOddsTotal: number; // Default: 20000 (Starter plan)
  rapidAPITotal: number; // Default: 150 (Basic plan)
}

class APIMonitoringService {
  private config: ThresholdConfig;
  private lastAlertTimes: Map<string, number> = new Map();

  constructor() {
    this.config = {
      theOddsWarningPct: parseInt(process.env.THEODDS_WARNING_PCT || '25'),
      rapidAPIWarningPct: parseInt(process.env.RAPIDAPI_WARNING_PCT || '75'),
      theOddsTotal: parseInt(process.env.THEODDS_TOTAL || '20000'),
      rapidAPITotal: parseInt(process.env.RAPIDAPI_TOTAL || '150')
    };
  }

  /**
   * Check if we should send an alert (rate limiting to avoid spam)
   */
  private shouldSendAlert(alertKey: string, cooldownMinutes: number = 60): boolean {
    const now = Date.now();
    const lastAlert = this.lastAlertTimes.get(alertKey) || 0;
    const cooldownMs = cooldownMinutes * 60 * 1000;
    
    if (now - lastAlert < cooldownMs) {
      return false; // Still in cooldown period
    }
    
    this.lastAlertTimes.set(alertKey, now);
    return true;
  }

  /**
   * Monitor TheOddsAPI response and check thresholds
   */
  async monitorTheOddsAPI(response: Response): Promise<void> {
    const remainingHeader = response.headers.get('x-requests-remaining');
    if (!remainingHeader) return;

    const remaining = parseInt(remainingHeader);
    const used = this.config.theOddsTotal - remaining;
    const remainingPct = (remaining / this.config.theOddsTotal) * 100;

    console.log(`📊 TheOddsAPI Usage: ${used.toLocaleString()} used, ${remaining.toLocaleString()} remaining (${remainingPct.toFixed(1)}%)`);

    // Check if we've crossed the warning threshold
    if (remainingPct <= this.config.theOddsWarningPct) {
      const alertKey = 'theodds-warning';
      
      if (this.shouldSendAlert(alertKey)) {
        await sendAPIWarning(
          'TheOddsAPI',
          used,
          this.config.theOddsTotal,
          99 // Pro tier cost
        );
      }
    }

    // Critical alert for very low remaining
    if (remainingPct <= 5) {
      const alertKey = 'theodds-critical';
      
      if (this.shouldSendAlert(alertKey, 15)) { // 15 minute cooldown for critical
        await sendAPIWarning(
          'TheOddsAPI - CRITICAL',
          used,
          this.config.theOddsTotal,
          99
        );
      }
    }
  }

  /**
   * Monitor RapidAPI usage (tracked via Redis/memory)
   */
  async monitorRapidAPI(): Promise<void> {
    // This would typically check Redis or a database
    // For now, we'll simulate with a counter that could be stored anywhere
    const used = await this.getRapidAPIUsage();
    const usedPct = (used / this.config.rapidAPITotal) * 100;

    console.log(`📊 RapidAPI Usage: ${used}/${this.config.rapidAPITotal} (${usedPct.toFixed(1)}%)`);

    // Check if we've crossed the warning threshold
    if (usedPct >= this.config.rapidAPIWarningPct) {
      const alertKey = 'rapidapi-warning';
      
      if (this.shouldSendAlert(alertKey)) {
        await sendAPIWarning(
          'RapidAPI',
          used,
          this.config.rapidAPITotal,
          30 // Pro tier cost
        );
      }
    }

    // Critical alert for very high usage
    if (usedPct >= 95) {
      const alertKey = 'rapidapi-critical';
      
      if (this.shouldSendAlert(alertKey, 15)) {
        await sendAPIWarning(
          'RapidAPI - CRITICAL',
          used,
          this.config.rapidAPITotal,
          30
        );
      }
    }
  }

  /**
   * Get RapidAPI usage from storage (Redis, database, or memory)
   * This is a placeholder - implement based on your storage solution
   */
  private async getRapidAPIUsage(): Promise<number> {
    // In production, this would query Redis or your database
    // For now, return a mock value that could be tracked elsewhere
    
    // Example implementation with Redis:
    // const redis = getRedisClient();
    // const today = new Date().toISOString().split('T')[0];
    // const usage = await redis.get(`rapidapi:usage:${today}`);
    // return parseInt(usage) || 0;
    
    // Mock implementation for testing
    return Math.floor(Math.random() * 100); // Replace with actual implementation
  }

  /**
   * Increment RapidAPI usage counter
   * Call this after each RapidAPI request
   */
  async incrementRapidAPIUsage(): Promise<void> {
    // In production, this would update Redis or your database
    const today = new Date().toISOString().split('T')[0];
    
    // Example with Redis:
    // const redis = getRedisClient();
    // await redis.incr(`rapidapi:usage:${today}`);
    // await redis.expire(`rapidapi:usage:${today}`, 86400); // Expire after 24h
    
    console.log(`📈 RapidAPI usage incremented for ${today}`);
    
    // Check thresholds after increment
    await this.monitorRapidAPI();
  }

  /**
   * Get current API usage statistics
   */
  async getUsageStats(): Promise<APIUsageStats> {
    return {
      theOddsAPI: {
        used: 0, // Would be calculated from headers
        remaining: 0, // Would be from last response
        total: this.config.theOddsTotal,
        lastReset: new Date()
      },
      rapidAPI: {
        used: await this.getRapidAPIUsage(),
        total: this.config.rapidAPITotal,
        lastReset: new Date()
      }
    };
  }

  /**
   * Reset daily counters (call this at midnight)
   */
  async resetDailyCounters(): Promise<void> {
    // Reset RapidAPI daily counter
    const today = new Date().toISOString().split('T')[0];
    
    // Example with Redis:
    // const redis = getRedisClient();
    // await redis.del(`rapidapi:usage:${today}`);
    
    console.log(`🔄 Daily API counters reset for ${today}`);
  }
}

// Singleton instance
export const apiMonitoring = new APIMonitoringService();

// Convenience functions for middleware
export const monitorTheOddsAPI = (response: Response) => apiMonitoring.monitorTheOddsAPI(response);
export const monitorRapidAPI = () => apiMonitoring.monitorRapidAPI();
export const incrementRapidAPIUsage = () => apiMonitoring.incrementRapidAPIUsage();
export const getAPIUsageStats = () => apiMonitoring.getUsageStats();

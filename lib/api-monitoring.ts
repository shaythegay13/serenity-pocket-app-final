/**
 * API Threshold Monitoring System
 * 
 * Monitors API usage and triggers alerts when thresholds are exceeded.
 * Tracks: TheOddsAPI, RapidAPI, Gemini API, Gmail/Nodemailer
 */

import { sendAPIWarning } from './email-alerts';
import { supabase } from './supabase';

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
  geminiAPI: {
    used: number;
    total: number;
    lastReset: Date;
  };
  gmail: {
    used: number;
    total: number;
    lastReset: Date;
  };
}

export interface ThresholdConfig {
  theOddsWarningPct: number;
  rapidAPIWarningPct: number;
  geminiWarningPct: number;
  theOddsTotal: number;
  rapidAPITotal: number;
  geminiDailyLimit: number;
  gmailDailyLimit: number;
}

// In-memory daily counters (reset at midnight via cron)
const dailyCounters: Map<string, number> = new Map();

function getTodayKey(prefix: string): string {
  const today = new Date().toISOString().split('T')[0];
  return `${prefix}:${today}`;
}

class APIMonitoringService {
  private config: ThresholdConfig;
  private lastAlertTimes: Map<string, number> = new Map();

  constructor() {
    this.config = {
      theOddsWarningPct: parseInt(process.env.THEODDS_WARNING_PCT || '25'),
      rapidAPIWarningPct: parseInt(process.env.RAPIDAPI_WARNING_PCT || '75'),
      geminiWarningPct: parseInt(process.env.GEMINI_WARNING_PCT || '80'),
      theOddsTotal: parseInt(process.env.THEODDS_TOTAL || '20000'),
      rapidAPITotal: parseInt(process.env.RAPIDAPI_TOTAL || '150'),
      geminiDailyLimit: parseInt(process.env.GEMINI_DAILY_LIMIT || '100'),
      gmailDailyLimit: parseInt(process.env.GMAIL_DAILY_LIMIT || '500'),
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

  // ─── In-memory counter helpers (shared by RapidAPI, Gemini, Gmail) ────

  private getCounter(prefix: string): number {
    return dailyCounters.get(getTodayKey(prefix)) || 0;
  }

  private incrementCounter(prefix: string): number {
    const key = getTodayKey(prefix);
    const current = dailyCounters.get(key) || 0;
    const next = current + 1;
    dailyCounters.set(key, next);
    return next;
  }

  // ─── Supabase-backed counter persistence ──────────────────────────────

  /**
   * Persist daily counters to Supabase for durability across deploys.
   * Called automatically by the daily cron before reset.
   */
  async persistCountersToSupabase(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const snapshot = {
      date: today,
      rapidapi_used: this.getCounter('rapidapi'),
      gemini_used: this.getCounter('gemini'),
      gmail_used: this.getCounter('gmail'),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('api_usage_daily')
      .upsert(snapshot, { onConflict: 'date' });

    if (error) {
      console.error('❌ Failed to persist API counters:', error);
    } else {
      console.log(`💾 API counters persisted for ${today}`);
    }
  }

  /**
   * Restore counters from Supabase on cold start (e.g. after redeploy)
   */
  async restoreCountersFromSupabase(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('api_usage_daily')
      .select('*')
      .eq('date', today)
      .single();

    if (error || !data) {
      console.log('📊 No persisted counters for today — starting fresh');
      return;
    }

    const todayRapid = getTodayKey('rapidapi');
    const todayGemini = getTodayKey('gemini');
    const todayGmail = getTodayKey('gmail');

    // Only restore if in-memory is lower (avoid overwriting live counts)
    if ((dailyCounters.get(todayRapid) || 0) < data.rapidapi_used) {
      dailyCounters.set(todayRapid, data.rapidapi_used);
    }
    if ((dailyCounters.get(todayGemini) || 0) < data.gemini_used) {
      dailyCounters.set(todayGemini, data.gemini_used);
    }
    if ((dailyCounters.get(todayGmail) || 0) < data.gmail_used) {
      dailyCounters.set(todayGmail, data.gmail_used);
    }

    console.log(`♻️ Restored counters: RapidAPI=${data.rapidapi_used}, Gemini=${data.gemini_used}, Gmail=${data.gmail_used}`);
  }

  // ─── TheOddsAPI (unchanged — reads from response headers) ─────────────

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

  // ─── RapidAPI (real counter replaces mock) ────────────────────────────

  /**
   * Monitor RapidAPI usage
   */
  async monitorRapidAPI(): Promise<void> {
    const used = this.getCounter('rapidapi');
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
   * Increment RapidAPI usage counter
   * Call this after each RapidAPI request
   */
  async incrementRapidAPIUsage(): Promise<void> {
    const count = this.incrementCounter('rapidapi');
    console.log(`📈 RapidAPI usage: ${count}/${this.config.rapidAPITotal}`);
    await this.monitorRapidAPI();
  }

  // ─── Gemini API (NEW — 100 RPD free tier) ─────────────────────────────

  /**
   * Monitor Gemini API daily usage
   */
  async monitorGeminiAPI(): Promise<void> {
    const used = this.getCounter('gemini');
    const usedPct = (used / this.config.geminiDailyLimit) * 100;

    console.log(`📊 Gemini API Usage: ${used}/${this.config.geminiDailyLimit} RPD (${usedPct.toFixed(1)}%)`);

    if (usedPct >= this.config.geminiWarningPct) {
      const alertKey = 'gemini-warning';

      if (this.shouldSendAlert(alertKey)) {
        await sendAPIWarning(
          'Gemini API (Free Tier)',
          used,
          this.config.geminiDailyLimit,
          42 // Tier 1 estimated monthly cost
        );
      }
    }

    if (usedPct >= 95) {
      const alertKey = 'gemini-critical';

      if (this.shouldSendAlert(alertKey, 15)) {
        await sendAPIWarning(
          'Gemini API - CRITICAL',
          used,
          this.config.geminiDailyLimit,
          42
        );
      }
    }
  }

  /**
   * Increment Gemini usage counter
   * Call this after each Gemini API request
   */
  async incrementGeminiUsage(): Promise<void> {
    const count = this.incrementCounter('gemini');
    console.log(`📈 Gemini API usage: ${count}/${this.config.geminiDailyLimit} RPD`);
    await this.monitorGeminiAPI();
  }

  /**
   * Check if Gemini quota allows another request
   */
  canMakeGeminiRequest(): boolean {
    return this.getCounter('gemini') < this.config.geminiDailyLimit;
  }

  // ─── Gmail / Nodemailer (NEW — 500/day limit) ────────────────────────

  /**
   * Monitor Gmail daily send usage
   */
  async monitorGmail(): Promise<void> {
    const used = this.getCounter('gmail');
    const usedPct = (used / this.config.gmailDailyLimit) * 100;

    console.log(`📊 Gmail Usage: ${used}/${this.config.gmailDailyLimit} emails/day (${usedPct.toFixed(1)}%)`);

    if (usedPct >= 80) {
      const alertKey = 'gmail-warning';

      if (this.shouldSendAlert(alertKey)) {
        await sendAPIWarning(
          'Gmail/Nodemailer',
          used,
          this.config.gmailDailyLimit,
          20 // Google Workspace or transactional email service
        );
      }
    }

    if (usedPct >= 95) {
      const alertKey = 'gmail-critical';

      if (this.shouldSendAlert(alertKey, 15)) {
        await sendAPIWarning(
          'Gmail/Nodemailer - CRITICAL',
          used,
          this.config.gmailDailyLimit,
          20
        );
      }
    }
  }

  /**
   * Increment Gmail send counter
   * Call this after each email is sent
   */
  async incrementGmailUsage(): Promise<void> {
    const count = this.incrementCounter('gmail');
    console.log(`📈 Gmail usage: ${count}/${this.config.gmailDailyLimit} emails`);
    await this.monitorGmail();
  }

  /**
   * Check if Gmail quota allows another send
   */
  canSendEmail(): boolean {
    return this.getCounter('gmail') < this.config.gmailDailyLimit;
  }

  // ─── Aggregate stats & reset ──────────────────────────────────────────

  /**
   * Get current API usage statistics
   */
  async getUsageStats(): Promise<APIUsageStats> {
    return {
      theOddsAPI: {
        used: 0, // Calculated from response headers at request time
        remaining: 0,
        total: this.config.theOddsTotal,
        lastReset: new Date()
      },
      rapidAPI: {
        used: this.getCounter('rapidapi'),
        total: this.config.rapidAPITotal,
        lastReset: new Date()
      },
      geminiAPI: {
        used: this.getCounter('gemini'),
        total: this.config.geminiDailyLimit,
        lastReset: new Date()
      },
      gmail: {
        used: this.getCounter('gmail'),
        total: this.config.gmailDailyLimit,
        lastReset: new Date()
      }
    };
  }

  /**
   * Reset daily counters (call this at midnight via cron)
   */
  async resetDailyCounters(): Promise<void> {
    // Persist before clearing so we have a historical record
    await this.persistCountersToSupabase();

    // Clear all daily keys
    for (const key of dailyCounters.keys()) {
      dailyCounters.delete(key);
    }

    console.log(`🔄 Daily API counters reset at ${new Date().toISOString()}`);
  }
}

// Singleton instance
export const apiMonitoring = new APIMonitoringService();

// Convenience functions for middleware
export const monitorTheOddsAPI = (response: Response) => apiMonitoring.monitorTheOddsAPI(response);
export const monitorRapidAPI = () => apiMonitoring.monitorRapidAPI();
export const incrementRapidAPIUsage = () => apiMonitoring.incrementRapidAPIUsage();
export const incrementGeminiUsage = () => apiMonitoring.incrementGeminiUsage();
export const incrementGmailUsage = () => apiMonitoring.incrementGmailUsage();
export const canMakeGeminiRequest = () => apiMonitoring.canMakeGeminiRequest();
export const canSendEmail = () => apiMonitoring.canSendEmail();
export const getAPIUsageStats = () => apiMonitoring.getUsageStats();
export const restoreCounters = () => apiMonitoring.restoreCountersFromSupabase();

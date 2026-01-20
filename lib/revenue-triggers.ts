/**
 * Revenue Upgrade Trigger System
 * 
 * Monitors MRR and triggers upgrade recommendations when thresholds are met
 */

import { supabase } from './supabase';
import { sendRevenueTrigger } from './email-alerts';

export interface RevenueMetrics {
  mrr: number; // Monthly Recurring Revenue
  activeSubscriptions: number;
  averageRevenuePerUser: number;
  margin: number; // Platform margin (default 0.8)
}

export interface UpgradeThreshold {
  apiName: string;
  requiredMRR: number;
  upgradeCost: number;
  currentPlan: string;
  upgradeURL?: string;
}

class RevenueTriggerService {
  private thresholds: UpgradeThreshold[];
  private margin: number;

  constructor() {
    this.margin = parseFloat(process.env.PLATFORM_MARGIN || '0.8'); // 80% margin
    
    this.thresholds = [
      {
        apiName: 'TheOddsAPI',
        requiredMRR: parseFloat(process.env.THEODDS_UPGRADE_MRR || '250'),
        upgradeCost: 99,
        currentPlan: 'starter',
        upgradeURL: 'https://the-odds-api.com/#pricing'
      },
      {
        apiName: 'RapidAPI',
        requiredMRR: parseFloat(process.env.RAPIDAPI_UPGRADE_MRR || '75'),
        upgradeCost: 30,
        currentPlan: 'basic',
        upgradeURL: 'https://rapidapi.com/pricing'
      }
    ];
  }

  /**
   * Calculate current revenue metrics
   */
  async calculateRevenueMetrics(): Promise<RevenueMetrics> {
    try {
      const { data: subscriptions, error } = await supabase
        .from('subscriptions')
        .select('plan_amount, status')
        .eq('status', 'active');

      if (error) {
        console.error('❌ Error fetching subscriptions:', error);
        throw error;
      }

      const activeSubscriptions = subscriptions || [];
      const totalMRR = activeSubscriptions.reduce((sum, sub) => sum + (sub.plan_amount || 0), 0);
      const netMRR = totalMRR * this.margin;
      const averageRevenuePerUser = activeSubscriptions.length > 0 ? netMRR / activeSubscriptions.length : 0;

      return {
        mrr: netMRR,
        activeSubscriptions: activeSubscriptions.length,
        averageRevenuePerUser,
        margin: this.margin
      };
    } catch (error) {
      console.error('❌ Error calculating revenue metrics:', error);
      return {
        mrr: 0,
        activeSubscriptions: 0,
        averageRevenuePerUser: 0,
        margin: this.margin
      };
    }
  }

  /**
   * Check if any upgrade thresholds are met
   */
  async checkUpgradeTriggers(): Promise<void> {
    const metrics = await this.calculateRevenueMetrics();
    
    console.log(`💰 Revenue Metrics: $${metrics.mrr.toFixed(2)} MRR, ${metrics.activeSubscriptions} active users`);

    for (const threshold of this.thresholds) {
      await this.checkThreshold(threshold, metrics);
    }
  }

  /**
   * Check individual threshold and send alert if needed
   */
  private async checkThreshold(threshold: UpgradeThreshold, metrics: RevenueMetrics): Promise<void> {
    const alertKey = `${threshold.apiName.toLowerCase()}-upgrade`;
    
    if (metrics.mrr >= threshold.requiredMRR) {
      console.log(`🎯 ${threshold.apiName} upgrade threshold met: $${metrics.mrr.toFixed(2)} >= $${threshold.requiredMRR}`);
      
      // Calculate customers needed for upgrade
      const customersNeeded = Math.ceil(threshold.requiredMRR / (metrics.averageRevenuePerUser || 1));
      
      // Send upgrade trigger
      await sendRevenueTrigger(
        threshold.apiName,
        metrics.mrr,
        threshold.upgradeCost,
        customersNeeded
      );
      
      console.log(`📧 Upgrade alert sent for ${threshold.apiName}`);
    } else {
      const gap = threshold.requiredMRR - metrics.mrr;
      const customersNeeded = Math.ceil(gap / (metrics.averageRevenuePerUser || 1));
      
      console.log(`📊 ${threshold.apiName} upgrade gap: $${gap.toFixed(2)} needed (~${customersNeeded} customers)`);
    }
  }

  /**
   * Get next upgrade recommendation
   */
  async getNextUpgrade(): Promise<UpgradeThreshold | null> {
    const metrics = await this.calculateRevenueMetrics();
    
    // Find thresholds we're closest to meeting
    const sortedThresholds = this.thresholds
      .map(threshold => ({
        ...threshold,
        gap: threshold.requiredMRR - metrics.mrr,
        percentage: (metrics.mrr / threshold.requiredMRR) * 100
      }))
      .filter(threshold => threshold.gap > 0) // Only show upgrades we haven't qualified for yet
      .sort((a, b) => a.gap - b.gap); // Sort by smallest gap first

    return sortedThresholds[0] || null;
  }

  /**
   * Get all upgrade recommendations with current status
   */
  async getAllUpgradeStatus(): Promise<Array<UpgradeThreshold & { 
    currentMRR: number; 
    gap: number; 
    percentage: number; 
    qualified: boolean;
    customersNeeded: number;
  }>> {
    const metrics = await this.calculateRevenueMetrics();
    
    return this.thresholds.map(threshold => {
      const gap = Math.max(0, threshold.requiredMRR - metrics.mrr);
      const percentage = Math.min(100, (metrics.mrr / threshold.requiredMRR) * 100);
      const qualified = metrics.mrr >= threshold.requiredMRR;
      const customersNeeded = Math.ceil(gap / (metrics.averageRevenuePerUser || 1));
      
      return {
        ...threshold,
        currentMRR: metrics.mrr,
        gap,
        percentage,
        qualified,
        customersNeeded
      };
    });
  }

  /**
   * Simulate revenue scenarios
   */
  simulateScenario(userCount: number, averagePrice: number): RevenueMetrics {
    const totalMRR = userCount * averagePrice * this.margin;
    
    return {
      mrr: totalMRR,
      activeSubscriptions: userCount,
      averageRevenuePerUser: averagePrice * this.margin,
      margin: this.margin
    };
  }

  /**
   * Run daily revenue check (call this via cron job)
   */
  async runDailyRevenueCheck(): Promise<void> {
    console.log('🔄 Running daily revenue check...');
    
    try {
      await this.checkUpgradeTriggers();
      console.log('✅ Daily revenue check completed');
    } catch (error) {
      console.error('❌ Error in daily revenue check:', error);
    }
  }
}

// Singleton instance
export const revenueTriggers = new RevenueTriggerService();

// Convenience functions
export const checkUpgradeTriggers = () => revenueTriggers.checkUpgradeTriggers();
export const getNextUpgrade = () => revenueTriggers.getNextUpgrade();
export const getAllUpgradeStatus = () => revenueTriggers.getAllUpgradeStatus();
export const runDailyRevenueCheck = () => revenueTriggers.runDailyRevenueCheck();

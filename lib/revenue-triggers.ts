/**
 * Revenue Upgrade Trigger System
 *
 * Monitors MRR and triggers upgrade recommendations when thresholds are met.
 *
 * UPGRADE PRIORITY ORDER (Revenue-Critical First):
 * 1. TheOddsAPI ($100 MRR) - Core to SmartSlip picks
 * 2. RapidAPI ($150 MRR) - Sports research data
 * 3. Google Services ($250 MRR) - Email + Gemini AI consolidated
 * 4. Vercel ($400 MRR) - Hosting/serverless capacity
 * 5. Supabase ($600 MRR) - Database scaling
 *
 * BASELINE COSTS (Already Paying):
 * - Cloudflare Domain: $12/year ($1/month)
 */

import { supabase } from './supabase';
import { sendRevenueTrigger } from './email-alerts';

export interface RevenueMetrics {
  mrr: number; // Monthly Recurring Revenue (gross)
  netMRR: number; // After Flowglad's 20% fee
  activeSubscriptions: number;
  averageRevenuePerUser: number;
  margin: number; // Platform margin (default 0.8)
  totalFixedCosts: number; // Current fixed costs based on upgrades
  profitMargin: number; // (netMRR - fixedCosts) / netMRR
}

export interface UpgradeThreshold {
  apiName: string;
  requiredMRR: number;
  upgradeCost: number;
  currentPlan: string;
  upgradePlan: string;
  upgradeURL?: string;
  priority: number; // 1 = highest priority (upgrade first)
  category: 'revenue-critical' | 'infrastructure' | 'baseline';
  description: string;
}

// Baseline costs (already paying)
export const BASELINE_COSTS = {
  cloudflare_domain: {
    name: 'Cloudflare Domain',
    monthlyCost: 1, // $12/year
    description: 'Domain registration for serenitypocket.com'
  }
};

class RevenueTriggerService {
  private thresholds: UpgradeThreshold[];
  private margin: number;
  private baselineFixedCost: number;

  constructor() {
    this.margin = parseFloat(process.env.PLATFORM_MARGIN || '0.8'); // 80% margin after Flowglad
    this.baselineFixedCost = Object.values(BASELINE_COSTS).reduce((sum, cost) => sum + cost.monthlyCost, 0);

    // Ordered by priority (revenue-critical APIs first)
    this.thresholds = [
      {
        apiName: 'TheOddsAPI',
        requiredMRR: parseFloat(process.env.THEODDS_UPGRADE_MRR || '100'),
        upgradeCost: 99,
        currentPlan: 'starter (free)',
        upgradePlan: 'Pro',
        upgradeURL: 'https://the-odds-api.com/#pricing',
        priority: 1,
        category: 'revenue-critical',
        description: 'Core odds data for SmartSlip AI picks - upgrade when hitting rate limits'
      },
      {
        apiName: 'RapidAPI',
        requiredMRR: parseFloat(process.env.RAPIDAPI_UPGRADE_MRR || '150'),
        upgradeCost: 30,
        currentPlan: 'basic (free)',
        upgradePlan: 'Pro',
        upgradeURL: 'https://rapidapi.com/pricing',
        priority: 2,
        category: 'revenue-critical',
        description: 'Sports research data enrichment - upgrade for more API calls'
      },
      {
        apiName: 'Google Services',
        requiredMRR: parseFloat(process.env.GOOGLE_UPGRADE_MRR || '250'),
        upgradeCost: 50, // ~$7 Workspace + ~$43 Gemini API usage
        currentPlan: 'Gmail free + Gemini free tier',
        upgradePlan: 'Google Workspace + Gemini Pay-as-you-go',
        upgradeURL: 'https://workspace.google.com/pricing',
        priority: 3,
        category: 'revenue-critical',
        description: 'Professional email (info@domain) + expanded AI capacity for TiltLab/SmartSlip'
      },
      {
        apiName: 'Vercel',
        requiredMRR: parseFloat(process.env.VERCEL_UPGRADE_MRR || '400'),
        upgradeCost: 20,
        currentPlan: 'Hobby (free)',
        upgradePlan: 'Pro',
        upgradeURL: 'https://vercel.com/pricing',
        priority: 4,
        category: 'infrastructure',
        description: 'Hosting upgrade for more bandwidth (1TB) and serverless hours (1000hrs)'
      },
      {
        apiName: 'Supabase',
        requiredMRR: parseFloat(process.env.SUPABASE_UPGRADE_MRR || '600'),
        upgradeCost: 25,
        currentPlan: 'free',
        upgradePlan: 'Pro',
        upgradeURL: 'https://supabase.com/pricing',
        priority: 5,
        category: 'infrastructure',
        description: 'Database scaling - 8GB storage, daily backups, no pause on inactivity'
      }
    ];
  }

  /**
   * Calculate total fixed costs at a given MRR level
   */
  calculateFixedCostsAtMRR(mrr: number): number {
    let totalCosts = this.baselineFixedCost;

    for (const threshold of this.thresholds) {
      if (mrr >= threshold.requiredMRR) {
        totalCosts += threshold.upgradeCost;
      }
    }

    return totalCosts;
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
        console.error('Error fetching subscriptions:', error);
        throw error;
      }

      const activeSubscriptions = subscriptions || [];
      const grossMRR = activeSubscriptions.reduce((sum, sub) => sum + (sub.plan_amount || 0), 0);
      const netMRR = grossMRR * this.margin;
      const averageRevenuePerUser = activeSubscriptions.length > 0
        ? grossMRR / activeSubscriptions.length
        : 0;

      const totalFixedCosts = this.calculateFixedCostsAtMRR(grossMRR);
      const profitMargin = netMRR > 0 ? (netMRR - totalFixedCosts) / netMRR : 0;

      return {
        mrr: grossMRR,
        netMRR,
        activeSubscriptions: activeSubscriptions.length,
        averageRevenuePerUser,
        margin: this.margin,
        totalFixedCosts,
        profitMargin
      };
    } catch (error) {
      console.error('Error calculating revenue metrics:', error);
      return {
        mrr: 0,
        netMRR: 0,
        activeSubscriptions: 0,
        averageRevenuePerUser: 0,
        margin: this.margin,
        totalFixedCosts: this.baselineFixedCost,
        profitMargin: 0
      };
    }
  }

  /**
   * Check if any upgrade thresholds are met
   */
  async checkUpgradeTriggers(): Promise<void> {
    const metrics = await this.calculateRevenueMetrics();

    console.log(`\n=== Revenue Check ===`);
    console.log(`Gross MRR: $${metrics.mrr.toFixed(2)}`);
    console.log(`Net MRR (after Flowglad): $${metrics.netMRR.toFixed(2)}`);
    console.log(`Active Users: ${metrics.activeSubscriptions}`);
    console.log(`Fixed Costs: $${metrics.totalFixedCosts.toFixed(2)}/month`);
    console.log(`Profit: $${(metrics.netMRR - metrics.totalFixedCosts).toFixed(2)}/month`);
    console.log(`Profit Margin: ${(metrics.profitMargin * 100).toFixed(1)}%`);
    console.log(`====================\n`);

    for (const threshold of this.thresholds) {
      await this.checkThreshold(threshold, metrics);
    }
  }

  /**
   * Check individual threshold and send alert if needed
   */
  private async checkThreshold(threshold: UpgradeThreshold, metrics: RevenueMetrics): Promise<void> {
    const qualified = metrics.mrr >= threshold.requiredMRR;
    const gap = Math.max(0, threshold.requiredMRR - metrics.mrr);
    const customersNeeded = Math.ceil(gap / (metrics.averageRevenuePerUser || 20)); // Default $20 ARPU

    if (qualified) {
      console.log(`[UPGRADE READY] ${threshold.apiName}`);
      console.log(`  - Current: ${threshold.currentPlan} -> ${threshold.upgradePlan}`);
      console.log(`  - Cost: $${threshold.upgradeCost}/month`);
      console.log(`  - Reason: ${threshold.description}`);
      console.log(`  - URL: ${threshold.upgradeURL}`);

      // Send upgrade trigger email
      await sendRevenueTrigger(
        threshold.apiName,
        metrics.mrr,
        threshold.upgradeCost,
        customersNeeded
      );
    } else {
      console.log(`[PENDING] ${threshold.apiName}: $${gap.toFixed(2)} MRR needed (~${customersNeeded} more users)`);
    }
  }

  /**
   * Get upgrade roadmap - shows all upgrades in priority order with status
   */
  async getUpgradeRoadmap(): Promise<Array<UpgradeThreshold & {
    currentMRR: number;
    gap: number;
    percentage: number;
    qualified: boolean;
    usersNeeded: number;
    runningTotalCost: number;
  }>> {
    const metrics = await this.calculateRevenueMetrics();
    let runningTotalCost = this.baselineFixedCost;

    return this.thresholds
      .sort((a, b) => a.priority - b.priority)
      .map(threshold => {
        const gap = Math.max(0, threshold.requiredMRR - metrics.mrr);
        const percentage = Math.min(100, (metrics.mrr / threshold.requiredMRR) * 100);
        const qualified = metrics.mrr >= threshold.requiredMRR;
        const usersNeeded = Math.ceil(gap / (metrics.averageRevenuePerUser || 20));

        if (qualified) {
          runningTotalCost += threshold.upgradeCost;
        }

        return {
          ...threshold,
          currentMRR: metrics.mrr,
          gap,
          percentage,
          qualified,
          usersNeeded,
          runningTotalCost: qualified ? runningTotalCost : runningTotalCost + threshold.upgradeCost
        };
      });
  }

  /**
   * Get next recommended upgrade
   */
  async getNextUpgrade(): Promise<UpgradeThreshold | null> {
    const metrics = await this.calculateRevenueMetrics();

    // Find the highest priority upgrade we haven't qualified for yet
    const pendingUpgrades = this.thresholds
      .filter(t => metrics.mrr < t.requiredMRR)
      .sort((a, b) => a.priority - b.priority);

    return pendingUpgrades[0] || null;
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
      const customersNeeded = Math.ceil(gap / (metrics.averageRevenuePerUser || 20));

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
   * Simulate revenue scenarios for planning
   */
  simulateScenario(userCount: number, averagePrice: number = 30): {
    metrics: RevenueMetrics;
    upgrades: string[];
    totalFixedCosts: number;
    profit: number;
    profitMargin: number;
  } {
    const grossMRR = userCount * averagePrice;
    const netMRR = grossMRR * this.margin;
    const totalFixedCosts = this.calculateFixedCostsAtMRR(grossMRR);
    const profit = netMRR - totalFixedCosts;
    const profitMargin = netMRR > 0 ? profit / netMRR : 0;

    const upgrades = this.thresholds
      .filter(t => grossMRR >= t.requiredMRR)
      .map(t => t.apiName);

    return {
      metrics: {
        mrr: grossMRR,
        netMRR,
        activeSubscriptions: userCount,
        averageRevenuePerUser: averagePrice,
        margin: this.margin,
        totalFixedCosts,
        profitMargin
      },
      upgrades,
      totalFixedCosts,
      profit,
      profitMargin
    };
  }

  /**
   * Get break-even analysis
   */
  getBreakEvenAnalysis(): Array<{
    afterUpgrade: string;
    fixedCosts: number;
    breakEvenMRR: number;
    breakEvenUsers: number;
  }> {
    let runningCost = this.baselineFixedCost;
    const analysis = [{
      afterUpgrade: 'Baseline (Domain only)',
      fixedCosts: runningCost,
      breakEvenMRR: Math.ceil(runningCost / this.margin),
      breakEvenUsers: Math.ceil(runningCost / this.margin / 20)
    }];

    for (const threshold of this.thresholds.sort((a, b) => a.priority - b.priority)) {
      runningCost += threshold.upgradeCost;
      analysis.push({
        afterUpgrade: threshold.apiName,
        fixedCosts: runningCost,
        breakEvenMRR: Math.ceil(runningCost / this.margin),
        breakEvenUsers: Math.ceil(runningCost / this.margin / 20)
      });
    }

    return analysis;
  }

  /**
   * Run daily revenue check (call this via cron job)
   */
  async runDailyRevenueCheck(): Promise<void> {
    console.log('Running daily revenue check...');

    try {
      await this.checkUpgradeTriggers();

      // Also log the upgrade roadmap
      const roadmap = await this.getUpgradeRoadmap();
      console.log('\n=== Upgrade Roadmap ===');
      for (const item of roadmap) {
        const status = item.qualified ? 'READY' : `${item.percentage.toFixed(0)}%`;
        console.log(`${item.priority}. ${item.apiName} [${status}] - $${item.requiredMRR} MRR -> $${item.upgradeCost}/mo`);
      }
      console.log('========================\n');

      console.log('Daily revenue check completed');
    } catch (error) {
      console.error('Error in daily revenue check:', error);
    }
  }
}

// Singleton instance
export const revenueTriggers = new RevenueTriggerService();

// Convenience functions
export const checkUpgradeTriggers = () => revenueTriggers.checkUpgradeTriggers();
export const getNextUpgrade = () => revenueTriggers.getNextUpgrade();
export const getAllUpgradeStatus = () => revenueTriggers.getAllUpgradeStatus();
export const getUpgradeRoadmap = () => revenueTriggers.getUpgradeRoadmap();
export const getBreakEvenAnalysis = () => revenueTriggers.getBreakEvenAnalysis();
export const simulateScenario = (users: number, avgPrice?: number) => revenueTriggers.simulateScenario(users, avgPrice);
export const runDailyRevenueCheck = () => revenueTriggers.runDailyRevenueCheck();

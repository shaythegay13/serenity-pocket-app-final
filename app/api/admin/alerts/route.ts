/**
 * Admin Alerts Dashboard API
 * 
 * GET /api/admin/alerts - Returns current API usage, revenue metrics, and upgrade recommendations
 * Requires admin authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAPIUsageStats } from '@/lib/api-monitoring';
import { getAllUpgradeStatus, getNextUpgrade } from '@/lib/revenue-triggers';

// Admin authentication middleware
async function isAdmin(request: NextRequest): Promise<boolean> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return false;
    }

    const token = authHeader.substring(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return false;
    }

    // Check if user is admin (you might want to store this in user metadata)
    const isAdminUser = user.email === 'info@playmindlabs.com' || 
                      user.user_metadata?.role === 'admin' ||
                      user.email?.endsWith('@playmindlabs.com');

    return isAdminUser;
  } catch (error) {
    console.error('Admin auth error:', error);
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    if (!await isAdmin(request)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    // Get API usage statistics
    const apiUsage = await getAPIUsageStats();
    
    // Get revenue metrics and upgrade status
    const upgradeStatuses = await getAllUpgradeStatus();
    const nextUpgrade = await getNextUpgrade();

    // Calculate additional metrics
    const theOddsRemainingPct = apiUsage.theOddsAPI.total > 0 
      ? (apiUsage.theOddsAPI.remaining / apiUsage.theOddsAPI.total) * 100 
      : 0;

    const rapidAPIUsedPct = apiUsage.rapidAPI.total > 0 
      ? (apiUsage.rapidAPI.used / apiUsage.rapidAPI.total) * 100 
      : 0;

    // Determine alert levels
    const theOddsAlertLevel = theOddsRemainingPct <= 5 ? 'critical' : 
                            theOddsRemainingPct <= 25 ? 'warning' : 'normal';
    
    const rapidAPIAlertLevel = rapidAPIUsedPct >= 95 ? 'critical' : 
                             rapidAPIUsedPct >= 75 ? 'warning' : 'normal';

    const response = {
      success: true,
      data: {
        // API Usage
        api: {
          theOdds: {
            used: apiUsage.theOddsAPI.used,
            remaining: apiUsage.theOddsAPI.remaining,
            total: apiUsage.theOddsAPI.total,
            remainingPct: Math.round(theOddsRemainingPct * 10) / 10,
            alertLevel: theOddsAlertLevel,
            lastReset: apiUsage.theOddsAPI.lastReset
          },
          rapidAPI: {
            used: apiUsage.rapidAPI.used,
            total: apiUsage.rapidAPI.total,
            usedPct: Math.round(rapidAPIUsedPct * 10) / 10,
            alertLevel: rapidAPIAlertLevel,
            lastReset: apiUsage.rapidAPI.lastReset
          }
        },

        // Revenue & Upgrades
        revenue: {
          mrr: upgradeStatuses[0]?.currentMRR || 0,
          activeSubscriptions: upgradeStatuses[0]?.currentMRR > 0 ? 
            Math.round(upgradeStatuses[0].currentMRR / (upgradeStatuses[0].currentMRR / (upgradeStatuses[0].currentMRR > 0 ? 1 : 1))) : 0,
          nextUpgrade: nextUpgrade ? {
            apiName: nextUpgrade.apiName,
            requiredMRR: nextUpgrade.requiredMRR,
            upgradeCost: nextUpgrade.upgradeCost,
            gap: nextUpgrade.requiredMRR - (nextUpgrade as any).currentMRR,
            customersNeeded: Math.ceil((nextUpgrade.requiredMRR - (nextUpgrade as any).currentMRR) / ((nextUpgrade as any).currentMRR > 0 ? (nextUpgrade as any).currentMRR / 10 : 1)),
            upgradeURL: nextUpgrade.upgradeURL
          } : null
        },

        // All upgrade statuses
        upgrades: upgradeStatuses.map(status => ({
          apiName: status.apiName,
          currentMRR: status.currentMRR,
          requiredMRR: status.requiredMRR,
          gap: status.gap,
          percentage: Math.round(status.percentage),
          qualified: status.qualified,
          customersNeeded: status.customersNeeded,
          upgradeCost: status.upgradeCost,
          upgradeURL: status.upgradeURL
        })),

        // System health
        health: {
          overallAlertLevel: theOddsAlertLevel === 'critical' || rapidAPIAlertLevel === 'critical' ? 'critical' :
                           theOddsAlertLevel === 'warning' || rapidAPIAlertLevel === 'warning' ? 'warning' : 'normal',
          lastChecked: new Date().toISOString(),
          nextUpgradeImminent: nextUpgrade ? nextUpgrade.requiredMRR - (nextUpgrade as any).currentMRR < 50 : false
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Admin alerts API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    if (!await isAdmin(request)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'check-revenue':
        // Force check revenue triggers
        const { checkUpgradeTriggers } = await import('@/lib/revenue-triggers');
        await checkUpgradeTriggers();
        
        return NextResponse.json({
          success: true,
          message: 'Revenue check completed',
          timestamp: new Date().toISOString()
        });

      case 'reset-counters':
        // Reset daily API counters (admin only)
        const { apiMonitoring } = await import('@/lib/api-monitoring');
        await apiMonitoring.resetDailyCounters();
        
        return NextResponse.json({
          success: true,
          message: 'Daily counters reset',
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Admin alerts POST error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

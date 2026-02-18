/**
 * Daily Revenue Check Cron Job
 * 
 * Runs daily to check revenue thresholds and send upgrade recommendations
 * Trigger via: curl -X POST "http://localhost:3000/api/cron/daily-revenue-check?secret=CRON_SECRET"
 */

import { NextRequest, NextResponse } from 'next/server';
import { runDailyRevenueCheck } from '@/lib/revenue-triggers';
import { apiMonitoring } from '@/lib/api-monitoring';

// Verify cron secret for security (supports both query param and Vercel Bearer token)
function verifyCronSecret(request: NextRequest): boolean {
  const expectedSecret = process.env.CRON_SECRET;

  // Method 1: Vercel cron sends Authorization: Bearer <CRON_SECRET>
  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${expectedSecret}`) {
    return true;
  }

  // Method 2: Manual trigger via ?secret= query param
  const secret = request.nextUrl.searchParams.get('secret');
  if (secret && secret === expectedSecret) {
    return true;
  }

  console.error('❌ Invalid cron secret provided');
  return false;
}

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    if (!verifyCronSecret(request)) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid cron secret' },
        { status: 401 }
      );
    }

    console.log('🕐 Starting daily revenue and API check...');

    // 0. Restore counters from Supabase (handles cold starts after redeploy)
    console.log('♻️ Restoring API counters from Supabase...');
    await apiMonitoring.restoreCountersFromSupabase();

    // 1. Get current API usage snapshot before reset
    const usageStats = await apiMonitoring.getUsageStats();
    console.log('📊 Current API usage:', JSON.stringify(usageStats, null, 2));

    // 2. Run revenue upgrade triggers
    console.log('💰 Checking revenue upgrade triggers...');
    await runDailyRevenueCheck();

    // 3. Reset daily API counters (persists to Supabase, then clears in-memory)
    console.log('🔄 Resetting daily API counters...');
    await apiMonitoring.resetDailyCounters();

    // 4. Log completion
    const timestamp = new Date().toISOString();
    console.log(`✅ Daily revenue check completed at ${timestamp}`);

    return NextResponse.json({
      success: true,
      message: 'Daily revenue and API check completed successfully',
      timestamp,
      usageSnapshot: usageStats,
      checks: ['counter-restore', 'revenue-triggers', 'api-counters-reset']
    });

  } catch (error) {
    console.error('❌ Error in daily revenue check:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // For testing purposes - allow GET requests with secret
  return POST(request);
}

/**
 * Daily Revenue Check Cron Job
 * 
 * Runs daily to check revenue thresholds and send upgrade recommendations
 * Trigger via: curl -X POST "http://localhost:3000/api/cron/daily-revenue-check?secret=CRON_SECRET"
 */

import { NextRequest, NextResponse } from 'next/server';
import { runDailyRevenueCheck } from '@/lib/revenue-triggers';
import { apiMonitoring } from '@/lib/api-monitoring';

// Verify cron secret for security
function verifyCronSecret(request: NextRequest): boolean {
  const secret = request.nextUrl.searchParams.get('secret');
  const expectedSecret = process.env.CRON_SECRET;
  
  if (!secret || secret !== expectedSecret) {
    console.error('❌ Invalid cron secret provided');
    return false;
  }
  
  return true;
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

    // 1. Run revenue upgrade triggers
    console.log('💰 Checking revenue upgrade triggers...');
    await runDailyRevenueCheck();

    // 2. Reset daily API counters (if needed)
    console.log('🔄 Resetting daily API counters...');
    await apiMonitoring.resetDailyCounters();

    // 3. Log completion
    const timestamp = new Date().toISOString();
    console.log(`✅ Daily revenue check completed at ${timestamp}`);

    return NextResponse.json({
      success: true,
      message: 'Daily revenue and API check completed successfully',
      timestamp,
      checks: ['revenue-triggers', 'api-counters-reset']
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

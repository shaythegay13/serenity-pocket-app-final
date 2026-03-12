import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Weekly AI Usage Reset Cron Job
 * 
 * This endpoint should be called every Monday at 00:00 UTC via Vercel Cron
 * or a similar scheduling service.
 * 
 * It cleans up expired purchased credits and optionally archives old usage data.
 */
export async function GET(request: NextRequest) {
  try {
    const secret = request.headers.get('authorization')
    if (!process.env.CRON_SECRET || secret !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Weekly Reset] Starting weekly AI usage reset...')

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 1. Clean up expired purchased credits (if expiration is implemented)
    const { data: expiredCredits, error: deleteError } = await supabaseAdmin
      .from('ai_usage_purchases')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select()

    if (deleteError) {
      console.error('[Weekly Reset] Error deleting expired credits:', deleteError)
    } else {
      console.log(`[Weekly Reset] Deleted ${expiredCredits?.length || 0} expired credit purchases`)
    }

    // 2. Archive old usage data (optional - keep last 90 days for analytics)
    // This is optional since we filter by week_start_date in queries anyway
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const { data: archivedUsage, error: archiveError } = await supabaseAdmin
      .from('ai_service_usage')
      .delete()
      .lt('created_at', ninetyDaysAgo.toISOString())
      .select('id')

    if (archiveError) {
      console.error('[Weekly Reset] Error archiving old usage:', archiveError)
    } else {
      console.log(`[Weekly Reset] Archived ${archivedUsage?.length || 0} old usage records`)
    }

    // 3. Log reset completion
    console.log('[Weekly Reset] Weekly reset completed successfully')

    return NextResponse.json({
      success: true,
      message: 'Weekly reset completed',
      stats: {
        expiredCreditsDeleted: expiredCredits?.length || 0,
        oldUsageArchived: archivedUsage?.length || 0,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('[Weekly Reset] Unexpected error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Weekly reset failed',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request)
}

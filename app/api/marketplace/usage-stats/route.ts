import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { getUserAIUsageStats } from '@/lib/ai-usage-tracker'

/**
 * GET /api/marketplace/usage-stats
 * 
 * Get user's current AI service usage statistics
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseServer

    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : undefined

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stats = await getUserAIUsageStats(supabase, user.id)

    return NextResponse.json({ 
      success: true,
      stats 
    })
  } catch (error) {
    console.error('[Marketplace Usage Stats] Unexpected error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch usage statistics'
      },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { getUserAIUsageStats } from '@/lib/ai-usage-tracker'

export const runtime = 'nodejs'

/**
 * GET /api/marketplace/usage-stats
 * 
 * Get user's current AI service usage statistics
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseServer

    const {
      data: { user: cookieUser },
    } = await supabase.auth.getUser()

    if (cookieUser?.id) {
      const stats = await getUserAIUsageStats(supabase, cookieUser.id)

      return NextResponse.json({
        success: true,
        stats,
      })
    }

    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : undefined

    if (!token) {
      console.warn('[Marketplace Usage Stats] Unauthorized: missing bearer token and no cookie session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fall back to verifying Bearer tokens (useful for non-browser clients).
    const {
      data: { user },
      error: authError,
    } = await supabaseServer.auth.getUser(token)

    if (authError || !user) {
      console.warn('[Marketplace Usage Stats] Unauthorized: bearer token invalid', {
        hasUser: !!user,
        message: authError?.message,
      })

      const extra =
        process.env.NODE_ENV === 'development'
          ? { authError: authError ? { message: authError.message } : null }
          : {}

      return NextResponse.json({ error: 'Unauthorized', ...extra }, { status: 401 })
    }

    // Note: use a server key client for stats access in token mode.
    const stats = await getUserAIUsageStats(supabaseServer, user.id)

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

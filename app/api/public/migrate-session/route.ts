import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { surveyService } from '@/lib/services/survey-service'

const COOKIE_NAME = 'pml_anon_session'

function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
}

/**
 * POST /api/public/migrate-session
 *
 * Migrates all anonymous session data to an authenticated user.
 * Requires Bearer token authentication.
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : undefined

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized', details: 'No authorization token provided' },
        { status: 401 }
      )
    }

    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', details: authError?.message },
        { status: 401 }
      )
    }

    // Get anonymous session ID from body and/or cookie
    const body = await request.json().catch(() => ({}))
    const cookieSessionId = request.cookies.get(COOKIE_NAME)?.value
    const sessionId = body.anonymous_session_id || cookieSessionId

    if (!sessionId || !isValidUUID(sessionId)) {
      return NextResponse.json(
        { error: 'No valid anonymous session found to migrate' },
        { status: 400 }
      )
    }

    // Call RPC function to migrate all data
    const { data: migratedCount, error: rpcError } = await supabaseServer.rpc(
      'migrate_anonymous_session_to_user',
      {
        p_anonymous_session_id: sessionId,
        p_user_id: user.id,
      }
    )

    if (rpcError) {
      console.error('[Session Migration] RPC error:', rpcError)
      return NextResponse.json(
        { error: 'Migration failed', details: rpcError.message },
        { status: 500 }
      )
    }

    // Sync migrated survey scores to user_profiles
    await surveyService.syncProfileFromLatestSurvey(user.id)

    // Clear the httpOnly cookie
    const response = NextResponse.json({
      success: true,
      migratedCount: migratedCount || 0,
    })
    response.cookies.delete(COOKIE_NAME)

    console.log('[Session Migration] Success:', {
      userId: user.id,
      sessionId,
      migratedCount,
    })

    return response
  } catch (error) {
    console.error('[Session Migration] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

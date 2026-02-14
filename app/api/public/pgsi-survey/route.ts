import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { PGSI_SB_QUESTIONS } from '@/lib/research-anchors'

const COOKIE_NAME = 'pml_anon_session'

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000
const MAX_REQUESTS = 5

function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }
  if (record.count >= MAX_REQUESTS) return false
  record.count++
  return true
}

/**
 * POST /api/public/pgsi-survey
 *
 * Stores a PGSI-SB survey submission for anonymous users.
 */
export async function POST(request: NextRequest) {
  try {
    const forwarded = request.headers.get('x-forwarded-for')
    const real = request.headers.get('x-real-ip')
    const clientIp = forwarded?.split(',')[0] || real || 'unknown'

    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { anonymous_session_id, responses, score, category } = body

    // Get session ID from body or cookie fallback
    const cookieSessionId = request.cookies.get(COOKIE_NAME)?.value
    const sessionId = anonymous_session_id || cookieSessionId

    if (!sessionId || !isValidUUID(sessionId)) {
      return NextResponse.json(
        { error: 'Valid anonymous_session_id required' },
        { status: 400 }
      )
    }

    // Validate responses
    if (!Array.isArray(responses) || responses.length !== PGSI_SB_QUESTIONS.length) {
      return NextResponse.json(
        { error: `Expected ${PGSI_SB_QUESTIONS.length} responses` },
        { status: 400 }
      )
    }

    // Validate score
    if (typeof score !== 'number' || score < 0) {
      return NextResponse.json({ error: 'Valid score required' }, { status: 400 })
    }

    // Store in survey_responses with null user_id
    const { data, error } = await supabaseServer
      .from('survey_responses')
      .insert({
        user_id: null,
        anonymous_session_id: sessionId,
        email: null,
        responses: {
          _surveyType: 'pgsi_sb',
          _category: category,
          questions: responses,
        },
        score,
        is_initial_survey: false,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[Public PGSI Survey] Insert error:', error)
      return NextResponse.json(
        { error: 'Failed to save survey', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, surveyId: data.id, score, category },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Public PGSI Survey] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

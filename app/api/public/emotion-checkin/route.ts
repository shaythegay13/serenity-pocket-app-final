import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

const COOKIE_NAME = 'pml_anon_session'

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS = 10

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

const VALID_PHASES = ['before', 'during', 'after'] as const
const VALID_EMOTIONS = [
  // Core emotions
  'joy', 'calm', 'fear', 'greed', 'frustration', 'sadness',
  // Sub-emotions (all 60)
  'Happy', 'Excited', 'Optimistic', 'Grateful', 'Confident', 'Proud', 'Hopeful', 'Content', 'Cheerful', 'Inspired',
  'Peaceful', 'Relaxed', 'Centered', 'Focused', 'Balanced', 'Serene', 'Patient', 'Composed', 'Tranquil', 'Stable',
  'Anxious', 'Worried', 'Nervous', 'Scared', 'Uncertain', 'Panicked', 'Hesitant', 'Overwhelmed', 'Tense', 'Uneasy',
  'FOMO', 'Euphoric', 'Impulsive', 'Overconfident', 'Eager', 'Craving', 'Obsessed', 'Compulsive', 'Restless', 'Driven',
  'Angry', 'Irritated', 'Disappointed', 'Impatient', 'Stressed', 'Resentful', 'Annoyed', 'Agitated', 'Bitter', 'Exhausted',
  'Down', 'Discouraged', 'Regretful', 'Defeated', 'Helpless', 'Lonely', 'Empty', 'Hopeless', 'Dejected', 'Grief',
]

/**
 * POST /api/public/emotion-checkin
 *
 * Stores an emotion check-in for anonymous users.
 * No authentication required -- uses anonymous_session_id.
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP
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
    const { anonymous_session_id, emotion, intensity, phase, context, bet_amount, bet_odds, game_description, is_live_bet } = body

    // Get session ID from body or cookie fallback
    const cookieSessionId = request.cookies.get(COOKIE_NAME)?.value
    const sessionId = anonymous_session_id || cookieSessionId

    if (!sessionId || !isValidUUID(sessionId)) {
      return NextResponse.json(
        { error: 'Valid anonymous_session_id required' },
        { status: 400 }
      )
    }

    // Validate emotion
    if (!emotion || typeof emotion !== 'string') {
      return NextResponse.json({ error: 'emotion is required' }, { status: 400 })
    }

    // Validate intensity (1-5 scale matching authenticated version)
    if (typeof intensity !== 'number' || intensity < 1 || intensity > 5) {
      return NextResponse.json({ error: 'intensity must be 1-5' }, { status: 400 })
    }

    // Validate phase
    if (!phase || !VALID_PHASES.includes(phase)) {
      return NextResponse.json({ error: 'phase must be before, during, or after' }, { status: 400 })
    }

    // Build notes field with context and betting data
    const notesParts: string[] = []
    if (context) notesParts.push(context)
    if (bet_amount || bet_odds || game_description) {
      const bettingMeta = JSON.stringify({
        bet_amount: bet_amount || null,
        bet_odds: bet_odds || null,
        game_description: game_description || null,
        is_live_bet: is_live_bet || false,
      })
      notesParts.push(`[betting_data:${bettingMeta}]`)
    }

    // Insert into emotion_logs with null user_id
    const { data, error } = await supabaseServer
      .from('emotion_logs')
      .insert({
        user_id: null,
        anonymous_session_id: sessionId,
        emotion,
        intensity,
        phase,
        notes: notesParts.length > 0 ? notesParts.join('\n') : null,
        timestamp: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error) {
      console.error('[Public Emotion Check-in] Insert error:', error)
      return NextResponse.json(
        { error: 'Failed to save emotion check-in', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, emotionId: data.id }, { status: 201 })
  } catch (error) {
    console.error('[Public Emotion Check-in] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

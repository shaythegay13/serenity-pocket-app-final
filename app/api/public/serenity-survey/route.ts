import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { SURVEY_QUESTIONS, type SurveyAnswer } from '@/types/survey'
import { calculateSurveyScore } from '@/lib/surveyValidation'
import { computeArchetypeFromSnapshot } from '@/lib/archetypes'

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
 * POST /api/public/serenity-survey
 *
 * Stores a Serenity survey submission for anonymous users.
 * Computes score and archetype server-side.
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
    const { anonymous_session_id, responses } = body

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
    if (!Array.isArray(responses) || responses.length !== SURVEY_QUESTIONS.length) {
      return NextResponse.json(
        { error: `Expected ${SURVEY_QUESTIONS.length} responses` },
        { status: 400 }
      )
    }

    // Calculate score server-side
    const score = responses.reduce((acc: number, r: SurveyAnswer) => {
      const q = SURVEY_QUESTIONS.find((question) => question.id === r.questionId)
      if (!q) return acc

      // Normalize to array for multi-select support
      const selectedOptions = Array.isArray(r.selectedOption)
        ? r.selectedOption
        : [r.selectedOption]

      const questionScore = selectedOptions.reduce((sum, opt) => {
        const idx = q.options.indexOf(opt)
        return sum + (idx >= 0 ? q.weight[idx] : 0)
      }, 0)

      return acc + questionScore
    }, 0)
    // Compute archetype
    const archetype = computeArchetypeFromSnapshot(responses)

    // Store in survey_responses with null user_id
    const { data, error } = await supabaseServer
      .from('survey_responses')
      .insert({
        user_id: null,
        anonymous_session_id: sessionId,
        email: null,
        responses: {
          _surveyType: 'serenity',
          _archetype: archetype.name,
          questions: responses,
        },
        score,
        is_initial_survey: true,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[Public Serenity Survey] Insert error:', error)
      return NextResponse.json(
        { error: 'Failed to save survey', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        surveyId: data.id,
        score,
        archetype: {
          name: archetype.name,
          description: archetype.description,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Public Serenity Survey] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

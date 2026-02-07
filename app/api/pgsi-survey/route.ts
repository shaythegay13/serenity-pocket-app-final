import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

/**
 * POST /api/pgsi-survey
 *
 * Saves PGSI-SB (Problem Gambling Severity Index - Sports Betting) survey responses.
 * This data feeds into the anchored risk assessment system.
 *
 * Note: We store PGSI-SB surveys in the same survey_responses table as other surveys,
 * but mark them with a _surveyType field in the responses JSON for identification.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseServer

    // Extract token from Authorization header
    const authHeader = request.headers.get("authorization") || ""
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : undefined

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized", details: "No authorization token provided" },
        { status: 401 }
      )
    }

    // Authenticate user with token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", details: authError?.message },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { responses, score, category } = body

    if (!responses || typeof score !== 'number') {
      return NextResponse.json(
        { error: "Missing required fields: responses and score" },
        { status: 400 }
      )
    }

    // Add survey type marker to responses for identification
    const responsesWithType = {
      _surveyType: 'pgsi_sb',
      _category: category,
      questions: responses
    }

    // Save to survey_responses table
    // We use the existing schema without survey_type column
    const { data: surveyData, error: surveyError } = await supabase
      .from('survey_responses')
      .insert({
        user_id: user.id,
        email: user.email,
        responses: responsesWithType,
        score: score,
        is_initial_survey: false
      })
      .select('id')
      .single()

    if (surveyError) {
      console.error("[PGSI-SB Survey] Error saving survey:", surveyError)
      return NextResponse.json(
        { error: "Failed to save survey", details: surveyError.message },
        { status: 500 }
      )
    }

    console.log("[PGSI-SB Survey] Saved successfully for user:", user.id, {
      score,
      category,
      responseCount: responses.length,
      surveyId: surveyData?.id
    })

    return NextResponse.json({
      success: true,
      score,
      category,
      surveyId: surveyData?.id
    })

  } catch (error) {
    console.error("[PGSI-SB Survey] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/pgsi-survey
 *
 * Retrieves the user's most recent PGSI-SB survey results.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseServer

    // Extract token from Authorization header
    const authHeader = request.headers.get("authorization") || ""
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : undefined

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized", details: "No authorization token provided" },
        { status: 401 }
      )
    }

    // Authenticate user with token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", details: authError?.message },
        { status: 401 }
      )
    }

    // Fetch all recent surveys and filter for PGSI-SB type
    const { data: surveys, error: surveyError } = await supabase
      .from('survey_responses')
      .select('id, responses, score, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (surveyError) {
      console.error("[PGSI-SB Survey] Error fetching surveys:", surveyError)
      return NextResponse.json(
        { error: "Failed to fetch survey", details: surveyError.message },
        { status: 500 }
      )
    }

    // Find the most recent PGSI-SB survey by checking responses._surveyType
    const pgsiSurvey = surveys?.find(s => {
      const responses = s.responses as any
      return responses?._surveyType === 'pgsi_sb'
    })

    if (!pgsiSurvey) {
      return NextResponse.json({
        hasSurvey: false,
        score: null,
        category: null,
        completedAt: null
      })
    }

    const responses = pgsiSurvey.responses as any

    // Determine category from score
    let category = responses._category || 'Non-problem gambler'
    if (!responses._category) {
      if (pgsiSurvey.score >= 8) {
        category = 'Problem gambler'
      } else if (pgsiSurvey.score >= 3) {
        category = 'Moderate-risk gambler'
      } else if (pgsiSurvey.score >= 1) {
        category = 'Low-risk gambler'
      }
    }

    return NextResponse.json({
      hasSurvey: true,
      score: pgsiSurvey.score,
      category,
      completedAt: pgsiSurvey.created_at,
      surveyId: pgsiSurvey.id
    })

  } catch (error) {
    console.error("[PGSI-SB Survey] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

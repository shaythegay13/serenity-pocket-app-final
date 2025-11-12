import { NextResponse } from "next/server"
import { getScoreInterpretation } from "@/types/survey"
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET() {
  // Create server-side Supabase client with cookies
  const cookieStore = await cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  // Get the user from the current session
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  try {
    // Fetch survey history directly with the authenticated client
    // Only select the columns we need to avoid permission issues with foreign key joins
    const { data, error } = await supabase
      .from('survey_responses')
      .select('id, user_id, email, responses, score, created_at, linked_at, is_initial_survey')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch survey history: ${error.message}`)
    }

    // Return null if no surveys found
    if (!data || data.length === 0) {
      return NextResponse.json(null)
    }

    // Get the latest survey (first in array since they're ordered by created_at DESC)
    const latestSurvey = data[0]

    // Map to legacy format for backward compatibility with frontend
    const legacyFormat = {
      user_id: latestSurvey.user_id,
      score: latestSurvey.score,
      risk_level: getScoreInterpretation(latestSurvey.score),
      answers: latestSurvey.responses, // Map responses to answers
      completed_at: latestSurvey.created_at,
    }

    return NextResponse.json(legacyFormat)
  } catch (error) {
    console.error("Error fetching survey results:", error)
    return NextResponse.json(
      { error: "Failed to retrieve survey results" },
      { status: 500 }
    )
  }
}

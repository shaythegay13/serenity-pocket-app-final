import { NextResponse } from "next/server"
import { getScoreInterpretation } from "@/types/survey"
import { supabaseServer } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = supabaseServer

    // Get the user from the current session
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error("Auth error:", authError)
      return NextResponse.json(
        { error: "Authentication failed", details: authError.message },
        { status: 401 }
      )
    }

    if (!user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    console.log("Fetching survey results for user:", user.id)

    // Fetch survey history directly with the authenticated client
    // Only select the columns we need to avoid permission issues with foreign key joins
    const { data, error } = await supabase
      .from('survey_responses')
      .select('id, user_id, email, responses, score, created_at, linked_at, is_initial_survey')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error("Error fetching survey responses:", error)
      throw new Error(`Failed to fetch survey history: ${error.message}`)
    }

    // Return null if no surveys found
    if (!data || data.length === 0) {
      console.log("No survey responses found for user")
      return NextResponse.json(null)
    }

    // Get the latest survey (first in array since they're ordered by created_at DESC)
    const latestSurvey = data[0]
    console.log("Latest survey found:", latestSurvey.id)

    // Fetch user profile to get archetype
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('survey_data')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error("Error fetching user profile:", profileError)
      // Don't throw - just continue without archetype
    }

    const surveyData = (profileData?.survey_data as any) || {}
    console.log("User archetype:", surveyData.userType || "none")

    // Map to legacy format for backward compatibility with frontend
    const legacyFormat = {
      user_id: latestSurvey.user_id,
      score: latestSurvey.score,
      risk_level: getScoreInterpretation(latestSurvey.score),
      answers: latestSurvey.responses, // Map responses to answers
      completed_at: latestSurvey.created_at,
      userType: surveyData.userType, // Include archetype from user_profiles
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

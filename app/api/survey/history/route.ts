import { NextResponse } from "next/server"
import { supabaseServer } from '@/lib/supabase-server'

export async function GET() {
  const supabase = supabaseServer

  // Get the user from the current session
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  try {
    // Fetch all survey history for the user
    const { data, error } = await supabase
      .from('survey_responses')
      .select('id, score, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch survey history: ${error.message}`)
    }

    // Return empty array if no surveys found
    if (!data || data.length === 0) {
      return NextResponse.json([])
    }

    // Map to a simpler format
    const history = data.map((survey) => ({
      date: survey.created_at,
      score: survey.score,
    }))

    return NextResponse.json(history)
  } catch (error) {
    console.error("Error fetching survey history:", error)
    return NextResponse.json(
      { error: "Failed to retrieve survey history" },
      { status: 500 }
    )
  }
}

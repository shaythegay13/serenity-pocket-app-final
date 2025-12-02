import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || ""
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : undefined

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseServer.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = user.id

    // Best-effort purge of all user-owned data before deleting auth record
    try {
      const tablesWithUserId = [
        "emotion_logs",
        "trades",
        "bias_profiles",
        "bias_quiz_history",
        "achievements",
        "challenges",
        "game_lines",
        "bet_analyses",
        "survey_responses",
      ]

      // Delete from tables that reference user_id
      for (const table of tablesWithUserId) {
        const { error } = await supabaseServer
          .from(table)
          .delete()
          .eq("user_id", userId)

        if (error) {
          console.warn(`Error deleting user data from ${table}:`, error)
        }
      }

      // Delete the primary user profile row (keyed by id)
      const { error: profileDeleteError } = await supabaseServer
        .from("user_profiles")
        .delete()
        .eq("id", userId)

      if (profileDeleteError) {
        console.warn("Error deleting user profile:", profileDeleteError)
      }
    } catch (dataDeleteError) {
      console.warn("Non-fatal error while purging user data:", dataDeleteError)
      // Continue to auth user deletion so the account is still removed
    }

    const { error: deleteError } = await supabaseServer.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error("Error deleting user account:", deleteError)
      return NextResponse.json(
        { error: "Failed to delete account" },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Fatal error in delete account handler:", error)
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 },
    )
  }
}

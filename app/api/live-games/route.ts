/**
 * Live Games API Route
 *
 * GET /api/live-games?sport={sport}&gameId={gameId}
 *
 * Returns live game data including scores, status, and play-by-play
 */

import { NextRequest, NextResponse } from "next/server"
import { getLiveGames } from "@/lib/services/data-aggregator"
import type { SupportedSportKey } from "@/lib/types"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get("sport") as SupportedSportKey || "nfl"
    const gameId = searchParams.get("gameId") || undefined

    // Validate sport
    const validSports: SupportedSportKey[] = ["nfl", "nba", "mlb", "nhl"]
    if (!validSports.includes(sport)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid sport. Must be one of: ${validSports.join(", ")}`,
        },
        { status: 400 }
      )
    }

    // Fetch live games from aggregator
    const response = await getLiveGames(sport, gameId)

    if (!response.success) {
      return NextResponse.json(response, { status: 500 })
    }

    // Add CORS headers for real-time updates
    const headers = {
      "Cache-Control": "no-store, max-age=0",
      "X-Refresh-Rate": "5000", // Suggest 5 second refresh
    }

    return NextResponse.json(response, { headers })

  } catch (error) {
    console.error("Live games API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        data: [],
        source: "error",
        timestamp: new Date(),
      },
      { status: 500 }
    )
  }
}

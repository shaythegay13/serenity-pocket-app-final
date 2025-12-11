/**
 * Betting Trends API Route
 *
 * GET /api/betting-trends?sport={sport}&gameId={gameId}
 *
 * Returns betting trends including sharp money indicators and public/professional splits
 */

import { NextRequest, NextResponse } from "next/server"
import { getBettingTrends } from "@/lib/services/data-aggregator"
import { detectSharpMoneyIndicators } from "@/lib/utils/betting-calculations"
import type { SupportedSportKey } from "@/lib/types"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = (searchParams.get("sport") as SupportedSportKey) || "americanfootball_nfl"
    const gameId = searchParams.get("gameId")

    if (!gameId) {
      return NextResponse.json(
        {
          success: false,
          error: "gameId parameter is required",
        },
        { status: 400 }
      )
    }

    // Validate sport against app-wide SupportedSportKey values
    const validSports: SupportedSportKey[] = [
      "americanfootball_nfl",
      "basketball_nba",
      "baseball_mlb",
      "icehockey_nhl",
    ]
    if (!validSports.includes(sport)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid sport. Must be one of: ${validSports.join(", ")}`,
        },
        { status: 400 }
      )
    }

    // Fetch betting trends from aggregator
    const response = await getBettingTrends(sport, gameId)

    if (!response.success) {
      return NextResponse.json(response, { status: 500 })
    }

    // Enhance with additional analysis
    const enhancedData = {
      ...response.data,
      insights: {
        topSharpPlays: response.data.sharpMoneyIndicators
          .filter(ind => ind.confidence === "extreme" || ind.confidence === "high")
          .slice(0, 3),
        publicFavorites: [] as any[], // Would calculate from splits
        contrarianOpportunities: [] as any[], // Where sharp disagrees with public
      },
    }

    return NextResponse.json({
      ...response,
      data: enhancedData,
    })

  } catch (error) {
    console.error("Betting trends API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        source: "error",
        timestamp: new Date(),
      },
      { status: 500 }
    )
  }
}

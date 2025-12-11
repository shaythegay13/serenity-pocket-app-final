/**
 * Live Odds API Route
 *
 * GET /api/live-odds?sport={sport}&gameId={gameId}
 *
 * Returns real-time odds from multiple sportsbooks with best odds highlighted
 */

import { NextRequest, NextResponse } from "next/server"
import { getLiveOdds } from "@/lib/services/data-aggregator"
import { findBestOdds, calculateConsensusOdds } from "@/lib/utils/betting-calculations"
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

    // Fetch live odds from aggregator
    const response = await getLiveOdds(sport, gameId)

    if (!response.success) {
      return NextResponse.json(response, { status: 500 })
    }

    // Enhance each game with best odds and consensus
    const enhancedData = response.data.map(game => {
      const bestMoneyline = findBestOdds(game.bookmakers, "moneyline")
      const bestSpread = findBestOdds(game.bookmakers, "spread")
      const bestTotal = findBestOdds(game.bookmakers, "total")

      const consensusMoneyline = calculateConsensusOdds(game.bookmakers, "moneyline")
      const consensusSpread = calculateConsensusOdds(game.bookmakers, "spread")
      const consensusTotal = calculateConsensusOdds(game.bookmakers, "total")

      return {
        ...game,
        bestOdds: {
          moneyline: {
            home: {
              bookmaker: bestMoneyline.bestHome.bookmaker,
              odds: { value: bestMoneyline.bestHome.odds },
            },
            away: {
              bookmaker: bestMoneyline.bestAway.bookmaker,
              odds: { value: bestMoneyline.bestAway.odds },
            },
          },
          spread: {
            home: {
              bookmaker: bestSpread.bestHome.bookmaker,
              odds: { value: bestSpread.bestHome.odds, point: bestSpread.bestHome.point },
            },
            away: {
              bookmaker: bestSpread.bestAway.bookmaker,
              odds: { value: bestSpread.bestAway.odds, point: bestSpread.bestAway.point },
            },
          },
          total: {
            over: {
              bookmaker: bestTotal.bestOver.bookmaker,
              odds: { value: bestTotal.bestOver.odds, point: bestTotal.bestOver.point },
            },
            under: {
              bookmaker: bestTotal.bestUnder.bookmaker,
              odds: { value: bestTotal.bestUnder.odds, point: bestTotal.bestUnder.point },
            },
          },
        },
        consensus: {
          moneyline: consensusMoneyline,
          spread: consensusSpread,
          total: consensusTotal,
        },
      }
    })

    return NextResponse.json({
      ...response,
      data: enhancedData,
    })

  } catch (error) {
    console.error("Live odds API error:", error)
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

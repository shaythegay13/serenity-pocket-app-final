import { NextResponse } from "next/server"
import { fetchLiveOdds, transformOddsForDisplay } from "@/lib/odds-api"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const sport = searchParams.get("sport") || "basketball_nba"

    const result = await fetchLiveOdds(sport)

    if (!result.success || !result.data) {
      return NextResponse.json({ success: false, error: result.error || "Failed to fetch odds" }, { status: 500 })
    }

    const transformed = transformOddsForDisplay(result.data)
    return NextResponse.json({ success: true, data: transformed, remainingRequests: result.remainingRequests })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Unexpected error" }, { status: 500 })
  }
}

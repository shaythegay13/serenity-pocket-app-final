import { NextResponse } from "next/server"
import { fetchSportData, fetchTeamRoster, Player } from "@/lib/sports-data-service"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport') || 'americanfootball_nfl'
    const teamId = searchParams.get('teamId')

    // Fetch sport data
    const sportData = await fetchSportData(sport)
    
    // If teamId is provided, fetch roster for that team
    let roster: Player[] = []
    if (teamId) {
      roster = await fetchTeamRoster(sport, teamId)
    }

    return NextResponse.json({
      success: true,
      data: {
        teams: sportData.teams,
        players: sportData.players,
        roster: roster,
        lastUpdated: sportData.lastUpdated
      }
    })
  } catch (error) {
    console.error('Team analytics API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch team analytics data",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

// Lightweight TheSportsDB client for fixtures
// Uses v2 API documented at https://www.thesportsdb.com/free_sports_api

export interface SportsDBFixture {
  id: string
  homeTeam: string
  awayTeam: string
  commenceTime: Date
}

interface SportsDBEvent {
  idEvent?: string
  strEvent?: string
  strHomeTeam?: string
  strAwayTeam?: string
  strTimestamp?: string
  dateEvent?: string
  strTime?: string
}

interface SportsDBResponse {
  events?: SportsDBEvent[]
  livescore?: SportsDBEvent[]
}

const BASE_V2 = (process.env.NEXT_PUBLIC_THESPORTSDB_BASE_URL || "https://www.thesportsdb.com/api/v2/json").replace(/\/$/, "")
const API_KEY = process.env.NEXT_PUBLIC_THESPORTSDB_API_KEY || ""

function getPath(name: string, defaultPath: string): string {
  const value = (process.env[name] || defaultPath).trim()
  // stored env values may include comments/examples; only keep the leading path segment
  const hashIndex = value.indexOf("#")
  let cleaned = hashIndex >= 0 ? value.slice(0, hashIndex).trim() : value
  // Some example paths in .env include a trailing placeholder like '/number'
  // which should not be part of the real API path. Strip that if present.
  cleaned = cleaned.replace(/\/number$/, "")
  return cleaned.replace(/\/$/, "")
}

const LIVESCORE_SPORT_PATH = getPath("THESPORTSDB_LIVESCORE_SPORT", "/livescore/sport")
const NEXT_LEAGUE_PATH = getPath("THESPORTSDB_NEXT_10_EVENTS_IN_LEAGUE", "/schedule/next/league")

function mapSportToSportsDB(sport: string): { sportName?: string; leagueId?: string } {
  switch (sport) {
    case "americanfootball_nfl":
      return { sportName: "American Football", leagueId: "4391" }
    case "basketball_nba":
      return { sportName: "Basketball", leagueId: "4387" }
    case "baseball_mlb":
      return { sportName: "Baseball", leagueId: "4424" }
    case "icehockey_nhl":
      return { sportName: "Ice Hockey", leagueId: "4380" }
    default:
      return {}
  }
}

function parseEventToFixture(event: SportsDBEvent): SportsDBFixture | null {
  const homeTeam = event.strHomeTeam?.trim()
  const awayTeam = event.strAwayTeam?.trim()
  if (!homeTeam || !awayTeam) return null

  let ts: Date | null = null
  if (event.strTimestamp) {
    const d = new Date(event.strTimestamp)
    if (!Number.isNaN(d.getTime())) ts = d
  }
  if (!ts && event.dateEvent) {
    const combined = event.strTime ? `${event.dateEvent}T${event.strTime}` : event.dateEvent
    const d = new Date(combined)
    if (!Number.isNaN(d.getTime())) ts = d
  }
  if (!ts) ts = new Date()

  return {
    id: event.idEvent || `${homeTeam}-${awayTeam}-${ts.toISOString()}`,
    homeTeam,
    awayTeam,
    commenceTime: ts,
  }
}

export async function fetchSportsDBFixturesForSport(
  sport: string
): Promise<{ success: boolean; data: SportsDBFixture[]; error?: string }> {
  if (!API_KEY) {
    return {
      success: false,
      data: [],
      error: "TheSportsDB API key not configured",
    }
  }

  const { sportName, leagueId } = mapSportToSportsDB(sport)

  try {
    // Try livescore by sport name first (real-time events)
    let fixtures: SportsDBFixture[] = []

    if (sportName) {
      const livescoreUrl = `${BASE_V2}/${API_KEY}${LIVESCORE_SPORT_PATH}/${encodeURIComponent(sportName)}`
      console.log(`📡 [TheSportsDB] Fetching livescore: ${livescoreUrl}`)
      const res = await fetch(livescoreUrl)
      if (res.ok) {
        const body = (await res.json()) as SportsDBResponse
        const events = body.livescore || body.events || []
        console.log(`📊 [TheSportsDB] Livescore returned ${events.length} events`)
        fixtures = events
          .map(parseEventToFixture)
          .filter((f): f is SportsDBFixture => f !== null)
      } else {
        console.warn(`⚠️ [TheSportsDB] Livescore request failed: ${res.status} ${res.statusText}`)
      }
    }

    // If no live fixtures, try upcoming league schedule
    if (fixtures.length === 0 && leagueId) {
      const scheduleUrl = `${BASE_V2}/${API_KEY}${NEXT_LEAGUE_PATH}/${leagueId}`
      console.log(`📡 [TheSportsDB] Fetching schedule: ${scheduleUrl}`)
      const res = await fetch(scheduleUrl)
      if (res.ok) {
        const body = (await res.json()) as SportsDBResponse
        const events = body.events || []
        console.log(`📊 [TheSportsDB] Schedule returned ${events.length} events`)
        fixtures = events
          .map(parseEventToFixture)
          .filter((f): f is SportsDBFixture => f !== null)
      } else {
        console.warn(`⚠️ [TheSportsDB] Schedule request failed: ${res.status} ${res.statusText}`)
      }
    }

    if (fixtures.length === 0) {
      return {
        success: false,
        data: [],
        error: "No fixtures available from TheSportsDB for this sport",
      }
    }

    return {
      success: true,
      data: fixtures,
    }
  } catch (error) {
    console.error("❌ Error fetching fixtures from TheSportsDB:", error)
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

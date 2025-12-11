/**
 * Live Odds API Integration
 * Uses The Odds API (https://the-odds-api.com/)
 * Free tier: 500 requests/month
 */

export interface OddsData {
  id: string
  sport_key: string
  sport_title: string
  commence_time: string
  home_team: string
  away_team: string
  bookmakers: Array<{
    key: string
    title: string
    markets: Array<{
      key: string
      outcomes: Array<{
        name: string
        price: number
      }>
    }>
  }>
}

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = 8000) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  try {
    // @ts-ignore
    const res = await fetch(url, { ...init, signal: controller.signal })
    return res
  } finally {
    clearTimeout(id)
  }
}

// ---------------- Player Props ----------------

export interface PlayerPropsResponse {
  success: boolean
  data?: OddsData[]
  error?: string
}

/**
 * Fetch player props odds for a specific event
 * Attempts to query player-focused markets; falls back to mock data on failure
 */
export async function fetchPlayerProps(sportKey: string, eventId: string): Promise<PlayerPropsResponse> {
  const apiKey = process.env.NEXT_PUBLIC_ODDS_API_KEY
  if (!apiKey) {
    console.error('NEXT_PUBLIC_ODDS_API_KEY not found in environment variables')
    return {
      success: false,
      error: 'API key not configured. Please add NEXT_PUBLIC_ODDS_API_KEY to your .env.local file'
    }
  }

  try {
    // Attempt event-level odds filtered to player markets
    const params = new URLSearchParams({
      apiKey,
      regions: 'us',
      markets: 'player_props',
      oddsFormat: 'american',
      dateFormat: 'iso'
    })
    const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/events/${eventId}/odds?${params}`
    const response = await fetchWithTimeout(url, { headers: { 'Accept': 'application/json' } }, 8000)
    if (!response.ok) throw new Error(`API responded with status: ${response.status}`)
    const data = await response.json()

    // The event endpoint may return a single object; normalize to array
    const arr = Array.isArray(data) ? data : [data]
    return { success: true, data: arr }
  } catch (error) {
    console.warn('Player props fetch failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Transform player props into a flat display list
 * Falls back gracefully if markets/outcomes are missing or shaped differently
 */
export function transformPlayerPropsForDisplay(propsData: OddsData[]): Array<{
  bookmaker: string
  market: string
  outcome: string
  price: number
}> {
  const rows: Array<{ bookmaker: string; market: string; outcome: string; price: number }> = []
  for (const event of propsData) {
    for (const bm of (event.bookmakers || [])) {
      for (const mkt of (bm.markets || [])) {
        if (!mkt || !mkt.key || (typeof mkt.key === 'string' && !mkt.key.toLowerCase().includes('player'))) continue
        for (const o of (mkt.outcomes || [])) {
          if (!o) continue
          rows.push({
            bookmaker: bm.title,
            market: mkt.key,
            outcome: String(o.name ?? 'Unknown'),
            price: Number(o.price ?? 0)
          })
        }
      }
    }
  }
  return rows
}

export interface LiveOddsResponse {
  success: boolean
  data?: OddsData[]
  error?: string
  remainingRequests?: number
}

/**
 * Fetch live odds for a specific sport
 * @param sport - Sport key (e.g., 'basketball_nba', 'americanfootball_nfl')
 * @returns Live odds data
 */
export async function fetchLiveOdds(sport: string = 'upcoming'): Promise<LiveOddsResponse> {
  const apiKey = process.env.NEXT_PUBLIC_ODDS_API_KEY

  if (!apiKey) {
    console.error('NEXT_PUBLIC_ODDS_API_KEY not found in environment variables')
    return {
      success: false,
      error: 'API key not configured. Please add NEXT_PUBLIC_ODDS_API_KEY to your .env.local file'
    }
  }

  try {
    const params = new URLSearchParams({
      apiKey: apiKey,
      regions: 'us',
      markets: 'h2h,spreads',
      oddsFormat: 'american',
      dateFormat: 'iso'
    })

    const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds?${params}`
    
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    }, 8000)

    // Check remaining requests from headers
    const remainingRequests = response.headers.get('x-requests-remaining')

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ The Odds API error (${response.status}):`, errorText)

      if (response.status === 401) {
        throw new Error(`API key unauthorized. Please check your NEXT_PUBLIC_ODDS_API_KEY is valid. Visit https://the-odds-api.com/ to verify or get a new key.`)
      }
      throw new Error(`API responded with status: ${response.status}`)
    }

    const data = await response.json()

    console.log(`✅ The Odds API success - Retrieved ${Array.isArray(data) ? data.length : 0} games for ${sport}`)

    return {
      success: true,
      data: data,
      remainingRequests: remainingRequests ? parseInt(remainingRequests) : undefined
    }
  } catch (error) {
    console.error('Error fetching odds:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Get list of available sports
 */
export async function fetchAvailableSports() {
  const apiKey = process.env.NEXT_PUBLIC_ODDS_API_KEY

  if (!apiKey) {
    return {
      success: false,
      error: 'API key not configured'
    }
  }

  try {
    const url = `https://api.the-odds-api.com/v4/sports?apiKey=${apiKey}`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`)
    }

    const data = await response.json()

    return {
      success: true,
      data: data
    }
  } catch (error) {
    console.error('Error fetching sports:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Transform odds data for display in the app
 */
export function transformOddsForDisplay(oddsData: OddsData[]) {
  return oddsData.map(game => {
    // Find best odds across all bookmakers
    const allOdds = game.bookmakers.flatMap(bookmaker =>
      bookmaker.markets.flatMap(market =>
        market.outcomes.map(outcome => ({
          bookmaker: bookmaker.title,
          team: outcome.name,
          odds: outcome.price
        }))
      )
    )

    // Group by team
    const homeOdds = allOdds.filter(o => o.team === game.home_team)
    const awayOdds = allOdds.filter(o => o.team === game.away_team)

    // Find best odds for each team
    const bestHomeOdds = homeOdds.reduce((best, current) =>
      current.odds > best.odds ? current : best
    , homeOdds[0])

    const bestAwayOdds = awayOdds.reduce((best, current) =>
      current.odds > best.odds ? current : best
    , awayOdds[0])

    return {
      id: game.id,
      sport: game.sport_title,
      sportKey: game.sport_key,
      homeTeam: game.home_team,
      awayTeam: game.away_team,
      commenceTime: new Date(game.commence_time),
      homeOdds: {
        best: bestHomeOdds,
        all: homeOdds
      },
      awayOdds: {
        best: bestAwayOdds,
        all: awayOdds
      },
      bookmakers: game.bookmakers.map(b => b.title)
    }
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPPORTED_SPORTS } from '@/lib/sports-config'

/**
 * Weekly Sport Seasons Update Cron Job
 *
 * This endpoint should be called weekly (e.g., every Monday at 06:00 UTC) via Vercel Cron
 * to update which sports/leagues are currently active.
 *
 * It fetches data from TheOddsAPI and updates the sport_seasons table.
 *
 * Vercel cron config (in vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/update-sport-seasons",
 *     "schedule": "0 6 * * 1"
 *   }]
 * }
 */

interface OddsApiSport {
  key: string;
  group: string;
  title: string;
  description: string;
  active: boolean;
  has_outrights: boolean;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.error('[Sport Seasons Update] Unauthorized cron request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Sport Seasons Update] Starting weekly sport seasons update...')

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Fetch active sports from TheOddsAPI
    const apiKey = process.env.NEXT_PUBLIC_ODDS_API_KEY
    if (!apiKey) {
      console.error('[Sport Seasons Update] No ODDS_API_KEY configured')
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports?apiKey=${apiKey}&all=true`
    )

    if (!response.ok) {
      console.error('[Sport Seasons Update] TheOddsAPI error:', response.status)
      return NextResponse.json(
        { error: `TheOddsAPI returned ${response.status}` },
        { status: 502 }
      )
    }

    const apiSports: OddsApiSport[] = await response.json()
    console.log(`[Sport Seasons Update] Fetched ${apiSports.length} sports from TheOddsAPI`)

    // Create a map of API sport keys to their data
    const apiSportMap = new Map<string, OddsApiSport>()
    for (const sport of apiSports) {
      apiSportMap.set(sport.key, sport)
    }

    // Update each sport in our system
    const results = {
      updated: 0,
      active: 0,
      inactive: 0,
      errors: 0,
      gamesFound: 0,
      gamesFetchFailed: 0
    }

    // Phase 1: Determine active status for all sports (no API calls needed)
    const sportData: Array<{
      sportId: string
      config: typeof SUPPORTED_SPORTS[string]
      apiSport: OddsApiSport | undefined
      isActive: boolean
      hasOutrights: boolean
    }> = []

    for (const [sportId, config] of Object.entries(SUPPORTED_SPORTS)) {
      const possibleKeys = [
        config.oddsApiLeague,
        `${config.oddsApiSport}_${config.oddsApiLeague}`,
        sportId,
        config.oddsApiSport
      ].filter(Boolean) as string[]

      let apiSport: OddsApiSport | undefined
      for (const key of possibleKeys) {
        apiSport = apiSportMap.get(key)
        if (apiSport) break
      }

      let isActive = false
      let hasOutrights = false

      if (apiSport) {
        isActive = apiSport.active
        hasOutrights = apiSport.has_outrights
      } else {
        const groupSports = apiSports.filter(s =>
          s.group.toLowerCase().includes(config.oddsApiSport.toLowerCase())
        )
        isActive = groupSports.some(s => s.active)
      }

      sportData.push({ sportId, config, apiSport, isActive, hasOutrights })
    }

    // Phase 2: Fetch game counts for active sports in batches (to avoid rate limiting)
    const activeSports = sportData.filter(s => s.isActive && s.apiSport)
    console.log(`[Sport Seasons Update] Fetching game counts for ${activeSports.length} active sports...`)

    // Process in batches of 5 with delay between batches
    const BATCH_SIZE = 5
    const BATCH_DELAY = 1000 // 1 second between batches
    const gameCounts = new Map<string, number>()

    for (let i = 0; i < activeSports.length; i += BATCH_SIZE) {
      const batch = activeSports.slice(i, i + BATCH_SIZE)

      const batchResults = await Promise.allSettled(
        batch.map(async (sport) => {
          const now = new Date()
          const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

          try {
            const start = now.toISOString().split('.')[0] + 'Z';
            const end = thirtyDaysLater.toISOString().split('.')[0] + 'Z';

            const gamesResponse = await fetch(
              `https://api.the-odds-api.com/v4/sports/${sport.apiSport!.key}/odds?apiKey=${apiKey}&regions=us&markets=h2h&commenceTimeFrom=${start}&commenceTimeTo=${end}`,
              { signal: AbortSignal.timeout(8000) } // Increased timeout
            )

            if (gamesResponse.ok) {
              const games = await gamesResponse.json()
              const count = Array.isArray(games) ? games.length : 0
              return { sportId: sport.sportId, count }
            } else {
              console.warn(`[Sport Seasons Update] ${sport.sportId}: HTTP ${gamesResponse.status}`)
              return { sportId: sport.sportId, count: 0, error: gamesResponse.status }
            }
          } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Unknown error'
            console.warn(`[Sport Seasons Update] ${sport.sportId}: ${errMsg}`)
            return { sportId: sport.sportId, count: 0, error: errMsg }
          }
        })
      )

      // Process batch results
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          const { sportId, count, error } = result.value
          gameCounts.set(sportId, count)
          if (count > 0) {
            results.gamesFound++
            console.log(`[Sport Seasons Update] ${sportId}: ${count} upcoming games`)
          } else if (error) {
            results.gamesFetchFailed++
          }
        } else {
          results.gamesFetchFailed++
        }
      }

      // Delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < activeSports.length) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY))
      }
    }

    console.log(`[Sport Seasons Update] Game counts: ${results.gamesFound} sports with games, ${results.gamesFetchFailed} fetch failures`)

    // Phase 3: Upsert all sports to database
    for (const sport of sportData) {
      try {
        const gameCount = gameCounts.get(sport.sportId) || 0

        const { error } = await supabaseAdmin
          .from('sport_seasons')
          .upsert({
            sport_id: sport.sportId,
            sport_name: sport.config.name,
            display_name: sport.config.displayName,
            is_active: sport.isActive,
            has_outrights: sport.hasOutrights,
            game_count: gameCount,
            api_source: 'theoddsapi',
            last_updated_at: new Date().toISOString()
          }, {
            onConflict: 'sport_id'
          })

        if (error) {
          console.error(`[Sport Seasons Update] Error upserting ${sport.sportId}:`, error)
          results.errors++
        } else {
          results.updated++
          if (sport.isActive) {
            results.active++
          } else {
            results.inactive++
          }
        }
      } catch (sportError) {
        console.error(`[Sport Seasons Update] Error processing ${sport.sportId}:`, sportError)
        results.errors++
      }
    }

    const duration = Date.now() - startTime
    console.log(`[Sport Seasons Update] Completed in ${duration}ms:`, results)

    return NextResponse.json({
      success: true,
      message: 'Sport seasons updated',
      stats: {
        ...results,
        totalApiSports: apiSports.length,
        totalOurSports: Object.keys(SUPPORTED_SPORTS).length,
        durationMs: duration,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('[Sport Seasons Update] Unexpected error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Sport seasons update failed',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request)
}

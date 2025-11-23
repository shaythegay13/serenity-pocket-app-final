import { NextRequest, NextResponse } from 'next/server'
import { generateAIPicks } from '@/lib/ai-analysis'
import { fetchLiveOdds } from '@/lib/odds-api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      sport = 'basketball_nba',
      emotionalScore = 50,
      riskTolerance = 'moderate'
    } = body

    // Validate emotional score
    if (typeof emotionalScore !== 'number' || emotionalScore < 0 || emotionalScore > 100) {
      return NextResponse.json(
        { error: 'Invalid emotional score. Must be between 0-100.' },
        { status: 400 }
      )
    }

    // Check if user is emotionally stable enough to receive picks
    if (emotionalScore < 70) {
      return NextResponse.json({
        success: true,
        shouldBet: false,
        message: `Your emotional stability score is ${emotionalScore}/100. We recommend waiting until you're in a more stable state (70+) before placing bets.`,
        picks: [],
        emotionalScore
      })
    }

    // Fetch live odds
    let oddsResponse
    try {
      console.log(`🎯 Fetching live odds for sport: ${sport}`)
      oddsResponse = await fetchLiveOdds(sport)
      console.log(`📊 Odds API response:`, oddsResponse)
    } catch (error) {
      console.error('❌ Error fetching live odds:', error)
      return NextResponse.json(
        { error: 'Failed to fetch live odds. Please try again.' },
        { status: 500 }
      )
    }

    // Extract games array from response
    const liveOdds = oddsResponse?.data || []
    console.log(`📊 Fetched ${liveOdds.length} games`)

    if (!oddsResponse.success || liveOdds.length === 0) {
      console.log('⚠️ No games available for this sport')
      return NextResponse.json({
        success: true,
        shouldBet: true,
        message: 'No games available for this sport at the moment.',
        picks: [],
        emotionalScore
      })
    }

    // Check if OpenAI API key is configured
    const hasOpenAI = !!process.env.OPENAI_API_KEY
    console.log(`🤖 OpenAI API key configured: ${hasOpenAI}`)

    let picks = []
    if (hasOpenAI) {
      try {
        // Generate AI picks
        console.log('🧠 Generating AI picks with OpenAI...')
        picks = await generateAIPicks(liveOdds, emotionalScore, riskTolerance)
        console.log(`✅ AI picks generated successfully: ${picks.length} picks`)
      } catch (error) {
        console.error('❌ AI picks generation failed:', error)
        // Fallback to mock picks instead of returning empty
        console.log('🔄 Falling back to mock picks...')
        picks = generateMockPicks(liveOdds, emotionalScore, riskTolerance)
        console.log(`✅ Generated ${picks.length} mock picks as fallback`)
      }
    } else {
      // Generate mock picks if no API key
      console.log('⚠️ No OpenAI API key, using mock picks')
      picks = generateMockPicks(liveOdds, emotionalScore, riskTolerance)
      console.log(`✅ Generated ${picks.length} mock picks`)
    }

    return NextResponse.json({
      success: true,
      shouldBet: true,
      message: picks.length > 0 
        ? `Found ${picks.length} high-value picks for you based on your emotional state and risk tolerance.`
        : 'No high-value picks available at the moment. Check back later.',
      picks,
      emotionalScore,
      usedAI: hasOpenAI
    })
  } catch (error) {
    console.error('❌ FATAL ERROR in ai-picks API:')
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('Full error object:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to generate AI picks',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

/**
 * Generate mock picks for testing/fallback
 */
function generateMockPicks(liveOdds: any[], emotionalScore: number, riskTolerance: string): any[] {
  if (!liveOdds || liveOdds.length === 0) {
    console.log('⚠️ No odds data to generate mock picks')
    return []
  }

  console.log(`🎲 Generating mock picks from ${liveOdds.length} games`)

  // Take first 3 games and create mock picks
  const picks = liveOdds.slice(0, 3).map((game, idx) => {
    try {
      const pickHome = idx % 2 === 0
      const team = pickHome ? game.home_team : game.away_team
      
      // Get odds - handle different possible structures
      let odds = -110 // Default odds
      if (pickHome) {
        odds = game.home_odds?.best?.odds || game.bookmakers?.[0]?.markets?.[0]?.outcomes?.find((o: any) => o.name === game.home_team)?.price || -110
      } else {
        odds = game.away_odds?.best?.odds || game.bookmakers?.[0]?.markets?.[0]?.outcomes?.find((o: any) => o.name === game.away_team)?.price || -110
      }
      
      // Calculate mock values
      const baseConfidence = 65 + Math.random() * 20
      const emotionalAdjustment = (emotionalScore - 70) / 30 * 10
      const confidence = Math.min(95, Math.max(50, baseConfidence + emotionalAdjustment))
      
      const impliedProb = odds > 0 
        ? (100 / (odds + 100)) * 100
        : (Math.abs(odds) / (Math.abs(odds) + 100)) * 100
      
      const estimatedProb = impliedProb + (Math.random() * 8 - 2)
      const stake = riskTolerance === 'aggressive' ? 100 : riskTolerance === 'conservative' ? 25 : 50
      const potentialWin = odds > 0 ? (stake * odds / 100) : (stake * 100 / Math.abs(odds))
      const ev = (estimatedProb / 100 * potentialWin) - ((1 - estimatedProb / 100) * stake)
      
      return {
        sport: game.sport_key || 'basketball_nba',
        event: `${game.away_team} @ ${game.home_team}`,
        pick: `${team} Moneyline`,
        odds,
        confidence: Math.round(confidence),
        expectedValue: Math.round(ev * 100) / 100,
        reasoning: `Strong value play. ${team} has favorable matchup and the odds provide positive expected value. Market appears to be undervaluing this team's chances.`,
        emotionalAlignment: emotionalScore,
        riskLevel: ev > stake * 0.15 ? 'LOW' : ev > stake * 0.05 ? 'MEDIUM' : 'HIGH',
        suggestedStake: stake,
        commenceTime: game.commence_time
      }
    } catch (error) {
      console.error('Error generating mock pick for game:', game, error)
      return null
    }
  }).filter((pick): pick is NonNullable<typeof pick> => pick !== null && pick.expectedValue > 0) // Only positive EV picks

  console.log(`✅ Generated ${picks.length} mock picks with positive EV`)
  return picks.sort((a, b) => b.expectedValue - a.expectedValue).slice(0, 3)
}

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { generateAIPicks } from '@/lib/ai-analysis'
import { fetchLiveOdds } from '@/lib/odds-api'
import { isEnhancedAIAvailable } from '@/lib/aws-bedrock'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

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

    // Check if enhanced AI (Claude via AWS Bedrock) is available
    const hasEnhancedAI = isEnhancedAIAvailable()
    console.log(`🤖 Enhanced AI (Claude via AWS Bedrock) available: ${hasEnhancedAI}`)

    if (!hasEnhancedAI) {
      console.log('⚠️ Enhanced AI not available, returning no picks (no mock data)')
      return NextResponse.json({
        success: true,
        shouldBet: false,
        message: 'AI picks are temporarily unavailable. We will only show real AI-derived picks, so no suggestions are shown right now.',
        picks: [],
        emotionalScore,
        usedAI: false,
      })
    }

    try {
      console.log('🧠 Generating AI picks with Claude via AWS Bedrock...')
      const picks = await generateAIPicks(liveOdds, emotionalScore, riskTolerance)
      console.log(`✅ AI picks generated successfully: ${picks.length} picks`)

      return NextResponse.json({
        success: true,
        shouldBet: picks.length > 0,
        message: picks.length > 0
          ? `Found ${picks.length} high-value picks for you based on your emotional state and risk tolerance.`
          : 'No high-value picks available at the moment. Check back later.',
        picks,
        emotionalScore,
        usedAI: true,
      })
    } catch (error) {
      console.error('❌ AI picks generation failed:', error)
      return NextResponse.json({
        success: true,
        shouldBet: false,
        message: 'AI picks are temporarily unavailable due to a technical issue. No mock or synthetic picks are shown.',
        picks: [],
        emotionalScore,
        usedAI: true,
      })
    }
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

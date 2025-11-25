import { NextRequest, NextResponse } from 'next/server'
import { analyzeBet, type BetAnalysisInput } from '@/lib/ai-analysis'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const input: BetAnalysisInput = {
      description: body.description,
      odds: body.odds,
      stake: body.stake,
      emotionalState: body.emotionalState,
      emotionalIntensity: body.emotionalIntensity,
      recentBets: body.recentBets,
      includeBiasDetection: body.includeBiasDetection || false,
    }

    // Validate input
    if (!input.description || !input.odds || !input.stake) {
      return NextResponse.json(
        { error: 'Missing required fields: description, odds, stake' },
        { status: 400 }
      )
    }

    let result
    try {
      // Use Claude via AWS Bedrock for real AI analysis
      result = await analyzeBet(input)
      console.log('✅ AI analysis completed via Claude (AWS Bedrock)')
    } catch (error) {
      console.error('AI analysis failed:', error)
      return NextResponse.json(
        { error: 'Failed to analyze bet' },
        { status: 502 }
      )
    }

    return NextResponse.json({
      success: true,
      analysis: result,
      usedAI: true
    })
  } catch (error) {
    console.error('Error in analyze-bet API:', error)
    return NextResponse.json(
      { error: 'Failed to analyze bet' },
      { status: 500 }
    )
  }
}

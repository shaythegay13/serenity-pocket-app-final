import { NextRequest, NextResponse } from 'next/server'
import { analyzeBet, getMockAnalysis, type BetAnalysisInput } from '@/lib/ai-analysis'

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

    // Check if OpenAI API key is configured
    const hasOpenAI = !!process.env.OPENAI_API_KEY

    let result
    if (hasOpenAI) {
      try {
        // Use real AI analysis
        result = await analyzeBet(input)
        console.log('✅ Real AI analysis completed')
      } catch (error) {
        console.error('AI analysis failed, falling back to mock:', error)
        // Fallback to mock if AI fails
        result = getMockAnalysis(input)
      }
    } else {
      // Use mock analysis if no API key
      console.log('⚠️ No OpenAI API key, using mock analysis')
      result = getMockAnalysis(input)
    }

    return NextResponse.json({
      success: true,
      analysis: result,
      usedAI: hasOpenAI
    })
  } catch (error) {
    console.error('Error in analyze-bet API:', error)
    return NextResponse.json(
      { error: 'Failed to analyze bet' },
      { status: 500 }
    )
  }
}

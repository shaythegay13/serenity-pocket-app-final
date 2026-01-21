import { NextRequest, NextResponse } from "next/server"
import { testSmartSlips, getRandomTestSlips } from "@/test-smart-slips"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const count = body.count || 7
    
    // Get random test slips
    const slips = getRandomTestSlips(count)
    
    return NextResponse.json({
      success: true,
      shouldBet: true,
      message: `Generated ${count} test SmartSlip picks for testing purposes.`,
      recommendations: slips,
      emotionalScore: 85,
      meta: {
        sport: "test_mode",
        oddsSource: "test_data",
        usedSageMaker: false,
        usedGemini: false,
      },
      probsByGameId: {},
    })
  } catch (error) {
    console.error("[Test SmartSlip] Failed to generate test picks", error)
    return NextResponse.json({
      success: false,
      shouldBet: false,
      message: "Failed to generate test SmartSlip picks.",
      error: "Test generation failed",
      recommendations: [],
    })
  }
}

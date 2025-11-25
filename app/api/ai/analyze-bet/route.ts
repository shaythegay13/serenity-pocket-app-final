import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"
import { analyzeScenario, type BetScenario } from "@/lib/ai-bet-advisor"
import { isEnhancedAIAvailable, getEnhancedBetAnalysis } from "@/lib/aws-bedrock"
import { fetchTeamRecentResults } from "@/lib/sports-data-api"

/**
 * AI Bet Analysis API Route
 * Requires Elite subscription tier
 * Uses enhanced Claude analysis via AWS Bedrock when available
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseServer

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's subscription tier
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("subscription_tier")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Check if user has Elite subscription
    if (profile.subscription_tier !== "elite") {
      return NextResponse.json(
        {
          error: "This feature requires an Elite subscription",
          upgrade_required: true,
          current_tier: profile.subscription_tier,
        },
        { status: 403 }
      )
    }

    // Parse request body
    const payload: BetScenario = await request.json()

    // Validate required fields
    if (!payload.sport || !payload.betType || !payload.betAmount || !payload.budget) {
      return NextResponse.json(
        { error: "Missing required fields: sport, betType, betAmount, budget" },
        { status: 400 }
      )
    }

    // Run built-in AI analysis first
    const analysis = analyzeScenario(payload)

    // Try to enhance with Claude if available
    let enhancedAnalysis = null
    let usedEnhancedAI = false

    if (isEnhancedAIAvailable()) {
      try {
        console.log("🤖 Running enhanced AI analysis with Claude...")

        // Best-effort: enrich with TheSportsDB recent form for favorite and underdog
        let sportsDbContext: { favoriteTeamForm?: string[]; underdogTeamForm?: string[] } | undefined
        try {
          if (payload.favoriteTeam || payload.underdogTeam) {
            const [favForm, dogForm] = await Promise.all([
              payload.favoriteTeam ? fetchTeamRecentResults(payload.favoriteTeam, 5) : Promise.resolve([]),
              payload.underdogTeam ? fetchTeamRecentResults(payload.underdogTeam, 5) : Promise.resolve([]),
            ])
            sportsDbContext = {
              favoriteTeamForm: favForm,
              underdogTeamForm: dogForm,
            }
          }
        } catch (e) {
          console.warn("[Analyze Bet] Failed to load TheSportsDB context:", e)
        }

        const enhanced = await getEnhancedBetAnalysis({
          ...payload,
          builtInAnalysis: {
            analyticalInsights: analysis.analytical.insights,
            emotionalRisk: analysis.recommendation.emotionalAnalysis.emotionalRisk,
            emotionalFactors: analysis.recommendation.emotionalAnalysis.emotionalFactors,
            safetySignals: analysis.safety.signals.map(s => s.label),
            recommendation: analysis.recommendation.recommendation,
            confidence: analysis.recommendation.confidence,
          },
          sportsDbContext,
        })

        enhancedAnalysis = enhanced
        usedEnhancedAI = true

        // Update recommendation with Claude's refined analysis
        analysis.recommendation.recommendation = enhanced.refinedRecommendation
        analysis.recommendation.confidence = enhanced.confidenceScore
        analysis.recommendation.reason = enhanced.enhancedReasoning

        console.log("✅ Enhanced AI analysis completed")
      } catch (enhancedError) {
        console.error("⚠️  Enhanced AI failed, falling back to built-in analysis:", enhancedError)
        // Continue with built-in analysis
      }
    } else {
      console.log("ℹ️  Enhanced AI not available, using built-in analysis")
    }

    // Log analysis for tracking
    await supabase.from("ai_analysis_logs").insert({
      user_id: user.id,
      sport: payload.sport,
      bet_type: payload.betType,
      bet_amount: payload.betAmount,
      recommendation: analysis.recommendation.recommendation,
      risk_level: analysis.safety.risk,
      confidence: analysis.recommendation.confidence,
      emotional_risk: analysis.recommendation.emotionalAnalysis.emotionalRisk,
      emotional_state: analysis.recommendation.emotionalAnalysis.emotionalState,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      analysis,
      enhanced: enhancedAnalysis,
      usedEnhancedAI,
    })
  } catch (error) {
    console.error("AI analysis error:", error)
    return NextResponse.json(
      { error: "Failed to analyze bet scenario" },
      { status: 500 }
    )
  }
}

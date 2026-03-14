import { NextRequest, NextResponse } from "next/server"
import { invokeAI, isEnhancedAIAvailable, type AIMessage } from "@/lib/ai-service"
import { supabaseServer } from "@/lib/supabase-server"
import { conductSportsResearch, type SportsResearchInput, type SportsResearchOutput } from "@/lib/sports-research"

type BiasWarning = {
  type: string
  severity: "low" | "medium" | "high"
  message: string
}

const americanToDecimal = (american: number) => {
  if (!Number.isFinite(american) || american === 0) return 2
  return american >= 100 ? 1 + american / 100 : 1 + 100 / Math.abs(american)
}

const impliedProbabilityFromAmerican = (american: number) => {
  if (!Number.isFinite(american) || american === 0) return 0.5
  return american > 0 ? 100 / (american + 100) : Math.abs(american) / (Math.abs(american) + 100)
}

async function callClaudeAsJson(system: string, userPrompt: string, maxTokens: number): Promise<any> {
  const raw = await invokeAI({
    system,
    messages: [{ role: "user", content: userPrompt }],
    max_tokens: maxTokens,
    temperature: 0.4,
  })

  let jsonText = raw.trim()
  if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/```json\s*/gi, "").replace(/```/g, "").trim()
  }

  try {
    return JSON.parse(jsonText)
  } catch (e) {
    const match = jsonText.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        return JSON.parse(match[0])
      } catch {
        // fall through
      }
    }
    throw new Error(`Failed to parse Claude JSON: ${e instanceof Error ? e.message : String(e)}`)
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isEnhancedAIAvailable()) {
      return NextResponse.json({ error: "Gemini is not configured" }, { status: 503 })
    }

    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { description, odds, stake, emotionalState, recentBets, includeBiasDetection, sport } = body ?? {}

    if (!description || typeof description !== "string") {
      return NextResponse.json({ error: "Missing bet description" }, { status: 400 })
    }

    // Extract teams from description for sports research (optional, fast)
    const teamMatch = description.match(/(\w+(?:\s+\w+)*)\s+(?:vs|at|-)\s+(\w+(?:\s+\w+)*)/i);
    let sportsResearch: SportsResearchOutput | null = null;
    
    if (teamMatch && sport) {
      try {
        console.log(`🔍 Conducting fast sports research for ${teamMatch[1]} vs ${teamMatch[2]}`);
        // Run sports research with timeout to ensure fast response
        const researchPromise = conductSportsResearch({
          homeTeam: teamMatch[1],
          awayTeam: teamMatch[2],
          sport: sport,
          league: body.league
        });
        
        // Wait max 8 seconds for sports research, then continue
        sportsResearch = await Promise.race([
          researchPromise,
          new Promise<SportsResearchOutput | null>((resolve) => setTimeout(() => resolve(null), 8000))
        ]);
        
        if (sportsResearch) {
          console.log(` Fast sports research completed: ${sportsResearch.dataSource}`);
        } else {
          console.log(` Sports research timeout, continuing without it`);
        }
      } catch (error) {
        console.warn(' Sports research failed, continuing with analysis:', error);
      }
    }

    const oddsNum = Number(odds)
    const stakeNum = Number(stake)
    if (!Number.isFinite(oddsNum) || !Number.isFinite(stakeNum) || stakeNum <= 0) {
      return NextResponse.json({ error: "Invalid odds or stake" }, { status: 400 })
    }

    const impliedProbability = impliedProbabilityFromAmerican(oddsNum)
    const decimalOdds = americanToDecimal(oddsNum)
    const profitIfWin = stakeNum * (decimalOdds - 1)
    const breakEvenEV = impliedProbability * profitIfWin - (1 - impliedProbability) * stakeNum

    const system = `You are a Betting Risk Analyst and reasoning engine for a responsible sports betting advisor.
You must prioritize emotional and financial safety over potential profit.
You must perform comprehensive analysis including sports research data when available.
You must perform an 'Enhanced Analysis'.
STRICT LOGIC RULES:
- If you detect a budget use (stake) higher than 20% of the weekly budget, you must override any 'Positive' sentiment and label the riskLevel as 'HIGH' and recommendation as 'DON'T PLACE BET'.
- **Devigged EV Calculation**:
  1. Calculate Implied Probability: Convert American odds to implied probability (Negative: |Odds|/(|Odds|+100), Positive: 100/(Odds+100)).
  2. Account for the 'Juice': Acknowledge the house edge (sum of implied probabilities > 100%).
  3. Calculate True EV: $EV = (WinProb_{AI} \times Profit) - (LossProb_{AI} \times Stake)$.
- The expectedValue must be returned as a standard decimal number (e.g., -4.54), representing the expected dollar gain/loss for the provided stake. Never use scientific notation.
- If expectedValue is negative, the reasoning must explain that the user is paying 'juice' and has no mathematical edge.
- If riskLevel is 'HIGH' or 'VERY_HIGH', the reasoning must start with a bold cautionary warning.
- **Sports Research Integration**: When sports research data is available, incorporate team form, head-to-head records, key player injuries, and expert predictions into your analysis.
Return STRICT JSON matching the schema exactly.`

    const userPrompt = `BET INPUT:
${JSON.stringify(
      {
        description,
        odds: oddsNum,
        stake: stakeNum,
        impliedProbability,
        breakEvenEV,
        emotionalState: typeof emotionalState === "string" ? emotionalState : undefined,
        recentBets: Array.isArray(recentBets) ? recentBets : undefined,
        includeBiasDetection: !!includeBiasDetection,
        sportsResearch: sportsResearch ? {
          dataSource: sportsResearch.dataSource,
          homeTeam: {
            name: sportsResearch.homeTeam.teamInfo?.strTeam,
            recentForm: sportsResearch.homeTeam.recentForm,
            strengths: sportsResearch.homeTeam.strengths,
            weaknesses: sportsResearch.homeTeam.weaknesses,
            currentForm: sportsResearch.homeTeam.currentForm
          },
          awayTeam: {
            name: sportsResearch.awayTeam.teamInfo?.strTeam,
            recentForm: sportsResearch.awayTeam.recentForm,
            strengths: sportsResearch.awayTeam.strengths,
            weaknesses: sportsResearch.awayTeam.weaknesses,
            currentForm: sportsResearch.awayTeam.currentForm
          },
          headToHead: sportsResearch.headToHead,
          keyFactors: sportsResearch.keyFactors,
          prediction: sportsResearch.prediction
        } : null
      },
      null,
      2,
    )}

${sportsResearch ? `
SPORTS RESEARCH DATA AVAILABLE:
- Home Team: ${sportsResearch.homeTeam.teamInfo?.strTeam} (Form: ${sportsResearch.homeTeam.currentForm})
- Away Team: ${sportsResearch.awayTeam.teamInfo?.strTeam} (Form: ${sportsResearch.awayTeam.currentForm})
- Head-to-Head: ${sportsResearch.headToHead ? `${sportsResearch.headToHead.totalMatches} matches, Home wins: ${sportsResearch.headToHead.homeTeamWins}, Away wins: ${sportsResearch.headToHead.awayTeamWins}` : 'No data'}
- Key Factors: ${sportsResearch.keyFactors.join(', ')}
- Expert Prediction: ${sportsResearch.prediction.winner} with ${Math.round(sportsResearch.prediction.confidence * 100)}% confidence
- Research Reasoning: ${sportsResearch.prediction.reasoning}

IMPORTANT: Incorporate this sports research data into your analysis. Consider team form, head-to-head records, and expert predictions when making your recommendation.
` : ''}

Return ONLY JSON in this TypeScript shape:
{
  "estimatedWinProbability": number,
  "expectedValue": number,
  "biasWarnings": Array<{ "type": string; "severity": "low"|"medium"|"high"; "message": string }>,
  "reasoning": string,
  "confidenceScore": number,
  "riskLevel": "LOW"|"MEDIUM"|"HIGH"|"VERY_HIGH",
  "recommendation": "PLACE BET"|"PROCEED WITH CAUTION"|"DON'T PLACE BET"
}

Rules:
- estimatedWinProbability must be between 0 and 1.
- expectedValue should reflect estimatedWinProbability and the provided odds/stake.
- Keep reasoning concise (2-6 sentences).
- If sports research is available, reference key insights from the research data.
- If info is missing/uncertain, prefer PROCEED WITH CAUTION or DON'T PLACE BET and explain why.`

    const parsed = await callClaudeAsJson(system, userPrompt, 2000)

    const biasWarnings: BiasWarning[] = Array.isArray(parsed?.biasWarnings) ? parsed.biasWarnings : []

    const estimatedWinProbabilityNum = Number(parsed?.estimatedWinProbability)
    if (!Number.isFinite(estimatedWinProbabilityNum)) {
      return NextResponse.json(
        { error: "Claude did not return a valid estimatedWinProbability" },
        { status: 500 },
      )
    }

    const probability = Math.max(0, Math.min(1, estimatedWinProbabilityNum))

    const expectedValue = probability * profitIfWin - (1 - probability) * stakeNum

    const recommendation: "PLACE BET" | "PROCEED WITH CAUTION" | "DON'T PLACE BET" =
      parsed?.recommendation === "PLACE BET" ||
      parsed?.recommendation === "PROCEED WITH CAUTION" ||
      parsed?.recommendation === "DON'T PLACE BET"
        ? parsed.recommendation
        : "PROCEED WITH CAUTION"

    const riskLevel: "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH" =
      parsed?.riskLevel === "LOW" ||
      parsed?.riskLevel === "MEDIUM" ||
      parsed?.riskLevel === "HIGH" ||
      parsed?.riskLevel === "VERY_HIGH"
        ? parsed.riskLevel
        : "MEDIUM"

    const confidenceScoreNum = Number(parsed?.confidenceScore)
    const confidenceScore = Number.isFinite(confidenceScoreNum)
      ? Math.max(0, Math.min(1, confidenceScoreNum))
      : 0.5

    return NextResponse.json({
      success: true,
      analysis: {
        probability,
        expectedValue,
        biasWarnings,
        reasoning: typeof parsed?.reasoning === "string" ? parsed.reasoning : "",
        confidenceScore,
        riskLevel,
        recommendation,
        sportsResearch: sportsResearch ? {
          dataSource: sportsResearch.dataSource,
          researchTimestamp: sportsResearch.researchTimestamp,
          homeTeam: {
            name: sportsResearch.homeTeam.teamInfo?.strTeam,
            currentForm: sportsResearch.homeTeam.currentForm,
            strengths: sportsResearch.homeTeam.strengths.slice(0, 3), // Limit to top 3
            recentForm: sportsResearch.homeTeam.recentForm?.last5 || []
          },
          awayTeam: {
            name: sportsResearch.awayTeam.teamInfo?.strTeam,
            currentForm: sportsResearch.awayTeam.currentForm,
            strengths: sportsResearch.awayTeam.strengths.slice(0, 3), // Limit to top 3
            recentForm: sportsResearch.awayTeam.recentForm?.last5 || []
          },
          headToHead: sportsResearch.headToHead ? {
            totalMatches: sportsResearch.headToHead.totalMatches,
            homeWins: sportsResearch.headToHead.homeTeamWins,
            awayWins: sportsResearch.headToHead.awayTeamWins,
            draws: sportsResearch.headToHead.draws
          } : null,
          keyFactors: sportsResearch.keyFactors.slice(0, 5), // Limit to top 5
          expertPrediction: sportsResearch.prediction
        } : null
      },
      usedAI: true,
    })
  } catch (error) {
    console.error("Bet analysis error:", error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message || "Failed to analyze bet" }, { status: 500 })
  }
}

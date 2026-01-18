import { NextRequest, NextResponse } from "next/server"
import { invokeAI, isEnhancedAIAvailable, type AIMessage } from "@/lib/ai-service"

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

    const body = await request.json()
    const { description, odds, stake, emotionalState, recentBets, includeBiasDetection } = body ?? {}

    if (!description || typeof description !== "string") {
      return NextResponse.json({ error: "Missing bet description" }, { status: 400 })
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
You must NOT hallucinate statistics. Only use the bet details provided.
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
      },
      null,
      2,
    )}

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
      },
      usedAI: true,
    })
  } catch (error) {
    console.error("Bet analysis error:", error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message || "Failed to analyze bet" }, { status: 500 })
  }
}

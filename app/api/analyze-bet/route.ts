import { NextRequest, NextResponse } from "next/server"
import { invokeClaude, isEnhancedAIAvailable, type ClaudeMessage } from "@/lib/aws-bedrock"
import { invokePerplexity, isPerplexityAvailable } from "@/lib/perplexity"

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
  const raw = await invokeClaude({
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
    if (!isPerplexityAvailable()) {
      return NextResponse.json({ error: "Perplexity is not configured" }, { status: 503 })
    }

    if (!isEnhancedAIAvailable()) {
      return NextResponse.json({ error: "Claude (AWS Bedrock) is not configured" }, { status: 503 })
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

    const messages: ClaudeMessage[] = [
      {
        role: "user",
        content:
          `Extract the matchup, teams, league/sport, and any relevant real-world context for this bet description. ` +
          `If the description is ambiguous, say so.\n\nBET DESCRIPTION:\n${description}`,
      },
    ]

    const research = await invokePerplexity({
      system:
        "You are a sports research assistant. Do not invent facts. If you cannot verify, say 'unknown'. Keep it concise.",
      messages,
      max_tokens: 700,
      temperature: 0.2,
    })

    const system = `You are a responsible sports betting advisor.
You must prioritize emotional and financial safety over profit.
You must NOT hallucinate statistics. Only use the bet details provided plus the Perplexity research text.
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

PERPLEXITY RESEARCH (may include unknowns):
${research}

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

    const parsed = await callClaudeAsJson(system, userPrompt, 900)

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

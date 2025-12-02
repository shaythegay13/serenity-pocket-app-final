import { invokeClaude } from "../aws-bedrock"
import type {
  BetAnalyzerReasoningInput,
  BetAnalyzerReasoningOutput,
  PickerReasoningInput,
  PickerReasoningOutput,
} from "../types/ai-models"

async function callClaudeAsJson(system: string, userPrompt: string, maxTokens: number): Promise<any> {
  const raw = await invokeClaude({
    system,
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
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
      } catch {}
    }
    throw new Error(
      `Failed to parse Claude JSON: ${e instanceof Error ? e.message : String(e)}`,
    )
  }
}

export async function generatePickerRecommendations(
  args: PickerReasoningInput,
): Promise<PickerReasoningOutput> {
  const system = `You are an internal reasoning engine for a responsible sports betting coach.
You never hallucinate statistics or odds.
You must rely ONLY on the numeric model predictions and context passed in.
You output STRICT JSON matching the requested schema and keep explanations concise.`

  const userPrompt = `USER PSYCHOLOGY SNAPSHOT:
${JSON.stringify(args.user, null, 2)}

CANDIDATE GAMES (with model predictions and context):
${JSON.stringify(
    args.games.map((g) => ({
      id: g.id,
      context: g.context,
      prediction: g.prediction,
    })),
    null,
    2,
  )}

For each game, you must propose at most one recommended bet (or none) that:
- Respects the user's riskTolerance and weeklyBudget
- Uses the model's win probabilities, expected values, and riskScore
- Considers emotional alignment from the psychology snapshot and narrative context

Respond ONLY with JSON in this TypeScript shape:
{
  "recommendations": [
    {
      "gameId": "string",
      "teams": "string",
      "startTime": "string",
      "betType": "string",
      "line": "string",
      "odds": 0,
      "emotionalAlignment": 0,
      "suggestedStakeFraction": 0,
      "suggestedStakeAbsolute": 0,
      "riskLevel": "LOW" | "MEDIUM" | "HIGH",
      "shortExplanation": "string"
    }
  ]
}`

  try {
    const parsed = await callClaudeAsJson(system, userPrompt, 1200)

    const output: PickerReasoningOutput = {
      recommendations: parsed.recommendations ?? [],
    }

    return output
  } catch (e) {
    console.error("[Picker] Claude JSON parse failed, returning no recommendations", e)
    const output: PickerReasoningOutput = {
      recommendations: [],
    }
    return output
  }
}

export async function analyzeUserBet(
  args: BetAnalyzerReasoningInput,
): Promise<BetAnalyzerReasoningOutput> {
  const system = `You are an internal reasoning engine for a responsible sports betting advisor.
You must combine:
- The numeric model prediction (probabilities, EV, riskScore)
- The user's psychology and history
- Current game context

You MUST always prioritize emotional and financial safety over potential profit.
You DO NOT hallucinate stats or odds and rely only on provided inputs.
Output must be STRICT JSON matching the requested schema.`

  const userPrompt = `USER PROFILE:
${JSON.stringify(args.user, null, 2)}

GAME (context + model prediction):
${JSON.stringify(args.game, null, 2)}

BET DETAILS:
${JSON.stringify(args.bet, null, 2)}

Return ONLY JSON matching this TypeScript shape:
{
  "betSafetyCategory": "DISCOURAGED" | "CAUTION" | "REASONABLE" | "PREFERRED",
  "stakeRecommendation": {
    "amount": number,
    "fractionOfBudget": number,
    "explanation": string
  },
  "psychologyFlags": string[],
  "summary": string,
  "detailedExplanation": string,
  "responsibleGamblingReminder"?: string
}`

  const parsed = await callClaudeAsJson(system, userPrompt, 1500)

  const output: BetAnalyzerReasoningOutput = {
    betSafetyCategory: parsed.betSafetyCategory,
    stakeRecommendation: parsed.stakeRecommendation,
    psychologyFlags: parsed.psychologyFlags ?? [],
    summary: parsed.summary,
    detailedExplanation: parsed.detailedExplanation,
    responsibleGamblingReminder: parsed.responsibleGamblingReminder,
  }

  return output
}

import { invokeClaude } from "../aws-bedrock"
import type {
  BetAnalyzerReasoningInput,
  BetAnalyzerReasoningOutput,
  PickerReasoningInput,
  PickerReasoningOutput,
} from "../types/ai-models"

async function callGeminiAsJson(
  system: string,
  userPrompt: string,
  maxTokens: number,
  responseSchema?: any,
): Promise<any> {
  const baseRequest = {
    system,
    messages: [
      {
        role: "user" as const,
        content: userPrompt,
      },
    ],
    max_tokens: maxTokens,
    temperature: 0.4,
    response_mime_type: "application/json",
    response_schema: responseSchema,
  }

  const raw = await invokeClaude(baseRequest)
  try {
    return JSON.parse(raw)
  } catch (e1) {
    // Retry once with temperature 0 if parsing fails
    const retryRaw = await invokeClaude({
      ...baseRequest,
      temperature: 0,
    })
    try {
      return JSON.parse(retryRaw)
    } catch (e2) {
      const snippet = retryRaw.slice(0, 400)
      throw new Error(
        `Failed to parse Gemini JSON: ${e2 instanceof Error ? e2.message : String(e2)}; response_snippet=${JSON.stringify(snippet)}`,
      )
    }
  }
}

export async function generatePickerRecommendations(
  args: PickerReasoningInput,
): Promise<PickerReasoningOutput> {
  const system = `You are a Betting Risk Analyst and reasoning engine for a responsible sports betting coach.
You never hallucinate statistics or odds.
You must rely ONLY on the numeric model predictions and context passed in.
You must perform an 'Enhanced Analysis'. 
STRICT LOGIC RULES:
- If you detect a budget use (stake) higher than 20% of the weekly budget, you must override any 'Positive' sentiment and label the riskLevel as 'HIGH'. 
- **Devigged EV Calculation**:
  1. Calculate Implied Probability: Convert American odds to implied probability (Negative: |Odds|/(|Odds|+100), Positive: 100/(Odds+100)).
  2. Account for the 'Juice': Acknowledge the house edge (sum of implied probabilities > 100%).
  3. Calculate True EV: $EV = (WinProb_{AI} \times Profit) - (LossProb_{AI} \times Stake)$.
- The numericRisk.ev must be returned as a standard decimal number (e.g., -4.54), representing the expected dollar gain/loss for the provided stake. Never use scientific notation.
- If EV is negative, the shortExplanation must explain that the user is paying 'juice' and has no mathematical edge.
- If riskLevel is 'HIGH', the shortExplanation must start with a cautionary warning.
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
- Considers emotional alignment from the psychology snapshot and narrative context`

  const responseSchema = {
    type: "object",
    properties: {
      recommendations: {
        type: "array",
        items: {
          type: "object",
          properties: {
            gameId: { type: "string" },
            teams: { type: "string" },
            startTime: { type: "string" },
            betType: { type: "string" },
            line: { type: "string" },
            odds: { type: "number" },
            emotionalAlignment: { type: "number" },
            suggestedStakeFraction: { type: "number" },
            suggestedStakeAbsolute: { type: "number" },
            riskLevel: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
            shortExplanation: { type: "string" },
            numericRisk: {
              type: "object",
              properties: {
                ev: { 
                  type: "number",
                  description: "Expected Value as a standard decimal (no scientific notation)"
                },
              },
              required: ["ev"],
            },
          },
          required: [
            "gameId",
            "teams",
            "startTime",
            "betType",
            "line",
            "odds",
            "emotionalAlignment",
            "suggestedStakeFraction",
            "suggestedStakeAbsolute",
            "riskLevel",
            "shortExplanation",
            "numericRisk",
          ],
        },
      },
    },
    required: ["recommendations"],
  }

  try {
    const parsed = await callGeminiAsJson(system, userPrompt, 1200, responseSchema)

    const output: PickerReasoningOutput = {
      recommendations: parsed.recommendations ?? [],
    }

    return output
  } catch (e) {
    console.error("[Picker] Gemini JSON mode failed, returning no recommendations", e)
    const output: PickerReasoningOutput = {
      recommendations: [],
    }
    return output
  }
}

export async function analyzeUserBet(
  args: BetAnalyzerReasoningInput,
): Promise<BetAnalyzerReasoningOutput> {
  const system = `You are a Betting Risk Analyst and reasoning engine for a responsible sports betting advisor.
You must combine:
- The numeric model prediction (probabilities, EV, riskScore)
- The user's psychology and history
- Current game context

You MUST always prioritize emotional and financial safety over potential profit.
You DO NOT hallucinate stats or odds and rely only on provided inputs.
You must perform an 'Enhanced Analysis'. 
STRICT LOGIC RULES:
- If you detect a budget use (stake) higher than 20% of the weekly budget, you must override any 'Positive' sentiment and label the betSafetyCategory as 'DISCOURAGED'. 
- **Devigged EV Calculation**:
  1. Calculate Implied Probability: Convert American odds to implied probability (Negative: |Odds|/(|Odds|+100), Positive: 100/(Odds+100)).
  2. Account for the 'Juice': Acknowledge the house edge (sum of implied probabilities > 100%).
  3. Calculate True EV: $EV = (WinProb_{AI} \times Profit) - (LossProb_{AI} \times Stake)$.
- The numericRisk.ev must be returned as a standard decimal number (e.g., -4.54), representing the expected dollar gain/loss for the provided stake. Never use scientific notation.
- If EV is negative, the summary must explain that the user is paying 'juice' and has no mathematical edge.
- If betSafetyCategory is 'DISCOURAGED' or 'CAUTION', the summary must start with a bold cautionary warning.
Output must be STRICT JSON matching the requested schema.`

  const userPrompt = `USER PROFILE:
${JSON.stringify(args.user, null, 2)}

GAME (context + model prediction):
${JSON.stringify(args.game, null, 2)}

BET DETAILS:
${JSON.stringify(args.bet, null, 2)}`

  const responseSchema = {
    type: "object",
    properties: {
      betSafetyCategory: {
        type: "string",
        enum: ["DISCOURAGED", "CAUTION", "REASONABLE", "PREFERRED"],
      },
      stakeRecommendation: {
        type: "object",
        properties: {
          amount: { type: "number" },
          fractionOfBudget: { type: "number" },
          explanation: { type: "string" },
        },
        required: ["amount", "fractionOfBudget", "explanation"],
      },
      psychologyFlags: {
        type: "array",
        items: { type: "string" },
      },
      summary: { type: "string" },
      detailedExplanation: { type: "string" },
      responsibleGamblingReminder: { type: "string" },
      numericRisk: {
        type: "object",
        properties: {
          ev: { 
            type: "number",
            description: "Expected Value as a standard decimal (no scientific notation)"
          },
        },
        required: ["ev"],
      },
    },
    required: [
      "betSafetyCategory",
      "stakeRecommendation",
      "psychologyFlags",
      "summary",
      "detailedExplanation",
      "numericRisk",
    ],
  }

  const parsed = await callGeminiAsJson(system, userPrompt, 1500, responseSchema)

  const output: BetAnalyzerReasoningOutput = {
    betSafetyCategory: parsed.betSafetyCategory,
    stakeRecommendation: parsed.stakeRecommendation,
    psychologyFlags: parsed.psychologyFlags ?? [],
    summary: parsed.summary,
    detailedExplanation: parsed.detailedExplanation,
    numericRisk: parsed.numericRisk || { ev: 0 },
    responsibleGamblingReminder: parsed.responsibleGamblingReminder,
  }

  return output
}

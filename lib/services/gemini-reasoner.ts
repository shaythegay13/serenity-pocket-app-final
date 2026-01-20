import { invokeAI } from "../ai-service"
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

  const raw = await invokeAI(baseRequest)
  try {
    return JSON.parse(raw)
  } catch (e1) {
    // Retry once with temperature 0 if parsing fails
    const retryRaw = await invokeAI({
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
You must perform comprehensive analysis including deep sports research data when available.
You must rely on the numeric model predictions, context, and sports research passed in.
You must perform an 'Enhanced Analysis'.

STRICT LOGIC RULES:
- If you detect a budget use (stake) higher than 20% of the weekly budget, you must override any 'Positive' sentiment and label the riskLevel as 'HIGH'.

**SPORTS RESEARCH INTEGRATION**:
- When sports research is available, incorporate team form, head-to-head records, key player injuries, and expert predictions into your analysis.
- Use recent form data to assess current team momentum and performance trends.
- Consider head-to-head history for matchup advantages and patterns.
- Factor in expert predictions from sports research when making recommendations.

**BET TYPE-SPECIFIC EV CALCULATION**:

For **MONEYLINE** bets:
  1. Calculate Implied Probability: Convert American odds to implied probability (Negative: |Odds|/(|Odds|+100), Positive: 100/(Odds+100))
  2. Calculate Profit: If odds > 0: Profit = Stake × (Odds/100); If odds < 0: Profit = Stake × (100/|Odds|)
  3. Calculate True EV: $EV = (WinProb_{AI} \times Profit) - (LossProb_{AI} \times Stake)$
  4. Calculate EV Percentage: $(EV / Stake) \times 100$

For **SPREAD** bets:
  1. Spreads typically have -110 odds (sometimes varying)
  2. Calculate Profit: Usually Stake × (100/110) ≈ Stake × 0.909
  3. Assess Win Probability: Does the AI model suggest the team will cover the spread?
  4. Calculate True EV: $EV = (CoverProb \times Profit) - ((1-CoverProb) \times Stake)$
  5. Calculate EV Percentage: $(EV / Stake) \times 100$

For **TOTAL (Over/Under)** bets:
  1. Similar to spreads, usually -110 odds on both Over and Under
  2. Calculate Profit: Stake × (100/110) ≈ Stake × 0.909
  3. Assess Probability: Based on team scoring trends, does Over or Under have value?
  4. Calculate True EV: $EV = (OverProb \times Profit) - (UnderProb \times Stake)$
  5. Calculate EV Percentage: $(EV / Stake) \times 100$

GENERAL RULES:
- The numericRisk.ev must be returned as a standard decimal number (e.g., -4.54), representing the expected dollar gain/loss for the provided stake. Never use scientific notation.
- If EV is negative, the shortExplanation must explain that the user is paying 'juice' and has no mathematical edge.
- If riskLevel is 'HIGH', the shortExplanation must start with a cautionary warning.
- PRIORITIZE recommendations with POSITIVE EV across all bet types.
- Include the confidence level (0-100) for each recommendation.

You output STRICT JSON matching the requested schema and keep explanations concise.`

  const userPrompt = `USER PSYCHOLOGY SNAPSHOT:
${JSON.stringify(args.user, null, 2)}

CANDIDATE GAMES (with model predictions, context, and sports research):
${JSON.stringify(
    args.games.map((g) => ({
      id: g.id,
      context: g.context,
      prediction: g.prediction,
      sportsResearch: g.sportsResearch ? {
        dataSource: g.sportsResearch.dataSource,
        homeTeam: {
          name: g.sportsResearch.homeTeam.name,
          currentForm: g.sportsResearch.homeTeam.currentForm,
          strengths: g.sportsResearch.homeTeam.strengths,
          recentForm: g.sportsResearch.homeTeam.recentForm
        },
        awayTeam: {
          name: g.sportsResearch.awayTeam.name,
          currentForm: g.sportsResearch.awayTeam.currentForm,
          strengths: g.sportsResearch.awayTeam.strengths,
          recentForm: g.sportsResearch.awayTeam.recentForm
        },
        headToHead: g.sportsResearch.headToHead,
        keyFactors: g.sportsResearch.keyFactors,
        expertPrediction: g.sportsResearch.expertPrediction
      } : null
    })),
    null,
    2,
  )}

${args.games.some(g => g.sportsResearch) ? `
SPORTS RESEARCH DATA AVAILABLE:
- Some games include comprehensive team analysis, recent form, head-to-head records, and expert predictions
- Use this research data to enhance your betting recommendations
- Consider team momentum, matchup history, and expert insights when analyzing each game
` : ''}

You must analyze each game and recommend the BEST bet types based on:
- Team statistics, form, and matchup analysis
- Injury reports and roster changes
- Historical performance and trends
- Model predictions and probabilities
- Expected value calculations
- User's risk tolerance and budget
- Sports research insights when available

Available bet types:
1. **Moneyline** - Betting on which team wins outright
2. **Spread** - Betting on the point differential
3. **Total (Over/Under)** - Betting on whether the combined score goes over or under a line

**CRITICAL REQUIREMENTS**:
1. You MUST return at least 3 recommendations (or as many games as available if less than 3)
2. For each recommendation, the 'teams' field MUST contain the actual team names in "Home Team vs Away Team" format
3. Bet type distribution should be FLEXIBLE based on what the data suggests:
   - If spreads have the best value, recommend 2-3 spreads
   - If totals look good, recommend multiple over/unders
   - Don't force 1 moneyline, 1 spread, 1 total if that's not what the data supports
4. Risk tolerance affects STAKE SIZE, not bet selection:
   - Conservative: smaller stakes (4% of budget)
   - Moderate: medium stakes (6% of budget)
   - Aggressive: larger stakes (8% of budget)
5. **NEVER** base recommendations solely on favorites vs underdogs or over vs under preferences
6. Base ALL picks on actual statistics, model predictions, and expected value
7. **IMPORTANT**: Always use the actual team names from the game context, never generic descriptions

**NEGATIVE EV HANDLING**:
- If EV is negative, you MUST include this exact warning in ALL CAPS in the shortExplanation:
  "DO NOT BET ON THIS GAME. OUR ANALYSIS HAS DETERMINED THIS WILL LEAD TO A LOSING BET. TAKE A BREAK FROM BETTING UNTIL ODDS IMPROVE."
- Still include these picks for educational purposes so users understand why to avoid them

**DO NOT** return an empty recommendations array unless there are literally zero games with odds available.`

  const responseSchema = {
    type: "object",
    properties: {
      recommendations: {
        type: "array",
        items: {
          type: "object",
          properties: {
            gameId: { type: "string" },
            teams: { 
              type: "string",
              description: "Team names in format 'Home Team vs Away Team' - MUST be actual team names from the game context"
            },
            startTime: { type: "string" },
            betType: {
              type: "string",
              enum: ["moneyline", "spread", "total", "over", "under"],
              description: "Type of bet: moneyline, spread, total (over), or total (under)"
            },
            line: { type: "string" },
            odds: { type: "number" },
            confidence: {
              type: "number",
              description: "Confidence level 0-100 for this pick based on model probability and data quality"
            },
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
                  description: "Expected Value in dollars as a standard decimal (no scientific notation)"
                },
                evPercentage: {
                  type: "number",
                  description: "Expected Value as a percentage of stake (EV/stake * 100)"
                },
              },
              required: ["ev", "evPercentage"],
            },
          },
          required: [
            "gameId",
            "teams",
            "startTime",
            "betType",
            "line",
            "odds",
            "confidence",
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
    const parsed = await callGeminiAsJson(system, userPrompt, 2400, responseSchema)

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

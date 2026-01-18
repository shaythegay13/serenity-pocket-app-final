/**
 * AI Service - Gemini Integration
 * Provides enhanced AI analysis for the Bet Advisor features (TiltLab & SmartSlip)
 */

import { geminiGenerateText } from "./gemini"

// Check if enhanced AI is enabled.
const enhancedFlag = (process.env.ENABLE_ENHANCED_AI_ANALYSIS || "").trim().toLowerCase()
const hasExplicitEnhancedFlag = enhancedFlag === "true" || enhancedFlag === "false"

// Gemini configuration
const hasGeminiKey = Boolean((process.env.GOOGLE_GEMINI_API_KEY || "").trim())

const isEnhancedAIEnabled = hasExplicitEnhancedFlag ? enhancedFlag === "true" : hasGeminiKey

console.log("[Gemini Init] Environment check:", {
  hasGeminiKey,
  hasExplicitEnhancedFlag,
  enhancedFlag,
  isEnhancedAIEnabled,
  nodeEnv: process.env.NODE_ENV
})

if (isEnhancedAIEnabled && hasGeminiKey) {
  console.log("✅ Gemini client available for enhanced AI analysis")
} else {
  console.log("ℹ️  Enhanced AI analysis disabled - using built-in algorithms")
}

export interface AIMessage {
  role: "user" | "assistant"
  content: string
}

export interface AIRequest {
  messages: AIMessage[]
  max_tokens: number
  temperature?: number
  top_p?: number
  system?: string
  response_mime_type?: string
  response_schema?: any
}

export interface AIResponse {
  content: Array<{
    type: string
    text: string
  }>
  stop_reason: string
  usage: {
    input_tokens: number
    output_tokens: number
  }
}

/**
 * Check if enhanced AI analysis is available
 */
export function isEnhancedAIAvailable(): boolean {
  return isEnhancedAIEnabled && hasGeminiKey
}

/**
 * Invoke Gemini AI
 */
export async function invokeAI(request: AIRequest): Promise<string> {
  try {
    if (!isEnhancedAIAvailable()) {
      throw new Error(
        "Enhanced AI not configured. Set ENABLE_ENHANCED_AI_ANALYSIS=true and GOOGLE_GEMINI_API_KEY.",
      )
    }

    const modelOverride = (process.env.GOOGLE_GEMINI_MODEL_AI || "").trim() || undefined
    let text: string
    try {
      text = await geminiGenerateText({
        system: request.system,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.max_tokens,
        model: modelOverride,
        responseMimeType: request.response_mime_type,
        responseSchema: request.response_schema,
      })
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      const isThrottlingOrQuota =
        message.includes("ThrottlingException") ||
        message.includes("Too many requests") ||
        message.includes("RESOURCE_EXHAUSTED") ||
        message.includes("Quota exceeded") ||
        message.includes("Gemini API error (429)")

      // If the premium/enhanced model is rate limited, retry once with the default model.
      if (isThrottlingOrQuota && modelOverride) {
        text = await geminiGenerateText({
          system: request.system,
          messages: request.messages,
          temperature: request.temperature ?? 0.7,
          maxOutputTokens: request.max_tokens,
          model: undefined,
          responseMimeType: request.response_mime_type,
          responseSchema: request.response_schema,
        })
      } else {
        throw e
      }
    }

    return text
  } catch (error) {
    console.error("❌ Error invoking Gemini:", error)

    const message = error instanceof Error ? error.message : String(error)
    const isThrottling =
      message.includes("ThrottlingException") ||
      message.includes("Too many requests, please wait before trying again") ||
      message.includes("RESOURCE_EXHAUSTED") ||
      message.includes("Quota exceeded") ||
      message.includes("Gemini API error (429)")

    if (isThrottling) {
      throw new Error(`GEMINI_THROTTLED: ${message}`)
    }

    throw new Error(`Failed to invoke Gemini: ${message}`)
  }
}

/**
 * Enhanced bet analysis using Gemini AI
 * Returns enhanced reasoning and recommendations
 */
export async function getEnhancedBetAnalysis(params: {
  sport: string
  betType: string
  betAmount: number
  budget: number
  favoriteTeam: string
  underdogTeam: string
  favoriteRecord: string
  underdogRecord: string
  injuries: string
  weather: string
  currentEmotion: string
  lastOutcome: string
  emotionalTriggers: string
  bettingSlip: string
  history: string
  notes: string
  sportsDbContext?: {
    favoriteTeamForm?: string[]
    underdogTeamForm?: string[]
  }
  builtInAnalysis: {
    analyticalInsights: string[]
    emotionalRisk: string
    emotionalFactors: string[]
    safetySignals: string[]
    recommendation: string
    confidence: number
  }
}): Promise<{
  enhancedReasoning: string
  refinedRecommendation: "PLACE BET" | "DON'T PLACE BET" | "PROCEED WITH CAUTION"
  confidenceScore: number
  keyInsights: string[]
  numericRisk?: {
    ev: number
  }
}> {
  if (!isEnhancedAIAvailable()) {
    throw new Error("Enhanced AI analysis not available")
  }

  const systemPrompt = `You are an expert betting advisor specializing in responsible gambling and harm reduction. Your role is to:

1. Provide brutally honest, data-driven analysis
2. PRIORITIZE emotional and financial safety over potential profit
3. Identify and warn about harmful betting patterns
4. Give clear, actionable recommendations
5. Use empathy while being direct about risks

You must perform an 'Enhanced Analysis'.
STRICT LOGIC RULES:
- If you detect a budget use (stake) higher than 20% of the weekly budget, you must override any 'Positive' sentiment and label the refinedRecommendation as 'PROCEED WITH CAUTION'.
- **Devigged EV Calculation**:
  1. Calculate Implied Probability: Convert American odds to implied probability (Negative: |Odds|/(|Odds|+100), Positive: 100/(Odds+100)).
  2. Account for the 'Juice': Acknowledge the house edge (sum of implied probabilities > 100%).
  3. Calculate True EV: $EV = (WinProb_{AI} \times Profit) - (LossProb_{AI} \times Stake)$.
- The numericRisk.ev must be returned as a standard decimal number (e.g., -4.54), representing the expected dollar gain/loss for the provided stake. Never use scientific notation.
- If EV is negative, the enhancedReasoning must explain that the user is paying 'juice' and has no mathematical edge.
- If risk is HIGH or recommendation is 'PROCEED WITH CAUTION', the enhancedReasoning must start with a bold cautionary warning.

You have access to both analytical data AND the user's emotional state. Always consider both.`

  const userPrompt = `Please analyze this betting scenario and provide enhanced reasoning:

## Bet Details
- Sport: ${params.sport}
- Bet Type: ${params.betType}
- Proposed Amount: $${params.betAmount}
- Weekly Budget: $${params.budget}
- Budget Percentage: ${((params.betAmount / params.budget) * 100).toFixed(1)}%

## Matchup
- Favorite: ${params.favoriteTeam} (${params.favoriteRecord})
- Underdog: ${params.underdogTeam} (${params.underdogRecord})
- Injuries: ${params.injuries || "None reported"}
- Weather: ${params.weather || "N/A"}

${params.sportsDbContext ? `## Team Recent Form (from TheSportsDB)
- Favorite recent form: ${params.sportsDbContext.favoriteTeamForm?.join(" ") || "n/a"}
- Underdog recent form: ${params.sportsDbContext.underdogTeamForm?.join(" ") || "n/a"}
` : ""}

## User's Emotional State
- Current Emotion: ${params.currentEmotion}
- Last Outcome: ${params.lastOutcome}
- Emotional Triggers: ${params.emotionalTriggers || "None stated"}
- Recent History: ${params.history || "No recent history"}
${params.bettingSlip ? `- Betting Slip: ${params.bettingSlip}` : ""}

## User's Reasoning
${params.notes || "No notes provided"}

## Built-in Analysis Results
**Analytical Insights:**
${params.builtInAnalysis.analyticalInsights.map(i => `- ${i}`).join("\n")}

**Emotional Assessment:**
- Risk Level: ${params.builtInAnalysis.emotionalRisk}
- Factors: ${params.builtInAnalysis.emotionalFactors.join(", ")}

**Safety Signals:**
${params.builtInAnalysis.safetySignals.length > 0 ? params.builtInAnalysis.safetySignals.map(s => `- ${s}`).join("\n") : "- No major red flags"}

**Initial Recommendation:** ${params.builtInAnalysis.recommendation} (${params.builtInAnalysis.confidence}% confidence)

---

Please provide:
1. **Enhanced Reasoning** (2-3 paragraphs): Synthesize all the data and explain your thinking. Be direct about risks.
2. **Refined Recommendation**: PLACE BET, DON'T PLACE BET, or PROCEED WITH CAUTION
3. **Confidence Score**: 0-100
4. **Key Insights** (3-5 bullet points): Most important factors to consider

Format your response as JSON:
{
  "enhancedReasoning": "...",
  "refinedRecommendation": "PLACE BET|DON'T PLACE BET|PROCEED WITH CAUTION",
  "confidenceScore": 75,
  "keyInsights": ["...", "...", "..."]
}

Remember: Prioritize the user's emotional and financial wellbeing. If there are red flags, be direct about them.`

  const responseSchema = {
    type: "object",
    properties: {
      enhancedReasoning: { type: "string" },
      refinedRecommendation: {
        type: "string",
        enum: ["PLACE BET", "DON'T PLACE BET", "PROCEED WITH CAUTION"],
      },
      confidenceScore: { type: "number" },
      keyInsights: {
        type: "array",
        items: { type: "string" },
      },
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
    required: ["enhancedReasoning", "refinedRecommendation", "confidenceScore", "keyInsights", "numericRisk"],
  }

  try {
    const response = await invokeAI({
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
      max_tokens: 2000,
      temperature: 0.7,
      response_mime_type: "application/json",
      response_schema: responseSchema,
    })

    const parsed = JSON.parse(response)

    return {
      enhancedReasoning: parsed.enhancedReasoning || parsed.enhanced_reasoning || "",
      refinedRecommendation:
        parsed.refinedRecommendation ||
        parsed.refined_recommendation ||
        params.builtInAnalysis.recommendation,
      confidenceScore:
        parsed.confidenceScore || parsed.confidence_score || params.builtInAnalysis.confidence,
      keyInsights: parsed.keyInsights || parsed.key_insights || [],
      numericRisk: parsed.numericRisk || { ev: 0 },
    }
  } catch (error) {
    console.error("Error parsing Gemini response:", error)
    throw error
  }
}

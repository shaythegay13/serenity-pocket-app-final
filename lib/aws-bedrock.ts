/**
 * AWS Bedrock Client for Claude AI
 * Provides enhanced AI analysis for the Bet Advisor feature
 */

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelCommandInput,
} from "@aws-sdk/client-bedrock-runtime"

// Check if enhanced AI is enabled
const isEnhancedAIEnabled = process.env.ENABLE_ENHANCED_AI_ANALYSIS === "true"

// AWS Bedrock configuration
const AWS_REGION = process.env.AWS_REGION || "us-east-1"
const AWS_BEDROCK_MODEL_ID = process.env.AWS_BEDROCK_MODEL_ID || "anthropic.claude-3-5-sonnet-20241022-v2:0"

// Initialize Bedrock client (only if credentials are available)
let bedrockClient: BedrockRuntimeClient | null = null

if (
  isEnhancedAIEnabled &&
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY
) {
  bedrockClient = new BedrockRuntimeClient({
    region: AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  })
  console.log("✅ AWS Bedrock client initialized for enhanced AI analysis")
} else {
  console.log("ℹ️  Enhanced AI analysis disabled - using built-in algorithms")
}

export interface ClaudeMessage {
  role: "user" | "assistant"
  content: string
}

export interface ClaudeRequest {
  messages: ClaudeMessage[]
  max_tokens: number
  temperature?: number
  top_p?: number
  system?: string
}

export interface ClaudeResponse {
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
  return bedrockClient !== null && isEnhancedAIEnabled
}

/**
 * Invoke Claude via AWS Bedrock
 */
export async function invokeClaude(request: ClaudeRequest): Promise<string> {
  if (!bedrockClient) {
    throw new Error("AWS Bedrock client not initialized. Check your environment variables.")
  }

  try {
    const input: InvokeModelCommandInput = {
      modelId: AWS_BEDROCK_MODEL_ID,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: request.max_tokens,
        temperature: request.temperature || 0.7,
        top_p: request.top_p || 1,
        system: request.system,
        messages: request.messages,
      }),
    }

    const command = new InvokeModelCommand(input)
    const response = await bedrockClient.send(command)

    // Parse response
    const responseBody = JSON.parse(new TextDecoder().decode(response.body)) as ClaudeResponse

    // Extract text from first content block
    const text = responseBody.content[0]?.text || ""

    console.log(`✅ Claude response received (${responseBody.usage.input_tokens} in, ${responseBody.usage.output_tokens} out)`)

    return text
  } catch (error) {
    console.error("❌ Error invoking Claude via Bedrock:", error)
    throw new Error(`Failed to invoke Claude: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Enhanced bet analysis using Claude
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
  // Analysis from built-in algorithms
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

  try {
    const response = await invokeClaude({
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    })

    // Parse JSON response
    // Claude sometimes wraps JSON in markdown code blocks, so we need to extract it
    let jsonText = response.trim()
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "")
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```\n?/g, "")
    }

    const parsed = JSON.parse(jsonText)

    return {
      enhancedReasoning: parsed.enhancedReasoning || parsed.enhanced_reasoning || "",
      refinedRecommendation: parsed.refinedRecommendation || parsed.refined_recommendation || params.builtInAnalysis.recommendation,
      confidenceScore: parsed.confidenceScore || parsed.confidence_score || params.builtInAnalysis.confidence,
      keyInsights: parsed.keyInsights || parsed.key_insights || [],
    }
  } catch (error) {
    console.error("Error parsing Claude response:", error)
    // Return a safe fallback using built-in analysis
    throw error
  }
}

/**
 * AI-Powered Bet Analysis using OpenAI
 * Provides probability estimation, EV calculation, and bias detection
 */

import { invokeClaude } from "./aws-bedrock"

export interface BetAnalysisInput {
  description: string
  odds: number
  stake: number
  emotionalState?: string
  emotionalIntensity?: number
  recentBets?: Array<{
    outcome: string
    emotionalState: string
  }>
  includeBiasDetection?: boolean
}

export interface BetAnalysisResult {
  recommendation: 'STRONG_BET' | 'MODERATE_BET' | 'WEAK_BET' | 'AVOID'
  probability: number // 0-100
  expectedValue: number // in dollars
  reasoning: string
  biasWarnings: string[]
  confidenceScore: number // 0-100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
}

/**
 * Analyze a bet using AI
 */
export async function analyzeBet(input: BetAnalysisInput): Promise<BetAnalysisResult> {
  try {
    const systemPrompt = input.includeBiasDetection
      ? `You are an expert sports betting analyst with a focus on responsible gambling and behavioral psychology. 
Your role is to:
1. Analyze bets objectively based on odds and probability
2. Calculate expected value (EV)
3. Detect cognitive biases in betting decisions
4. Consider the bettor's emotional state
5. Provide clear, actionable recommendations

Always prioritize responsible gambling and warn against emotional or biased betting.`
      : `You are an expert sports betting analyst focused on data-driven analysis.
Your role is to:
1. Analyze bets objectively based on odds and probability
2. Calculate expected value (EV)
3. Provide clear, actionable recommendations

Focus on mathematical analysis and value betting.`

    const userPrompt = buildAnalysisPrompt(input)

    const rawText = await invokeClaude({
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    })

    let jsonText = rawText.trim()
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "")
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```\n?/g, "")
    }

    const result = JSON.parse(jsonText)
    
    // Validate and format the response
    return {
      recommendation: result.recommendation || 'MODERATE_BET',
      probability: Math.min(100, Math.max(0, result.probability || 50)),
      expectedValue: result.expectedValue || 0,
      reasoning: result.reasoning || 'Analysis completed.',
      biasWarnings: result.biasWarnings || [],
      confidenceScore: Math.min(100, Math.max(0, result.confidenceScore || 70)),
      riskLevel: result.riskLevel || 'MEDIUM'
    }
  } catch (error) {
    console.error('Error analyzing bet:', error)
    throw new Error('Failed to analyze bet. Please try again.')
  }
}

/**
 * Build the analysis prompt
 */
function buildAnalysisPrompt(input: BetAnalysisInput): string {
  const oddsType = input.odds > 0 ? 'American (positive)' : 'American (negative)'
  const impliedProbability = calculateImpliedProbability(input.odds)

  let prompt = `Analyze this sports bet:

BET DETAILS:
- Description: ${input.description}
- Odds: ${input.odds} (${oddsType})
- Stake: $${input.stake}
- Implied Probability: ${impliedProbability.toFixed(1)}%
`

  if (input.includeBiasDetection && input.emotionalState) {
    prompt += `
BETTOR'S EMOTIONAL STATE:
- Current emotion: ${input.emotionalState}
- Intensity: ${input.emotionalIntensity}/10
`
  }

  if (input.includeBiasDetection && input.recentBets && input.recentBets.length > 0) {
    const recentLosses = input.recentBets.filter(b => b.outcome === 'loss').length
    const recentWins = input.recentBets.filter(b => b.outcome === 'win').length
    
    prompt += `
RECENT BETTING HISTORY:
- Last ${input.recentBets.length} bets: ${recentWins} wins, ${recentLosses} losses
- Recent emotional states: ${input.recentBets.map(b => b.emotionalState).join(', ')}
`
  }

  prompt += `
REQUIRED ANALYSIS:
1. Estimate the TRUE probability of this bet winning (0-100%)
2. Calculate Expected Value (EV) in dollars: EV = (Probability × Potential Win) - ((1 - Probability) × Stake)
3. Provide a recommendation: STRONG_BET, MODERATE_BET, WEAK_BET, or AVOID
4. Give your confidence score (0-100%) in this analysis
5. Assess risk level: LOW, MEDIUM, or HIGH
6. Explain your reasoning in 2-3 sentences
`

  if (input.includeBiasDetection) {
    prompt += `
7. BIAS DETECTION - Check for these cognitive biases:
   - Recency bias (betting on recent winners/losers)
   - Loss chasing (betting more after losses)
   - Overconfidence (betting too much relative to edge)
   - Confirmation bias (ignoring contrary information)
   - Emotional betting (making decisions based on feelings)
   - Gambler's fallacy (thinking past results affect future odds)

List any biases detected as an array of warning strings.
`
  }

  prompt += `
RESPOND IN JSON FORMAT:
{
  "recommendation": "STRONG_BET" | "MODERATE_BET" | "WEAK_BET" | "AVOID",
  "probability": <number 0-100>,
  "expectedValue": <number in dollars>,
  "reasoning": "<2-3 sentence explanation>",
  "biasWarnings": [<array of bias warning strings>],
  "confidenceScore": <number 0-100>,
  "riskLevel": "LOW" | "MEDIUM" | "HIGH"
}
`

  return prompt
}

/**
 * Calculate implied probability from American odds
 */
function calculateImpliedProbability(odds: number): number {
  if (odds > 0) {
    // Positive odds (underdog)
    return (100 / (odds + 100)) * 100
  } else {
    // Negative odds (favorite)
    return (Math.abs(odds) / (Math.abs(odds) + 100)) * 100
  }
}

/**
 * Generate AI picks for Elite users
 */
export async function generateAIPicks(
  liveOdds: any[],
  userEmotionalScore: number,
  userRiskTolerance: 'conservative' | 'moderate' | 'aggressive' = 'moderate'
): Promise<any[]> {
  try {
    // Filter for games with good data
    const validGames = liveOdds.slice(0, 10) // Limit to 10 games to save API costs

    const systemPrompt = `You are an elite sports betting analyst. Generate high-value bet recommendations based on:
1. Expected value (EV) analysis
2. Risk-adjusted returns
3. User's emotional stability (only recommend bets when user is stable)
4. Market inefficiencies

Only recommend bets with positive expected value and appropriate risk levels.`

    const userPrompt = `Analyze these games and recommend the top 3 bets:

GAMES:
${validGames.map((game, idx) => {
  // Get best odds from bookmakers
  const h2hMarket = game.bookmakers?.[0]?.markets?.find((m: any) => m.key === 'h2h')
  const homeOutcome = h2hMarket?.outcomes?.find((o: any) => o.name === game.home_team)
  const awayOutcome = h2hMarket?.outcomes?.find((o: any) => o.name === game.away_team)
  
  return `
${idx + 1}. ${game.away_team} @ ${game.home_team}
   - Home Odds: ${homeOutcome?.price || 'N/A'}
   - Away Odds: ${awayOutcome?.price || 'N/A'}
   - Starts: ${new Date(game.commence_time).toLocaleString()}
`
}).join('\n')}

USER PROFILE:
- Emotional Stability Score: ${userEmotionalScore}/100
- Risk Tolerance: ${userRiskTolerance}

REQUIREMENTS:
- Only recommend if emotional score > 70
- Prioritize positive EV bets
- Match risk tolerance
- Provide confidence score (0-100)
- Calculate expected value
- Explain reasoning

RESPOND IN JSON FORMAT:
{
  "picks": [
    {
      "sport": "<sport name>",
      "event": "<away team> @ <home team>",
      "pick": "<team name and bet type>",
      "odds": <number>,
      "confidence": <0-100>,
      "expectedValue": <number>,
      "reasoning": "<explanation>",
      "emotionalAlignment": <0-100>,
      "riskLevel": "LOW" | "MEDIUM" | "HIGH"
    }
  ],
  "shouldBet": <true if emotional score allows>,
  "message": "<message to user>"
}
`

    const rawText = await invokeClaude({
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
      max_tokens: 1500,
      temperature: 0.8,
    })

    let jsonText = rawText.trim()
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "")
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```\n?/g, "")
    }

    const result = JSON.parse(jsonText)
    return result.picks || []
  } catch (error) {
    console.error('Error generating AI picks:', error)
    throw new Error('Failed to generate AI picks. Please try again.')
  }
}

import { invokeAI } from "../ai-service"
import type {
  BetAnalyzerReasoningInput,
  BetAnalyzerReasoningOutput,
  EVValidation,
  PickerReasoningInput,
  PickerReasoningOutput,
} from "../types/ai-models"

/**
 * Validates EV calculations against realistic sports betting ranges
 * Based on industry standards: +1-5% typical sharp edges
 * Sources: Pinnacle, OddsJam, professional betting forums
 *
 * Typical ranges:
 * - Typical profitable +EV: +1% to +5% (most common 1-3%)
 * - Strong +EV: +3% to +5%
 * - Above +5%: Rare in major markets, flag as high-variance/risky
 * - Negative EV: -2% to -10% common; below -10% extreme
 *
 * @param evPercent - EV as percentage of stake (e.g., 2.5 means +2.5%)
 * @param evDollars - EV in dollars (raw value)
 * @returns EVValidation object with realistic assessment and flags
 */
function validateEV(evPercent: number, evDollars: number): EVValidation {
  // Handle NaN or undefined
  if (!Number.isFinite(evPercent)) {
    return {
      ev: evDollars || 0,
      evPercentage: 0,
      isRealistic: false,
      flag: 'Invalid EV calculation; check inputs',
      category: 'negative-ev'
    }
  }

  if (evPercent > 5) {
    return {
      ev: evDollars,
      evPercentage: evPercent,
      isRealistic: false,
      flag: 'High EV (>5%) - rare in major markets; double-check probs or consider niche prop/live bet',
      category: 'high-variance'
    }
  } else if (evPercent > 3) {
    return {
      ev: evDollars,
      evPercentage: evPercent,
      isRealistic: true,
      flag: 'Strong edge (+3-5%); bet harder if confident',
      category: 'strong-edge'
    }
  } else if (evPercent > 1) {
    return {
      ev: evDollars,
      evPercentage: evPercent,
      isRealistic: true,
      flag: 'Solid +EV (+1-3%); good for volume',
      category: 'solid-value'
    }
  } else if (evPercent > 0) {
    return {
      ev: evDollars,
      evPercentage: evPercent,
      isRealistic: true,
      flag: 'Marginal +EV; line-shop for better',
      category: 'marginal'
    }
  } else if (evPercent > -2) {
    return {
      ev: evDollars,
      evPercentage: evPercent,
      isRealistic: true,
      flag: 'Near-fair; pass unless volume play',
      category: 'near-fair'
    }
  } else {
    return {
      ev: evDollars,
      evPercentage: evPercent,
      isRealistic: evPercent > -10, // Extreme negative EV is flagged as unrealistic
      flag: evPercent <= -10 ? 'Extreme negative EV (<-10%); avoid' : 'Negative EV; avoid unless hedging',
      category: 'negative-ev'
    }
  }
}

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
  const system = `You are an Expert Sports Betting Analyst AI that generates INDEPENDENT probability predictions.

**YOUR CORE TASK - GENERATE YOUR OWN PREDICTIONS**:
You are NOT simply re-using market odds. You must analyze the provided data and form YOUR OWN opinion about each team's win probability. Your predictions should DIFFER from the market implied probabilities based on:
- Team current form and momentum (recent wins/losses)
- Head-to-head historical records
- Key factors like injuries, home advantage, scheduling
- Expert analysis provided in the research data
- Statistical patterns that the market may have missed

**CRITICAL: CREATING REAL VALUE (POSITIVE/NEGATIVE EV)**:
The whole point of sports betting analysis is finding where YOUR probability estimate differs from the market:
- If YOU think Team A has 55% chance but market implies 50% → This is POSITIVE EV (+EV)
- If YOU think Team A has 45% chance but market implies 50% → This is NEGATIVE EV (-EV)
- NOT ALL PICKS SHOULD BE THE SAME SIGN - some games you'll find value, others you won't

Example of proper analysis:
- Market odds: Team A -150 (implied 60%), Team B +130 (implied 43.5%)
- YOUR analysis: Team A has been in poor form, lost 3 of last 5. You predict: Team A 52%, Team B 48%
- EV calculation for Team A: (0.52 × $6.67) - (0.48 × $10) = $3.47 - $4.80 = -$1.33 (NEGATIVE EV)
- EV calculation for Team B: (0.48 × $13) - (0.52 × $10) = $6.24 - $5.20 = +$1.04 (POSITIVE EV)
- RECOMMEND: Team B because your analysis shows the market is undervaluing them

**RULES FOR PROBABILITY PREDICTIONS**:
1. Your predicted probabilities must be based on RESEARCH DATA, not market odds
2. If a team is in hot form (3+ recent wins), increase their probability 5-15% vs market
3. If a team is struggling (3+ recent losses), decrease their probability 5-15% vs market
4. Consider H2H records - if one team dominates historically, adjust probabilities
5. Factor in expert predictions when available
6. Your probabilities for a matchup don't need to sum to 100% (account for draws in some sports)

**FOR EVERY GAME YOU MUST**:
1. State your independent predicted probability for each side
2. Compare to market implied probability
3. Calculate EV using YOUR probability (not market's)
4. Recommend the side where YOUR analysis shows value

**BET TYPE-SPECIFIC EV CALCULATION**:

For **MONEYLINE** bets:
  1. Calculate Implied Probability from odds: (Negative: |Odds|/(|Odds|+100), Positive: 100/(Odds+100))
  2. Form YOUR OWN win probability estimate based on research data
  3. Calculate Profit: If odds > 0: Profit = Stake × (Odds/100); If odds < 0: Profit = Stake × (100/|Odds|)
  4. Calculate True EV: EV = (YOUR_WinProb × Profit) - ((1 - YOUR_WinProb) × Stake)
  5. EV Percentage: (EV / Stake) × 100

For **SPREAD** bets:
  1. Form YOUR OWN cover probability based on team scoring patterns and spread size
  2. Calculate Profit from odds (usually ~0.909 × Stake at -110)
  3. Calculate True EV: EV = (YOUR_CoverProb × Profit) - ((1 - YOUR_CoverProb) × Stake)

For **TOTAL (Over/Under)** bets:
  1. Analyze team scoring trends, pace of play
  2. Form YOUR OWN over/under probability
  3. Calculate True EV using YOUR probability

**EXPECTED OUTCOME**:
- Some games you'll find +EV opportunities (your prediction differs favorably from market)
- Some games you'll find -EV (market is efficient or better informed)
- This VARIETY is NORMAL and EXPECTED
- Do NOT artificially make all picks positive or all negative

**RECOMMENDATION RULES**:
- ALWAYS recommend one team per game as the BETTER VALUE pick
- The "better value" = the side where YOUR predicted probability most exceeds market implied
- ALWAYS include BOTH sides of moneyline so users can compare
- Include confidence level (0-100) based on how much research data supports your prediction

**SPORTS RESEARCH INTEGRATION**:
Use ALL available research to form your predictions:
- Recent form: Hot teams get probability boost, cold teams get reduction
- Head-to-head: Dominance patterns adjust probability
- Expert predictions: Factor these into your analysis
- Key factors: Injuries, rest days, travel, etc.

**DYNAMIC STAKE CALCULATION**:
- Base stake: 4-8% of budget based on risk tolerance
- INCREASE stake for +EV picks with high confidence
- DECREASE stake for -EV picks or low confidence
- NEVER use hardcoded values

**EMOTIONAL ALIGNMENT**:
- Start at 50% baseline
- +15-25% if your predicted win prob > market implied (positive edge)
- +10-20% for positive user emotional state
- -15-25% for negative emotional state or chasing losses
- Consider EV impact on alignment

STRICT LOGIC RULES:
- If stake > 20% of weekly budget, label riskLevel as 'HIGH'
- If riskLevel is 'HIGH', shortExplanation must start with cautionary warning

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
- Negative EV is acceptable when AI win probability > implied probability (this means you're paying juice for a statistical edge)
- Only recommend "DON'T BET" when BOTH conditions are met:
  1. AI win probability < implied probability (no statistical edge)
  2. EV is significantly negative (more than -10% of stake)
- If AI probability > implied probability but EV is slightly negative, recommend the bet with explanation about paying juice for edge
- If EV is very negative (< -20% of stake) regardless of probability, recommend caution

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

    // Debug: Log what Gemini actually returned
    console.log('[Gemini] Raw response sample:', {
      emotionalAlignments: parsed.recommendations?.map((r: any) => r.emotionalAlignment),
      stakeAmounts: parsed.recommendations?.map((r: any) => r.suggestedStakeAbsolute),
      firstRec: parsed.recommendations?.[0]
    })

    // Apply EV validation to each recommendation
    // This validates EV against realistic sports betting ranges
    const validatedRecommendations = (parsed.recommendations ?? []).map((rec: any) => {
      const evDollars = rec.numericRisk?.ev ?? 0
      const evPercentage = rec.numericRisk?.evPercentage ?? 0

      // Validate EV and attach validation result
      const evValidation = validateEV(evPercentage, evDollars)

      // Log warnings for unrealistic EVs
      if (!evValidation.isRealistic) {
        console.warn(`[Gemini EV Validation] ⚠️ Unrealistic EV detected for ${rec.teams} - ${rec.line}:`, {
          evPercent: evPercentage.toFixed(2) + '%',
          evDollars: '$' + evDollars.toFixed(2),
          flag: evValidation.flag,
          category: evValidation.category
        })
      } else {
        console.log(`[Gemini EV Validation] ✓ ${rec.teams} - ${rec.line}: ${evPercentage.toFixed(2)}% (${evValidation.category})`)
      }

      return {
        ...rec,
        evValidation
      }
    })

    const output: PickerReasoningOutput = {
      recommendations: validatedRecommendations,
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

CRITICAL BETTING LOGIC:
- **RECOMMEND BETTING when AI win probability > implied probability from odds**, even if EV is slightly negative due to juice
- **DISCOURAGE BETTING when AI win probability < implied probability** (no mathematical edge)
- If AI win probability equals implied probability, recommend CAUTION
- **PRIORITIZE positive EV bets** but don't require positive EV when AI model shows edge

DYNAMIC STAKE CALCULATION:
- Base stake: 1-3% of weekly budget for standard bets
- Increase stake (up to 5%) when: AI probability > implied probability AND confidence > 70%
- Decrease stake (to 0.5-1%) when: AI probability < implied probability OR high emotional risk
- Consider user's risk tolerance and emotional state

EMOTIONAL ALIGNMENT SCORING (0-100%):
- Start at 50% baseline
- Add 20% if AI probability > implied probability
- Add 15% if user emotional state is positive/calm
- Add 10% if confidence > 75% and risk is LOW/MEDIUM
- Subtract 20% if emotional risk is HIGH
- Subtract 15% if chasing losses detected
- Subtract 10% if stake > 10% of budget

You MUST always prioritize emotional and financial safety over potential profit.
You DO NOT hallucinate stats or odds and rely only on provided inputs.
You must perform an 'Enhanced Analysis'.

STRICT LOGIC RULES:
- If you detect a budget use (stake) higher than 20% of the weekly budget, you must override any 'Positive' sentiment and label the betSafetyCategory as 'DISCOURAGED'.
- Calculate Implied Probability: Convert American odds to implied probability (Negative: |Odds|/(|Odds|+100), Positive: 100/(Odds+100)).
- The numericRisk.ev must be returned as a standard decimal number (e.g., -4.54), representing the expected dollar gain/loss for the provided stake. Never use scientific notation.
- If EV is negative but AI probability > implied probability, explain this as "paying juice for statistical edge"
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
      emotionalAlignment: {
        type: "number",
        description: "Emotional alignment score from 0-100% based on user psychology and bet analysis"
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
      "emotionalAlignment",
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
    emotionalAlignment: parsed.emotionalAlignment ?? 50,
    summary: parsed.summary,
    detailedExplanation: parsed.detailedExplanation,
    numericRisk: parsed.numericRisk || { ev: 0 },
    responsibleGamblingReminder: parsed.responsibleGamblingReminder,
  }

  return output
}

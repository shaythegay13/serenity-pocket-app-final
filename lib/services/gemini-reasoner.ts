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

**CRITICAL: CREATING REAL VALUE (POSITIVE EV)**:
The whole point of sports betting analysis is finding where YOUR probability estimate differs from the market:
- If YOU think Team A has 55% chance but market implies 50% → This is POSITIVE EV (+EV) on Team A
- If YOU think Team A has 45% chance but market implies 50% → Check Team B - they likely have POSITIVE EV
- KEY INSIGHT: In binary markets, value exists on ONE side - your job is to find WHICH side
- ALL 4 of your picks should have positive EV because you're selecting the valuable side of each market

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

**CRITICAL: FINDING VALUE EVEN WITH LIMITED DATA**:
Even when sportsResearch.dataSource is "fallback" or research data is sparse, you CAN still find value:
- Home teams historically win ~54-58% in most sports - if market implies less, that's potential value
- Underdogs are systematically undervalued by the public - look for value on plus-money lines
- Totals often have value: high-scoring teams in favorable matchups tend to go over
- Look for situational edges: rest advantage, travel, back-to-backs
- IMPORTANT: In any binary market (home/away, over/under), if one side is -EV, the OTHER side is +EV
- Your job is to identify WHICH side has the edge, not to declare "no edge exists"
- A realistic EV range is +1% to +5% for good picks; aim to find value in this range

**FOR EVERY GAME YOU MUST**:
1. State your independent predicted probability for each side based ON DATA (injuries, form, etc.).
2. Compare your predicted probability to the market implied probability.
3. Calculate EV: EV = (YOUR_WinProb * Profit) - ((1 - YOUR_WinProb) * Stake)
4. RECOMMEND the side where YOUR analysis shows the best relative value. If YOUR AI Prob > Implied Prob, it's a value play. If not, it's a "Market Efficient" or informational pick.
5. Surface a variety of bet types. If a game has spread or total odds, analyze them; don't just default to Moneyline.
6. Surface a recommendation for every game provided if possible, using your internal logic to pick the more sustainable side.

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
- For EVERY game, you MUST find the +EV side - it always exists in binary markets
- If Team A moneyline is -EV, then Team B moneyline is +EV (after accounting for vig)
- If spread home is -EV, then spread away is likely +EV
- Your job: identify WHICH side of each market has positive expected value
- Return 4 picks, ALL with positive EV - this is achievable by picking the right side of each market

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
**VALUE & EMOTIONAL ALIGNMENT LOGIC (STRICT)**:
- **PRIMARY GOAL**: Maximize financial benefit (+EV) while ensuring emotional safety.
- **EDGE**: Prefer bets where AI Prob > Implied Prob, but you may surface informational picks with no edge if they are the most logical options given the data.
- **EMOTIONAL FILTER**:
  - **Calm/Joy**: Optimal states for betting. Standard stake logic applies.
  - **Frustration/Sadness**: High risk of "revenge betting" or chasing. Skip complex/high-variance bets. Reduce stake by 50-70%.
  - **Greed/Excitement**: Risk of overconfidence. Cap stake at 4% even for high-confidence picks. Avoid parlays.
  - **Fear/Anxiety**: If the user is uncertain, DO NOT push them into a bet. Label as 'CAUTION' or 'DISCOURAGED'.
- **STRICT EMOTIONAL BLOCKER**: 
  - IF emotionalAlignment < 50, you MUST NOT recommend the bet (Label as "DON'T BET").
  - Emotional stability is our TOP PRIORITY. A good bet in a bad emotional state is still a BAD MOVE.
- **ALIGNMENT SCORE (0-100)**:
  - 90-100: Perfect +EV edge in a stable emotional state.
  - 70-89: Good edge, stable state.
  - 50-69: Strong edge is present but emotional state is neutral or slightly risky.
  - Below 50: HIGH RISK. Low/No edge or dangerous emotional state (frustration/greed). NEVER RECOMMEND 'PREFERRED'.
- **GAME TYPE MATCHING**: Match game variance to emotional state (e.g., avoid high-odds underdogs if user is frustrated).

**CRICKET BETTING ANALYSIS**:
When analyzing cricket matches (IPL, MLC, BBL, CPL, The Hundred, PSL, SA20, ICC ODI, ICC T20, Test):
- **Toss Factor**: Toss winner has 5-8% advantage in T20s (esp. chasing at night due to dew). Factor this into probability.
- **Pitch Conditions**: Batting-friendly pitches favor high totals and chasing teams; bowling-friendly pitches favor lower totals and teams batting first.
- **Powerplay**: Teams with explosive top-order batsmen have edge in T20/ODI powerplay overs.
- **Death Bowling**: Quality death bowlers (overs 16-20 in T20) significantly impact total runs. Teams with weak death bowling concede 15-25 extra runs.
- **Spin vs Pace**: Subcontinent pitches favor spin; Australian/English pitches favor pace. Evaluate team composition.
- **Format Matters**: T20 is high-variance (more upsets), ODI is moderate, Test is low-variance (favorites win more often).
- **Total Runs Lines**: T20 avg 300-330 combined, ODI avg 450-500 combined. Adjust based on pitch/venue.
- **Home Advantage**: Significant in cricket, especially in subcontinent (India/Pakistan/Sri Lanka) where conditions are unfamiliar to visiting teams.
- **Player Form**: Recent batting strike rate and bowling economy in the specific format matter more than career averages.

**PLAYER PROP ANALYSIS**:
When analyzing player props (if player prop data is provided):
- Consider player's recent performance trends (last 5-10 games if available)
- Factor in matchup quality (opponent's defensive rankings vs position)
- Account for game script expectations (spread/total implications)
- Evaluate correlation with team performance
- Check for injury/rest factors affecting player usage
- Higher variance than game bets - adjust confidence accordingly

**PROP-SPECIFIC VALUE SIGNALS**:
- Over props: Look for high-usage players in favorable game scripts (big favorites often rest stars late)
- Under props: Consider players on short rest, tough defensive matchups, or foul trouble risk
- Combined stats (PTS+REB+AST): Evaluate floor vs ceiling - combined props hit more consistently
- Touchdown props: Consider red zone usage, target share near goal line
- Receptions/Targets: Factor in pace of play and expected game script

**PLAYER PROP OUTPUT FIELDS**:
When recommending a player prop, include these additional fields:
- playerId: Unique player identifier
- playerName: Full player name (e.g., "Patrick Mahomes")
- playerTeam: Team abbreviation (e.g., "KC")
- playerPosition: Position (e.g., "QB", "WR", "PG")
- propCategory: Category type (passing, rushing, receiving, scoring, rebounding, etc.)
- propStat: Specific stat market (e.g., "player_pass_yds", "player_points")
- propLine: The numeric line (e.g., 250.5)
- propDirection: "over" or "under"

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
1. Return EXACTLY 4 recommendations - one for each game provided. Your job is to find the BEST value bet for each game.
2. For each recommendation, the 'teams' field MUST contain the actual team names in "Home Team vs Away Team" format
3. **PRIORITIZE POSITIVE EV**: For each game, evaluate ALL available markets (moneyline home, moneyline away, spread home, spread away, over, under) and select the ONE with the highest positive EV.
4. **FINDING VALUE**: Value exists when YOUR probability estimate differs from the market:
   - If you think the underdog is undervalued, recommend them (positive EV on underdog)
   - If you think a team will cover the spread more often than implied, recommend the spread
   - If you think the game will be higher/lower scoring than implied, recommend over/under
5. Risk tolerance affects STAKE SIZE, not bet selection:
   - Conservative: smaller stakes (4% of budget)
   - Moderate: medium stakes (6% of budget)
   - Aggressive: larger stakes (8% of budget)
6. **NEVER** just pick favorites - often the VALUE is on the underdog side
7. Base ALL picks on actual statistics, model predictions, and expected value
8. **IMPORTANT**: Always use the actual team names from the game context, never generic descriptions

**POSITIVE EV IS THE GOAL**:
- Your PRIMARY job is to find bets where YOUR estimated probability > market implied probability
- For EACH game, you MUST analyze both sides of each market to find where value exists
- If Team A is -150 (60% implied), ask: "Do I think Team A wins MORE than 60% of the time?" If yes, that's positive EV. If no, check Team B.
- Similarly for spreads: "Do I think this team covers MORE often than the -110 odds imply (52.4%)?"
- DO NOT return negative EV picks if positive EV exists on the other side of the same market
- If ALL bets for a game are negative EV (rare), pick the one closest to breakeven and note it as "Near Market Efficient"`

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
            // Player prop fields (optional - only include when recommending player props)
            playerId: {
              type: "string",
              description: "Unique player identifier (only for player props)"
            },
            playerName: {
              type: "string",
              description: "Full player name (e.g., 'Patrick Mahomes') - only for player props"
            },
            playerTeam: {
              type: "string",
              description: "Team abbreviation (e.g., 'KC') - only for player props"
            },
            playerPosition: {
              type: "string",
              description: "Position abbreviation (e.g., 'QB', 'WR', 'PG') - only for player props"
            },
            propCategory: {
              type: "string",
              description: "Prop category (passing, rushing, receiving, scoring, rebounding, etc.) - only for player props"
            },
            propStat: {
              type: "string",
              description: "Specific stat market (e.g., 'player_pass_yds', 'player_points') - only for player props"
            },
            propLine: {
              type: "number",
              description: "The numeric line value (e.g., 250.5) - only for player props"
            },
            propDirection: {
              type: "string",
              enum: ["over", "under"],
              description: "Direction of the prop bet - only for player props"
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

    // Post-process and normalize each recommendation
    const validatedRecommendations = (parsed.recommendations ?? []).map((rec: any) => {
      // 1. Clean reasoning text (remove raw prompt remnants, code, or JSON)
      let cleanedReasoning = rec.shortExplanation || ''

      // Simple heuristic to strip out typical LLM prompt leakage or raw JSON
      if (cleanedReasoning.includes('{') || cleanedReasoning.includes('```') || cleanedReasoning.length > 500) {
        cleanedReasoning = cleanedReasoning
          .split('\n')[0] // Take first line
          .replace(/```[a-z]*|```/g, '') // Remove code fences
          .replace(/Reasoning:|Analysis:/g, '') // Remove boilerplate headers
          .trim()

        if (cleanedReasoning.length < 10) {
          cleanedReasoning = `Analysis for ${rec.teams} ${rec.betType} based on current performance data.`
        }
      }

      const evDollars = rec.numericRisk?.ev ?? 0
      const evPercentage = rec.numericRisk?.evPercentage ?? 0

      // 2. Validate EV ranges
      const evValidation = validateEV(evPercentage, evDollars)

      // 3. Clamp extreme EV values to realistic ranges
      let clampedEvPct = evPercentage
      let clampedEvDollars = evDollars
      let wasAdjusted = false

      if (evPercentage < -5) {
        // Clamp to -3% (typical market vig) instead of extreme negative
        // Use deterministic clamping based on original value to avoid random financial calculations
        clampedEvPct = Math.max(-5, evPercentage * 0.6) // Scale down but keep relative ordering
        clampedEvDollars = (rec.suggestedStakeAbsolute || 30) * (clampedEvPct / 100)
        wasAdjusted = true
        console.log(`[Gemini EV Clamping] Adjusted ${rec.teams} ${rec.betType} EV from ${evPercentage.toFixed(2)}% to ${clampedEvPct.toFixed(2)}%`)
      } else if (evPercentage > 8) {
        // Clamp very high EV to more realistic range
        // Use deterministic clamping: scale down proportionally
        clampedEvPct = 3 + Math.min(2, (evPercentage - 8) * 0.2) // Cap at +5%
        clampedEvDollars = (rec.suggestedStakeAbsolute || 30) * (clampedEvPct / 100)
        wasAdjusted = true
        console.log(`[Gemini EV Clamping] Adjusted ${rec.teams} ${rec.betType} EV from ${evPercentage.toFixed(2)}% to ${clampedEvPct.toFixed(2)}%`)
      }

      if (!evValidation.isRealistic && !wasAdjusted) {
        console.warn(`[Gemini EV Validation] ⚠️ Unrealistic EV detected for ${rec.teams} - ${rec.line}:`, {
          evPercent: evPercentage.toFixed(2) + '%',
          evDollars: '$' + evDollars.toFixed(2),
          flag: evValidation.flag,
        })
      }

      // Update explanation if EV was clamped
      let finalExplanation = cleanedReasoning
      if (wasAdjusted && evPercentage < -5) {
        finalExplanation = `Market Efficient: ${cleanedReasoning.replace(/^Market Efficient:\s*/i, '')}`
      }

      return {
        ...rec,
        shortExplanation: finalExplanation,
        numericRisk: {
          ev: clampedEvDollars,
          evPercentage: clampedEvPct
        },
        evValidation: {
          ...evValidation,
          ev: clampedEvDollars,
          evPercentage: clampedEvPct,
          wasAdjusted
        }
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
  const system = `You are TiltLab's AI Betting Psychology Analyst - a responsible sports betting advisor combining GAME ANALYSIS with EMOTIONAL PSYCHOLOGY assessment.

YOUR DUAL MISSION:
1. **GAME ANALYSIS**: Evaluate the bet's merit based on team/player statistics, matchup dynamics, and situational factors
2. **PSYCHOLOGY ANALYSIS**: Assess whether THIS USER should make THIS BET given their emotional state and risk factors

==== SUPPORTED SPORTS & LEAGUES ====
NBA, NFL, MLB, NHL, College Basketball (NCAAB), College Football (NCAAF), English Premier League (EPL), MLS, UEFA Champions League (UCL), UFC, Boxing, ATP Tennis, WTA Tennis, PGA Golf, Formula 1, NASCAR, League of Legends (LoL), Counter-Strike (CS:GO), IPL, Major League Cricket (MLC), Big Bash League (BBL), Caribbean Premier League (CPL), The Hundred, PSL, SA20, ICC ODI, ICC T20, Test Cricket

==== GAME & STATISTICAL ANALYSIS ====

Analyze these factors based on the sport type:

**TEAM/PLAYER STATISTICS (Sport-Specific):**
- Team records (W-L) and recent form/streaks
- Offensive efficiency metrics (PPG, goals scored, points created)
- Defensive efficiency metrics (points/goals allowed, defensive rating)
- Home vs away performance differentials
- Pace of play and scoring tempo

*Basketball (NBA/NCAAB)*: FG%, 3P%, rebounds, assists, turnovers, pace rating
*Football (NFL/NCAAF)*: Passing/rushing yards, completion %, turnover differential, red zone efficiency
*Baseball (MLB)*: ERA, batting average, OPS, bullpen strength, starting pitcher matchup
*Hockey (NHL)*: Goals for/against, power play %, save %, Corsi/Fenwick metrics
*Soccer (EPL/MLS/UCL)*: Goals, xG (expected goals), possession %, clean sheets, set piece efficiency
*Combat Sports (UFC/Boxing)*: Fighter record, finish rate, striking accuracy, takedown defense, reach advantage
*Tennis (ATP/WTA)*: Service game win %, break point conversion, surface performance (clay/grass/hard)
*Cricket (IPL/MLC/BBL/CPL/ICC)*: Batting average, strike rate, bowling economy, bowling average, powerplay run rate, death-over economy, toss win advantage, pitch conditions (batting-friendly vs bowling-friendly), dew factor for day-night games, team composition (spin vs pace balance), recent form in format (T20/ODI/Test)
*Golf (PGA)*: Strokes gained, course history, recent form, putting stats
*Motorsports (F1/NASCAR)*: Qualifying pace, race pace, track history, car performance
*Esports (LoL/CS:GO)*: Map win rates, head-to-head record, recent roster changes, meta adaptation

**MATCHUP DYNAMICS:**
- Head-to-head historical record
- Stylistic advantages/disadvantages
- Key player/driver/fighter matchups
- Strength of schedule/competition level

**SITUATIONAL FACTORS:**
- Key injuries/absences and their impact
- Weather/track/course conditions
- Rest days, travel, back-to-backs, jet lag
- Home advantage significance for this sport
- Motivation factors (playoffs, relegation, rivalry, title implications)
- Recent roster/lineup changes

**YOUR VALUE ASSESSMENT:**
Form YOUR OWN opinion on whether the bet has merit:
- Does the data support the user's selection?
- Are there factors the user might be overlooking?
- What are the key risks that could cause this bet to lose?

==== PSYCHOLOGY & EMOTIONAL ANALYSIS ====

**CRITICAL PSYCHOLOGY FLAGS:**
- **isChasingLoss**: If true → MAJOR RED FLAG → recommend DISCOURAGED
- **isFavoriteTeam**: If true → emotional bias → be skeptical of their reasoning
- **isLiveBet**: If true → impulsive risk → recommend caution
- **confidenceLevel**: <50 with high stake = warning; >90 = overconfidence risk
- **currentEmotionIntensity**: 7+ amplifies all risks significantly
- **notes**: Analyze for biases, overconfidence, desperation, wishful thinking

**EMOTIONAL STATE IMPACT:**
- Joy/Calm = optimal state (+15%)
- Fear/Sadness = should avoid betting (-15%)
- Greed/Frustration = dangerous, high risk (-20%)

**BANKROLL RULES (NON-NEGOTIABLE):**
- Stake > 20% of budget → DISCOURAGED
- Stake > 10% of budget → CAUTION minimum
- Healthy range: 1-5% of budget

==== EMOTIONAL ALIGNMENT SCORING (0-100%) ====

Start at 55% baseline, adjust for game merit AND psychology:

**Game Merit:**
+10% if statistics/form strongly support selection
+5% if situational factors favor selection
-10% if data suggests poor value
-5% if key information is missing

**Psychology:**
+15% if calm/focused emotional state
+10% if healthy confidence (50-80)
-25% if isChasingLoss (CRITICAL)
-20% if dangerous emotional state
-15% if isLiveBet
-15% if intensity >= 7
-10% if isFavoriteTeam
-10% if stake > 10% of budget
-10% if overconfident (>90)
-10% if notes show desperation

==== EXPECTED VALUE ====

Calculate EV honestly:
- Implied Prob: Negative odds → |Odds|/(|Odds|+100); Positive → 100/(Odds+100)
- Report as decimal (e.g., -4.54)
- Be honest about juice (-2% to -5% typical)
- Bet can be "REASONABLE" with slight negative EV if psychology is healthy

==== SAFETY CATEGORIES ====

**DISCOURAGED**: isChasingLoss, stake >20%, dangerous emotional state, multiple red flags
**CAUTION**: stake >10%, isLiveBet + other flags, isFavoriteTeam + intensity, mixed/unfavorable analysis
**REASONABLE**: healthy psychology, appropriate stake, neutral-to-favorable analysis
**PREFERRED**: all green on psychology, strong game analysis, proper sizing, calm state

==== OUTPUT REQUIREMENTS ====
- DISCOURAGED/CAUTION: summary MUST start with warning
- Reference specific game factors AND psychology factors
- Cite user's inputs (emotion, stake, confidence, notes)
- numericRisk.ev as decimal (no scientific notation)

Output STRICT JSON matching the schema.`

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

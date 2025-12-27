/**
 * AI Bet Advisor - Responsible Betting Analysis
 * Integrated from hackathon serenitypocketai project
 *
 * This module provides dual-agent AI analysis for betting:
 * 1. Analytical Agent: Technical betting analysis, EV considerations
 * 2. Safety Agent: Harm reduction, emotional psychology, risk assessment
 * 3. Unified Recommendation: Combined analysis with confidence scoring
 */

import { isEnhancedAIAvailable, getEnhancedBetAnalysis } from './aws-bedrock'
import { isPerplexityAvailable, invokePerplexity } from './perplexity'
export interface BetScenario {
  sport: string
  betType: 'Moneyline' | 'Spread' | 'Over/Under' | 'Parlay'
  betAmount: number
  budget: number
  favoriteTeam: string
  underdogTeam: string
  favoriteRecord: string
  underdogRecord: string
  // Legacy text fields (kept for backward compatibility)
  injuries: string
  weather: string
  // New boolean fields for UI
  hasKeyInjuries: boolean
  hasAdverseWeather: boolean
  isLiveBet: boolean
  isFavoriteTeam: boolean
  isChasingLoss: boolean
  currentEmotion: string
  lastOutcome: 'Won' | 'Lost' | 'Push' | 'None'
  emotionalTriggers: string
  bettingSlip: string
  history: string
  notes: string
  odds?: string
}

export interface HarmSignal {
  type: 'budget' | 'chasing' | 'frequency' | 'emotional' | 'parlay'
  label: string
}

export interface SafetyAnalysis {
  percent: number
  signals: HarmSignal[]
  risk: 'LOW' | 'MODERATE' | 'HIGH'
  color: 'risk-low' | 'risk-moderate' | 'risk-high'
  recommendations: string[]
}

export interface AnalyticalAnalysis {
  insights: string[]
  evNotes: string[]
  factors: string[]
}

export interface BettingSlipParsed {
  hasParlay: boolean
  hasMultipleBets: boolean
  totalStake: number
  betCount: number
  teams: string[]
  betTypes: string[]
  riskIndicators: string[]
}

export interface EmotionalAnalysis {
  emotionalRisk: 'LOW' | 'MODERATE' | 'HIGH'
  emotionalState: 'neutral' | 'positive' | 'negative' | 'dangerous'
  emotionalFactors: string[]
  recoveryRecommendations: string[]
  shouldWait: boolean
  waitingPeriod: string
}

export interface UnifiedRecommendation {
  recommendation: 'PLACE BET' | 'DON\'T PLACE BET' | 'PROCEED WITH CAUTION'
  reason: string
  confidence: number
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH'
  budgetPercent: number
  emotionalAnalysis: EmotionalAnalysis
  gameFactors: {
    favoriteWinPct: number
    underdogWinPct: number
    hasKeyInjuries: boolean
    badWeather: boolean
    isParlay: boolean
  }
}

export interface ComprehensiveAnalysis {
  analytical: AnalyticalAnalysis
  safety: SafetyAnalysis
  recommendation: UnifiedRecommendation
}

export interface AIEnhancedAnalysis extends ComprehensiveAnalysis {
  ai?: {
    usedClaude: boolean
    usedPerplexity: boolean
    claudeAnalysis?: {
      enhancedReasoning: string
      refinedRecommendation: 'PLACE BET' | 'DON\'T PLACE BET' | 'PROCEED WITH CAUTION'
      confidenceScore: number
      keyInsights: string[]
    }
    perplexitySummary?: string
  }
}

/**
 * Detect harm reduction signals in betting behavior
 */
export function detectSignals(payload: BetScenario): SafetyAnalysis {
  const amt = Number(payload.betAmount) || 0
  const budget = Number(payload.budget) || 0
  const percent = budget > 0 ? Math.round((amt / budget) * 100) : 0
  const historyText = (payload.history || '').toLowerCase()
  const emotionText = (payload.currentEmotion || '').toLowerCase()

  const signals: HarmSignal[] = []
  const recommendations: string[] = []

  // Budget risk
  const highBudget = percent >= 25
  const moderateBudget = percent >= 15 && percent < 25

  if (highBudget) signals.push({ type: 'budget', label: `${percent}% of weekly budget at risk` })
  else if (moderateBudget) signals.push({ type: 'budget', label: `${percent}% of budget (moderately high)` })

  // Chasing losses
  const chasing = /lost|loss|losing|down|behind|recover|win back/i.test(historyText)
  if (chasing) signals.push({ type: 'chasing', label: 'Potential chasing behavior detected' })

  // High frequency
  const frequency = /multiple|several|many|few bets|series/i.test(historyText)
  if (frequency) signals.push({ type: 'frequency', label: 'High betting frequency noted' })

  // Emotional state
  const emotional = /frustrated|angry|desperate|greedy|need to|anxious|upset/i.test(emotionText)
  if (emotional) signals.push({ type: 'emotional', label: 'Emotional state may affect judgment' })

  // Parlay after loss
  const parlayAfterLoss = payload.betType === 'Parlay' && chasing
  if (parlayAfterLoss) signals.push({ type: 'parlay', label: 'Parlay bet while chasing losses' })

  // Risk calculation
  let risk: 'LOW' | 'MODERATE' | 'HIGH' = 'LOW'
  let color: 'risk-low' | 'risk-moderate' | 'risk-high' = 'risk-low'

  if (highBudget || parlayAfterLoss || (emotional && chasing)) {
    risk = 'HIGH'
    color = 'risk-high'
  } else if (moderateBudget || chasing || emotional || frequency) {
    risk = 'MODERATE'
    color = 'risk-moderate'
  }

  // Recommendations
  if (percent >= 25) recommendations.push('Reduce bet size below 25% of weekly budget immediately')
  else if (percent >= 10) recommendations.push('Consider lowering bet size to under 10% of budget')
  if (chasing) recommendations.push('Avoid chasing losses; consider a cooling-off period')
  if (frequency) recommendations.push('Set limits to reduce short-term betting frequency')
  if (emotional) recommendations.push('Reflect on reasoning; avoid emotion-driven decisions')
  if (parlayAfterLoss) recommendations.push('Skip parlays after losses; choose a single event')
  if (recommendations.length === 0) recommendations.push('Stay within budget and track outcomes objectively')

  return { percent, signals, risk, color, recommendations }
}

/**
 * Analytical agent - technical betting analysis
 */
export function analyticalAgent(payload: BetScenario): AnalyticalAnalysis {
  const amt = Number(payload.betAmount) || 0
  const budget = Number(payload.budget) || 0
  const percent = budget > 0 ? Math.round((amt / budget) * 100) : 0
  const isParlay = payload.betType === 'Parlay'
  const type = payload.betType
  const sport = payload.sport

  const insights: string[] = []
  insights.push(`Bet type: ${type} • Sport: ${sport}`)
  insights.push(`Stake: $${amt} • ${percent}% of weekly budget`)
  if (isParlay) insights.push('Parlay: payout potential rises but probability drops sharply')
  if (type === 'Spread' || type === 'Over/Under') insights.push('Lines typically priced near even odds; vig affects EV')
  if (type === 'Moneyline') insights.push('Assess fair odds vs offered price; avoid heavy juice')

  const evNotes: string[] = []
  if (isParlay) evNotes.push('Compounded legs reduce win probability; EV often negative without edge')
  evNotes.push('EV hinges on fair probability vs payout; track implied odds and vig')
  evNotes.push('Consider bankroll impact; higher stake % increases risk of ruin')

  const factors: string[] = []
  factors.push('Team injuries and rest')
  factors.push('Recent form and matchup stats')
  factors.push('Home/away splits and travel')
  factors.push('Line movement and market consensus')
  factors.push('Weather (for outdoor sports)')

  return { insights, evNotes, factors }
}

/**
 * Parse betting slip text for risk patterns
 */
export function parseBettingSlip(bettingSlipText: string): BettingSlipParsed | null {
  if (!bettingSlipText) return null

  const text = bettingSlipText.toLowerCase()
  const parsed: BettingSlipParsed = {
    hasParlay: false,
    hasMultipleBets: false,
    totalStake: 0,
    betCount: 0,
    teams: [],
    betTypes: [],
    riskIndicators: []
  }

  // Detect bet type
  if (/(parlay|accumulator|multi|multiple)/i.test(text)) {
    parsed.hasParlay = true
    parsed.riskIndicators.push('Parlay bet detected')
  }

  // Detect multiple bets
  const betMatches = text.match(/(\d+)\s*leg|\d+\s*team|\d+\s*game|\d+\s*selection/gi)
  if (betMatches) {
    parsed.hasMultipleBets = true
    parsed.betCount = Math.max(...betMatches.map(m => parseInt(m.match(/\d+/)![0])))
    if (parsed.betCount > 3) parsed.riskIndicators.push(`Complex bet with ${parsed.betCount} selections`)
  }

  // Extract stake amount
  const stakeMatch = text.match(/\$(\d+(?:\.\d{2})?)|(\d+(?:\.\d{2})?)\s*\$/i)
  if (stakeMatch) {
    parsed.totalStake = parseFloat(stakeMatch[1] || stakeMatch[2])
    if (parsed.totalStake > 100) parsed.riskIndicators.push('High stake amount')
  }

  // Extract teams/lines
  const teamPatterns = [
    /([a-z]{3,}\s+[a-z]{3,}|[a-z]+)\s*[+-]\d+(\.\d+)?/gi, // Team names with spread
    /([a-z]{3,}\s+[a-z]{3,}|[a-z]+)\s+moneyline/gi, // Moneyline
    /over\s+\d+(\.\d+)?|under\s+\d+(\.\d+)?/gi // Totals
  ]

  teamPatterns.forEach(pattern => {
    const matches = text.match(pattern)
    if (matches) parsed.teams = [...parsed.teams, ...matches]
  })

  // Detect emotional language in betting slip
  if (/(big|huge|massive|all in|yolo|lock|guarantee|sure thing)/i.test(text)) {
    parsed.riskIndicators.push('Emotional/overconfident language')
  }

  // Detect chasing patterns
  if (/(win back|recover|make back|get even|chase)/i.test(text)) {
    parsed.riskIndicators.push('Potential chasing behavior')
  }

  return parsed
}

/**
 * Emotional psychology analysis
 */
export function emotionalPsychologyAnalysis(payload: BetScenario): EmotionalAnalysis {
  const currentEmotion = payload.currentEmotion || 'Neutral/Calm'
  const lastOutcome = payload.lastOutcome || 'Haven\'t bet recently'
  const emotionalTriggers = (payload.emotionalTriggers || '').toLowerCase()
  const bettingSlip = (payload.bettingSlip || '').toLowerCase()

  // Parse betting slip for emotional patterns
  const slipAnalysis = parseBettingSlip(bettingSlip)

  // Emotional state mapping
  const positiveEmotions = ['happy', 'excited', 'confident', 'optimistic', 'gleeful']
  const negativeEmotions = ['frustrated', 'annoyed', 'sad', 'disappointed', 'anxious', 'stressed', 'angry', 'upset']
  const dangerousEmotions = ['desperate', 'greedy', 'lucky']

  // Analyze current emotional state
  let emotionalRisk: 'LOW' | 'MODERATE' | 'HIGH' = 'LOW'
  let emotionalState: 'neutral' | 'positive' | 'negative' | 'dangerous' = 'neutral'
  let emotionalFactors: string[] = []

  // Check current emotion
  const emotionText = currentEmotion.toLowerCase()
  if (dangerousEmotions.some(e => emotionText.includes(e))) {
    emotionalRisk = 'HIGH'
    emotionalState = 'dangerous'
    emotionalFactors.push('Dangerous emotional state detected')
  } else if (negativeEmotions.some(e => emotionText.includes(e))) {
    emotionalRisk = 'HIGH'
    emotionalState = 'negative'
    emotionalFactors.push('Negative emotional state')
  } else if (positiveEmotions.some(e => emotionText.includes(e))) {
    emotionalRisk = 'MODERATE'
    emotionalState = 'positive'
    emotionalFactors.push('Positive but potentially overconfident state')
  }

  // Check last outcome impact
  if (lastOutcome.includes('Lost')) {
    emotionalFactors.push('Recent loss may trigger chasing behavior')
    if (emotionalRisk === 'LOW') emotionalRisk = 'MODERATE'
  } else if (lastOutcome.includes('Won')) {
    emotionalFactors.push('Recent win may create overconfidence')
  }

  // Analyze emotional triggers
  const triggerSignals: Record<string, RegExp> = {
    chasing: /win back|recover|make back|get even|chase/i,
    desperation: /need to|must win|desperate|can't lose/i,
    overconfidence: /feeling lucky|on fire|hot streak|can't lose|sure thing/i,
    celebration: /celebrate|treat myself|reward/i,
    boredom: /bored|nothing to do|pass time/i,
    anger: /pissed|angry|mad|show them|prove/i,
    fear: /scared|nervous|worried|anxious/i
  }

  Object.entries(triggerSignals).forEach(([type, regex]) => {
    if (regex.test(emotionalTriggers)) {
      emotionalFactors.push(`Emotional trigger detected: ${type}`)
      if (type === 'chasing' || type === 'desperation' || type === 'anger') {
        emotionalRisk = 'HIGH'
      } else if (emotionalRisk === 'LOW' && (type === 'overconfidence' || type === 'celebration')) {
        emotionalRisk = 'MODERATE'
      }
    }
  })

  // Analyze betting slip for emotional patterns
  if (slipAnalysis) {
    if (slipAnalysis.hasParlay && emotionalTriggers.includes('chasing')) {
      emotionalFactors.push('Complex parlay bets while emotionally compromised')
      emotionalRisk = 'HIGH'
    }
    if (slipAnalysis.totalStake > 100 && emotionalRisk !== 'LOW') {
      emotionalFactors.push(`Large stake amount ($${slipAnalysis.totalStake}) during emotional state`)
      emotionalRisk = 'HIGH'
    }
    if (slipAnalysis.riskIndicators.length > 0) {
      emotionalFactors.push(...slipAnalysis.riskIndicators.map(r => `Bet slip: ${r}`))
    }
    if (slipAnalysis.betCount > 3) {
      emotionalFactors.push(`Complex multi-bet (${slipAnalysis.betCount} selections) - higher risk`)
      if (emotionalRisk === 'LOW') emotionalRisk = 'MODERATE'
    }
  }

  // Recovery recommendations
  const recoveryRecommendations: string[] = []
  if (emotionalRisk === 'HIGH') {
    recoveryRecommendations.push('Strongly recommend waiting 24-48 hours before betting')
    recoveryRecommendations.push('Consider taking a break from betting today')
    recoveryRecommendations.push('Practice emotional regulation techniques')
  } else if (emotionalRisk === 'MODERATE') {
    recoveryRecommendations.push('Wait a few hours and reassess your emotional state')
    recoveryRecommendations.push('Consider reducing bet size significantly')
    recoveryRecommendations.push('Focus on objective analysis rather than emotions')
  } else {
    recoveryRecommendations.push('Maintain emotional awareness while betting')
    recoveryRecommendations.push('Stick to your predetermined betting strategy')
  }

  return {
    emotionalRisk,
    emotionalState,
    emotionalFactors,
    recoveryRecommendations,
    shouldWait: emotionalRisk === 'HIGH',
    waitingPeriod: emotionalRisk === 'HIGH' ? '24-48 hours' : emotionalRisk === 'MODERATE' ? '2-4 hours' : 'immediate'
  }
}

/**
 * Unified recommendation agent - combines analytical and safety data
 */
export function unifiedRecommendationAgent(
  payload: BetScenario,
  analyticalData: AnalyticalAnalysis,
  safetyData: SafetyAnalysis
): UnifiedRecommendation {
  const amt = Number(payload.betAmount) || 0
  const budget = Number(payload.budget) || 0
  const percent = budget > 0 ? Math.round((amt / budget) * 100) : 0
  const isParlay = payload.betType === 'Parlay'

  // Parse team records
  const favRecord = payload.favoriteRecord || ''
  const dogRecord = payload.underdogRecord || ''
  const favWins = parseInt(favRecord.split('-')[0]) || 0
  const favLosses = parseInt(favRecord.split('-')[1]) || 0
  const dogWins = parseInt(dogRecord.split('-')[0]) || 0
  const dogLosses = parseInt(dogRecord.split('-')[1]) || 0

  const favWinPct = favWins + favLosses > 0 ? (favWins / (favWins + favLosses)) : 0.5
  const dogWinPct = dogWins + dogLosses > 0 ? (dogWins / (dogWins + dogLosses)) : 0.5

  // Game analysis factors
  const hasKeyInjuries = /star|key|starting|main/i.test(payload.injuries || '')
  const badWeather = /rain|snow|wind|cold/i.test(payload.weather || '')
  const bigFavorite = favWinPct - dogWinPct > 0.3
  const recordsClose = Math.abs(favWinPct - dogWinPct) < 0.15

  // Emotional psychology analysis
  const emotionalAnalysis = emotionalPsychologyAnalysis(payload)

  // Financial risk factors
  const highBudgetRisk = percent > 20
  const moderateBudgetRisk = percent > 10 && percent <= 20
  const chasingBehavior = safetyData.signals.some(s => s.type === 'chasing')
  const emotionalBetting = safetyData.signals.some(s => s.type === 'emotional')

  // Recommendation logic
  let recommendation: 'PLACE BET' | 'DON\'T PLACE BET' | 'PROCEED WITH CAUTION' = 'PROCEED WITH CAUTION'
  let reason = ''
  let confidence = 50

  // PRIORITY 1: Emotional Psychology - Most Important
  if (emotionalAnalysis.emotionalRisk === 'HIGH') {
    recommendation = 'DON\'T PLACE BET'
    reason = `Emotional state (${emotionalAnalysis.emotionalState}) detected. ${emotionalAnalysis.emotionalFactors[0]}. Waiting ${emotionalAnalysis.waitingPeriod} is strongly recommended for better decision making.`
    confidence = 90
  }
  // Strong DON'T BET conditions (emotional + financial)
  else if (highBudgetRisk && (chasingBehavior || emotionalBetting || emotionalAnalysis.emotionalRisk === 'MODERATE')) {
    recommendation = 'DON\'T PLACE BET'
    reason = 'High financial risk combined with emotional factors. This bet poses significant danger to your bankroll and mental well-being.'
    confidence = 85
  } else if (isParlay && (chasingBehavior || emotionalAnalysis.emotionalState === 'negative')) {
    recommendation = 'DON\'T PLACE BET'
    reason = 'Emotional state combined with parlays is extremely risky. Parlays already have lower win probability and emotional betting clouds judgment.'
    confidence = 85
  } else if (emotionalAnalysis.shouldWait && (highBudgetRisk || isParlay)) {
    recommendation = 'DON\'T PLACE BET'
    reason = `Your emotional state suggests waiting ${emotionalAnalysis.waitingPeriod} before betting. Combined with financial risk, this is not advisable right now.`
    confidence = 80
  }
  // Strong BET conditions
  else if (!highBudgetRisk && !moderateBudgetRisk && !chasingBehavior && !emotionalBetting &&
           bigFavorite && !hasKeyInjuries && !badWeather && !isParlay) {
    recommendation = 'PLACE BET'
    reason = 'Low financial risk, no emotional patterns, favorable matchup with strong favorite and no major injuries.'
    confidence = 75
  }
  // CAUTION conditions
  else {
    const riskFactors: string[] = []
    if (moderateBudgetRisk) riskFactors.push('moderate budget risk')
    if (chasingBehavior) riskFactors.push('chasing losses')
    if (emotionalBetting) riskFactors.push('emotional decision making')
    if (hasKeyInjuries) riskFactors.push('key injuries')
    if (badWeather) riskFactors.push('poor weather conditions')
    if (isParlay) riskFactors.push('parlay complexity')
    if (recordsClose) riskFactors.push('closely matched teams')

    if (riskFactors.length > 0) {
      reason = `Consider proceeding carefully due to: ${riskFactors.join(', ')}. ${percent > 15 ? 'Reduce bet size' : 'Monitor your emotional state'} and ensure this fits your overall strategy.`
    } else {
      reason = 'Standard bet with manageable risk. Ensure this aligns with your betting strategy and emotional state.'
    }
    confidence = Math.max(30, 70 - (riskFactors.length * 10))
  }

  return {
    recommendation,
    reason,
    confidence,
    riskLevel: safetyData.risk,
    budgetPercent: percent,
    emotionalAnalysis,
    gameFactors: {
      favoriteWinPct: Math.round(favWinPct * 100),
      underdogWinPct: Math.round(dogWinPct * 100),
      hasKeyInjuries,
      badWeather,
      isParlay
    }
  }
}

/**
 * Main analysis function - runs all agents and returns comprehensive analysis
 */
export function analyzeScenario(payload: BetScenario): ComprehensiveAnalysis {
  const analytical = analyticalAgent(payload)
  const safety = detectSignals(payload)
  const recommendation = unifiedRecommendationAgent(payload, analytical, safety)

  return {
    analytical,
    safety,
    recommendation
  }
}

export async function analyzeScenarioWithAI(payload: BetScenario): Promise<AIEnhancedAnalysis> {
  const base = analyzeScenario(payload)

  const hasClaude = isEnhancedAIAvailable()
  const hasPerplexity = isPerplexityAvailable()

  let claudeAnalysis:
    | {
        enhancedReasoning: string
        refinedRecommendation: 'PLACE BET' | "DON'T PLACE BET" | 'PROCEED WITH CAUTION'
        confidenceScore: number
        keyInsights: string[]
      }
    | undefined
  let perplexitySummary: string | undefined

  if (hasPerplexity) {
    try {
      const researchPrompt = `You are assisting with research for a responsible betting advisor.

Please provide concise, factual context for this betting scenario.

Sport: ${payload.sport}
Bet Type: ${payload.betType}
Bet Amount: $${payload.betAmount}
Weekly Budget: $${payload.budget}
Favorite: ${payload.favoriteTeam} (${payload.favoriteRecord})
Underdog: ${payload.underdogTeam} (${payload.underdogRecord})
Injuries: ${payload.injuries || 'None reported'}
Weather: ${payload.weather || 'N/A'}
Current Emotion: ${payload.currentEmotion}
Last Outcome: ${payload.lastOutcome}

User notes: ${payload.notes || 'n/a'}

Focus on data that could impact responsible betting decisions (schedule spots, injuries, trends, etc.).
Respond with 3-8 bullet points.`

      perplexitySummary = await invokePerplexity({
        system: 'You are a neutral research assistant supporting a responsible gambling advisor.',
        messages: [
          {
            role: 'user',
            content: researchPrompt,
          },
        ],
        max_tokens: 900,
        temperature: 0.3,
      })
    } catch (error) {
      console.error('Perplexity research failed (analyzeScenarioWithAI):', error)
    }
  }

  if (hasClaude) {
    try {
      claudeAnalysis = await getEnhancedBetAnalysis({
        sport: payload.sport,
        betType: payload.betType,
        betAmount: payload.betAmount,
        budget: payload.budget,
        favoriteTeam: payload.favoriteTeam,
        underdogTeam: payload.underdogTeam,
        favoriteRecord: payload.favoriteRecord,
        underdogRecord: payload.underdogRecord,
        injuries: payload.injuries,
        weather: payload.weather,
        currentEmotion: payload.currentEmotion,
        lastOutcome: payload.lastOutcome,
        emotionalTriggers: payload.emotionalTriggers,
        bettingSlip: payload.bettingSlip,
        history: payload.history,
        notes: payload.notes,
        builtInAnalysis: {
          analyticalInsights: [
            ...base.analytical.insights,
            ...base.analytical.evNotes,
            ...base.analytical.factors,
          ],
          emotionalRisk: base.recommendation.emotionalAnalysis.emotionalRisk,
          emotionalFactors: base.recommendation.emotionalAnalysis.emotionalFactors,
          safetySignals: base.safety.signals.map((s) => s.label),
          recommendation: base.recommendation.recommendation,
          confidence: base.recommendation.confidence,
        },
      })
    } catch (error) {
      console.error('Claude enhanced analysis failed (analyzeScenarioWithAI):', error)
    }
  }

  return {
    ...base,
    ai: {
      usedClaude: !!claudeAnalysis,
      usedPerplexity: !!perplexitySummary,
      claudeAnalysis,
      perplexitySummary,
    },
  }
}

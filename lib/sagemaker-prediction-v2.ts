/**
 * AWS SageMaker Prediction Integration (3-Class Classification)
 * Calls the trained XGBoost model endpoint for bet outcome predictions
 * Predicts: LOSS (0), PUSH (1), or WIN (2)
 */

import { SageMakerRuntimeClient, InvokeEndpointCommand } from '@aws-sdk/client-sagemaker-runtime'
import type { BetScenario } from './ai-bet-advisor'

// Initialize SageMaker Runtime client
const sagemakerClient = new SageMakerRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

export interface SageMakerPredictionInput {
  sport: string
  betType: 'Moneyline' | 'Spread' | 'Over/Under' | 'Parlay'
  betAmount: number
  budget: number
  favoriteWinPct: number
  underdogWinPct: number
  hasKeyInjuries: boolean
  badWeather: boolean
  emotionalRisk: 'LOW' | 'MODERATE' | 'HIGH'
  emotionalState: 'neutral' | 'positive' | 'negative' | 'dangerous'
  chasingBehavior: boolean
  highFrequencyBetting: boolean
  recentLoss: boolean
  recentWin: boolean
  favoritePPG?: number
  underdogPPG?: number
  favoriteFGPct?: number
  underdogFGPct?: number
  favoriteDefRating?: number
  underdogDefRating?: number
  homeAdvantage: boolean
  oddsAmerican: number
  confidenceScore: number
  userExperience: 'novice' | 'intermediate' | 'expert'
  emotionalIntensity: number
  biasOverconfidence: boolean
  biasRecency: boolean
  biasLossAversion: boolean
  biasConfirmation: boolean
  last5WinRate: number
  userAge: '18-25' | '26-35' | '36-45' | '46+'
}

export interface SageMakerPredictionResult {
  // Probabilities for each outcome
  lossProbability: number      // 0.0 - 1.0
  pushProbability: number      // 0.0 - 1.0
  winProbability: number       // 0.0 - 1.0

  // Predicted outcome
  predictedOutcome: 'LOSS' | 'PUSH' | 'WIN'

  // Confidence in prediction (highest probability)
  confidence: number           // 0.0 - 1.0

  // Risk scores
  overallRisk: number          // 0-100 (higher = riskier)

  // Expected value calculation
  expectedValue: number        // In dollars (can be negative)
}

/**
 * Convert BetScenario to SageMaker feature vector
 */
function scenarioToFeatureVector(input: SageMakerPredictionInput): number[] {
  const budgetPercent = input.budget > 0 ? (input.betAmount / input.budget) * 100 : 0
  const impliedProbability = calculateImpliedProbability(input.oddsAmerican)

  // 50 features matching the training data format
  return [
    // Sport one-hot encoding (4 features)
    input.sport.toLowerCase().includes('nba') || input.sport.toLowerCase() === 'basketball' ? 1 : 0,
    input.sport.toLowerCase().includes('nfl') || input.sport.toLowerCase() === 'football' ? 1 : 0,
    input.sport.toLowerCase().includes('mlb') || input.sport.toLowerCase() === 'baseball' ? 1 : 0,
    input.sport.toLowerCase().includes('nhl') || input.sport.toLowerCase() === 'hockey' ? 1 : 0,

    // Bet type one-hot encoding (4 features)
    input.betType === 'Moneyline' ? 1 : 0,
    input.betType === 'Spread' ? 1 : 0,
    input.betType === 'Over/Under' ? 1 : 0,
    input.betType === 'Parlay' ? 1 : 0,

    // Bet financial metrics (3 features)
    input.betAmount,
    input.budget,
    budgetPercent,

    // Game metrics (5 features)
    input.favoriteWinPct,
    input.underdogWinPct,
    input.hasKeyInjuries ? 1 : 0,
    input.badWeather ? 1 : 0,
    input.betType === 'Parlay' ? 1 : 0,

    // Emotional risk one-hot encoding (3 features)
    input.emotionalRisk === 'LOW' ? 1 : 0,
    input.emotionalRisk === 'MODERATE' ? 1 : 0,
    input.emotionalRisk === 'HIGH' ? 1 : 0,

    // Emotional state one-hot encoding (4 features)
    input.emotionalState === 'neutral' ? 1 : 0,
    input.emotionalState === 'positive' ? 1 : 0,
    input.emotionalState === 'negative' ? 1 : 0,
    input.emotionalState === 'dangerous' ? 1 : 0,

    // Behavioral signals (4 features)
    input.chasingBehavior ? 1 : 0,
    input.highFrequencyBetting ? 1 : 0,
    input.recentLoss ? 1 : 0,
    input.recentWin ? 1 : 0,

    // Performance metrics (6 features)
    input.favoritePPG || 0,
    input.underdogPPG || 0,
    input.favoriteFGPct || 0,
    input.underdogFGPct || 0,
    input.favoriteDefRating || 0,
    input.underdogDefRating || 0,

    // Game context (1 feature)
    input.homeAdvantage ? 1 : 0,

    // Odds and confidence (3 features)
    input.oddsAmerican,
    impliedProbability,
    input.confidenceScore,

    // Safety risk one-hot encoding (3 features)
    input.emotionalRisk === 'LOW' ? 1 : 0,
    input.emotionalRisk === 'MODERATE' ? 1 : 0,
    input.emotionalRisk === 'HIGH' ? 1 : 0,

    // User experience one-hot encoding (3 features)
    input.userExperience === 'novice' ? 1 : 0,
    input.userExperience === 'intermediate' ? 1 : 0,
    input.userExperience === 'expert' ? 1 : 0,

    // Emotional and bias metrics (5 features)
    input.emotionalIntensity,
    input.biasOverconfidence ? 1 : 0,
    input.biasRecency ? 1 : 0,
    input.biasLossAversion ? 1 : 0,
    input.biasConfirmation ? 1 : 0,

    // Performance history (1 feature)
    input.last5WinRate,

    // User age one-hot encoding (4 features)
    input.userAge === '18-25' ? 1 : 0,
    input.userAge === '26-35' ? 1 : 0,
    input.userAge === '36-45' ? 1 : 0,
    input.userAge === '46+' ? 1 : 0,
  ]
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
 * Calculate potential payout from American odds
 */
function calculatePayout(stake: number, odds: number): number {
  if (odds > 0) {
    // Positive odds: profit = stake * (odds / 100)
    return stake * (odds / 100)
  } else {
    // Negative odds: profit = stake / (abs(odds) / 100)
    return stake / (Math.abs(odds) / 100)
  }
}

/**
 * Calculate expected value of the bet
 */
function calculateExpectedValue(
  stake: number,
  odds: number,
  winProb: number,
  pushProb: number,
  lossProb: number
): number {
  const profit = calculatePayout(stake, odds)

  // EV = (P(Win) * Profit) + (P(Push) * 0) + (P(Loss) * -Stake)
  const ev = (winProb * profit) + (pushProb * 0) + (lossProb * -stake)

  return ev
}

/**
 * Call SageMaker endpoint for prediction (3-Class)
 */
export async function predictBetOutcome(input: SageMakerPredictionInput): Promise<SageMakerPredictionResult> {
  const endpointName = process.env.AWS_SAGEMAKER_ENDPOINT

  if (!endpointName) {
    throw new Error('AWS_SAGEMAKER_ENDPOINT environment variable not set')
  }

  try {
    // Convert input to feature vector
    const features = scenarioToFeatureVector(input)

    // Format as CSV (SageMaker XGBoost expects CSV input)
    const csvData = features.join(',')

    // Invoke SageMaker endpoint
    const command = new InvokeEndpointCommand({
      EndpointName: endpointName,
      ContentType: 'text/csv',
      Body: csvData,
    })

    const response = await sagemakerClient.send(command)

    // Parse response - XGBoost multiclass returns array of 3 probabilities
    const responseBody = JSON.parse(new TextDecoder().decode(response.Body))

    // responseBody is [P(class0), P(class1), P(class2)] = [P(LOSS), P(PUSH), P(WIN)]
    const lossProbability = responseBody[0] || 0
    const pushProbability = responseBody[1] || 0
    const winProbability = responseBody[2] || 0

    // Determine predicted outcome (highest probability)
    const probabilities = [lossProbability, pushProbability, winProbability]
    const maxProb = Math.max(...probabilities)
    const predictedClass = probabilities.indexOf(maxProb)
    const predictedOutcome = ['LOSS', 'PUSH', 'WIN'][predictedClass] as 'LOSS' | 'PUSH' | 'WIN'

    // Calculate overall risk (weighted by loss and push probabilities)
    const overallRisk = (lossProbability * 100) + (pushProbability * 30)

    // Calculate expected value
    const expectedValue = calculateExpectedValue(
      input.betAmount,
      input.oddsAmerican,
      winProbability,
      pushProbability,
      lossProbability
    )

    return {
      lossProbability,
      pushProbability,
      winProbability,
      predictedOutcome,
      confidence: maxProb,
      overallRisk,
      expectedValue,
    }
  } catch (error) {
    console.error('SageMaker prediction error:', error)
    throw new Error('Failed to get prediction from SageMaker')
  }
}

/**
 * Convert BetScenario to SageMakerPredictionInput
 */
export function betScenarioToSageMakerInput(
  scenario: BetScenario,
  analysis: {
    emotionalRisk: 'LOW' | 'MODERATE' | 'HIGH'
    emotionalState: 'neutral' | 'positive' | 'negative' | 'dangerous'
    chasingBehavior: boolean
    highFrequencyBetting: boolean
    favoriteWinPct: number
    underdogWinPct: number
    hasKeyInjuries: boolean
    badWeather: boolean
    confidenceScore: number
  },
  userProfile?: {
    experience?: 'novice' | 'intermediate' | 'expert'
    age?: '18-25' | '26-35' | '36-45' | '46+'
    last5WinRate?: number
  }
): SageMakerPredictionInput {
  // Parse odds from scenario
  const oddsMatch = scenario.odds?.match(/-?\d+/)
  const oddsAmerican = oddsMatch ? parseInt(oddsMatch[0]) : -110

  // Determine recent outcomes
  const recentLoss = scenario.lastOutcome?.toLowerCase().includes('lost') || false
  const recentWin = scenario.lastOutcome?.toLowerCase().includes('won') || false

  // Detect biases from emotional triggers
  const triggers = scenario.emotionalTriggers?.toLowerCase() || ''
  const biasOverconfidence = /feeling lucky|on fire|hot streak|can't lose|sure thing/i.test(triggers)
  const biasRecency = /recent|last game|just saw/i.test(triggers)
  const biasLossAversion = /scared|nervous|worried|anxious/i.test(triggers)
  const biasConfirmation = /always|never|always wins|never loses/i.test(triggers)

  // Detect behavioral patterns
  const chasingBehavior = /win back|recover|make back|get even|chase/i.test(scenario.history || '')
  const highFrequencyBetting = /multiple|several|many|few bets|series/i.test(scenario.history || '')

  return {
    sport: scenario.sport,
    betType: scenario.betType,
    betAmount: scenario.betAmount,
    budget: scenario.budget,
    favoriteWinPct: analysis.favoriteWinPct,
    underdogWinPct: analysis.underdogWinPct,
    hasKeyInjuries: analysis.hasKeyInjuries,
    badWeather: analysis.badWeather,
    emotionalRisk: analysis.emotionalRisk,
    emotionalState: analysis.emotionalState,
    chasingBehavior: chasingBehavior || analysis.chasingBehavior,
    highFrequencyBetting: highFrequencyBetting || analysis.highFrequencyBetting,
    recentLoss,
    recentWin,
    homeAdvantage: true, // Assume home if favorite
    oddsAmerican,
    confidenceScore: analysis.confidenceScore,
    userExperience: userProfile?.experience || 'intermediate',
    emotionalIntensity: 5, // Default medium intensity
    biasOverconfidence,
    biasRecency,
    biasLossAversion,
    biasConfirmation,
    last5WinRate: userProfile?.last5WinRate || 0.5,
    userAge: userProfile?.age || '26-35',
  }
}

/**
 * Check if SageMaker is available
 */
export function isSageMakerAvailable(): boolean {
  return !!(
    process.env.AWS_SAGEMAKER_ENDPOINT &&
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY
  )
}

/**
 * Format prediction result for user display
 */
export function formatPredictionForUser(result: SageMakerPredictionResult): {
  recommendation: string
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH'
  details: string[]
} {
  let recommendation: string
  let riskLevel: 'LOW' | 'MODERATE' | 'HIGH'
  const details: string[] = []

  // Add probability breakdown
  details.push(`Win: ${(result.winProbability * 100).toFixed(1)}%`)
  details.push(`Push: ${(result.pushProbability * 100).toFixed(1)}%`)
  details.push(`Loss: ${(result.lossProbability * 100).toFixed(1)}%`)

  // Expected value
  if (result.expectedValue > 0) {
    details.push(`Expected Value: +$${result.expectedValue.toFixed(2)}`)
  } else {
    details.push(`Expected Value: -$${Math.abs(result.expectedValue).toFixed(2)}`)
  }

  // Determine risk level
  if (result.overallRisk > 60) {
    riskLevel = 'HIGH'
  } else if (result.overallRisk > 35) {
    riskLevel = 'MODERATE'
  } else {
    riskLevel = 'LOW'
  }

  // Generate recommendation
  if (result.predictedOutcome === 'WIN' && result.confidence > 0.6) {
    recommendation = 'PLACE BET'
    details.push(`Model predicts WIN with ${(result.confidence * 100).toFixed(0)}% confidence`)
  } else if (result.predictedOutcome === 'LOSS') {
    recommendation = "DON'T PLACE BET"
    details.push(`Model predicts LOSS with ${(result.confidence * 100).toFixed(0)}% confidence`)
  } else if (result.predictedOutcome === 'PUSH') {
    recommendation = 'PROCEED WITH CAUTION'
    details.push(`Model predicts PUSH (break even) with ${(result.confidence * 100).toFixed(0)}% confidence`)
  } else {
    recommendation = 'PROCEED WITH CAUTION'
    details.push('Model shows no clear winner - uncertain outcome')
  }

  return {
    recommendation,
    riskLevel,
    details,
  }
}

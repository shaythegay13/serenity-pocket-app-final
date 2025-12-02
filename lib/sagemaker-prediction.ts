/**
 * AWS SageMaker Prediction Integration
 * Calls the trained XGBoost model endpoint for bet outcome predictions
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
  winProbability: number
  prediction: 'WIN' | 'LOSS'
  confidence: number
  riskScore: number
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

    // Game metrics (7 features)
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
 * Call SageMaker endpoint for prediction
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

    // Parse response
    const responseBody = JSON.parse(new TextDecoder().decode(response.Body))
    const winProbability = responseBody[0] || 0.5 // XGBoost returns array with single probability

    // Calculate confidence (distance from 0.5)
    const confidence = Math.abs(winProbability - 0.5) * 200

    // Calculate risk score (inverse of confidence for losing bets)
    const riskScore = winProbability < 0.5 ? (1 - winProbability) * 100 : (1 - confidence / 100) * 100

    return {
      winProbability,
      prediction: winProbability >= 0.5 ? 'WIN' : 'LOSS',
      confidence,
      riskScore,
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

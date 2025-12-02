import {
  SageMakerRuntimeClient,
  InvokeEndpointCommand,
} from "@aws-sdk/client-sagemaker-runtime"
import type {
  HistoricalFeatureVector,
  ModelPrediction,
  BetRiskAssessment,
  UserPsychProfile,
  RiskLevel,
} from "../types/ai-models"

const SAGEMAKER_REGION = process.env.AWS_REGION || "us-east-1"
const SAGEMAKER_ENDPOINT_NAME = process.env.SAGEMAKER_SPORTS_ENDPOINT_NAME || "serenity-pocket-sports-model"

let sagemakerClient: SageMakerRuntimeClient | null = null

function getClient(): SageMakerRuntimeClient {
  if (!sagemakerClient) {
    sagemakerClient = new SageMakerRuntimeClient({ region: SAGEMAKER_REGION })
  }
  return sagemakerClient
}

function serializeFeatures(features: HistoricalFeatureVector): string {
  // Placeholder: many tabular models accept CSV or JSON; adjust to your actual endpoint contract.
  return JSON.stringify(features)
}

export async function predictGameOutcomes(
  features: HistoricalFeatureVector,
): Promise<ModelPrediction> {
  const client = getClient()

  const payload = serializeFeatures(features)

  const command = new InvokeEndpointCommand({
    EndpointName: SAGEMAKER_ENDPOINT_NAME,
    Body: Buffer.from(payload),
    ContentType: "application/json",
    Accept: "application/json",
  })

  const res = await client.send(command)
  const body = res.Body ? Buffer.from(res.Body as Uint8Array).toString("utf-8") : "{}"
  const parsed = JSON.parse(body)

  const prediction: ModelPrediction = {
    winProbabilityHome: parsed.winProbabilityHome ?? parsed.win_prob_home ?? 0.5,
    winProbabilityAway: parsed.winProbabilityAway ?? parsed.win_prob_away ?? 0.5,
    expectedValueMoneylineHome:
      parsed.expectedValueMoneylineHome ?? parsed.ev_ml_home ?? undefined,
    expectedValueMoneylineAway:
      parsed.expectedValueMoneylineAway ?? parsed.ev_ml_away ?? undefined,
    expectedValueSpread: parsed.expectedValueSpread ?? parsed.ev_spread ?? undefined,
    expectedValueTotal: parsed.expectedValueTotal ?? parsed.ev_total ?? undefined,
    modelConfidence: parsed.modelConfidence ?? parsed.confidence ?? 0.5,
    riskScore: parsed.riskScore ?? parsed.risk_score ?? 0.5,
  }

  return prediction
}

export async function scoreUserBet(input: {
  features: HistoricalFeatureVector
  betType: string
  stake: number
  odds: number
  userProfile: UserPsychProfile
}): Promise<BetRiskAssessment> {
  // Simple placeholder scoring logic that combines model output and user profile.
  const prediction = await predictGameOutcomes(input.features)

  // Approximate implied probability from American odds
  const odds = input.odds
  const impliedProb = odds > 0 ? 100 / (odds + 100) : Math.abs(odds) / (Math.abs(odds) + 100)

  const winProb = prediction.winProbabilityHome // placeholder; real impl would depend on side
  const stake = input.stake
  const potentialWin = odds > 0 ? (stake * odds) / 100 : (stake * 100) / Math.abs(odds)
  const ev = winProb * potentialWin - (1 - winProb) * stake

  // Basic risk category from riskScore and stake fraction
  const stakeFraction = input.userProfile.weeklyBudget
    ? stake / input.userProfile.weeklyBudget
    : 0

  let riskCategory: RiskLevel = "MEDIUM"
  if (prediction.riskScore > 0.7 || stakeFraction > 0.1) {
    riskCategory = "HIGH"
  } else if (prediction.riskScore < 0.4 && stakeFraction <= 0.05) {
    riskCategory = "LOW"
  }

  // Very simple suggested max stake fraction rule-of-thumb
  const baseMax =
    input.userProfile.riskTolerance === "aggressive"
      ? 0.05
      : input.userProfile.riskTolerance === "moderate"
        ? 0.03
        : 0.02

  const suggestedMaxStakeFraction = Math.max(0.01, Math.min(baseMax, 0.05))

  const flags: string[] = []
  if (stakeFraction > suggestedMaxStakeFraction) {
    flags.push("Stake above suggested fraction of weekly budget")
  }
  if (prediction.riskScore > 0.7) {
    flags.push("Model indicates high risk for this game/bet")
  }
  if (Math.abs(ev) < stake * 0.02) {
    flags.push("Low edge detected; EV is close to zero")
  }

  return {
    ev,
    riskCategory,
    suggestedMaxStakeFraction,
    flags,
  }
}

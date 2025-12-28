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

const SAGEMAKER_REGION = process.env.AWS_REGION || "us-west-2"
const SAGEMAKER_ENDPOINT_NAME =
  process.env.SAGEMAKER_SPORTS_ENDPOINT_NAME || "serenity-pocket-xgb-endpoint-v4"

let sagemakerClient: SageMakerRuntimeClient | null = null

function getClient(): SageMakerRuntimeClient {
  if (!sagemakerClient) {
    sagemakerClient = new SageMakerRuntimeClient({ region: SAGEMAKER_REGION })
  }
  return sagemakerClient
}

function serializeFeatures(features: HistoricalFeatureVector): string {
  // Convert to CSV format expected by the endpoint.
  // This endpoint is trained on a numeric CSV row; categorical features are not safely coercible here.
  return features.numericFeatures
    .map((v) => (Number.isFinite(v) ? String(v) : "0"))
    .join(",")
}

export async function predictGameOutcomes(
  features: HistoricalFeatureVector,
): Promise<ModelPrediction> {
  const client = getClient()

  const payload = serializeFeatures(features)

  const startedAt = Date.now()
  if (process.env.NODE_ENV !== "production") {
    console.log("🤖 [SageMaker] Invoking endpoint:", SAGEMAKER_ENDPOINT_NAME)
  }

  const command = new InvokeEndpointCommand({
    EndpointName: SAGEMAKER_ENDPOINT_NAME,
    Body: Buffer.from(payload, "utf-8"),
    ContentType: "text/csv",
    Accept: "text/csv",
  })

  const res = await client.send(command)
  const body = res.Body ? Buffer.from(res.Body as Uint8Array).toString("utf-8") : ""

  if (process.env.NODE_ENV !== "production") {
    console.log(`✅ [SageMaker] Response received in ${Date.now() - startedAt}ms`)
  }

  // Expect something like: "pLoss,pPush,pWin" (multiclass probabilities) or a single line.
  const line = body.trim().split(/\r?\n/)[0] || ""
  const parts = line
    .split(",")
    .map((s) => parseFloat(s.trim()))
    .filter((n) => Number.isFinite(n))

  const [pLoss, pPush, pWin] = parts

  // Map model outputs into our generic ModelPrediction shape.
  // We treat pWin as the "home" win probability for downstream logic.
  const winHome = Number.isFinite(pWin) ? (pWin as number) : 0.5
  const winAway = Number.isFinite(pLoss) ? (pLoss as number) : 1 - winHome
  const confidence = Math.max(winHome, winAway, Number.isFinite(pPush) ? (pPush as number) : 0)

  const prediction: ModelPrediction = {
    winProbabilityHome: winHome,
    winProbabilityAway: winAway,
    expectedValueMoneylineHome: undefined,
    expectedValueMoneylineAway: undefined,
    expectedValueSpread: undefined,
    expectedValueTotal: undefined,
    modelConfidence: confidence,
    // RiskScore is a placeholder; treat low confidence as higher risk.
    riskScore: 1 - confidence,
  }

  return prediction
}

export async function scoreUserBet(input: {
  features: HistoricalFeatureVector
  betType: string
  stake: number
  odds: number
  userProfile: UserPsychProfile
  prediction?: ModelPrediction
}): Promise<BetRiskAssessment> {
  // Simple placeholder scoring logic that combines model output and user profile.
  const prediction = input.prediction ?? (await predictGameOutcomes(input.features))

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

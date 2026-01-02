import type {
  HistoricalFeatureVector,
  ModelPrediction,
  BetRiskAssessment,
  UserPsychProfile,
  RiskLevel,
} from "../types/ai-models"

function clamp(v: number, min: number, max: number): number {
  if (!Number.isFinite(v)) return min
  if (v < min) return min
  if (v > max) return max
  return v
}

function sanitizeEv(ev: number): number {
  if (!Number.isFinite(ev)) return 0
  return Math.abs(ev) < 1e-9 ? 0 : ev
}

export async function predictGameOutcomes(
  features: HistoricalFeatureVector,
): Promise<ModelPrediction> {
  // Local heuristic in place of SageMaker:
  // When numericFeatures includes [impliedProb, odds], we treat impliedProb as winProb.
  // Otherwise we fall back to 0.5.
  const implied = clamp(features.numericFeatures?.[0] ?? 0.5, 0.05, 0.95)

  const winHome = implied
  const winAway = 1 - implied
  const confidence = Math.max(winHome, winAway)

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
  const ev = sanitizeEv(winProb * potentialWin - (1 - winProb) * stake)

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

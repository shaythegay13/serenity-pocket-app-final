export interface SerenityBetProbs {
  pLoss: number
  pPush: number
  pWin: number
}

function clamp(v: number, min: number, max: number): number {
  if (!Number.isFinite(v)) return min
  if (v < min) return min
  if (v > max) return max
  return v
}

/**
 * Call the PlayMind Labs XGBoost multiclass model over CSV.
 * featuresCsv must be a single CSV row with NO label column, columns in the
 * exact order the model was trained on (all columns after `label`).
 */
export async function predictSerenityBet(featuresCsv: string): Promise<SerenityBetProbs> {
  // Local heuristic in place of SageMaker.
  // We derive win probability from the implied_probability column in the CSV.
  // Column order comes from serenityFeatureBuilder.ts.
  const parts = featuresCsv
    .trim()
    .split(/\r?\n/)[0]
    ?.split(",")
    .map((s) => parseFloat(s.trim()))

  // implied_probability is column index 38 (0-based).
  const implied = clamp(parts?.[38] ?? 0.5, 0.05, 0.95)

  // Keep a small push probability to avoid overconfidence.
  const pPush = 0.02
  const remaining = 1 - pPush
  const pWin = implied * remaining
  const pLoss = (1 - implied) * remaining

  return { pLoss, pPush, pWin }
}

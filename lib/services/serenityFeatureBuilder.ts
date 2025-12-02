export type SerenitySportKey =
  | "basketball_nba"
  | "americanfootball_nfl"
  | "baseball_mlb"
  | "icehockey_nhl"

export type SerenityBetType =
  | "moneyline"
  | "spread"
  | "over_under"
  | "parlay"
  | "teaser"
  | "prop"
  | "futures"

export type SerenityEmotionalRisk = "low" | "moderate" | "high"
export type SerenityEmotionalState = "neutral" | "positive" | "negative" | "dangerous"
export type SerenitySafetyRisk = "low" | "moderate" | "high"
export type SerenityUserExperience = "novice" | "intermediate" | "expert"
export type SerenityUserAgeBucket = "18_25" | "26_35" | "36_45" | "46_plus"

/**
 * High-level feature input matching app concepts.
 * All numeric fields are optional and will be defaulted if missing.
 */
export interface SerenityFeatureInput {
  sport: SerenitySportKey
  betType: SerenityBetType
  betAmount: number
  budget: number

  favoriteWinPct?: number
  underdogWinPct?: number
  hasKeyInjuries?: boolean
  badWeather?: boolean
  isParlay?: boolean

  emotionalRisk: SerenityEmotionalRisk
  emotionalState: SerenityEmotionalState

  chasingBehavior?: boolean
  highFrequencyBetting?: boolean
  recentLoss?: boolean
  recentWin?: boolean

  favoritePpg?: number
  underdogPpg?: number
  favoriteFgPct?: number
  underdogFgPct?: number
  favoriteDefRating?: number
  underdogDefRating?: number
  homeAdvantage?: boolean

  oddsAmerican: number
  impliedProbability: number
  confidenceScore: number

  safetyRisk: SerenitySafetyRisk
  userExperience: SerenityUserExperience

  emotionalIntensity: number // 0-10 or 0-100 scale (will be used as-is)

  biasOverconfidence?: boolean
  biasRecency?: boolean
  biasLossAversion?: boolean
  biasConfirmation?: boolean

  last5WinRate?: number // 0-1 or 0-100, we treat as 0-1

  userAgeBucket: SerenityUserAgeBucket
}

function b(v?: boolean): number {
  return v ? 1 : 0
}

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0
  if (v < 0) return 0
  if (v > 1) return 1
  return v
}

/**
 * Build a single CSV row (no header, no label column) in the exact column order
 * expected by the SageMaker XGBoost model.
 */
export function buildFeaturesCsv(input: SerenityFeatureInput): string {
  const sport_nba = input.sport === "basketball_nba" ? 1 : 0
  const sport_nfl = input.sport === "americanfootball_nfl" ? 1 : 0
  const sport_mlb = input.sport === "baseball_mlb" ? 1 : 0
  const sport_nhl = input.sport === "icehockey_nhl" ? 1 : 0

  const bet_type_moneyline = input.betType === "moneyline" ? 1 : 0
  const bet_type_spread = input.betType === "spread" ? 1 : 0
  const bet_type_over_under = input.betType === "over_under" ? 1 : 0
  const bet_type_parlay = input.betType === "parlay" ? 1 : 0
  const bet_type_teaser = input.betType === "teaser" ? 1 : 0
  const bet_type_prop = input.betType === "prop" ? 1 : 0
  const bet_type_futures = input.betType === "futures" ? 1 : 0

  const betTypeFlags = [
    bet_type_moneyline,
    bet_type_spread,
    bet_type_over_under,
    bet_type_parlay,
    bet_type_teaser,
    bet_type_prop,
    bet_type_futures,
  ]
  const betTypeSum = betTypeFlags.reduce((acc, v) => acc + v, 0)
  if (betTypeSum !== 1) {
    throw new Error(
      `SerenityFeatureBuilder: exactly one bet_type_* flag must be 1, got ${betTypeSum} for betType=${input.betType}`,
    )
  }

  const bet_amount = Number(input.betAmount) || 0
  const budget = Number(input.budget) || 0
  const budget_percent = budget > 0 ? (bet_amount / budget) * 100 : 0

  const favorite_win_pct = input.favoriteWinPct ?? 0.5
  const underdog_win_pct = input.underdogWinPct ?? 0.5

  const has_key_injuries = b(input.hasKeyInjuries)
  const bad_weather = b(input.badWeather)
  const is_parlay = b(input.isParlay || input.betType === "parlay")

  const emotional_risk_low = input.emotionalRisk === "low" ? 1 : 0
  const emotional_risk_moderate = input.emotionalRisk === "moderate" ? 1 : 0
  const emotional_risk_high = input.emotionalRisk === "high" ? 1 : 0

  const emotional_state_neutral = input.emotionalState === "neutral" ? 1 : 0
  const emotional_state_positive = input.emotionalState === "positive" ? 1 : 0
  const emotional_state_negative = input.emotionalState === "negative" ? 1 : 0
  const emotional_state_dangerous = input.emotionalState === "dangerous" ? 1 : 0

  const chasing_behavior = b(input.chasingBehavior)
  const high_frequency_betting = b(input.highFrequencyBetting)
  const recent_loss = b(input.recentLoss)
  const recent_win = b(input.recentWin)

  const favorite_ppg = input.favoritePpg ?? 0
  const underdog_ppg = input.underdogPpg ?? 0
  const favorite_fg_pct = input.favoriteFgPct ?? 0
  const underdog_fg_pct = input.underdogFgPct ?? 0

  const favorite_def_rating = input.favoriteDefRating ?? 0
  const underdog_def_rating = input.underdogDefRating ?? 0
  const home_advantage = b(input.homeAdvantage)

  const odds_american = Number(input.oddsAmerican) || 0
  const implied_probability = input.impliedProbability
  const confidence_score = input.confidenceScore

  const safety_risk_low = input.safetyRisk === "low" ? 1 : 0
  const safety_risk_moderate = input.safetyRisk === "moderate" ? 1 : 0
  const safety_risk_high = input.safetyRisk === "high" ? 1 : 0

  const user_experience_novice = input.userExperience === "novice" ? 1 : 0
  const user_experience_intermediate =
    input.userExperience === "intermediate" ? 1 : 0
  const user_experience_expert = input.userExperience === "expert" ? 1 : 0

  const emotional_intensity = input.emotionalIntensity

  const bias_overconfidence = b(input.biasOverconfidence)
  const bias_recency = b(input.biasRecency)
  const bias_loss_aversion = b(input.biasLossAversion)
  const bias_confirmation = b(input.biasConfirmation)

  const last_5_win_rate = clamp01(input.last5WinRate ?? 0)

  const user_age_18_25 = input.userAgeBucket === "18_25" ? 1 : 0
  const user_age_26_35 = input.userAgeBucket === "26_35" ? 1 : 0
  const user_age_36_45 = input.userAgeBucket === "36_45" ? 1 : 0
  const user_age_46_plus = input.userAgeBucket === "46_plus" ? 1 : 0

  const row: (string | number)[] = [
    // sport_* one-hot
    sport_nba,
    sport_nfl,
    sport_mlb,
    sport_nhl,
    // bet_type_*
    bet_type_moneyline,
    bet_type_spread,
    bet_type_over_under,
    bet_type_parlay,
     bet_type_teaser,
     bet_type_prop,
     bet_type_futures,
    // bet_amount, budget, budget_percent
    bet_amount,
    budget,
    budget_percent,
    // favorite / underdog win pct
    favorite_win_pct,
    underdog_win_pct,
    // injuries / weather / parlay
    has_key_injuries,
    bad_weather,
    is_parlay,
    // emotional risk one-hot
    emotional_risk_low,
    emotional_risk_moderate,
    emotional_risk_high,
    // emotional state one-hot
    emotional_state_neutral,
    emotional_state_positive,
    emotional_state_negative,
    emotional_state_dangerous,
    // behavior flags
    chasing_behavior,
    high_frequency_betting,
    recent_loss,
    recent_win,
    // scoring / shooting stats
    favorite_ppg,
    underdog_ppg,
    favorite_fg_pct,
    underdog_fg_pct,
    // defense ratings
    favorite_def_rating,
    underdog_def_rating,
    home_advantage,
    // odds & confidence
    odds_american,
    implied_probability,
    confidence_score,
    // safety risk one-hot
    safety_risk_low,
    safety_risk_moderate,
    safety_risk_high,
    // user experience one-hot
    user_experience_novice,
    user_experience_intermediate,
    user_experience_expert,
    // emotional intensity
    emotional_intensity,
    // biases
    bias_overconfidence,
    bias_recency,
    bias_loss_aversion,
    bias_confirmation,
    // last 5 win rate
    last_5_win_rate,
    // age bucket one-hot
    user_age_18_25,
    user_age_26_35,
    user_age_36_45,
    user_age_46_plus,
  ]

  return row.map((v) => String(v)).join(",")
}

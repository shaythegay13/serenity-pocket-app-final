/**
 * lib/ev-calculator.ts
 *
 * Core Expected Value (EV) calculator for PlayMind Labs.
 * Handles odds conversion, vig removal, and EV/Edge/Kelly calculations.
 */

// Constant weight for blending market probability with model probability
const ALPHA_MARKET = 0.7;

export interface EvInputs {
  stake: number;
  offeredAmericanOdds: number; // odds at the book we might bet

  // Market-based inputs (optional)
  // Two-way market consensus (e.g. Pinnacle) for vig removal
  consensusAmericanOdds?: { sideA: number; sideB: number };

  // Model-based inputs (optional)
  modelWinProb?: number;

  // Optional: precomputed probability from upstream engine (TrueProbabilityEngine)
  precomputedTrueWinProb?: number;
}

export interface EvDiagnostics {
  stake: number;
  offeredAmericanOdds: number;
  offeredDecimalOdds: number;
  profitIfWin: number;

  // Probabilities
  trueWinProb: number;
  marketImpliedProb: number; // from offeredAmericanOdds, with vig
  fairMarketProb?: number;   // no-vig fair probability if consensus is available
  modelWinProb?: number;

  // Edge and value
  edgePercent: number;       // (trueWinProb - referenceProb) * 100
  evDollars: number;
  evPercent: number;

  // Bankroll & risk
  kellyFraction: number;     // full Kelly criterion (0-1+)
  confidenceScore?: number;  // 0–1: uncertainty / reliability of trueWinProb

  // Debug / metadata hooks
  metadata?: Record<string, unknown>;
}

/**
 * Converts American odds (-110, +150) to Decimal odds (1.91, 2.50).
 */
export function americanToDecimal(odds: number): number {
  if (odds > 0) {
    return (odds / 100) + 1;
  } else {
    return (100 / Math.abs(odds)) + 1;
  }
}

/**
 * Converts Decimal odds to American odds.
 */
export function decimalToAmerican(decimal: number): number {
  if (decimal < 1.01) return -10000; // Safety floor
  if (decimal >= 2.0) {
    return Math.round((decimal - 1) * 100);
  } else {
    return Math.round(-100 / (decimal - 1));
  }
}

/**
 * Computes implied probability from American odds (includes vig).
 */
export function impliedProbFromAmerican(odds: number): number {
  const decimal = americanToDecimal(odds);
  return 1 / decimal;
}

/**
 * Removes vig from a two-way market using the multiplicative method (normalization).
 * Returns fair probabilities for both sides.
 */
export function noVigFairProbFromTwoWayMarket(
  impliedProbSideA: number,
  impliedProbSideB: number
): { fairProbSideA: number; fairProbSideB: number } {
  const sumImplied = impliedProbSideA + impliedProbSideB;

  if (sumImplied === 0) {
    return { fairProbSideA: 0.5, fairProbSideB: 0.5 };
  }

  return {
    fairProbSideA: impliedProbSideA / sumImplied,
    fairProbSideB: impliedProbSideB / sumImplied
  };
}

/**
 * Primary EV calculation function.
 * Orchestrates probability derivation, blending, and metric computation.
 */
export function computeEv(inputs: EvInputs): EvDiagnostics {
  const {
    stake,
    offeredAmericanOdds,
    consensusAmericanOdds,
    modelWinProb,
    precomputedTrueWinProb
  } = inputs;

  // 1. Basic conversions
  const offeredDecimalOdds = americanToDecimal(offeredAmericanOdds);
  const marketImpliedProb = impliedProbFromAmerican(offeredAmericanOdds);
  const profitIfWin = (offeredDecimalOdds - 1) * stake;

  // 2. Determine "Fair Market Probability" if consensus is provided
  let fairMarketProb: number | undefined;

  if (consensusAmericanOdds) {
    const impliedA = impliedProbFromAmerican(consensusAmericanOdds.sideA);
    const impliedB = impliedProbFromAmerican(consensusAmericanOdds.sideB);

    // We assume 'offeredAmericanOdds' generally aligns with one side.
    // However, to correctly assign fairProb, we need to know which side 'offeredAmericanOdds' represents.
    // Heuristic: Whichever consensus side is closer to offeredAmericanOdds is likely the same side.
    // This assumes the book isn't wildly off.

    // Calculate fair no-vig probs
    const { fairProbSideA, fairProbSideB } = noVigFairProbFromTwoWayMarket(impliedA, impliedB);

    // Distance check
    const distA = Math.abs(consensusAmericanOdds.sideA - offeredAmericanOdds);
    const distB = Math.abs(consensusAmericanOdds.sideB - offeredAmericanOdds);

    // If offered is closer to side A, use fairProbSideA, else B.
    // Note: This heuristic works best if odds inputs are consistently favored/dog logic.
    // Ideally, inputs should specify 'side', but per spec we infer or use precomputed.
    // For robust usage, usually we'd pass explicit side alignment, but let's assume valid mapping.
    // A better approach if values differ sign significantly:
    if (distA < distB) {
      fairMarketProb = fairProbSideA;
    } else {
      fairMarketProb = fairProbSideB;
    }

    // Refined heuristic: if signs match, use that.
    if (Math.sign(consensusAmericanOdds.sideA) === Math.sign(offeredAmericanOdds)) {
      fairMarketProb = fairProbSideA;
    } else if (Math.sign(consensusAmericanOdds.sideB) === Math.sign(offeredAmericanOdds)) {
      fairMarketProb = fairProbSideB;
    }
  }

  // 3. Determine True Probability
  let trueWinProb: number;
  let confidenceScore: number | undefined; // 0-1

  if (typeof precomputedTrueWinProb === 'number') {
    trueWinProb = precomputedTrueWinProb;
    confidenceScore = 0.9; // Assume high confidence if precomputed externally
  } else {
    // Blending logic
    const baseProb = fairMarketProb ?? marketImpliedProb;

    if (typeof modelWinProb === 'number') {
      // Blend market and model
      trueWinProb = (ALPHA_MARKET * baseProb) + ((1 - ALPHA_MARKET) * modelWinProb);
      confidenceScore = 0.75; // Model + Market = better confidence
    } else {
      // Only market data
      trueWinProb = baseProb;
      confidenceScore = 0.6; // Market only
    }
  }

  // Clamp probability to valid range [0.01, 0.99] to avoid infinities
  trueWinProb = Math.max(0.01, Math.min(0.99, trueWinProb));

  // 4. Compute Metrics

  // Reference probability for "Edge" (Market Price vs True Price)
  const referenceProb = fairMarketProb ?? marketImpliedProb;
  const edgePercent = (trueWinProb - referenceProb) * 100;

  // EV
  const evDollars = (trueWinProb * profitIfWin) - ((1 - trueWinProb) * stake);
  const evPercent = (evDollars / stake) * 100;

  // Kelly Criterion
  // f* = (bp - q) / b
  // b = decimal odds - 1 (net fractional odds)
  // p = probability of winning (trueWinProb)
  // q = probability of losing (1 - p)
  const b = offeredDecimalOdds - 1;
  const p = trueWinProb;
  const q = 1 - p;

  const rawKelly = (b * p - q) / b;
  const kellyFraction = Math.max(0, rawKelly); // Zero if negative EV

  return {
    stake,
    offeredAmericanOdds,
    offeredDecimalOdds,
    profitIfWin,
    trueWinProb,
    marketImpliedProb,
    fairMarketProb,
    modelWinProb,
    edgePercent,
    evDollars,
    evPercent,
    kellyFraction,
    confidenceScore,
    metadata: {
      usedConsensus: !!consensusAmericanOdds,
      usedModel: typeof modelWinProb === 'number',
      blendingAlpha: ALPHA_MARKET
    }
  };
}

/**
 * Legacy wrapper for backward compatibility.
 * @deprecated Use computeEv() for new code.
 */
export function computeEvFromProbAndOdds(
  trueWinProb: number,
  americanOdds: number,
  stake: number = 100
): { evDollars: number; evPercent: number } {
  // Map simplified inputs to new engine
  const result = computeEv({
    stake,
    offeredAmericanOdds: americanOdds,
    precomputedTrueWinProb: trueWinProb
  });

  return {
    evDollars: result.evDollars,
    evPercent: result.evPercent
  };
}

/*
 * USAGE EXAMPLES:
 * 
 * 1. Favorite (-110) with Model Confirmation
 * const result = computeEv({
 *   stake: 100,
 *   offeredAmericanOdds: -110,
 *   // Consensus also shows -110/-110, so fair prob is 0.50
 *   consensusAmericanOdds: { sideA: -110, sideB: -110 }, 
 *   // Our model is bullish: 55%
 *   modelWinProb: 0.55 
 * });
 * // Result includes blended True Prob (~0.515), EV, and Kelly suggestion.
 * 
 * 2. Dog (+150) with only market data
 * const result2 = computeEv({
 *   stake: 50,
 *   offeredAmericanOdds: 150
 * });
 * // Uses implied probability (with vig included since no consensus given) for conservative estimate.
 */

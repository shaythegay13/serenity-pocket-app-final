// lib/ev-calculator.ts - PlayMind Labs Canonical EV
export function americanToDecimal(odds: number): number {
  return odds > 0 ? (odds / 100) + 1 : (100 / Math.abs(odds)) + 1
}

export function computeEvFromProbAndOdds(
  trueWinProb: number, 
  americanOdds: number, 
  stake: number = 100
): { evDollars: number; evPercent: number } {
  const decOdds = americanToDecimal(americanOdds)
  const profitIfWin = (decOdds - 1) * stake
  const evDollars = trueWinProb * profitIfWin - (1 - trueWinProb) * stake
  return { evDollars, evPercent: (evDollars / stake) * 100 }
}

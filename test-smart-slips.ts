export const testSmartSlips = [
  {
    gameId: "test_001",
    teams: "Los Angeles Lakers @ Boston Celtics",
    startTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    betType: "moneyline",
    line: "Boston Celtics ML",
    odds: -150,
    emotionalAlignment: 85,
    confidence: 78,
    suggestedStakeFraction: 0.06,
    suggestedStakeAbsolute: 30,
    riskLevel: "MEDIUM",
    shortExplanation: "Home court advantage combined with Celtics' current 3-game winning streak makes this a solid value play.",
    numericRisk: { ev: 4.50, evPercentage: 15.0 }
  },
  {
    gameId: "test_002", 
    teams: "Golden State Warriors @ Phoenix Suns",
    startTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    betType: "spread",
    line: "Golden State Warriors +5.5",
    odds: -110,
    emotionalAlignment: 82,
    confidence: 72,
    suggestedStakeFraction: 0.05,
    suggestedStakeAbsolute: 25,
    riskLevel: "LOW",
    shortExplanation: "Warriors have covered the spread in 4 of their last 5 games against Phoenix.",
    numericRisk: { ev: 2.75, evPercentage: 11.0 }
  },
  {
    gameId: "test_003",
    teams: "Denver Nuggets @ Miami Heat", 
    startTime: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
    betType: "over",
    line: "Over 225.5",
    odds: -105,
    emotionalAlignment: 88,
    confidence: 80,
    suggestedStakeFraction: 0.07,
    suggestedStakeAbsolute: 35,
    riskLevel: "MEDIUM",
    shortExplanation: "Both teams rank in top 10 for pace, and their last 3 matchups all went over the total.",
    numericRisk: { ev: 5.25, evPercentage: 15.0 }
  },
  {
    gameId: "test_004",
    teams: "Milwaukee Bucks @ Philadelphia 76ers",
    startTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    betType: "moneyline",
    line: "Milwaukee Bucks ML",
    odds: +130,
    emotionalAlignment: 75,
    confidence: 68,
    suggestedStakeFraction: 0.04,
    suggestedStakeAbsolute: 20,
    riskLevel: "HIGH",
    shortExplanation: "Underdog value with Giannis returning from injury and 76ers on back-to-back.",
    numericRisk: { ev: 6.50, evPercentage: 32.5 }
  },
  {
    gameId: "test_005",
    teams: "Dallas Mavericks @ Los Angeles Clippers",
    startTime: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(),
    betType: "spread",
    line: "Los Angeles Clippers -3.5",
    odds: -115,
    emotionalAlignment: 90,
    confidence: 85,
    suggestedStakeFraction: 0.08,
    suggestedStakeAbsolute: 40,
    riskLevel: "LOW",
    shortExplanation: "Clippers have dominated this matchup recently, winning 4 of last 5 by 6+ points.",
    numericRisk: { ev: 3.48, evPercentage: 8.7 }
  },
  {
    gameId: "test_006",
    teams: "New York Knicks @ Brooklyn Nets",
    startTime: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    betType: "under",
    line: "Under 218.5",
    odds: -120,
    emotionalAlignment: 77,
    confidence: 74,
    suggestedStakeFraction: 0.06,
    suggestedStakeAbsolute: 30,
    riskLevel: "MEDIUM",
    shortExplanation: "Both teams have been playing slower pace recently, with 4 of last 5 games staying under.",
    numericRisk: { ev: 2.50, evPercentage: 8.3 }
  },
  {
    gameId: "test_007",
    teams: "Chicago Bulls @ Cleveland Cavaliers",
    startTime: new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString(),
    betType: "moneyline",
    line: "Cleveland Cavaliers ML",
    odds: -180,
    emotionalAlignment: 92,
    confidence: 88,
    suggestedStakeFraction: 0.05,
    suggestedStakeAbsolute: 25,
    riskLevel: "LOW",
    shortExplanation: "Cavaliers have been dominant at home this season with a 15-3 record.",
    numericRisk: { ev: 3.75, evPercentage: 15.0 }
  }
]

// Helper function to get random test slips
export function getRandomTestSlips(count: number = 6) {
  const shuffled = [...testSmartSlips].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

// Helper function to get slips by risk level
export function getTestSlipsByRisk(riskLevel: "LOW" | "MEDIUM" | "HIGH") {
  return testSmartSlips.filter(slip => slip.riskLevel === riskLevel)
}

// Helper function to get slips by bet type
export function getTestSlipsByBetType(betType: "moneyline" | "spread" | "over" | "under") {
  return testSmartSlips.filter(slip => slip.betType === betType)
}

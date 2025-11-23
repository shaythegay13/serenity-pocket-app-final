import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { legs, stake, emotionalState, recentBets } = body

    if (!legs || !Array.isArray(legs) || legs.length < 2) {
      return NextResponse.json(
        { error: 'Parlay must have at least 2 legs' },
        { status: 400 }
      )
    }

    // Calculate combined odds
    const americanToDecimal = (american: number) => {
      return american >= 100 ? 1 + american / 100 : 1 + 100 / Math.abs(american)
    }

    const decimalOdds = legs.map((leg: any) => americanToDecimal(leg.odds))
    const combinedDecimal = decimalOdds.reduce((acc: number, val: number) => acc * val, 1)
    const combinedAmerican = combinedDecimal >= 2 
      ? Math.round((combinedDecimal - 1) * 100)
      : Math.round(-100 / (combinedDecimal - 1))

    // Calculate potential payout
    const stakeNum = parseFloat(stake) || 0
    const potentialWin = stakeNum * (combinedDecimal - 1)

    // Calculate implied probability
    const individualProbs = legs.map((leg: any) => {
      const odds = leg.odds
      return odds > 0 ? 100 / (odds + 100) : Math.abs(odds) / (Math.abs(odds) + 100)
    })
    const parlayProbability = individualProbs.reduce((acc: number, val: number) => acc * val, 1)

    // Bias detection for parlays
    const biasWarnings = []
    
    // Warning if parlay is too large
    if (legs.length > 5) {
      biasWarnings.push({
        type: 'Excessive Correlation',
        severity: 'high',
        message: `${legs.length}-leg parlays have very low win probability (${(parlayProbability * 100).toFixed(1)}%). Consider splitting into smaller parlays.`
      })
    }

    // Warning for correlated legs (same game/team)
    const teams = new Set<string>()
    legs.forEach((leg: any) => {
      if (leg.team) teams.add(leg.team)
    })
    if (teams.size < legs.length * 0.5) {
      biasWarnings.push({
        type: 'Correlation Risk',
        severity: 'medium',
        message: 'Multiple legs involve the same teams. Outcomes may be correlated, reducing true odds.'
      })
    }

    // Emotional state impact
    if (emotionalState && ['frustrated', 'anxious', 'excited'].includes(emotionalState.toLowerCase())) {
      biasWarnings.push({
        type: 'Emotional Bias',
        severity: 'medium',
        message: `Current emotional state (${emotionalState}) may lead to riskier parlay selections. Consider single bets instead.`
      })
    }

    // Chasing losses pattern
    if (recentBets && Array.isArray(recentBets)) {
      const recentLosses = recentBets.filter((b: any) => b.outcome === 'loss').length
      if (recentLosses >= 3) {
        biasWarnings.push({
          type: 'Chasing Losses',
          severity: 'high',
          message: 'Recent losses detected. Parlays are riskier recovery strategies. Consider taking a break.'
        })
      }
    }

    // Generate analysis
    const analysis = {
      combinedOdds: combinedAmerican,
      potentialPayout: potentialWin.toFixed(2),
      impliedProbability: (parlayProbability * 100).toFixed(2),
      expectedValue: ((parlayProbability * potentialWin) - stakeNum).toFixed(2),
      breakdown: legs.map((leg: any, idx: number) => ({
        leg: idx + 1,
        selection: leg.selection,
        odds: leg.odds,
        probability: (individualProbs[idx] * 100).toFixed(1) + '%'
      })),
      biasWarnings,
      recommendation: parlayProbability > 0.3 
        ? 'Moderate parlay with reasonable win probability.'
        : parlayProbability > 0.15
          ? 'Speculative parlay. Consider reducing legs or stake.'
          : 'High-risk parlay with very low win probability. Strongly consider alternatives.',
      riskLevel: parlayProbability > 0.3 ? 'MEDIUM' : parlayProbability > 0.15 ? 'HIGH' : 'VERY_HIGH'
    }

    return NextResponse.json({
      success: true,
      analysis,
      usedAI: false // This is rule-based; could be enhanced with OpenAI
    })

  } catch (error) {
    console.error('Parlay analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze parlay' },
      { status: 500 }
    )
  }
}

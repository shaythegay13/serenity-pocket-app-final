import { NextRequest, NextResponse } from 'next/server'
import { 
  americanToDecimal, 
  calculateCombinedOdds, 
  calculateParlayEV, 
  calculateParlayEVPercentage,
  detectCorrelations,
  validateParlayLegs
} from '@/lib/parlay-utils'
import { ParlayLeg, CorrelationWarning } from '@/lib/types/ai-models'

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

    // Validate legs
    const validation = validateParlayLegs(legs)
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Invalid parlay legs', 
          details: validation.errors 
        },
        { status: 400 }
      )
    }

    const stakeNum = parseFloat(stake) || 0
    if (stakeNum <= 0) {
      return NextResponse.json(
        { error: 'Stake must be greater than 0' },
        { status: 400 }
      )
    }

    // Convert to ParlayLeg format
    const parlayLegs: ParlayLeg[] = legs.map((leg: any, index: number) => ({
      pickId: leg.pickId || `leg-${index}`,
      gameId: leg.gameId,
      teams: leg.teams || leg.selection || `${leg.teamA} vs ${leg.teamB}`,
      betType: leg.betType || 'moneyline',
      line: leg.line || 'N/A',
      odds: leg.odds,
      confidence: leg.confidence,
      aiWinProbability: leg.aiWinProbability
    }))

    // Calculate combined odds using our utility
    const combinedDecimalOdds = calculateCombinedOdds(parlayLegs)
    const combinedAmericanOdds = Math.round((combinedDecimalOdds - 1) * 100)
    const potentialPayout = stakeNum * combinedDecimalOdds
    const potentialWin = potentialPayout - stakeNum

    // Calculate EV using our utility
    const ev = calculateParlayEV(parlayLegs, stakeNum)
    const evPercentage = calculateParlayEVPercentage(parlayLegs)

    // Detect correlations using our utility
    const correlationWarnings = detectCorrelations(parlayLegs)

    // Calculate implied probability
    const impliedProbability = 1 / combinedDecimalOdds
    const impliedProbabilityPercent = (impliedProbability * 100)

    // Bias detection for parlays (enhanced)
    const biasWarnings = []
    
    // Warning if parlay is too large
    if (parlayLegs.length > 8) {
      biasWarnings.push({
        type: 'excessive-legs' as const,
        severity: 'high' as const,
        message: `${parlayLegs.length}-leg parlays have extremely low win probability (${impliedProbabilityPercent.toFixed(1)}%). Consider splitting into smaller parlays.`,
        affectedLegs: parlayLegs.map(leg => leg.pickId)
      })
    }

    // Emotional state impact
    if (emotionalState && ['frustrated', 'anxious', 'excited', 'angry'].includes(emotionalState.toLowerCase())) {
      biasWarnings.push({
        type: 'same-team' as const, // Reusing type for emotional warnings
        severity: 'medium' as const,
        message: `Current emotional state (${emotionalState}) may lead to riskier parlay selections. Consider single bets instead.`,
        affectedLegs: []
      })
    }

    // Chasing losses pattern
    if (recentBets && Array.isArray(recentBets)) {
      const recentLosses = recentBets.filter((b: any) => b.outcome === 'loss').length
      if (recentLosses >= 3) {
        biasWarnings.push({
          type: 'same-game' as const, // Reusing type for chasing warnings
          severity: 'high' as const,
          message: 'Recent losses detected. Parlays are riskier recovery strategies. Consider taking a break.',
          affectedLegs: []
        })
      }
    }

    // Combine correlation warnings with bias warnings
    const allWarnings = [...correlationWarnings, ...biasWarnings]

    // Generate assessment based on EV and probability
    let assessment: 'DISCOURAGED' | 'CAUTION' | 'REASONABLE' | 'PREFERRED'
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'
    
    if (ev < -stakeNum * 0.5 || impliedProbabilityPercent < 5) {
      assessment = 'DISCOURAGED'
      riskLevel = 'VERY_HIGH'
    } else if (ev < 0 || impliedProbabilityPercent < 10) {
      assessment = 'CAUTION'
      riskLevel = 'HIGH'
    } else if (ev < stakeNum * 0.1 || impliedProbabilityPercent < 20) {
      assessment = 'REASONABLE'
      riskLevel = 'MEDIUM'
    } else {
      assessment = 'PREFERRED'
      riskLevel = 'LOW'
    }

    // Adjust assessment based on warnings
    if (allWarnings.some(w => w.severity === 'high')) {
      if (assessment === 'PREFERRED') assessment = 'REASONABLE'
      else if (assessment === 'REASONABLE') assessment = 'CAUTION'
      else if (assessment === 'CAUTION') assessment = 'DISCOURAGED'
    }

    // Generate stake recommendation
    let recommendedStake = stakeNum
    let stakeReasoning = 'Using your requested stake'
    
    if (riskLevel === 'VERY_HIGH') {
      recommendedStake = Math.min(stakeNum, 25) // Cap at $25 for very high risk
      stakeReasoning = 'High risk parlay - recommend smaller stake'
    } else if (riskLevel === 'HIGH') {
      recommendedStake = Math.min(stakeNum, 50) // Cap at $50 for high risk
      stakeReasoning = 'Elevated risk - consider reducing stake'
    }

    // Generate analysis
    const analysis = {
      assessment,
      riskLevel,
      combinedOdds: {
        american: combinedAmericanOdds,
        decimal: combinedDecimalOdds
      },
      potentialPayout: potentialPayout.toFixed(2),
      potentialWin: potentialWin.toFixed(2),
      impliedProbability: impliedProbabilityPercent.toFixed(2),
      expectedValue: {
        absolute: ev.toFixed(2),
        percentage: evPercentage.toFixed(2)
      },
      stakeRecommendation: {
        amount: recommendedStake.toFixed(2),
        reasoning: stakeReasoning
      },
      legs: parlayLegs.map((leg, idx: number) => ({
        leg: idx + 1,
        pickId: leg.pickId,
        teams: leg.teams,
        betType: leg.betType,
        line: leg.line,
        odds: leg.odds,
        confidence: leg.confidence,
        probability: leg.aiWinProbability ? (leg.aiWinProbability * 100).toFixed(1) + '%' : 
                   ((1 / americanToDecimal(leg.odds)) * 100).toFixed(1) + '%'
      })),
      warnings: allWarnings,
      recommendation: assessment === 'PREFERRED' 
        ? 'Strong parlay value with favorable risk/reward profile.'
        : assessment === 'REASONABLE'
          ? 'Acceptable parlay with moderate risk/reward.'
          : assessment === 'CAUTION'
            ? 'Speculative parlay. Consider reducing legs or stake.'
            : 'High-risk parlay with poor risk/reward. Strongly consider alternatives.',
      summary: `${parlayLegs.length}-leg parlay at ${combinedAmericanOdds >= 0 ? '+' : ''}${combinedAmericanOdds} odds with ${impliedProbabilityPercent.toFixed(1)}% implied probability and ${ev >= 0 ? '+' : ''}${evPercentage.toFixed(1)}% EV.`
    }

    return NextResponse.json({
      success: true,
      result: analysis,
      usedAI: false, // This is enhanced rule-based; could be enhanced with Gemini
      warnings: validation.warnings
    })

  } catch (error) {
    console.error('Parlay analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze parlay' },
      { status: 500 }
    )
  }
}

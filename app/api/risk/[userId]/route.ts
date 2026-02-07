import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"
import { emotionalStabilityService } from "@/lib/services/emotional-stability-service"
import {
  computeAnchoredRisk,
  getRiskLevelLabel,
  shouldBlockBetting,
  analyzeBettingSequence,
  tradesToBettingActions,
  getSessionEscalationRisk,
  type UserRiskProfile,
  type BettingSession,
  type AnchoredRiskResult,
  type BettingSequenceAnalysis
} from "@/lib/risk-models"
import {
  RESEARCH_CITATIONS,
  type DemographicProfile,
  type GamblingBehaviorProfile
} from "@/lib/research-anchors"
import type { UserData } from "@/lib/types"

/**
 * GET /api/risk/[userId]
 *
 * Returns anchored risk assessment for the specified user.
 * Combines emotional tilt (80%) with research-validated factors (20%):
 * - PGSI-SB behavioral metrics (10%)
 * - Demographic base risk (5%)
 * - Expenditure-crime correlation (5%)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const supabase = supabaseServer

    // Authenticate current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", details: authError?.message },
        { status: 401 }
      )
    }

    // Security: Users can only query their own risk profile (or admin access)
    if (user.id !== userId) {
      // TODO: Add admin role check if needed
      return NextResponse.json(
        { error: "Forbidden: Cannot access other user's risk data" },
        { status: 403 }
      )
    }

    // Fetch user profile from database
    const { data: userData, error: userError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single()

    if (userError || !userData) {
      console.error("[Risk API] Error fetching user data:", userError)
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      )
    }

    // Get emotional stability (primary signal - 80% weight)
    const emotionalStability = await emotionalStabilityService.getCurrentEmotionalStability(userData as UserData)

    // Convert emotional score (0-100) to tilt (0-1), inverted
    // Higher emotional score = lower tilt risk
    const emotionalTilt = 1 - (emotionalStability.score / 100)

    // Build demographic profile from user data
    const demographics = mapUserToDemographics(userData)

    // Build gambling behavior profile from user data
    const gamblingBehavior = mapUserToGamblingBehavior(userData)

    // Fetch recent betting data for session context
    const session = await fetchBettingSession(supabase, userId)

    // Build user risk profile
    const riskProfile: UserRiskProfile = {
      userId,
      demographics,
      gamblingBehavior,
      // PGSI-SB responses would come from survey if completed
      pgsiSbResponses: await fetchPgsiResponses(supabase, userId)
    }

    // Compute anchored risk
    const riskResult = computeAnchoredRisk(emotionalTilt, riskProfile, session)

    // Get UI-friendly risk level
    const riskLevel = getRiskLevelLabel(riskResult.overallRisk)

    // Build response with full research integration metadata
    const response: AnchoredRiskResponse = {
      success: true,
      userId,
      timestamp: new Date().toISOString(),

      // Core risk metrics
      overallRisk: riskResult.overallRisk,
      riskLevel: riskLevel.label,
      riskColor: riskLevel.color,
      riskDescription: riskLevel.description,
      confidence: riskResult.confidence,

      // Gating decision
      shouldBlockBetting: shouldBlockBetting(riskResult.overallRisk),

      // Clinical context
      clinicalContext: riskResult.clinicalContext,

      // Intervention recommendation
      intervention: {
        type: riskResult.suggestedIntervention.type,
        urgency: riskResult.suggestedIntervention.urgency,
        message: riskResult.suggestedIntervention.message,
        options: riskResult.suggestedIntervention.options
      },

      // Risk breakdown for transparency
      breakdown: {
        emotionalTilt: {
          rawScore: emotionalStability.score,
          contribution: riskResult.breakdown.emotionalContribution,
          weight: 0.80,
          description: "Primary signal from emotional stability system"
        },
        behavioral: {
          pgsiScore: riskResult.pgsiSbScore,
          pgsiCategory: riskResult.pgsiSbCategory,
          contribution: riskResult.breakdown.behavioralContribution,
          weight: 0.10,
          description: "PGSI-SB validated behavioral metrics"
        },
        demographic: {
          contribution: riskResult.breakdown.demographicBase,
          weight: 0.10, // Combined demographic (0.05) + expenditure (0.05)
          description: "Demographic and expenditure risk factors"
        }
      },

      // Research integration citations
      researchIntegration: RESEARCH_CITATIONS.map(c => ({
        id: c.id,
        name: c.shortName,
        citation: c.fullCitation,
        doi: c.doi
      })),

      // Emotional stability details (existing system)
      emotionalStability: {
        score: emotionalStability.score,
        level: emotionalStability.level,
        recommendation: emotionalStability.recommendation,
        factors: emotionalStability.factors
      },

      // Behavioral sequence analysis (if available)
      sequenceAnalysis: session?.sequenceAnalysis ? {
        escalationRisk: session.sequenceAnalysis.escalationRisk,
        patterns: session.sequenceAnalysis.patterns.map(p => ({
          type: p.type,
          severity: p.severity,
          description: p.description,
          occurrences: p.occurrences
        })),
        velocityTrend: session.sequenceAnalysis.velocityTrend,
        stakeTrend: session.sequenceAnalysis.stakeTrend,
        liveBettingRatio: session.sequenceAnalysis.liveBettingRatio,
        confidence: session.sequenceAnalysis.confidence
      } : undefined
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error("[Risk API] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

interface AnchoredRiskResponse {
  success: boolean
  userId: string
  timestamp: string
  overallRisk: number
  riskLevel: string
  riskColor: string
  riskDescription: string
  confidence: number
  shouldBlockBetting: boolean
  clinicalContext: string
  intervention: {
    type: string
    urgency: string
    message: string
    options: string[]
  }
  breakdown: {
    emotionalTilt: {
      rawScore: number
      contribution: number
      weight: number
      description: string
    }
    behavioral: {
      pgsiScore?: number
      pgsiCategory?: string
      contribution: number
      weight: number
      description: string
    }
    demographic: {
      contribution: number
      weight: number
      description: string
    }
  }
  researchIntegration: Array<{
    id: string
    name: string
    citation: string
    doi: string | null
  }>
  emotionalStability: {
    score: number
    level: string
    recommendation: string
    factors: Record<string, number>
  }
  /** Behavioral sequence analysis results */
  sequenceAnalysis?: {
    escalationRisk: number
    patterns: Array<{
      type: string
      severity: string
      description: string
      occurrences: number
    }>
    velocityTrend: string
    stakeTrend: string
    liveBettingRatio: number
    confidence: number
  }
}

/**
 * Map user profile data to demographic risk profile
 */
function mapUserToDemographics(userData: any): DemographicProfile | undefined {
  if (!userData) return undefined

  // Map gender
  const genderMap: Record<string, DemographicProfile['gender']> = {
    'male': 'male',
    'female': 'female',
    'other': 'other',
    'prefer not to say': 'other'
  }
  const gender = genderMap[userData.gender?.toLowerCase()] || 'other'

  // Map age to age group
  const surveyData = userData.survey_data || {}
  const ageRange = surveyData.ageRange || userData.age_range
  const ageGroup = mapAgeToGroup(ageRange, userData.age)

  // Map education level
  const educationMap: Record<string, DemographicProfile['education']> = {
    'high school': 'upper_secondary',
    'some college': 'short_cycle_tertiary',
    'bachelors': 'bachelors',
    'masters': 'masters_doctoral',
    'doctorate': 'masters_doctoral',
    'phd': 'masters_doctoral'
  }
  const education = educationMap[surveyData.educationLevel?.toLowerCase()] ||
                   educationMap[userData.education_level?.toLowerCase()]

  // Map employment status
  const employmentMap: Record<string, DemographicProfile['employmentStatus']> = {
    'employed': 'employed',
    'full-time': 'employed',
    'part-time': 'employed',
    'unemployed': 'unemployed',
    'retired': 'retired',
    'student': 'outside_labor_force',
    'disabled': 'disability_sickness'
  }
  const employmentStatus = employmentMap[surveyData.employmentStatus?.toLowerCase()] ||
                          employmentMap[userData.employment_status?.toLowerCase()]

  // Map income level
  const incomeRange = surveyData.incomeRange || userData.income_range
  const incomeLevel = mapIncomeToLevel(incomeRange)

  return {
    gender,
    ageGroup,
    education,
    employmentStatus,
    incomeLevel
  }
}

/**
 * Map age or age range to demographic age group
 */
function mapAgeToGroup(ageRange?: string, age?: number): DemographicProfile['ageGroup'] {
  if (ageRange) {
    const lower = ageRange.toLowerCase()
    if (lower.includes('18') || lower.includes('24') || lower === '18-24') return '18-24'
    if (lower.includes('25') || lower.includes('34') || lower === '25-34') return '25-34'
    if (lower.includes('35') || lower.includes('44') || lower === '35-44') return '35-44'
    if (lower.includes('45') || lower.includes('54') || lower === '45-54') return '45-54'
    if (lower.includes('55') || lower.includes('64') || lower === '55-64') return '55-64'
    if (lower.includes('65') || lower === '65+') return '65+'
  }

  if (typeof age === 'number') {
    if (age < 25) return '18-24'
    if (age < 35) return '25-34'
    if (age < 45) return '35-44'
    if (age < 55) return '45-54'
    if (age < 65) return '55-64'
    return '65+'
  }

  return '25-34' // Default if unknown
}

/**
 * Map income range to income level
 */
function mapIncomeToLevel(incomeRange?: string): DemographicProfile['incomeLevel'] {
  if (!incomeRange) return 'medium'

  const lower = incomeRange.toLowerCase()
  if (lower.includes('under') || lower.includes('less than') || lower.includes('<25') || lower.includes('<30')) {
    return 'low'
  }
  if (lower.includes('100') || lower.includes('150') || lower.includes('200') || lower.includes('+')) {
    return 'high'
  }
  return 'medium'
}

/**
 * Map user data to gambling behavior profile
 */
function mapUserToGamblingBehavior(userData: any): GamblingBehaviorProfile | undefined {
  if (!userData) return undefined

  const surveyData = userData.survey_data || {}
  const bettingFrequency = surveyData.bettingFrequency || userData.betting_frequency

  // Map betting frequency to risk category
  const frequencyMap: Record<string, GamblingBehaviorProfile['frequency']> = {
    'daily': 'daily',
    'several times a week': 'several_times_week',
    'weekly': 'once_week',
    'monthly': 'less_than_monthly',
    'rarely': 'less_than_monthly'
  }
  const frequency = frequencyMap[bettingFrequency?.toLowerCase()] || 'once_week'

  return {
    frequency,
    gamblingMode: 'online_only' // Default for app users
  }
}

/**
 * Fetch recent betting session data for expenditure risk calculation
 */
async function fetchBettingSession(supabase: any, userId: string): Promise<BettingSession | undefined> {
  try {
    // Get recent bets from the last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: recentBets, error } = await supabase
      .from('comprehensive_bets')
      .select('id, stake, timestamp, is_chasing_loss, is_live_bet, outcome')
      .eq('user_id', userId)
      .gte('timestamp', sevenDaysAgo.toISOString())
      .order('timestamp', { ascending: true }) // Chronological for sequence analysis

    if (error || !recentBets || recentBets.length === 0) {
      return undefined
    }

    // Calculate session metrics
    const today = new Date().toDateString()
    const todayBets = recentBets.filter((b: any) =>
      new Date(b.timestamp).toDateString() === today
    )

    const sessionSpend = todayBets.reduce((sum: number, b: any) => sum + (b.stake || 0), 0)
    const weeklySpend = recentBets.reduce((sum: number, b: any) => sum + (b.stake || 0), 0)
    const lossChaseCount = recentBets.filter((b: any) => b.is_chasing_loss).length

    // Count live bets
    const liveBetCount = recentBets.filter((b: any) => b.is_live_bet).length

    // Convert to betting actions for sequence analysis
    const bettingActions = tradesToBettingActions(
      recentBets.map((b: any) => ({
        id: b.id,
        timestamp: new Date(b.timestamp),
        stake: b.stake,
        isLiveBet: b.is_live_bet || false,
        // comprehensive_bets uses outcome field with values like 'win', 'loss', 'push', 'pending'
        result: b.outcome
      }))
    )

    // Perform sequence analysis
    const sequenceAnalysis = analyzeBettingSequence(bettingActions)

    // Calculate average time between bets
    let avgTimeBetweenBets: number | undefined
    if (recentBets.length > 1) {
      const totalTime = new Date(recentBets[recentBets.length - 1].timestamp).getTime() -
                       new Date(recentBets[0].timestamp).getTime()
      avgTimeBetweenBets = totalTime / (recentBets.length - 1) / 1000 // in seconds
    }

    return {
      amount: todayBets[todayBets.length - 1]?.stake || 0,
      frequency: recentBets.length,
      sessionSpend,
      weeklySpend,
      lossChaseCount,
      liveBetCount,
      totalBetsInSession: todayBets.length,
      avgTimeBetweenBets,
      velocityIncreasing: sequenceAnalysis.velocityTrend === 'accelerating',
      stakeEscalating: sequenceAnalysis.stakeTrend === 'increasing',
      sequenceAnalysis
    }
  } catch (error) {
    console.error("[Risk API] Error fetching betting session:", error)
    return undefined
  }
}

/**
 * Fetch PGSI-SB questionnaire responses if user has completed it
 */
async function fetchPgsiResponses(supabase: any, userId: string): Promise<any[] | undefined> {
  try {
    // Fetch recent surveys and find PGSI-SB by checking responses._surveyType
    const { data: surveys, error } = await supabase
      .from('survey_responses')
      .select('responses')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error || !surveys || surveys.length === 0) {
      return undefined
    }

    // Find the most recent PGSI-SB survey
    const pgsiSurvey = surveys.find((s: any) => {
      const responses = s.responses as any
      return responses?._surveyType === 'pgsi_sb'
    })

    if (!pgsiSurvey) {
      return undefined
    }

    // Extract questions from the stored format
    const surveyResponses = pgsiSurvey.responses as any
    return surveyResponses?.questions || undefined
  } catch {
    // No PGSI-SB survey completed - this is fine
    return undefined
  }
}

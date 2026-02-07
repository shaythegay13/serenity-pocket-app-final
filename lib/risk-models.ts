/**
 * Anchored Inference Engine - Risk Models
 *
 * Integrates research-validated risk factors with the existing emotional tilt system.
 * Formula: overallRisk = 0.80 * emotionalTilt + 0.10 * pgsiSb + 0.05 * demoBase + 0.05 * crimeMultiplier
 *
 * This preserves the emotional signals as primary (80% weight) while adding stable baselines
 * from validated research to reduce drift and improve intervention accuracy.
 */

import {
  PGSI_SB_THRESHOLDS,
  DEMOGRAPHIC_RISK_FACTORS,
  GAMBLING_BEHAVIOR_RISK,
  SPEND_RISK_THRESHOLDS,
  SESSION_SPEND_MULTIPLIERS,
  INTERVENTION_THRESHOLDS,
  CLINICAL_CONTEXT_MESSAGES,
  MODEL_WEIGHTS,
  CONFIDENCE_MODIFIERS,
  RESEARCH_CITATIONS,
  type DemographicProfile,
  type GamblingBehaviorProfile,
  type PgsiSbResponse,
  type InterventionUrgency,
  type InterventionType
} from './research-anchors';

// ============================================================================
// Types
// ============================================================================

export interface BettingSession {
  amount: number;
  frequency: number; // bets per week
  sessionSpend: number; // current session total
  weeklySpend: number;
  lossChaseCount: number; // times user bet to recover losses
  /** Number of live/in-play bets in session */
  liveBetCount?: number;
  /** Total bets in session */
  totalBetsInSession?: number;
  /** Average time between bets in seconds */
  avgTimeBetweenBets?: number;
  /** Whether bet velocity is increasing (bets getting faster) */
  velocityIncreasing?: boolean;
  /** Whether stakes are escalating */
  stakeEscalating?: boolean;
  /** Sequence analysis result */
  sequenceAnalysis?: BettingSequenceAnalysis;
}

/**
 * Individual betting action for sequence analysis
 */
export interface BettingAction {
  id: string;
  timestamp: Date;
  stake: number;
  isLiveBet: boolean;
  outcome?: 'win' | 'loss' | 'push' | 'pending';
  sport?: string;
  emotionalState?: {
    tiltLevel: number;
    arousal: number;
    valence: number;
  };
  /** Time since previous bet in seconds */
  timeSincePrevious?: number;
}

/**
 * Result of behavioral sequence analysis
 */
export interface BettingSequenceAnalysis {
  /** Overall escalation risk (0-1) */
  escalationRisk: number;
  /** Detected patterns */
  patterns: EscalationPattern[];
  /** Velocity trend: 'accelerating' | 'stable' | 'decelerating' */
  velocityTrend: 'accelerating' | 'stable' | 'decelerating';
  /** Stake trend: 'increasing' | 'stable' | 'decreasing' */
  stakeTrend: 'increasing' | 'stable' | 'decreasing';
  /** Live betting ratio (0-1) */
  liveBettingRatio: number;
  /** Confidence in analysis (based on sample size) */
  confidence: number;
}

/**
 * Types of escalation patterns detected
 */
export interface EscalationPattern {
  type: 'loss_chasing' | 'stake_escalation' | 'velocity_increase' | 'live_betting_spike' | 'emotional_betting';
  severity: 'low' | 'medium' | 'high';
  description: string;
  /** Evidence count for this pattern */
  occurrences: number;
}

export interface UserRiskProfile {
  userId: string;
  demographics?: DemographicProfile;
  gamblingBehavior?: GamblingBehaviorProfile;
  pgsiSbResponses?: PgsiSbResponse[];
}

export interface RiskBreakdown {
  emotionalContribution: number;
  behavioralContribution: number;
  demographicBase: number;
  crimeMultiplier?: number;
}

export interface SuggestedIntervention {
  type: InterventionType;
  message: string;
  options: string[];
  urgency: InterventionUrgency;
}

export interface AnchoredRiskResult {
  overallRisk: number;
  confidence: number;
  breakdown: RiskBreakdown;
  clinicalContext: string;
  suggestedIntervention: SuggestedIntervention;
  pgsiSbScore?: number;
  pgsiSbCategory?: string;
  researchIntegration: string[];
}

// ============================================================================
// Core Computation Functions
// ============================================================================

/**
 * Compute PGSI-SB score from questionnaire responses
 * @param responses Array of PGSI-SB question responses (0-3 scale)
 * @returns Normalized score (0-1) and raw score (0-27)
 *
 * @example
 * computePgsiSbScore([
 *   { questionId: 'affordability', score: 2 },
 *   { questionId: 'tolerance', score: 1 },
 *   { questionId: 'chasing', score: 3 },
 *   // ... remaining questions
 * ])
 * // Returns { normalized: 0.37, raw: 10, category: 'PROBLEM_GAMBLER' }
 */
export function computePgsiSbScore(responses: PgsiSbResponse[]): {
  normalized: number;
  raw: number;
  category: keyof typeof PGSI_SB_THRESHOLDS;
} {
  if (!responses || responses.length === 0) {
    return { normalized: 0, raw: 0, category: 'NON_PROBLEM' };
  }

  const rawScore = responses.reduce((sum, r) => sum + r.score, 0);
  const maxPossible = responses.length * 3; // 9 questions * 3 max = 27

  // Determine category
  let category: keyof typeof PGSI_SB_THRESHOLDS = 'NON_PROBLEM';
  if (rawScore >= PGSI_SB_THRESHOLDS.PROBLEM_GAMBLER.min) {
    category = 'PROBLEM_GAMBLER';
  } else if (rawScore >= PGSI_SB_THRESHOLDS.MODERATE_RISK.min) {
    category = 'MODERATE_RISK';
  } else if (rawScore >= PGSI_SB_THRESHOLDS.LOW_RISK.min) {
    category = 'LOW_RISK';
  }

  return {
    normalized: rawScore / maxPossible,
    raw: rawScore,
    category
  };
}

/**
 * Compute demographic base risk from user profile
 * @param demographics User demographic information
 * @returns Risk score (0-1)
 *
 * @example
 * computeDemographicRisk({
 *   gender: 'male',
 *   ageGroup: '25-34',
 *   education: 'upper_secondary',
 *   employmentStatus: 'employed',
 *   incomeLevel: 'medium'
 * })
 * // Returns 0.68 (elevated risk profile)
 */
export function computeDemographicRisk(demographics?: DemographicProfile): number {
  if (!demographics) {
    return 0.2; // Default baseline when demographics unavailable
  }

  let riskScore = 0;

  // Gender factor (Study 2: Males OR 2.5)
  riskScore += DEMOGRAPHIC_RISK_FACTORS.gender[demographics.gender] || 0;

  // Age factor (Study 2: Older adults significantly higher OR)
  riskScore += DEMOGRAPHIC_RISK_FACTORS.ageGroup[demographics.ageGroup] || 0;

  // Education factor (Study 2: Lower education = higher risk)
  if (demographics.education) {
    riskScore += DEMOGRAPHIC_RISK_FACTORS.education[demographics.education] || 0;
  }

  // Employment factor (Study 2: Disability/sickness OR 2.0)
  if (demographics.employmentStatus) {
    riskScore += DEMOGRAPHIC_RISK_FACTORS.employmentStatus[demographics.employmentStatus] || 0;
  }

  // Income factor (Study 2: High income OR 2.0, low income protective)
  if (demographics.incomeLevel) {
    riskScore += DEMOGRAPHIC_RISK_FACTORS.incomeLevel[demographics.incomeLevel] || 0;
  }

  // Normalize to 0-1 range (max theoretical ~1.14)
  return Math.min(1, Math.max(0, riskScore));
}

/**
 * Compute behavioral risk from gambling patterns
 * @param behavior User gambling behavior profile
 * @returns Risk score (0-1)
 */
export function computeBehavioralRisk(behavior?: GamblingBehaviorProfile): number {
  if (!behavior) {
    return 0;
  }

  let riskScore = 0;

  // Frequency is strongest predictor (Study 2: Daily OR 224.8)
  riskScore += GAMBLING_BEHAVIOR_RISK.frequency[behavior.frequency] || 0;

  // Number of game types
  if (behavior.gameTypesCount) {
    riskScore += GAMBLING_BEHAVIOR_RISK.gameTypesCount[behavior.gameTypesCount] || 0;
  }

  // Gambling mode (multi-mode slightly elevated)
  if (behavior.gamblingMode) {
    riskScore += GAMBLING_BEHAVIOR_RISK.gamblingMode[behavior.gamblingMode] || 0;
  }

  // Normalize (max theoretical ~1.7)
  return Math.min(1, riskScore / 1.7);
}

/**
 * Compute expenditure-crime risk multiplier
 * @param session Current betting session data
 * @returns Risk multiplier (1.0-1.75)
 *
 * @example
 * computeExpenditureRisk({ sessionSpend: 600, weeklySpend: 150, ... })
 * // Returns 0.75 (high spend threshold from Study 1)
 */
export function computeExpenditureRisk(session?: BettingSession): number {
  if (!session) {
    return 0;
  }

  // Weekly spend threshold (Study 1 methodology)
  let weeklyRisk = 0;
  if (session.weeklySpend > SPEND_RISK_THRESHOLDS.INTERMEDIATE.maxWeekly) {
    weeklyRisk = SPEND_RISK_THRESHOLDS.HIGH.riskMultiplier;
  } else if (session.weeklySpend > SPEND_RISK_THRESHOLDS.LOW.maxWeekly) {
    weeklyRisk = SPEND_RISK_THRESHOLDS.INTERMEDIATE.riskMultiplier;
  }

  // Session spend multiplier
  let sessionMultiplier = 1.0;
  if (session.sessionSpend > 500) {
    sessionMultiplier = SESSION_SPEND_MULTIPLIERS.over_500;
  } else if (session.sessionSpend > 250) {
    sessionMultiplier = SESSION_SPEND_MULTIPLIERS['250_to_500'];
  } else if (session.sessionSpend > 100) {
    sessionMultiplier = SESSION_SPEND_MULTIPLIERS['100_to_250'];
  } else if (session.sessionSpend > 50) {
    sessionMultiplier = SESSION_SPEND_MULTIPLIERS['50_to_100'];
  }

  // Combine and normalize
  const combinedRisk = weeklyRisk * (sessionMultiplier - 0.75); // Adjust base
  return Math.min(1, Math.max(0, combinedRisk));
}

/**
 * Determine intervention based on risk level
 * @param overallRisk Combined risk score (0-1)
 * @param pgsiCategory PGSI-SB category for clinical context
 * @returns Suggested intervention with urgency and options
 */
export function determineIntervention(
  overallRisk: number,
  pgsiCategory?: keyof typeof PGSI_SB_THRESHOLDS
): SuggestedIntervention {
  // Critical intervention
  if (overallRisk > INTERVENTION_THRESHOLDS.WARNING.maxRisk) {
    return {
      type: 'intervention',
      message: 'Your current risk indicators suggest taking a break would be beneficial. Consider reaching out to support resources.',
      options: [
        'Take a 24-hour break',
        'Set a hard loss limit',
        'Contact support resources',
        'Enable self-exclusion'
      ],
      urgency: 'critical'
    };
  }

  // High urgency warning
  if (overallRisk > INTERVENTION_THRESHOLDS.PROMPT.maxRisk) {
    return {
      type: 'warning',
      message: 'Multiple risk factors detected. We recommend reviewing your betting strategy.',
      options: [
        'Take 10-minute break',
        'Set loss limit',
        'Review strategy',
        'View risk breakdown'
      ],
      urgency: 'high'
    };
  }

  // Medium urgency prompt
  if (overallRisk > INTERVENTION_THRESHOLDS.SUGGESTION.maxRisk) {
    return {
      type: 'prompt',
      message: 'Some risk indicators are elevated. Consider adjusting your approach.',
      options: [
        'Take 5-minute break',
        'Reduce stake size',
        'Review betting history'
      ],
      urgency: 'medium'
    };
  }

  // Low urgency suggestion
  if (overallRisk > INTERVENTION_THRESHOLDS.NONE.maxRisk) {
    return {
      type: 'suggestion',
      message: 'Minor risk indicators present. Stay mindful of your betting patterns.',
      options: [
        'Set session time limit',
        'Review bankroll management'
      ],
      urgency: 'low'
    };
  }

  // No intervention needed
  return {
    type: 'passive',
    message: 'Risk indicators are within normal range.',
    options: [],
    urgency: 'none'
  };
}

/**
 * Get clinical context message based on combined risk factors
 */
export function getClinicalContext(
  overallRisk: number,
  pgsiCategory?: keyof typeof PGSI_SB_THRESHOLDS
): string {
  if (overallRisk > 0.85 || pgsiCategory === 'PROBLEM_GAMBLER') {
    return CLINICAL_CONTEXT_MESSAGES.CRITICAL;
  }
  if (overallRisk > 0.7) {
    return CLINICAL_CONTEXT_MESSAGES.PROBLEM_GAMBLER;
  }
  if (overallRisk > 0.5 || pgsiCategory === 'MODERATE_RISK') {
    return CLINICAL_CONTEXT_MESSAGES.MODERATE_RISK;
  }
  if (overallRisk > 0.3 || pgsiCategory === 'LOW_RISK') {
    return CLINICAL_CONTEXT_MESSAGES.LOW_RISK;
  }
  return CLINICAL_CONTEXT_MESSAGES.NON_PROBLEM;
}

/**
 * Calculate confidence based on available data
 */
export function calculateConfidence(profile: UserRiskProfile, session?: BettingSession): number {
  let confidence = CONFIDENCE_MODIFIERS.FULL_DATA;

  if (!profile.demographics) {
    confidence *= CONFIDENCE_MODIFIERS.MISSING_DEMOGRAPHICS;
  }

  if (!profile.pgsiSbResponses || profile.pgsiSbResponses.length < 9) {
    confidence *= 0.95; // Partial PGSI data
  }

  if (!session || session.frequency === 0) {
    confidence *= CONFIDENCE_MODIFIERS.MISSING_HISTORY;
  }

  return Math.max(0.5, confidence);
}

// ============================================================================
// Main Anchored Inference Engine
// ============================================================================

/**
 * Compute anchored risk score combining emotional tilt with research-validated factors
 *
 * @param emotionalTilt Current emotional tilt score from vibecoding system (0-1)
 * @param profile User profile with demographics and PGSI-SB responses
 * @param session Current betting session data
 * @returns Complete anchored risk assessment
 *
 * @example
 * // High-risk scenario: elevated tilt, young male, high frequency
 * const result = computeAnchoredRisk(
 *   0.7, // emotional tilt
 *   {
 *     userId: 'user_123',
 *     demographics: { gender: 'male', ageGroup: '25-34' },
 *     pgsiSbResponses: [{ questionId: 'chasing', score: 2 }, ...]
 *   },
 *   { sessionSpend: 300, weeklySpend: 600, frequency: 15 }
 * );
 * // Returns { overallRisk: 0.85, confidence: 0.9, ... }
 */
export function computeAnchoredRisk(
  emotionalTilt: number,
  profile: UserRiskProfile,
  session?: BettingSession
): AnchoredRiskResult {
  // Normalize emotional tilt to 0-1
  const normalizedTilt = Math.min(1, Math.max(0, emotionalTilt));

  // Compute PGSI-SB behavioral score
  const pgsiResult = computePgsiSbScore(profile.pgsiSbResponses || []);
  const pgsiRisk = PGSI_SB_THRESHOLDS[pgsiResult.category].riskMultiplier;

  // Compute demographic base risk
  const demographicRisk = computeDemographicRisk(profile.demographics);

  // Compute expenditure-crime multiplier
  const expenditureRisk = computeExpenditureRisk(session);

  // Combined behavioral risk (PGSI + gambling patterns)
  const behavioralPattern = computeBehavioralRisk(profile.gamblingBehavior);
  const combinedBehavioral = (pgsiRisk + behavioralPattern) / 2;

  // Apply model weights
  // Formula: 0.80 * emotionalTilt + 0.10 * pgsiSb + 0.05 * demoBase + 0.05 * crimeMultiplier
  const weightedEmotional = MODEL_WEIGHTS.EMOTIONAL_TILT * normalizedTilt;
  const weightedBehavioral = MODEL_WEIGHTS.PGSI_SB_BEHAVIORAL * combinedBehavioral;
  const weightedDemographic = MODEL_WEIGHTS.DEMOGRAPHIC_BASE * demographicRisk;
  const weightedExpenditure = MODEL_WEIGHTS.EXPENDITURE_CRIME * expenditureRisk;

  const overallRisk = weightedEmotional + weightedBehavioral + weightedDemographic + weightedExpenditure;

  // Calculate confidence
  const confidence = calculateConfidence(profile, session);

  // Determine clinical context and intervention
  const clinicalContext = getClinicalContext(overallRisk, pgsiResult.category);
  const intervention = determineIntervention(overallRisk, pgsiResult.category);

  // Build breakdown
  const breakdown: RiskBreakdown = {
    emotionalContribution: weightedEmotional,
    behavioralContribution: weightedBehavioral,
    demographicBase: weightedDemographic + weightedExpenditure
  };

  return {
    overallRisk: Math.min(1, Math.max(0, overallRisk)),
    confidence,
    breakdown,
    clinicalContext,
    suggestedIntervention: intervention,
    pgsiSbScore: pgsiResult.raw,
    pgsiSbCategory: PGSI_SB_THRESHOLDS[pgsiResult.category].label,
    researchIntegration: RESEARCH_CITATIONS.map(c => c.shortName)
  };
}

/**
 * Quick risk check for ensemble with SmartSlip picker
 * Returns just the risk score for gating decisions
 */
export function quickRiskCheck(emotionalTilt: number, userId: string): number {
  // Simplified check using just emotional tilt (for real-time decisions)
  // Full check should use computeAnchoredRisk with profile data
  return Math.min(1, emotionalTilt * 1.1); // Slight uplift for safety margin
}

/**
 * Check if betting should be blocked based on risk level
 */
export function shouldBlockBetting(overallRisk: number): boolean {
  return overallRisk > INTERVENTION_THRESHOLDS.WARNING.maxRisk;
}

/**
 * Get risk level label for UI display
 */
export function getRiskLevelLabel(risk: number): {
  label: string;
  color: 'green' | 'yellow' | 'orange' | 'red';
  description: string;
} {
  if (risk <= 0.3) {
    return { label: 'Low', color: 'green', description: 'Betting within normal parameters' };
  }
  if (risk <= 0.5) {
    return { label: 'Moderate', color: 'yellow', description: 'Some risk factors present' };
  }
  if (risk <= 0.7) {
    return { label: 'Elevated', color: 'orange', description: 'Multiple risk factors detected' };
  }
  return { label: 'High', color: 'red', description: 'Significant risk - intervention recommended' };
}

// ============================================================================
// Behavioral Sequence Analysis
// ============================================================================

/**
 * Analyze a sequence of betting actions to detect escalation patterns
 *
 * @param actions Array of betting actions in chronological order
 * @returns Sequence analysis with detected patterns and risk scores
 *
 * @example
 * const analysis = analyzeBettingSequence([
 *   { id: '1', timestamp: new Date(), stake: 10, isLiveBet: false },
 *   { id: '2', timestamp: new Date(), stake: 25, isLiveBet: true },
 *   { id: '3', timestamp: new Date(), stake: 50, isLiveBet: true },
 * ]);
 * // Returns { escalationRisk: 0.7, patterns: [...], ... }
 */
export function analyzeBettingSequence(actions: BettingAction[]): BettingSequenceAnalysis {
  if (!actions || actions.length < 2) {
    return {
      escalationRisk: 0,
      patterns: [],
      velocityTrend: 'stable',
      stakeTrend: 'stable',
      liveBettingRatio: 0,
      confidence: actions?.length === 1 ? 0.3 : 0
    };
  }

  const patterns: EscalationPattern[] = [];
  let escalationRisk = 0;

  // Sort by timestamp
  const sortedActions = [...actions].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Calculate time intervals between bets
  const intervals: number[] = [];
  for (let i = 1; i < sortedActions.length; i++) {
    const timeDiff = (new Date(sortedActions[i].timestamp).getTime() -
                     new Date(sortedActions[i - 1].timestamp).getTime()) / 1000;
    intervals.push(timeDiff);
    sortedActions[i].timeSincePrevious = timeDiff;
  }

  // Analyze velocity trend
  const velocityTrend = analyzeVelocityTrend(intervals);
  if (velocityTrend === 'accelerating') {
    patterns.push({
      type: 'velocity_increase',
      severity: intervals[intervals.length - 1] < 60 ? 'high' : 'medium',
      description: 'Time between bets is decreasing - betting is speeding up',
      occurrences: countDecreasingSequence(intervals)
    });
    escalationRisk += 0.2;
  }

  // Analyze stake trend
  const stakes = sortedActions.map(a => a.stake);
  const stakeTrend = analyzeStakeTrend(stakes);
  if (stakeTrend === 'increasing') {
    const stakeIncreaseRatio = stakes[stakes.length - 1] / stakes[0];
    patterns.push({
      type: 'stake_escalation',
      severity: stakeIncreaseRatio > 3 ? 'high' : stakeIncreaseRatio > 1.5 ? 'medium' : 'low',
      description: `Stakes have increased ${Math.round((stakeIncreaseRatio - 1) * 100)}% since session start`,
      occurrences: countIncreasingSequence(stakes)
    });
    escalationRisk += stakeIncreaseRatio > 3 ? 0.3 : stakeIncreaseRatio > 1.5 ? 0.2 : 0.1;
  }

  // Detect loss chasing
  const lossChasingResult = detectLossChasing(sortedActions);
  if (lossChasingResult.detected) {
    patterns.push({
      type: 'loss_chasing',
      severity: lossChasingResult.severity,
      description: 'Increased stakes detected after losses - potential loss chasing',
      occurrences: lossChasingResult.count
    });
    escalationRisk += lossChasingResult.severity === 'high' ? 0.35 :
                      lossChasingResult.severity === 'medium' ? 0.2 : 0.1;
  }

  // Analyze live betting ratio
  const liveBets = sortedActions.filter(a => a.isLiveBet).length;
  const liveBettingRatio = liveBets / sortedActions.length;
  if (liveBettingRatio > 0.5) {
    patterns.push({
      type: 'live_betting_spike',
      severity: liveBettingRatio > 0.8 ? 'high' : 'medium',
      description: `${Math.round(liveBettingRatio * 100)}% of bets are live/in-play - elevated impulsivity risk`,
      occurrences: liveBets
    });
    escalationRisk += liveBettingRatio > 0.8 ? 0.2 : 0.1;
  }

  // Detect emotional betting (high tilt bets)
  const emotionalBets = sortedActions.filter(
    a => a.emotionalState && a.emotionalState.tiltLevel > 0.6
  ).length;
  if (emotionalBets > sortedActions.length * 0.3) {
    patterns.push({
      type: 'emotional_betting',
      severity: emotionalBets > sortedActions.length * 0.6 ? 'high' : 'medium',
      description: 'Multiple bets placed while in elevated emotional state',
      occurrences: emotionalBets
    });
    escalationRisk += 0.15;
  }

  // Calculate confidence based on sample size
  const confidence = Math.min(1, 0.5 + (sortedActions.length - 2) * 0.1);

  return {
    escalationRisk: Math.min(1, escalationRisk),
    patterns,
    velocityTrend,
    stakeTrend,
    liveBettingRatio,
    confidence
  };
}

/**
 * Analyze trend in time intervals between bets
 */
function analyzeVelocityTrend(intervals: number[]): 'accelerating' | 'stable' | 'decelerating' {
  if (intervals.length < 2) return 'stable';

  // Compare first half average to second half average
  const midpoint = Math.floor(intervals.length / 2);
  const firstHalf = intervals.slice(0, midpoint);
  const secondHalf = intervals.slice(midpoint);

  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  const changeRatio = secondAvg / firstAvg;

  if (changeRatio < 0.7) return 'accelerating'; // Time between bets decreased
  if (changeRatio > 1.3) return 'decelerating'; // Time between bets increased
  return 'stable';
}

/**
 * Analyze trend in stake amounts
 */
function analyzeStakeTrend(stakes: number[]): 'increasing' | 'stable' | 'decreasing' {
  if (stakes.length < 2) return 'stable';

  // Use linear regression slope
  const n = stakes.length;
  const sumX = (n * (n - 1)) / 2;
  const sumY = stakes.reduce((a, b) => a + b, 0);
  const sumXY = stakes.reduce((sum, y, x) => sum + x * y, 0);
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const avgStake = sumY / n;
  const normalizedSlope = slope / avgStake;

  if (normalizedSlope > 0.1) return 'increasing';
  if (normalizedSlope < -0.1) return 'decreasing';
  return 'stable';
}

/**
 * Detect loss chasing pattern: increased stakes after losses
 */
function detectLossChasing(actions: BettingAction[]): {
  detected: boolean;
  severity: 'low' | 'medium' | 'high';
  count: number;
} {
  let chasingCount = 0;
  let maxStakeIncrease = 1;

  for (let i = 1; i < actions.length; i++) {
    const prev = actions[i - 1];
    const curr = actions[i];

    if (prev.outcome === 'loss' && curr.stake > prev.stake) {
      chasingCount++;
      const increase = curr.stake / prev.stake;
      maxStakeIncrease = Math.max(maxStakeIncrease, increase);
    }
  }

  if (chasingCount === 0) {
    return { detected: false, severity: 'low', count: 0 };
  }

  const chasingRatio = chasingCount / (actions.length - 1);
  let severity: 'low' | 'medium' | 'high' = 'low';

  if (chasingRatio > 0.5 || maxStakeIncrease > 2) {
    severity = 'high';
  } else if (chasingRatio > 0.25 || maxStakeIncrease > 1.5) {
    severity = 'medium';
  }

  return { detected: true, severity, count: chasingCount };
}

/**
 * Count consecutive decreasing values in sequence
 */
function countDecreasingSequence(values: number[]): number {
  let count = 0;
  for (let i = 1; i < values.length; i++) {
    if (values[i] < values[i - 1]) count++;
  }
  return count;
}

/**
 * Count consecutive increasing values in sequence
 */
function countIncreasingSequence(values: number[]): number {
  let count = 0;
  for (let i = 1; i < values.length; i++) {
    if (values[i] > values[i - 1]) count++;
  }
  return count;
}

/**
 * Convert trades to betting actions for sequence analysis
 */
export function tradesToBettingActions(trades: Array<{
  id: string;
  timestamp: Date;
  stake?: number;
  isLiveBet?: boolean;
  result?: 'win' | 'loss' | 'push';
  outcome?: 'profit' | 'loss' | 'breakeven';
  preTradeEmotion?: string;
  preTradeIntensity?: number;
}>): BettingAction[] {
  // Import the conversion function dynamically to avoid circular deps
  const getEmotionalState = (emotion?: string, intensity?: number) => {
    if (!emotion) return undefined;

    // Simplified arousal/valence mapping
    const positiveEmotions = ['happy', 'confident', 'calm', 'excited', 'grateful'];
    const negativeEmotions = ['anxious', 'frustrated', 'angry', 'fearful', 'stressed'];

    const normalizedIntensity = (intensity || 5) / 10;
    let arousal = 0.5;
    let valence = 0;

    const lowerEmotion = emotion.toLowerCase();
    if (positiveEmotions.some(e => lowerEmotion.includes(e))) {
      valence = 0.6 * normalizedIntensity;
      arousal = lowerEmotion.includes('excited') ? 0.8 : 0.5;
    } else if (negativeEmotions.some(e => lowerEmotion.includes(e))) {
      valence = -0.6 * normalizedIntensity;
      arousal = 0.7 * normalizedIntensity;
    }

    const tiltLevel = arousal * (1 - valence) / 2;
    return { tiltLevel, arousal, valence };
  };

  return trades
    .filter(t => t.stake !== undefined)
    .map(t => ({
      id: t.id,
      timestamp: t.timestamp,
      stake: t.stake!,
      isLiveBet: t.isLiveBet || false,
      outcome: t.result || (t.outcome === 'profit' ? 'win' : t.outcome === 'loss' ? 'loss' : 'push'),
      emotionalState: getEmotionalState(t.preTradeEmotion, t.preTradeIntensity)
    }));
}

/**
 * Get escalation risk from betting session with sequence analysis
 */
export function getSessionEscalationRisk(session: BettingSession): number {
  if (!session.sequenceAnalysis) return 0;

  const analysis = session.sequenceAnalysis;
  let risk = analysis.escalationRisk;

  // Additional risk from live betting
  if (session.liveBetCount && session.totalBetsInSession) {
    const liveRatio = session.liveBetCount / session.totalBetsInSession;
    if (liveRatio > 0.7) risk += 0.1;
  }

  // Additional risk from velocity
  if (session.velocityIncreasing) risk += 0.1;
  if (session.stakeEscalating) risk += 0.1;

  return Math.min(1, risk);
}

// ============================================================================
// Exports for Testing
// ============================================================================

export const __testing = {
  computePgsiSbScore,
  computeDemographicRisk,
  computeBehavioralRisk,
  computeExpenditureRisk,
  determineIntervention,
  getClinicalContext,
  calculateConfidence,
  analyzeBettingSequence,
  analyzeVelocityTrend,
  analyzeStakeTrend,
  detectLossChasing
};

/**
 * Research Anchors - Fixed features extracted from EBSCO studies
 *
 * Study 1: "Does gambling expenditure have any effect on crime?" (Wan et al., 2024)
 * Study 2: "Socio-Demographic Factors, Gambling Behaviour, and the Level of Gambling Expenditure" (Grönroos et al., 2022)
 * Study 3: "Validation of a Sports Betting Adaptation to the Problem Gambling Severity Index" (Graupensperger & Calhoun, 2024)
 *
 * These constants anchor the emotional tilt system with stable, research-validated baselines
 * to reduce model drift and improve intervention accuracy.
 */

// ============================================================================
// PGSI-SB (Problem Gambling Severity Index - Sports Betting) from Study 3
// ============================================================================

/**
 * PGSI-SB Question IDs and their validated weightings
 * Scale: 0=Never, 1=Sometimes, 2=Most of the time, 3=Almost always
 * Total possible score: 0-27
 */
export const PGSI_SB_QUESTIONS = [
  {
    id: 'affordability',
    text: 'Have you bet more than you could really afford to lose?',
    weight: 1.0,
    subscale: 'problem_behavior'
  },
  {
    id: 'tolerance',
    text: 'Have you needed to bet larger amounts of money to get the same feeling of excitement?',
    weight: 1.0,
    subscale: 'problem_behavior'
  },
  {
    id: 'chasing',
    text: 'When you bet on sports, did you bet again another day to try to win back the money you lost?',
    weight: 1.0,
    subscale: 'problem_behavior'
  },
  {
    id: 'borrowing',
    text: 'Have you borrowed money or sold anything to get money to bet on sports?',
    weight: 1.0,
    subscale: 'problem_behavior'
  },
  {
    id: 'self_perception',
    text: 'Have you felt that you might have a problem with sports betting?',
    weight: 1.0,
    subscale: 'negative_consequences'
  },
  {
    id: 'health_impact',
    text: 'Has sports betting caused you any health problems, including stress or anxiety?',
    weight: 1.0,
    subscale: 'negative_consequences'
  },
  {
    id: 'criticism',
    text: 'Have people criticized your sports betting or told you that you had a problem?',
    weight: 1.0,
    subscale: 'negative_consequences'
  },
  {
    id: 'financial_problems',
    text: 'Has your sports betting caused any financial problems for you or your household?',
    weight: 1.0,
    subscale: 'negative_consequences'
  },
  {
    id: 'guilt',
    text: 'Have you felt guilty about the way you bet on sports or what happens when you bet on sports?',
    weight: 1.0,
    subscale: 'negative_consequences'
  }
] as const;

/**
 * PGSI-SB Risk Thresholds (validated from Study 3)
 * Based on confirmatory factor analysis with N=221 young adults
 */
export const PGSI_SB_THRESHOLDS = {
  NON_PROBLEM: { min: 0, max: 0, label: 'Non-problem gambler', riskMultiplier: 0.0 },
  LOW_RISK: { min: 1, max: 2, label: 'Low-risk gambler', riskMultiplier: 0.15 },
  MODERATE_RISK: { min: 3, max: 7, label: 'Moderate-risk gambler', riskMultiplier: 0.45 },
  PROBLEM_GAMBLER: { min: 8, max: 27, label: 'Problem gambler', riskMultiplier: 0.85 }
} as const;

/**
 * PGSI-SB Subscale Reliability (Cronbach's omega from Study 3)
 */
export const PGSI_SB_RELIABILITY = {
  single_factor: 0.863,
  problem_behaviors: 0.702,
  negative_consequences: 0.805
} as const;

// ============================================================================
// Demographic Risk Factors from Study 2
// ============================================================================

/**
 * Demographic base risk multipliers extracted from multinomial logistic regression
 * Reference group: 18-24 year old female with Master's degree, employed, median income
 * Values are odds ratios converted to risk adjustments (normalized 0-1)
 */
export const DEMOGRAPHIC_RISK_FACTORS = {
  gender: {
    male: 0.30,      // OR 2.5 for highest expenditure vs female
    female: 0.0,     // Reference
    other: 0.15      // Interpolated
  },

  ageGroup: {
    '18-24': 0.0,    // Reference group
    '25-34': 0.18,   // OR 7.5
    '35-44': 0.15,   // OR 5.3
    '45-54': 0.22,   // OR 9.1
    '55-64': 0.35,   // OR 27.5
    '65+': 0.40      // OR 40.9 - highest risk for sustained high spending
  },

  education: {
    masters_doctoral: 0.0,       // Reference
    bachelors: 0.05,             // OR 1.3
    short_cycle_tertiary: 0.10,  // OR 1.5
    upper_secondary: 0.20,       // OR 2.3
    missing_lower: 0.22          // OR 2.5
  },

  employmentStatus: {
    employed: 0.0,               // Reference
    unemployed: 0.08,            // OR 1.4
    retired: 0.02,               // OR 1.1
    outside_labor_force: 0.12,   // OR 1.6
    disability_sickness: 0.20    // OR 2.0 - significant risk factor
  },

  incomeLevel: {
    high: 0.20,     // T3 - OR 2.0 for highest expenditure
    medium: 0.0,    // T2 - Reference
    low: -0.10      // T1 - OR 0.6 (protective factor - less disposable income)
  }
} as const;

/**
 * Gambling behavior risk factors from Study 2
 * These compound with demographic factors
 */
export const GAMBLING_BEHAVIOR_RISK = {
  frequency: {
    daily: 0.95,              // OR 224.8 - extreme risk
    several_times_week: 0.75, // OR 76.3
    once_week: 0.35,          // OR 10.0
    less_than_monthly: 0.0    // Reference
  },

  gameTypesCount: {
    '11-18': 0.60,  // OR 18.5
    '6-10': 0.40,   // OR 5.7
    '4-5': 0.08,    // OR 1.4
    '1-3': 0.0      // Reference
  },

  gamblingMode: {
    multi_mode: 0.15,    // OR 1.4 - online + land-based
    online_only: 0.05,   // OR 1.1
    land_based_only: 0.0 // Reference
  }
} as const;

// ============================================================================
// Expenditure-Crime Risk Multipliers from Study 1
// ============================================================================

/**
 * Crime correlation multipliers based on gambling expenditure
 * From NSW Australia ARDL analysis (2015-2020)
 * Each 10% increase in gambling expenditure correlates with crime increases
 */
export const EXPENDITURE_CRIME_CORRELATION = {
  // Long-run elasticities from Table 3
  assault: 0.7364,                    // 7.4% increase per 10% spend increase
  break_enter_dwelling: 1.0583,       // 10.6% increase
  break_enter_non_dwelling: 1.3170,   // 13.2% increase
  motor_vehicle_theft: 1.0662,        // 10.7% increase
  stealing_from_vehicle: 0.6106,      // 6.1% increase
  fraud: 0.7410                       // 7.4% increase
} as const;

/**
 * Weekly spend thresholds for risk categorization (EUR converted to USD)
 * Based on Study 1's expenditure groups
 */
export const SPEND_RISK_THRESHOLDS = {
  // Original EUR values converted at ~1.1 USD/EUR
  LOW: { maxWeekly: 11, riskMultiplier: 0.0 },           // <EUR 10
  INTERMEDIATE: { maxWeekly: 44, riskMultiplier: 0.35 }, // EUR 10-40
  HIGH: { maxWeekly: Infinity, riskMultiplier: 0.75 }    // >EUR 40 (produces 50% of total GE)
} as const;

/**
 * Session-based spend thresholds for immediate risk detection
 */
export const SESSION_SPEND_MULTIPLIERS = {
  under_50: 1.0,      // Normal
  '50_to_100': 1.15,  // Elevated awareness
  '100_to_250': 1.35, // Moderate concern
  '250_to_500': 1.55, // High concern
  over_500: 1.75      // Critical - correlates with crime risk escalation
} as const;

// ============================================================================
// Intervention Thresholds
// ============================================================================

/**
 * Risk-based intervention mapping
 * Derived from combined study findings
 */
export const INTERVENTION_THRESHOLDS = {
  NONE: { maxRisk: 0.3, urgency: 'none', type: 'passive' },
  SUGGESTION: { maxRisk: 0.5, urgency: 'low', type: 'suggestion' },
  PROMPT: { maxRisk: 0.7, urgency: 'medium', type: 'prompt' },
  WARNING: { maxRisk: 0.85, urgency: 'high', type: 'warning' },
  INTERVENTION: { maxRisk: 1.0, urgency: 'critical', type: 'intervention' }
} as const;

/**
 * Clinical context messages based on PGSI-SB categories
 */
export const CLINICAL_CONTEXT_MESSAGES = {
  NON_PROBLEM: 'No indicators of problematic gambling behavior detected.',
  LOW_RISK: 'Minor risk indicators present. Recreational gambling with minimal harm indicators.',
  MODERATE_RISK: 'Moderate risk indicators. Some behaviors may lead to negative consequences if unchecked.',
  PROBLEM_GAMBLER: 'High clinical risk. Multiple problem gambling indicators present. Professional support recommended.',
  CRITICAL: 'Critical risk level. Immediate intervention recommended. Consider self-exclusion or professional help.'
} as const;

// ============================================================================
// Model Configuration
// ============================================================================

/**
 * Anchored Inference Engine weight configuration
 * Primary signal: Emotional tilt (80%) - preserves existing vibecoding system
 * Stabilizers: Research-backed factors (20% combined) - reduces drift
 */
export const MODEL_WEIGHTS = {
  EMOTIONAL_TILT: 0.80,      // Primary signal - existing system
  PGSI_SB_BEHAVIORAL: 0.10,  // Study 3 validated behavioral metrics
  DEMOGRAPHIC_BASE: 0.05,    // Study 2 demographic risk factors
  EXPENDITURE_CRIME: 0.05    // Study 1 spend-crime correlation
} as const;

/**
 * Confidence modifiers based on data availability
 */
export const CONFIDENCE_MODIFIERS = {
  FULL_DATA: 1.0,            // All inputs available
  MISSING_DEMOGRAPHICS: 0.9, // Demographics unavailable
  MISSING_HISTORY: 0.75,     // Limited betting history
  MINIMAL_DATA: 0.6          // Only current session data
} as const;

/**
 * Research integration metadata for API responses
 */
export const RESEARCH_CITATIONS = [
  {
    id: 'study_1',
    shortName: 'Expenditure-Crime (Study 1)',
    fullCitation: 'Wan, W.Y., Wang, J., & Weatherburn, D.J. (2024). Does gambling expenditure have any effect on crime? Addiction, 119, 2197-2204.',
    doi: '10.1111/add.16648'
  },
  {
    id: 'study_2',
    shortName: 'Demographics (Study 2)',
    fullCitation: 'Grönroos, T., Kouvonen, A., Kontto, J., & Salonen, A.H. (2022). Socio-Demographic Factors, Gambling Behaviour, and the Level of Gambling Expenditure: A Population-Based Study. Journal of Gambling Studies, 38, 1093-1109.',
    doi: '10.1007/s10899-021-10075-6'
  },
  {
    id: 'study_3',
    shortName: 'PGSI-SB (Study 3)',
    fullCitation: 'Graupensperger, S., & Calhoun, B. (2024). Validation of a Sports Betting Adaptation to the Problem Gambling Severity Index in Young Adults. Journal of Gambling Issues.',
    doi: null
  }
] as const;

// ============================================================================
// Type Exports
// ============================================================================

export type PgsiSbQuestionId = typeof PGSI_SB_QUESTIONS[number]['id'];
export type PgsiSbSubscale = typeof PGSI_SB_QUESTIONS[number]['subscale'];
export type RiskThresholdLevel = keyof typeof PGSI_SB_THRESHOLDS;
export type InterventionUrgency = typeof INTERVENTION_THRESHOLDS[keyof typeof INTERVENTION_THRESHOLDS]['urgency'];
export type InterventionType = typeof INTERVENTION_THRESHOLDS[keyof typeof INTERVENTION_THRESHOLDS]['type'];

export interface DemographicProfile {
  gender: keyof typeof DEMOGRAPHIC_RISK_FACTORS.gender;
  ageGroup: keyof typeof DEMOGRAPHIC_RISK_FACTORS.ageGroup;
  education?: keyof typeof DEMOGRAPHIC_RISK_FACTORS.education;
  employmentStatus?: keyof typeof DEMOGRAPHIC_RISK_FACTORS.employmentStatus;
  incomeLevel?: keyof typeof DEMOGRAPHIC_RISK_FACTORS.incomeLevel;
}

export interface GamblingBehaviorProfile {
  frequency: keyof typeof GAMBLING_BEHAVIOR_RISK.frequency;
  gameTypesCount?: keyof typeof GAMBLING_BEHAVIOR_RISK.gameTypesCount;
  gamblingMode?: keyof typeof GAMBLING_BEHAVIOR_RISK.gamblingMode;
}

export interface PgsiSbResponse {
  questionId: PgsiSbQuestionId;
  score: 0 | 1 | 2 | 3; // Never, Sometimes, Most of the time, Almost always
}

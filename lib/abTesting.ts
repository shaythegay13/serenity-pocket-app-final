/**
 * A/B Testing Utilities for Survey Variants
 * 
 * This module provides utilities for assigning users to Survey A or Survey B
 * in a consistent, deterministic way for A/B testing.
 */

export type SurveyVariant = 'A' | 'B';

export interface ABTestConfig {
  /** Percentage of users to assign to variant B (0-100) */
  variantBPercentage: number;
  /** Whether A/B testing is enabled */
  enabled: boolean;
}

// Default configuration - can be overridden via environment variables
const DEFAULT_CONFIG: ABTestConfig = {
  variantBPercentage: 50, // 50/50 split by default
  enabled: true,
};

/**
 * Get A/B test configuration from environment or defaults
 */
export function getABTestConfig(): ABTestConfig {
  const variantBPercentage = process.env.NEXT_PUBLIC_SURVEY_B_PERCENTAGE 
    ? parseInt(process.env.NEXT_PUBLIC_SURVEY_B_PERCENTAGE, 10)
    : DEFAULT_CONFIG.variantBPercentage;

  const enabled = process.env.NEXT_PUBLIC_SURVEY_AB_TEST_ENABLED !== 'false';

  return {
    variantBPercentage: Math.min(100, Math.max(0, variantBPercentage)),
    enabled,
  };
}

/**
 * Simple hash function to convert string to number
 * Used for deterministic variant assignment based on email
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Assign a survey variant based on email address (deterministic)
 * Same email will always get the same variant
 * 
 * @param email - User's email address
 * @param config - Optional A/B test configuration
 * @returns 'A' or 'B'
 */
export function assignSurveyVariant(
  email: string,
  config: ABTestConfig = getABTestConfig()
): SurveyVariant {
  // If A/B testing is disabled, always return A
  if (!config.enabled) {
    return 'A';
  }

  // If variant B percentage is 0, always return A
  if (config.variantBPercentage === 0) {
    return 'A';
  }

  // If variant B percentage is 100, always return B
  if (config.variantBPercentage === 100) {
    return 'B';
  }

  // Hash the email to get a deterministic number
  const hash = hashString(email.toLowerCase().trim());
  
  // Convert to percentage (0-99)
  const percentage = hash % 100;
  
  // Assign variant based on percentage
  return percentage < config.variantBPercentage ? 'B' : 'A';
}

/**
 * Assign a survey variant randomly (non-deterministic)
 * Each call will potentially return a different variant
 * 
 * @param config - Optional A/B test configuration
 * @returns 'A' or 'B'
 */
export function assignRandomSurveyVariant(
  config: ABTestConfig = getABTestConfig()
): SurveyVariant {
  // If A/B testing is disabled, always return A
  if (!config.enabled) {
    return 'A';
  }

  const random = Math.random() * 100;
  return random < config.variantBPercentage ? 'B' : 'A';
}

/**
 * Store the assigned variant in session storage
 * This ensures consistency within a single session
 */
export function storeVariantInSession(variant: SurveyVariant): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('surveyVariant', variant);
  }
}

/**
 * Get the variant from session storage
 */
export function getVariantFromSession(): SurveyVariant | null {
  if (typeof window !== 'undefined') {
    const stored = sessionStorage.getItem('surveyVariant');
    if (stored === 'A' || stored === 'B') {
      return stored;
    }
  }
  return null;
}

/**
 * Get or assign a survey variant for a user
 * Checks session storage first, then assigns based on email
 * 
 * @param email - Optional email for deterministic assignment
 * @returns 'A' or 'B'
 */
export function getSurveyVariant(email?: string): SurveyVariant {
  // Check session storage first
  const sessionVariant = getVariantFromSession();
  if (sessionVariant) {
    return sessionVariant;
  }

  // If email provided, use deterministic assignment
  if (email) {
    const variant = assignSurveyVariant(email);
    storeVariantInSession(variant);
    return variant;
  }

  // Otherwise, assign randomly
  const variant = assignRandomSurveyVariant();
  storeVariantInSession(variant);
  return variant;
}

/**
 * Clear the variant from session storage
 * Useful for testing or when user logs out
 */
export function clearVariantFromSession(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('surveyVariant');
  }
}

/**
 * Analytics helper to track which variant was shown
 */
export function trackSurveyVariantAssignment(
  email: string,
  variant: SurveyVariant
): void {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[A/B Test] User ${email} assigned to Survey ${variant}`);
  }

  // You can add analytics tracking here (e.g., Google Analytics, Mixpanel, etc.)
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'survey_variant_assigned', {
      variant,
      email_hash: hashString(email).toString(),
    });
  }
}

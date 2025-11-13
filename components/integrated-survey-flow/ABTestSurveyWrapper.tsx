'use client';

import { useState, useEffect } from 'react';
import { IntegratedSurveyWrapper } from './IntegratedSurveyWrapper';
import { IntegratedSurveyWrapperB } from './IntegratedSurveyWrapperB';
import { getSurveyVariant, trackSurveyVariantAssignment, type SurveyVariant } from '@/lib/abTesting';

interface ABTestSurveyWrapperProps {
  onComplete?: (score: number, level: string, email: string, variant: SurveyVariant) => void;
  onSwitchToLogin: () => void;
  /** Optional: Force a specific variant (useful for testing) */
  forceVariant?: SurveyVariant;
}

/**
 * A/B Testing wrapper that automatically assigns users to Survey A or Survey B
 * 
 * Features:
 * - Deterministic assignment based on email (same email always gets same variant)
 * - Session persistence (variant stays consistent during session)
 * - Configurable via environment variables
 * - Analytics tracking
 */
export function ABTestSurveyWrapper({ 
  onComplete, 
  onSwitchToLogin,
  forceVariant 
}: ABTestSurveyWrapperProps) {
  const [variant, setVariant] = useState<SurveyVariant | null>(forceVariant || null);
  const [email, setEmail] = useState<string>('');

  // Initialize variant on mount (random assignment initially)
  useEffect(() => {
    if (!forceVariant && !variant) {
      const initialVariant = getSurveyVariant();
      setVariant(initialVariant);
    }
  }, [forceVariant, variant]);

  // Update variant when email is captured (deterministic assignment)
  const handleEmailCapture = (capturedEmail: string) => {
    setEmail(capturedEmail);
    
    if (!forceVariant) {
      const emailBasedVariant = getSurveyVariant(capturedEmail);
      setVariant(emailBasedVariant);
      trackSurveyVariantAssignment(capturedEmail, emailBasedVariant);
    }
  };

  // Wrap the onComplete callback to include variant information
  const handleComplete = (score: number, level: string, completedEmail: string) => {
    if (onComplete && variant) {
      onComplete(score, level, completedEmail, variant);
    }
  };

  // Show loading state while variant is being determined
  if (!variant) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  // Render the appropriate survey variant
  if (variant === 'B') {
    return (
      <IntegratedSurveyWrapperB
        onComplete={handleComplete}
        onSwitchToLogin={onSwitchToLogin}
        onEmailCapture={handleEmailCapture}
      />
    );
  }

  return (
    <IntegratedSurveyWrapper
      onComplete={handleComplete}
      onSwitchToLogin={onSwitchToLogin}
      onEmailCapture={handleEmailCapture}
    />
  );
}

/**
 * Hook to get the current survey variant
 * Useful for components that need to know which variant is active
 */
export function useSurveyVariant(email?: string): SurveyVariant {
  const [variant, setVariant] = useState<SurveyVariant>('A');

  useEffect(() => {
    const currentVariant = getSurveyVariant(email);
    setVariant(currentVariant);
  }, [email]);

  return variant;
}

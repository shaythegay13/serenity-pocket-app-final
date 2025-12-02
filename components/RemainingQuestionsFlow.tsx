'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SurveyAnswer, SURVEY_QUESTIONS } from '@/types/survey';
import SurveyForm from '@/components/SurveyForm';
import { Card } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';

// Get the remaining questions (c5-c12) - everything except the first 4 snapshot questions
const REMAINING_QUESTIONS = SURVEY_QUESTIONS.slice(4);

export function RemainingQuestionsFlow() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (responses: SurveyAnswer[]) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Get the snapshot responses from sessionStorage
      const snapshotResponsesRaw = sessionStorage.getItem('snapshotResponses');
      if (!snapshotResponsesRaw) {
        throw new Error('Snapshot responses not found. Please retake the survey.');
      }

      const snapshotResponses: SurveyAnswer[] = JSON.parse(snapshotResponsesRaw);

      // Combine snapshot responses with the remaining questions responses
      const allResponses = [...snapshotResponses, ...responses];

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const email = user?.email;

      if (!email) {
        throw new Error('Unable to determine user email. Please sign in again and retry the survey.');
      }

      // Submit the complete survey
      const response = await fetch('/api/gambling-survey/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          responses: allResponses,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit survey');
      }

      const data = await response.json();
      console.log('Complete survey submitted:', data);

      // Clear snapshot data from sessionStorage
      sessionStorage.removeItem('snapshotResponses');
      sessionStorage.removeItem('snapshotResult');
      sessionStorage.removeItem('snapshotArchetypeId');

      // Redirect to main app where OnboardingGate will handle biography and emotion tracking
      router.push('/');
    } catch (err) {
      console.error('Survey submission error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-8 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Complete Your Profile
              </h1>
              <p className="text-gray-700">
                Answer these final questions to unlock your full personalized assessment
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                {error}
              </div>
            )}

            <SurveyForm
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              questions={REMAINING_QUESTIONS}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SurveyForm from '@/components/SurveyForm';
import { SurveyAnswer, SURVEY_QUESTIONS } from '@/types/survey';
import { getScoreInterpretation } from '@/types/survey';
import { computeArchetype, ArchetypeDef } from '@/lib/archetypes';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function AuthenticatedSurveyRetake() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [surveyComplete, setSurveyComplete] = useState(false);
  const [surveyResult, setSurveyResult] = useState<{ score: number; level: string } | null>(null);
  const [archetype, setArchetype] = useState<ArchetypeDef | null>(null);

  const handleSurveySubmit = async (responses: SurveyAnswer[]) => {
    setIsSubmitting(true);

    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session found. Please log in again.');
      }

      const response = await fetch('/api/gambling-survey/retake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          responses,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit survey');
      }

      const level = getScoreInterpretation(data.score);
      const at = computeArchetype(responses);

      setSurveyResult({ score: data.score, level });
      setArchetype(at);

      // Clear local cache to ensure fresh data is loaded
      if (typeof window !== 'undefined') {
        localStorage.removeItem('serenity_user_data');
      }

      setSurveyComplete(true);
    } catch (error) {
      console.error('Survey submission error:', error);
      alert('An error occurred while submitting your survey. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturnHome = () => {
    // Force a full page reload to refresh userData with new survey results
    window.location.href = '/';
  };

  if (surveyComplete && surveyResult) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-blue-50 to-green-50">
        <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center">
          <button
            type="button"
            aria-label="Close survey"
            className="absolute left-3 top-3 inline-flex items-center justify-center h-8 w-8 rounded-full border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            onClick={() => window.location.href = '/'}
          >
            <X className="h-4 w-4" />
          </button>
          <div className="mb-6">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Survey Complete!</h2>
            <p className="text-gray-700">Your new results are ready</p>
          </div>

          <div className="bg-linear-to-r from-blue-50 to-green-50 rounded-lg p-6 mb-6">
            <div className="text-sm text-gray-600 mb-2">Your Score</div>
            <div className="text-5xl font-bold text-gray-900 mb-2">{surveyResult.score}</div>
            <div className="text-lg font-semibold text-gray-700">{surveyResult.level}</div>
          </div>

          {archetype && (
            <div className="text-left border rounded-lg p-5 mb-6">
              <div className="text-sm text-gray-600 mb-1">Your Archetype</div>
              <div className="text-xl font-semibold text-gray-900">{archetype.name}</div>
              <p className="text-sm text-gray-700 mt-2">{archetype.description}</p>
              <div className="mt-4 grid grid-cols-1 gap-3">
                <div className="bg-green-50 rounded-md p-3">
                  <div className="text-xs font-semibold text-green-700">Positive</div>
                  <div className="text-sm text-green-800">{archetype.positive}</div>
                </div>
                <div className="bg-rose-50 rounded-md p-3">
                  <div className="text-xs font-semibold text-rose-700">Negative</div>
                  <div className="text-sm text-rose-800">{archetype.negative}</div>
                </div>
              </div>
            </div>
          )}

          <p className="text-sm text-gray-600 mb-6">
            Your progress is being tracked. Check your survey history to see how you're improving over time!
          </p>

          <Button
            onClick={handleReturnHome}
            className="w-full px-8 py-4 text-lg bg-linear-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
          >
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-blue-50 to-green-50">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-8">
        <button
          type="button"
          aria-label="Close survey"
          className="absolute left-3 top-3 inline-flex items-center justify-center h-8 w-8 rounded-full border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          onClick={() => window.location.href = '/'}
        >
          <X className="h-4 w-4" />
        </button>
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Retake Serenity Survey</h2>
          <p className="text-sm text-gray-700">Complete all 12 questions to update your results</p>
        </div>
        <SurveyForm
          onSubmit={handleSurveySubmit}
          isSubmitting={isSubmitting}
          questions={SURVEY_QUESTIONS}
        />
      </div>
    </div>
  );
}

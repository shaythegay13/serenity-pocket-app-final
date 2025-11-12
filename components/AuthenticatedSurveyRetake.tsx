'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SurveyForm from '@/components/SurveyForm';
import { SurveyAnswer } from '@/types/survey';
import { getScoreInterpretation } from '@/types/survey';
import { Button } from '@/components/ui/button';

export function AuthenticatedSurveyRetake() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [surveyComplete, setSurveyComplete] = useState(false);
  const [surveyResult, setSurveyResult] = useState<{ score: number; level: string } | null>(null);

  const handleSurveySubmit = async (responses: SurveyAnswer[]) => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/gambling-survey/retake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      
      setSurveyResult({
        score: data.score,
        level: level,
      });
      
      setSurveyComplete(true);
    } catch (error) {
      console.error('Survey submission error:', error);
      alert('An error occurred while submitting your survey. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturnHome = () => {
    router.push('/');
  };

  if (surveyComplete && surveyResult) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-green-50">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="mb-6">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Survey Complete!</h2>
            <p className="text-gray-700">Your new results are ready</p>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 mb-6">
            <div className="text-sm text-gray-600 mb-2">Your Score</div>
            <div className="text-5xl font-bold text-gray-900 mb-2">{surveyResult.score}</div>
            <div className="text-lg font-semibold text-gray-700">{surveyResult.level}</div>
          </div>

          <p className="text-sm text-gray-600 mb-6">
            Your progress is being tracked. Check your survey history to see how you're improving over time!
          </p>

          <Button
            onClick={handleReturnHome}
            className="w-full px-8 py-4 text-lg bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
          >
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-green-50">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-8">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Retake Assessment</h2>
          <p className="text-sm text-gray-700">
            Track your progress by answering these questions honestly
          </p>
        </div>
        
        <SurveyForm 
          onSubmit={handleSurveySubmit} 
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}

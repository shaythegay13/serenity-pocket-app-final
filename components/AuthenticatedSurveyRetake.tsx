'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SurveyForm from '@/components/SurveyForm';
import { SurveyAnswer, SURVEY_QUESTIONS, SURVEY_C_SNAPSHOT_QUESTIONS } from '@/types/survey';
import { getScoreInterpretation } from '@/types/survey';
import { computeArchetypeFromSnapshot, ArchetypeDef } from '@/lib/archetypes';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export function AuthenticatedSurveyRetake() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [surveyComplete, setSurveyComplete] = useState(false);
  const [surveyResult, setSurveyResult] = useState<{ score: number; level: string } | null>(null);
  const [archetype, setArchetype] = useState<ArchetypeDef | null>(null);
  const [step, setStep] = useState<'SNAPSHOT' | 'REST' | 'COMPLETE'>('SNAPSHOT');
  const [snapshotAnswers, setSnapshotAnswers] = useState<SurveyAnswer[] | null>(null);

  useEffect(() => {
    // If snapshot answers exist from pre-signup, load them and skip straight to the 8-question step
    try {
      const raw = sessionStorage.getItem('snapshotResponses');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSnapshotAnswers(parsed);
          setStep('REST');
        }
      }
    } catch {}
  }, []);

  const handleSnapshotSubmit = async (responses: SurveyAnswer[]) => {
    // Save snapshot answers locally then move to betting questions
    setSnapshotAnswers(responses);
    setStep('REST');
  };

  const handleSurveySubmit = async (responses: SurveyAnswer[]) => {
    setIsSubmitting(true);

    try {
      if (!snapshotAnswers || snapshotAnswers.length === 0) {
        alert('Please answer the quick snapshot first.');
        setStep('SNAPSHOT');
        return;
      }

      // Merge 4 snapshot + 8 betting responses into full 12 for scoring/persistence
      const mergedResponses: SurveyAnswer[] = [...snapshotAnswers, ...responses];

      const response = await fetch('/api/gambling-survey/retake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          responses: mergedResponses,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit survey');
      }

      const level = getScoreInterpretation(data.score);
      const at = computeArchetypeFromSnapshot(snapshotAnswers);

      setSurveyResult({ score: data.score, level });
      setArchetype(at);
      
      setSurveyComplete(true);
      setStep('COMPLETE');
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
        <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center">
          <button
            type="button"
            aria-label="Close survey"
            className="absolute left-3 top-3 inline-flex items-center justify-center h-8 w-8 rounded-full border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            onClick={() => router.push('/')}
          >
            <X className="h-4 w-4" />
          </button>
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
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-8">
        <button
          type="button"
          aria-label="Close survey"
          className="absolute left-3 top-3 inline-flex items-center justify-center h-8 w-8 rounded-full border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          onClick={() => router.push('/')}
        >
          <X className="h-4 w-4" />
        </button>
        {step === 'SNAPSHOT' && (
          <>
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Quick Psychological Snapshot</h2>
              <p className="text-sm text-gray-700">4 questions • &lt; 20 seconds</p>
            </div>
            <SurveyForm onSubmit={handleSnapshotSubmit} isSubmitting={isSubmitting} questions={SURVEY_C_SNAPSHOT_QUESTIONS} />
          </>
        )}

        {step === 'REST' && (
          <>
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Full Profile</h2>
              <p className="text-sm text-gray-700">8 quick questions about your betting style</p>
            </div>
            <SurveyForm 
              onSubmit={handleSurveySubmit} 
              isSubmitting={isSubmitting}
              questions={SURVEY_QUESTIONS.filter(q => q.id.startsWith('c') && parseInt(q.id.slice(1), 10) >= 5)}
            />
          </>
        )}
      </div>
    </div>
  );
}

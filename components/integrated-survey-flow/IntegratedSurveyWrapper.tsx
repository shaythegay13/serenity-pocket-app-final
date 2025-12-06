'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, X } from 'lucide-react';
import SurveyForm from '@/components/SurveyForm';
import { SurveyAnswer } from '@/types/survey';
import { SURVEY_C_SNAPSHOT_QUESTIONS } from '@/types/survey';
import { computeArchetypeFromSnapshot, ArchetypeDef } from '@/lib/archetypes';

export enum SurveyFlow {
  WELCOME = 'welcome',
  SNAPSHOT = 'snapshot',
  TEASER = 'teaser',
  EMAIL_CAPTURE = 'email_capture',
  QUESTIONS = 'questions',
  COMPLETE = 'complete'
}

interface IntegratedSurveyWrapperProps {
  onComplete?: (score: number, level: string, email: string) => void;
  onSwitchToLogin: () => void;
  onEmailCapture?: (email: string) => void;
  onClose?: () => void;
}

export function IntegratedSurveyWrapper({ onComplete, onSwitchToLogin, onEmailCapture, onClose }: IntegratedSurveyWrapperProps) {
  const router = useRouter();
  const [currentFlow, setCurrentFlow] = useState<SurveyFlow>(SurveyFlow.WELCOME);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [surveyResult, setSurveyResult] = useState<{ surveyId: string; score: number } | null>(null);
  const [hasPrevious, setHasPrevious] = useState<{ email: string; surveyId: string; score: number } | null>(null)
  const [snapshotResult, setSnapshotResult] = useState<{ tag: string; blurb: string } | null>(null)
  const [snapshotArchetype, setSnapshotArchetype] = useState<ArchetypeDef | null>(null)

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Detect existing pending survey data for returning visitors
  // Allows users to skip retake and create an account with previous results
  // or retake Survey C again
  // Loaded only on mount
  useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const pending = sessionStorage.getItem('pendingSurveyData')
        if (pending) {
          const parsed = JSON.parse(pending)
          if (parsed?.email && parsed?.surveyId) {
            setHasPrevious({ email: parsed.email, surveyId: parsed.surveyId, score: parsed.score })
          }
        }
      } catch {}
    }
    return undefined
  })

  const handleStartSurvey = () => {
    setCurrentFlow(SurveyFlow.SNAPSHOT);
  };

  const computeSnapshotTag = (responses: SurveyAnswer[]): { tag: string; blurb: string } => {
    // Simple heuristic on c1-c4 total (0-12)
    const score = responses.reduce((acc, r) => {
      const q = SURVEY_C_SNAPSHOT_QUESTIONS.find((x) => x.id === r.questionId);
      if (!q) return acc;
      const idx = q.options.indexOf(r.selectedOption);
      return acc + (idx >= 0 ? q.weight[idx] : 0);
    }, 0);
    if (score <= 2) return { tag: 'Methodical Analyst', blurb: 'Disciplined, research-first, steady pacing.' };
    if (score <= 6) return { tag: 'Momentum Player', blurb: 'Confidence-driven, rides streaks—watch for tilt.' };
    return { tag: 'Action Seeker', blurb: 'Excitement-oriented, set clear limits and cool-downs.' };
  };

  const handleSnapshotSubmit = async (responses: SurveyAnswer[]) => {
    const tag = computeSnapshotTag(responses);
    setSnapshotResult(tag);
    // Compute archetype from snapshot only and persist snapshot answers
    try {
      const at = computeArchetypeFromSnapshot(responses);
      setSnapshotArchetype(at);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('snapshotResponses', JSON.stringify(responses));
        sessionStorage.setItem('snapshotArchetypeId', at.id);
      }
    } catch {}
    setCurrentFlow(SurveyFlow.TEASER);
  };

  const handleUnlockClick = () => {
    if (typeof window !== 'undefined' && snapshotResult) {
      try {
        sessionStorage.setItem('snapshotResult', JSON.stringify(snapshotResult));
      } catch {}
    }
    setCurrentFlow(SurveyFlow.EMAIL_CAPTURE);
  };

  const handleEmailSubmit = async () => {
    setEmailError(null);

    if (!email) {
      setEmailError('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    // Check if user already has an account
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/check-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.accountExists) {
        setEmailError('You already have an account with this email.');
        setIsSubmitting(false);
        return;
      }
    } catch (error) {
      console.error('Error checking account:', error);
      // If check fails, continue anyway (fail open)
    } finally {
      setIsSubmitting(false);
    }

    if (onEmailCapture) {
      onEmailCapture(email);
    }

    // Navigate to account creation to unlock full breakdown
    router.push(`/gambling-survey/create-account?email=${encodeURIComponent(email)}`);
  };

  const handleSurveySubmit = async (responses: SurveyAnswer[]) => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/gambling-survey/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          responses,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setEmailError('A survey has already been submitted with this email address.');
          setCurrentFlow(SurveyFlow.EMAIL_CAPTURE);
        } else {
          throw new Error(data.error || 'Failed to submit survey');
        }
        return;
      }

      setSurveyResult({
        surveyId: data.surveyId,
        score: data.score,
      });

      setCurrentFlow(SurveyFlow.COMPLETE);

      // Persist pending survey data so returning visitors can skip retake later
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('pendingSurveyData', JSON.stringify({
            email,
            surveyId: data.surveyId,
            score: data.score,
          }))
          setHasPrevious({ email, surveyId: data.surveyId, score: data.score })
        } catch {}
      }

      // Don't call onComplete here - let the user see the completion screen first
      // onComplete will be called when they click "Create Account"
    } catch (error) {
      console.error('Survey submission error:', error);
      setEmailError('An error occurred while submitting your survey. Please try again.');
      setCurrentFlow(SurveyFlow.EMAIL_CAPTURE);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUsePrevious = () => {
    const prev = hasPrevious
    if (!prev) return
    router.push(`/gambling-survey/create-account?email=${encodeURIComponent(prev.email)}&surveyId=${prev.surveyId}&score=${prev.score}`)
  }

  const handleCreateAccount = () => {
    if (surveyResult) {
      // Store survey data in session storage for account creation
      sessionStorage.setItem('pendingSurveyData', JSON.stringify({
        email,
        surveyId: surveyResult.surveyId,
        score: surveyResult.score,
      }));
      
      // Navigate to account creation
      router.push(`/gambling-survey/create-account?email=${encodeURIComponent(email)}&surveyId=${surveyResult.surveyId}&score=${surveyResult.score}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-950 rounded-2xl shadow-2xl overflow-hidden animate-slideUp">
        {/* Close button */}
        <button
          type="button"
          aria-label="Close survey"
          className="absolute left-3 top-3 inline-flex items-center justify-center h-8 w-8 rounded-full border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          onClick={() => {
            if (onClose) onClose(); else router.push('/');
          }}
        >
          <X className="h-4 w-4" />
        </button>
        
        {/* Welcome Screen */}
        {currentFlow === SurveyFlow.WELCOME && (
          <div className="flex flex-col items-center justify-center space-y-5 p-8 bg-white">
            <div className="flex flex-col items-center space-y-3">
              <div className="flex items-center space-x-3">
                <Image 
                  src="/logo.png" 
                  alt="Serenity Pocket Logo" 
                  width={56} 
                  height={56} 
                  className="object-contain"
                />
                <span className="text-lg font-semibold text-gray-800">Serenity Survey</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 text-center max-w-2xl">
                Make Smarter, Safer Betting Decisions
              </h1>
            </div>

            <p className="text-base text-gray-700 max-w-lg text-center">
              Understand the real impact of your habits. Take our quick, confidential quiz to support your emotional health.
            </p>

            <div className="bg-linear-to-r from-blue-50 to-green-50 rounded-lg p-4 max-w-lg">
              <ul className="text-left space-y-1.5 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Research-backed questions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Get instant personalized results</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Track your progress over time</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>100% confidential and secure</span>
                </li>
              </ul>
            </div>

            <Button 
              onClick={handleStartSurvey}
              className="w-full md:w-auto px-8 py-3 text-base bg-linear-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
            >
              Start 20s Snapshot
            </Button>

            {hasPrevious && (
              <div className="w-full max-w-lg space-y-2">
                <div className="text-xs text-gray-600 text-center">We found your previous survey. Use it or retake.</div>
                <div className="flex flex-col md:flex-row gap-2">
                  <Button className="flex-1" variant="outline" onClick={handleUsePrevious}>
                    Use Previous Results
                  </Button>
                  <Button className="flex-1" variant="secondary" onClick={handleStartSurvey}>
                    Retake Survey
                  </Button>
                </div>
              </div>
            )}

            <div className="max-w-2xl text-center space-y-2 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-600">
                <span className="font-semibold text-gray-800">Serenity Pocket</span> helps you develop healthier sports betting habits through emotional awareness and progress tracking. Your personalized score tracks improvements as you engage with our daily tools. Subscribers unlock even more features.
              </p>
            </div>
            
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-blue-500 hover:underline text-sm"
            >
              I already have an account. Take me to login page.
            </button>
          </div>
        )}

        {/* 4-question Snapshot */}
        {currentFlow === SurveyFlow.SNAPSHOT && (
          <div className="p-8 bg-white">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Quick Psychological Snapshot</h2>
              <p className="text-sm text-gray-700">4 questions • &lt; 20 seconds • Instant tag</p>
            </div>
            <SurveyForm
              onSubmit={handleSnapshotSubmit}
              isSubmitting={false}
              questions={SURVEY_C_SNAPSHOT_QUESTIONS}
            />
          </div>
        )}

        {/* Instant Results Teaser */}
        {currentFlow === SurveyFlow.TEASER && (snapshotResult || snapshotArchetype) && (
          <div className="p-8 text-center bg-white">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-900">You’re a “{snapshotArchetype?.name || snapshotResult?.tag}”.</h2>
              <div className="mt-3 text-gray-700">See your full breakdown →</div>
            </div>
            <div className="relative mx-auto max-w-lg p-6 rounded-lg bg-linear-to-r from-blue-50 to-green-50">
              <div className="filter blur-sm select-none">
                <p className="text-gray-800 font-medium">What this means</p>
                <p className="text-gray-700 mt-1">{snapshotArchetype?.description || snapshotResult?.blurb} Personalized insights, risk patterns, and recommended guardrails are ready.</p>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-semibold bg-white/80 rounded-md px-3 py-1 shadow">Create account to unlock</span>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 max-w-md mx-auto">
              <Button onClick={handleUnlockClick} className="w-full bg-linear-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600">Unlock Full Breakdown</Button>
              <button type="button" onClick={() => setCurrentFlow(SurveyFlow.SNAPSHOT)} className="text-blue-500 hover:underline text-sm">Retake snapshot</button>
            </div>
          </div>
        )}

        {/* Soft Gate: Email Capture */}
        {currentFlow === SurveyFlow.EMAIL_CAPTURE && (
          <div className="p-8 bg-white">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Account</h2>
              <p className="text-gray-700">Unlock your full breakdown and continue your profile</p>
            </div>

            <div className="space-y-4 max-w-md mx-auto">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-800">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleEmailSubmit();
                    }
                  }}
                  className="border-gray-300 focus:border-blue-500"
                />
                {emailError && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>{emailError}</span>
                    </div>
                    {emailError.includes('already have an account') && (
                      <button
                        type="button"
                        onClick={onSwitchToLogin}
                        className="text-blue-500 hover:underline text-sm"
                      >
                        Return to login screen
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setCurrentFlow(SurveyFlow.WELCOME)}
                  disabled={isSubmitting}
                  className="flex-1 text-gray-700 border-gray-300 hover:bg-gray-50"
                >
                  Back
                </Button>
                <Button
                  onClick={handleEmailSubmit}
                  disabled={isSubmitting}
                  className="flex-1 bg-linear-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
                >
                  {isSubmitting ? 'Checking...' : 'Continue to Survey'}
                </Button>
              </div>

              <p className="text-xs text-gray-600 text-center">
                Your email will only be used to save your results. 
                You can create an account after completing the assessment.
              </p>
            </div>
          </div>
        )}

        {/* Survey Questions (legacy path) */}
        {currentFlow === SurveyFlow.QUESTIONS && (
          <div className="p-8 bg-white">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Assessment Questions</h2>
              <p className="text-sm text-gray-700">
                Answer honestly - your responses are completely confidential
              </p>
            </div>
            
            <SurveyForm 
              onSubmit={handleSurveySubmit} 
              isSubmitting={isSubmitting}
            />
            
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setCurrentFlow(SurveyFlow.EMAIL_CAPTURE)}
                disabled={isSubmitting}
                className="text-blue-500 hover:underline text-sm"
              >
                Back to Email
              </button>
            </div>
          </div>
        )}

        {/* Completion Screen */}
        {currentFlow === SurveyFlow.COMPLETE && surveyResult && (
          <div className="p-8 text-center bg-white">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Assessment Complete!</h2>
              <div className="p-6 bg-linear-to-r from-blue-50 to-green-50 rounded-lg">
                <div className="text-6xl mb-4">🎉</div>
                <div className="text-xl text-gray-900 font-semibold mb-2">
                  Your results are ready!
                </div>
                <div className="text-base text-gray-700">
                  Create an account to unlock your personalized assessment results
                </div>
              </div>
            </div>

            <div className="space-y-4 max-w-md mx-auto">
              <p className="text-gray-700 font-medium">
                Create a free account to:
              </p>
              <ul className="text-left text-gray-700 space-y-2 mb-6">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>View your detailed assessment results</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Get personalized insights and recommendations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Track your progress over time</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Access tools to develop healthier habits</span>
                </li>
              </ul>

              <Button
                onClick={handleCreateAccount}
                className="w-full px-8 py-4 text-lg bg-linear-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
              >
                Create Account to See Results
              </Button>

              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-blue-500 hover:underline text-base w-full"
              >
                Already have an account? Sign In
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

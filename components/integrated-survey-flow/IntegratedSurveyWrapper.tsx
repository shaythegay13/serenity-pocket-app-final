'use client';

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Brain, CheckCircle2, ArrowRight, Sparkles, Mail, Lock, User } from 'lucide-react'
import Image from 'next/image'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#020617] border border-white/5 rounded-[32px] shadow-2xl overflow-hidden animate-slideUp text-white">
        {/* Close button */}
        <button
          type="button"
          aria-label="Close survey"
          className="absolute left-6 top-6 inline-flex items-center justify-center h-10 w-10 rounded-full border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors z-10"
          onClick={() => {
            if (onClose) onClose(); else router.push('/');
          }}
        >
          <X className="h-5 w-5" />
        </button>
        
        {/* Welcome Screen */}
        {currentFlow === SurveyFlow.WELCOME && (
          <div className="flex flex-col items-center justify-center space-y-8 p-10 bg-[#020617]">
            <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center space-x-3">
                <Image
                  src="/logo.png"
                  alt="Serenity Pocket"
                  width={108}
                  height={108}
                  className="h-27 w-27"
                />
                <span className="text-2xl font-bold tracking-tight">Serenity Pocket</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white text-center max-w-2xl tracking-tight leading-tight">
                Make Smarter, <br />Safer Betting Decisions
              </h1>
            </div>

            <p className="text-lg text-gray-400 max-w-lg text-center leading-relaxed">
              Understand the real impact of your habits. Take our quick, confidential quiz to support your emotional health.
            </p>

            <div className="w-full bg-[#0f172a]/50 border border-white/5 rounded-2xl p-6 max-w-lg">
              <ul className="text-left space-y-3 text-base text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-[#10b981] font-bold">✓</span>
                  <span>Research-backed questions</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#10b981] font-bold">✓</span>
                  <span>Get instant personalized results</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#10b981] font-bold">✓</span>
                  <span>Track your progress over time</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#10b981] font-bold">✓</span>
                  <span>100% confidential and secure</span>
                </li>
              </ul>
            </div>

            <Button 
              onClick={handleStartSurvey}
              className="w-full md:w-auto px-10 py-4 h-14 text-lg font-bold rounded-xl bg-linear-to-r from-[#3b82f6] to-[#a855f7] hover:opacity-90 transition-opacity"
            >
              Start 20s Snapshot
            </Button>

            {hasPrevious && (
              <div className="w-full max-w-lg space-y-3">
                <div className="text-xs text-gray-500 text-center uppercase tracking-widest font-semibold">Previous Survey Found</div>
                <div className="flex flex-col md:flex-row gap-3">
                  <Button className="flex-1 h-12 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 transition-colors" variant="outline" onClick={handleUsePrevious}>
                    Use Previous
                  </Button>
                  <Button className="flex-1 h-12 rounded-xl bg-white/5 hover:bg-white/10 transition-colors" variant="secondary" onClick={handleStartSurvey}>
                    Retake
                  </Button>
                </div>
              </div>
            )}

            <div className="max-w-2xl text-center space-y-4 pt-6 border-t border-white/5">
              <p className="text-xs text-gray-500 leading-relaxed">
                <span className="font-semibold text-gray-300">Serenity Pocket</span> helps you develop healthier sports betting habits through emotional awareness and progress tracking. Your personalized score tracks improvements as you engage with our daily tools.
              </p>
            </div>
            
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-[#3b82f6] hover:text-[#60a5fa] font-semibold text-sm transition-colors"
            >
              Already have an account? Sign In
            </button>
          </div>
        )}

        {/* 4-question Snapshot */}
        {currentFlow === SurveyFlow.SNAPSHOT && (
          <div className="p-10 bg-[#020617]">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-extrabold text-white mb-3 tracking-tight">Quick Snapshot</h2>
              <p className="text-gray-400 font-medium italic">4 questions • &lt; 20 seconds • Instant tag</p>
            </div>
            <div className="survey-dark-theme">
              <SurveyForm
                onSubmit={handleSnapshotSubmit}
                isSubmitting={false}
                questions={SURVEY_C_SNAPSHOT_QUESTIONS}
              />
            </div>
          </div>
        )}

        {/* Instant Results Teaser */}
        {currentFlow === SurveyFlow.TEASER && (snapshotResult || snapshotArchetype) && (
          <div className="p-10 text-center bg-[#020617]">
            <div className="mb-8">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
                You’re a <br />
                <span className="gradient-data">“{snapshotArchetype?.name || snapshotResult?.tag}”</span>
              </h2>
              <div className="mt-4 text-gray-400 text-lg">Your full breakdown is ready →</div>
            </div>
            
            <div className="relative mx-auto max-w-lg p-8 rounded-3xl bg-[#0f172a]/50 border border-white/5 overflow-hidden">
              <div className="filter blur-md select-none opacity-50">
                <p className="text-white font-bold text-xl mb-2">What this means</p>
                <p className="text-gray-300 leading-relaxed">
                  {snapshotArchetype?.description || snapshotResult?.blurb} 
                  Personalized insights, risk patterns, and recommended guardrails are generated specifically for your style.
                </p>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white text-[#020617] font-bold rounded-xl px-6 py-3 shadow-2xl transform -rotate-2">
                  Create account to unlock
                </div>
              </div>
            </div>

            <div className="mt-10 flex flex-col gap-4 max-w-md mx-auto">
              <Button 
                onClick={handleUnlockClick} 
                className="w-full h-14 text-lg font-bold rounded-xl bg-linear-to-r from-[#3b82f6] to-[#a855f7] hover:opacity-90 transition-opacity"
              >
                Unlock Full Breakdown
              </Button>
              <button 
                type="button" 
                onClick={() => setCurrentFlow(SurveyFlow.SNAPSHOT)} 
                className="text-gray-400 hover:text-white text-sm font-medium transition-colors underline underline-offset-4"
              >
                Retake snapshot
              </button>
            </div>
          </div>
        )}

        {/* Soft Gate: Email Capture */}
        {currentFlow === SurveyFlow.EMAIL_CAPTURE && (
          <div className="p-10 bg-[#020617]">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-extrabold text-white mb-3 tracking-tight">Save Your Results</h2>
              <p className="text-gray-400 text-lg">Enter your email to unlock your full archetype profile</p>
            </div>

            <div className="space-y-6 max-w-md mx-auto">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300 font-semibold ml-1 text-sm">Email Address</Label>
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
                  className="h-14 bg-white/5 border-white/10 rounded-xl focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] text-white placeholder:text-gray-600 transition-all"
                />
                {emailError && (
                  <div className="space-y-3 mt-2">
                    <div className="flex items-center gap-2 text-sm text-[#f87171] bg-[#7f1d1d]/20 p-3 rounded-lg border border-[#ef4444]/20">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{emailError}</span>
                    </div>
                    {emailError.includes('already have an account') && (
                      <button
                        type="button"
                        onClick={onSwitchToLogin}
                        className="text-[#3b82f6] hover:text-[#60a5fa] font-bold text-sm transition-colors w-full text-center"
                      >
                        Return to login screen
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentFlow(SurveyFlow.WELCOME)}
                  disabled={isSubmitting}
                  className="flex-1 h-14 rounded-xl text-gray-400 border-white/10 hover:bg-white/5 hover:text-white transition-all font-bold"
                >
                  Back
                </Button>
                <Button
                  onClick={handleEmailSubmit}
                  disabled={isSubmitting}
                  className="flex-1 h-14 rounded-xl bg-linear-to-r from-[#3b82f6] to-[#a855f7] hover:opacity-90 transition-opacity font-bold text-lg"
                >
                  {isSubmitting ? 'Checking...' : 'Continue'}
                </Button>
              </div>

              <p className="text-xs text-gray-500 text-center leading-relaxed">
                We'll only use your email to save your progress and send your results. 
                Private, secure, and encrypted.
              </p>
            </div>
          </div>
        )}


        {/* Survey Questions (legacy path) */}
        {currentFlow === SurveyFlow.QUESTIONS && (
          <div className="p-10 bg-[#020617]">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-extrabold text-white mb-3 tracking-tight">Assessment Questions</h2>
              <p className="text-gray-400 font-medium italic">
                Answer honestly • responses are completely confidential
              </p>
            </div>
            
            <div className="survey-dark-theme">
              <SurveyForm 
                onSubmit={handleSurveySubmit} 
                isSubmitting={isSubmitting}
              />
            </div>
            
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => setCurrentFlow(SurveyFlow.EMAIL_CAPTURE)}
                disabled={isSubmitting}
                className="text-gray-400 hover:text-white text-sm font-medium transition-colors underline underline-offset-4"
              >
                Back to Email
              </button>
            </div>
          </div>
        )}

        {/* Completion Screen */}
        {currentFlow === SurveyFlow.COMPLETE && surveyResult && (
          <div className="p-10 text-center bg-[#020617]">
            <div className="mb-10">
              <h2 className="text-4xl font-extrabold text-white mb-6 tracking-tight">Assessment Complete!</h2>
              <div className="p-8 bg-[#0f172a]/50 border border-white/5 rounded-[32px]">
                <div className="text-7xl mb-6">🎉</div>
                <div className="text-2xl text-white font-bold mb-3">
                  Your results are ready!
                </div>
                <div className="text-lg text-gray-400 leading-relaxed">
                  Create an account to unlock your personalized assessment results
                </div>
              </div>
            </div>

            <div className="space-y-6 max-w-md mx-auto">
              <p className="text-gray-300 font-bold uppercase tracking-widest text-xs">
                Account Benefits:
              </p>
              <ul className="text-left text-gray-400 space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <span className="text-[#10b981] font-bold">✓</span>
                  <span>View your detailed assessment results</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#10b981] font-bold">✓</span>
                  <span>Get personalized insights and recommendations</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#10b981] font-bold">✓</span>
                  <span>Track your progress over time</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#10b981] font-bold">✓</span>
                  <span>Access tools to develop healthier habits</span>
                </li>
              </ul>

              <Button
                onClick={handleCreateAccount}
                className="w-full h-16 text-xl font-bold rounded-2xl bg-linear-to-r from-[#3b82f6] to-[#a855f7] hover:opacity-90 transition-opacity shadow-xl shadow-blue-500/20"
              >
                Create Account to See Results
              </Button>

              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-gray-400 hover:text-white font-bold text-sm transition-colors w-full text-center"
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

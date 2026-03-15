'use client';

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Brain, X } from 'lucide-react'
import Image from 'next/image'
import SurveyForm from '@/components/SurveyForm';
import { SurveyAnswer } from '@/types/survey';
import { SURVEY_QUESTIONS } from '@/types/survey';
import { computeArchetypeFromSnapshot, ArchetypeDef } from '@/lib/archetypes';
import { supabase } from '@/lib/supabase';
import { getAnonymousSessionId } from '@/lib/anonymous-session';
import { UnifiedSurveyResult } from '@/types/survey.enhanced';

export enum SurveyFlow {
  WELCOME = 'welcome',
  QUESTIONS = 'questions',
  COMPLETE = 'complete'
}

interface IntegratedSurveyWrapperProps {
  onComplete?: (score: number, level: string, email: string, fullResults?: UnifiedSurveyResult) => void;
  onSwitchToLogin: () => void;
  onClose?: () => void;
}

export function IntegratedSurveyWrapper({ onComplete, onSwitchToLogin, onClose }: IntegratedSurveyWrapperProps) {
  const router = useRouter();
  const [currentFlow, setCurrentFlow] = useState<SurveyFlow>(SurveyFlow.WELCOME);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [surveyResult, setSurveyResult] = useState<{ score: number; archetype: ArchetypeDef } | null>(null);

  const handleStartSurvey = () => {
    setCurrentFlow(SurveyFlow.QUESTIONS);
  };

  const handleSurveySubmit = async (responses: SurveyAnswer[]) => {
    setIsSubmitting(true);
    try {
      // Get current user and anonymous session
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user ?? null;
      const accessToken = session?.access_token ?? null;
      let anonymousId = !user ? getAnonymousSessionId() : null;

      // If still no anonymous ID (e.g., localStorage empty), generate a fallback
      if (!user && !anonymousId) {
        anonymousId = 'anon-' + Math.random().toString(36).substring(2) + Date.now();
        // Store it for consistency
        localStorage.setItem('pml_anonymous_session_id', anonymousId);
      }

      // Call the new hybrid survey API
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      const response = await fetch('/api/survey/submit-v2', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          responses,
          anonymousSessionId: anonymousId
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit survey');
      }

      const data = await response.json();
      const results: UnifiedSurveyResult = data.results;

      setSurveyResult({ 
        score: results.serenityScore, 
        archetype: results.archetype 
      });
      
      setCurrentFlow(SurveyFlow.COMPLETE);

      if (onComplete) {
        onComplete(
          results.serenityScore,
          results.archetype.name,
          user?.email || '',
          results
        );
      }
    } catch (error) {
      console.error('Survey submission error:', error);
      // Optionally show an error message to the user
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = () => {
    if (onComplete && surveyResult) {
      onComplete(surveyResult.score, surveyResult.archetype.name, '');
    }
    // Redirect will be handled by the parent component
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
                  alt="PlayMind Labs"
                  width={108}
                  height={108}
                  className="h-27 w-27 logo-dark-mode"
                />
                <span className="text-2xl font-bold tracking-tight">PlayMind Labs</span>
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
              Start Assessment
            </Button>

            <div className="max-w-2xl text-center space-y-4 pt-6 border-t border-white/5">
              <p className="text-xs text-gray-500 leading-relaxed">
                <span className="font-semibold text-gray-300">PlayMind Labs</span> helps you develop healthier sports betting habits through emotional awareness and progress tracking. Your personalized score tracks improvements as you engage with our daily tools.
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

        {/* Full 12-Question Survey */}
        {currentFlow === SurveyFlow.QUESTIONS && (
          <div className="p-10 bg-[#020617]">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-extrabold text-white mb-3 tracking-tight">Complete Assessment</h2>
              <p className="text-gray-400 font-medium italic">12 questions • 2-3 minutes • Personalized archetype</p>
            </div>
            <div className="survey-dark-theme">
              <SurveyForm
                onSubmit={handleSurveySubmit}
                isSubmitting={isSubmitting}
                questions={SURVEY_QUESTIONS}
              />
            </div>
          </div>
        )}

        {/* Complete Screen */}
        {currentFlow === SurveyFlow.COMPLETE && surveyResult && (
          <div className="p-10 text-center bg-[#020617]">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-linear-to-r from-[#3b82f6] to-[#a855f7] mb-6">
                <Brain className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
                You're a <br />
                <span className="gradient-data">"{surveyResult.archetype.name}"</span>
              </h2>
              <div className="mt-4 text-gray-400 text-lg">{surveyResult.archetype.description}</div>
            </div>

            <div className="w-full bg-[#0f172a]/50 border border-white/5 rounded-2xl p-6 max-w-lg mb-8">
              <div className="text-center space-y-4">
                <div className="text-2xl font-bold text-white">Your Score: {surveyResult.score}</div>
                <div className="text-sm text-gray-400">
                  This score helps us personalize your experience and track your progress over time.
                </div>
              </div>
            </div>

            <Button
              onClick={handleComplete}
              className="w-full md:w-auto px-10 py-4 h-14 text-lg font-bold rounded-xl bg-linear-to-r from-[#10b981] to-[#059669] hover:opacity-90 transition-opacity"
            >
              Continue to Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default IntegratedSurveyWrapper;
// Deployed: 2026-01-20T02:29:00Z - Survey Flow v2.0 (updated with hybrid API + fallback anonymous ID)
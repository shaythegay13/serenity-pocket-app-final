'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';
import SurveyForm from '@/components/SurveyForm';
import { SurveyAnswer } from '@/types/survey';

export enum SurveyFlow {
  WELCOME = 'welcome',
  EMAIL_CAPTURE = 'email_capture',
  QUESTIONS = 'questions',
  COMPLETE = 'complete'
}

interface IntegratedSurveyWrapperProps {
  onComplete?: (score: number, level: string, email: string) => void;
  onSwitchToLogin: () => void;
}

export function IntegratedSurveyWrapper({ onComplete, onSwitchToLogin }: IntegratedSurveyWrapperProps) {
  const router = useRouter();
  const [currentFlow, setCurrentFlow] = useState<SurveyFlow>(SurveyFlow.WELCOME);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [surveyResult, setSurveyResult] = useState<{ surveyId: string; score: number } | null>(null);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleStartSurvey = () => {
    setCurrentFlow(SurveyFlow.EMAIL_CAPTURE);
  };

  const handleEmailSubmit = () => {
    setEmailError(null);

    if (!email) {
      setEmailError('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setCurrentFlow(SurveyFlow.QUESTIONS);
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
      
      // Call the parent's onComplete callback
      if (onComplete && surveyResult) {
        const level = data.score >= 1 && data.score <= 17 ? 'Low' : 
                     data.score >= 18 && data.score <= 34 ? 'Medium' : 
                     data.score >= 35 && data.score <= 50 ? 'High' : 'Low';
        onComplete(data.score, level, email);
      }
    } catch (error) {
      console.error('Survey submission error:', error);
      setEmailError('An error occurred while submitting your survey. Please try again.');
      setCurrentFlow(SurveyFlow.EMAIL_CAPTURE);
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <div className="w-full max-w-2xl bg-white dark:bg-gray-950 rounded-2xl shadow-2xl overflow-hidden animate-slideUp">
        
        {/* Welcome Screen */}
        {currentFlow === SurveyFlow.WELCOME && (
          <div className="flex flex-col items-center justify-center space-y-7 p-12 bg-white">
            <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center space-x-3">
                <Image 
                  src="/logo.png" 
                  alt="Serenity Pocket Logo" 
                  width={64} 
                  height={64} 
                  className="object-contain"
                />
                <span className="text-xl font-semibold text-gray-800">Take our Serenity Survey</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 text-center max-w-2xl">
                Sports Betting: Joyful or Stressful?
              </h1>
            </div>

            <p className="text-lg text-gray-700 max-w-lg text-center">
              Understand the real impact of your habits. Take our quick, confidential quiz to support your emotional health.
            </p>

            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 max-w-lg">
              <ul className="text-left space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>8 research-backed questions</span>
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
              className="w-full md:w-auto px-8 py-4 text-lg bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
            >
              Take the Serenity Survey
            </Button>
            
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-blue-500 hover:underline mt-4 text-base"
            >
              I already have an account. Take me to login page.
            </button>
          </div>
        )}

        {/* Email Capture Screen */}
        {currentFlow === SurveyFlow.EMAIL_CAPTURE && (
          <div className="p-8 bg-white">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Let's Get Started</h2>
              <p className="text-gray-700">
                Enter your email to save your assessment results
              </p>
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
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>{emailError}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setCurrentFlow(SurveyFlow.WELCOME)}
                  className="flex-1 text-gray-700 border-gray-300 hover:bg-gray-50"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleEmailSubmit}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
                >
                  Continue to Survey
                </Button>
              </div>

              <p className="text-xs text-gray-600 text-center">
                Your email will only be used to save your results. 
                You can create an account after completing the assessment.
              </p>
            </div>
          </div>
        )}

        {/* Survey Questions */}
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
              <div className="p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
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
                className="w-full px-8 py-4 text-lg bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
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

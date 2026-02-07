'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { X, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, Shield } from 'lucide-react';
import { PGSI_SB_QUESTIONS, PGSI_SB_THRESHOLDS } from '@/lib/research-anchors';

// Response options for PGSI-SB
const RESPONSE_OPTIONS = [
  { value: 0, label: 'Never' },
  { value: 1, label: 'Sometimes' },
  { value: 2, label: 'Most of the time' },
  { value: 3, label: 'Almost always' },
] as const;

// Calculate category from score
function getCategoryFromScore(score: number): {
  category: string;
  riskMultiplier: number;
  color: string;
  description: string;
} {
  if (score === 0) {
    return {
      category: PGSI_SB_THRESHOLDS.NON_PROBLEM.label,
      riskMultiplier: PGSI_SB_THRESHOLDS.NON_PROBLEM.riskMultiplier,
      color: 'green',
      description: 'Your responses indicate no signs of problem gambling behaviors. Keep up the healthy habits!'
    };
  } else if (score <= 2) {
    return {
      category: PGSI_SB_THRESHOLDS.LOW_RISK.label,
      riskMultiplier: PGSI_SB_THRESHOLDS.LOW_RISK.riskMultiplier,
      color: 'yellow',
      description: 'Your responses suggest some low-risk gambling behaviors. Stay mindful and continue monitoring your habits.'
    };
  } else if (score <= 7) {
    return {
      category: PGSI_SB_THRESHOLDS.MODERATE_RISK.label,
      riskMultiplier: PGSI_SB_THRESHOLDS.MODERATE_RISK.riskMultiplier,
      color: 'orange',
      description: 'Your responses indicate moderate risk. Consider setting stricter limits and using our responsible gambling tools.'
    };
  } else {
    return {
      category: PGSI_SB_THRESHOLDS.PROBLEM_GAMBLER.label,
      riskMultiplier: PGSI_SB_THRESHOLDS.PROBLEM_GAMBLER.riskMultiplier,
      color: 'red',
      description: 'Your responses suggest potential problem gambling. We strongly recommend speaking with a professional counselor.'
    };
  }
}

export default function PGSISurveyPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [surveyComplete, setSurveyComplete] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    category: string;
    color: string;
    description: string;
  } | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setIsAuthenticated(true);
      } else {
        // Redirect to home if not authenticated
        router.push('/');
      }
    };

    checkAuth();
  }, [router]);

  const handleResponse = (questionId: string, value: number) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleNext = () => {
    if (currentQuestion < PGSI_SB_QUESTIONS.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('No active session found. Please log in again.');
      }

      // Calculate score
      const totalScore = Object.values(responses).reduce((sum, val) => sum + val, 0);
      const categoryInfo = getCategoryFromScore(totalScore);

      // Format responses for API
      const formattedResponses = PGSI_SB_QUESTIONS.map(q => ({
        questionId: q.id,
        questionText: q.text,
        response: responses[q.id] ?? 0,
        subscale: q.subscale
      }));

      // Save to database
      const response = await fetch('/api/pgsi-survey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          responses: formattedResponses,
          score: totalScore,
          category: categoryInfo.category,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit survey');
      }

      setResult({
        score: totalScore,
        category: categoryInfo.category,
        color: categoryInfo.color,
        description: categoryInfo.description
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
    window.location.href = '/';
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Survey complete - show results
  if (surveyComplete && result) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="relative w-full max-w-lg p-8 text-center">
          <button
            type="button"
            aria-label="Close survey"
            className="absolute left-3 top-3 inline-flex items-center justify-center h-8 w-8 rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={handleReturnHome}
          >
            <X className="h-4 w-4" />
          </button>

          <div className="mb-6">
            {result.color === 'green' ? (
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            ) : result.color === 'red' ? (
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            ) : (
              <Shield className="h-16 w-16 text-amber-500 mx-auto mb-4" />
            )}
            <h2 className="text-2xl font-bold text-foreground mb-2">Survey Complete</h2>
            <p className="text-muted-foreground">Your PGSI-SB results are ready</p>
          </div>

          <div className={`rounded-lg p-6 mb-6 ${
            result.color === 'green' ? 'bg-green-500/10 border border-green-500/30' :
            result.color === 'yellow' ? 'bg-yellow-500/10 border border-yellow-500/30' :
            result.color === 'orange' ? 'bg-orange-500/10 border border-orange-500/30' :
            'bg-red-500/10 border border-red-500/30'
          }`}>
            <div className="text-sm text-muted-foreground mb-2">Your Score</div>
            <div className={`text-5xl font-bold mb-2 ${
              result.color === 'green' ? 'text-green-500' :
              result.color === 'yellow' ? 'text-yellow-500' :
              result.color === 'orange' ? 'text-orange-500' :
              'text-red-500'
            }`}>{result.score}</div>
            <Badge variant="outline" className={`text-base px-4 py-1 ${
              result.color === 'green' ? 'border-green-500 text-green-500' :
              result.color === 'yellow' ? 'border-yellow-500 text-yellow-500' :
              result.color === 'orange' ? 'border-orange-500 text-orange-500' :
              'border-red-500 text-red-500'
            }`}>
              {result.category}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground mb-6">{result.description}</p>

          <div className="space-y-3">
            <Button onClick={handleReturnHome} className="w-full">
              Return to Dashboard
            </Button>
            {(result.color === 'orange' || result.color === 'red') && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open('https://www.ncpgambling.org/help-treatment/', '_blank')}
              >
                Find Help Resources
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            Based on the Problem Gambling Severity Index adapted for Sports Betting (PGSI-SB).
            Validated by Graupensperger & Calhoun (2024).
          </p>
        </Card>
      </div>
    );
  }

  // Survey in progress
  const question = PGSI_SB_QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / PGSI_SB_QUESTIONS.length) * 100;
  const canProceed = responses[question.id] !== undefined;
  const isLastQuestion = currentQuestion === PGSI_SB_QUESTIONS.length - 1;
  const allAnswered = PGSI_SB_QUESTIONS.every(q => responses[q.id] !== undefined);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="relative w-full max-w-lg p-6">
        <button
          type="button"
          aria-label="Close survey"
          className="absolute right-3 top-3 inline-flex items-center justify-center h-8 w-8 rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
          onClick={() => router.push('/')}
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-foreground mb-1">Sports Betting Survey</h1>
          <p className="text-sm text-muted-foreground">
            This validated assessment helps us better understand your sports betting habits.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Question {currentQuestion + 1} of {PGSI_SB_QUESTIONS.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question */}
        <div className="mb-8">
          <Badge variant="secondary" className="mb-3 text-xs">
            {question.subscale === 'problem_behavior' ? 'Problem Behavior' : 'Negative Consequences'}
          </Badge>
          <h2 className="text-lg font-medium text-foreground mb-6">{question.text}</h2>

          <RadioGroup
            value={responses[question.id]?.toString()}
            onValueChange={(value) => handleResponse(question.id, parseInt(value))}
            className="space-y-3"
          >
            {RESPONSE_OPTIONS.map((option) => (
              <div key={option.value} className="flex items-center">
                <RadioGroupItem
                  value={option.value.toString()}
                  id={`${question.id}-${option.value}`}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={`${question.id}-${option.value}`}
                  className="flex-1 flex items-center gap-3 p-4 rounded-lg border border-border cursor-pointer transition-colors hover:bg-muted peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:border-primary"
                >
                  <div className={`h-4 w-4 rounded-full border-2 transition-colors ${
                    responses[question.id] === option.value
                      ? 'border-primary bg-primary'
                      : 'border-muted-foreground'
                  }`}>
                    {responses[question.id] === option.value && (
                      <div className="h-full w-full rounded-full bg-primary flex items-center justify-center">
                        <div className="h-1.5 w-1.5 rounded-full bg-white" />
                      </div>
                    )}
                  </div>
                  <span className="text-foreground">{option.label}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Navigation */}
        <div className="flex justify-between gap-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="flex-1"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          {isLastQuestion ? (
            <Button
              onClick={handleSubmit}
              disabled={!allAnswered || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceed}
              className="flex-1"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>

        {/* Question dots */}
        <div className="flex justify-center gap-1.5 mt-6">
          {PGSI_SB_QUESTIONS.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentQuestion(idx)}
              className={`h-2 w-2 rounded-full transition-colors ${
                idx === currentQuestion
                  ? 'bg-primary'
                  : responses[PGSI_SB_QUESTIONS[idx].id] !== undefined
                  ? 'bg-primary/50'
                  : 'bg-muted'
              }`}
              aria-label={`Go to question ${idx + 1}`}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}

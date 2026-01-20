'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { 
  Heart, 
  DollarSign, 
  Gauge, 
  ClipboardCheck,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { useFlow } from '@/contexts/FlowContext';

interface SmartSlipFlowControllerProps {
  onComplete: () => void;
  onSkip?: () => void;
}

const SMART_SLIP_STEPS = [
  { step: 'emotion-check', title: 'Emotion Check', icon: <Heart className="h-5 w-5" /> },
  { step: 'stake-limit', title: 'Stake Limit', icon: <DollarSign className="h-5 w-5" /> },
  { step: 'confidence-calibration', title: 'Confidence', icon: <Gauge className="h-5 w-5" /> },
  { step: 'final-review', title: 'Review', icon: <ClipboardCheck className="h-5 w-5" /> },
];

const EMOTION_OPTIONS = [
  { value: 'calm', label: 'Calm & Focused', emoji: '😌', color: 'bg-green-100 border-green-300 text-green-800' },
  { value: 'excited', label: 'Excited', emoji: '🤩', color: 'bg-yellow-100 border-yellow-300 text-yellow-800' },
  { value: 'greedy', label: 'Greedy/FOMO', emoji: '🤑', color: 'bg-purple-100 border-purple-300 text-purple-800' },
  { value: 'anxious', label: 'Anxious', emoji: '😰', color: 'bg-orange-100 border-orange-300 text-orange-800' },
  { value: 'frustrated', label: 'Frustrated', emoji: '😤', color: 'bg-red-100 border-red-300 text-red-800' },
  { value: 'bored', label: 'Bored', emoji: '😐', color: 'bg-gray-100 border-gray-300 text-gray-800' },
];

export function SmartSlipFlowController({ onComplete, onSkip }: SmartSlipFlowControllerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [stakeLimit, setStakeLimit] = useState<number>(25);
  const [confidence, setConfidence] = useState<number>(50);

  const progressPercentage = ((currentStep + 1) / SMART_SLIP_STEPS.length) * 100;

  const handleNext = useCallback(() => {
    if (currentStep < SMART_SLIP_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  }, [currentStep, onComplete]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const canProceed = () => {
    const currentStepData = SMART_SLIP_STEPS[currentStep];
    switch (currentStepData.step) {
      case 'emotion-check':
        return selectedEmotion !== null;
      default:
        return true;
    }
  };

  const getEmotionWarning = () => {
    if (selectedEmotion === 'frustrated' || selectedEmotion === 'anxious' || selectedEmotion === 'greedy') {
      return (
        <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3 mt-4">
          <p className="text-sm text-orange-800 dark:text-orange-200">
            <strong>Heads up:</strong> Betting while feeling {selectedEmotion === 'greedy' ? 'greedy or experiencing FOMO' : selectedEmotion} can lead to impulsive decisions. 
            Consider taking a break or reducing your stake.
          </p>
        </div>
      );
    }
    return null;
  };

  const renderStepContent = () => {
    const currentStepData = SMART_SLIP_STEPS[currentStep];
    switch (currentStepData.step) {
      case 'emotion-check':
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              How are you feeling right now? Be honest—this helps you make better decisions.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {EMOTION_OPTIONS.map((emotion) => (
                <button
                  key={emotion.value}
                  onClick={() => setSelectedEmotion(emotion.value)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedEmotion === emotion.value
                      ? `${emotion.color} border-current`
                      : 'bg-background border-border hover:border-primary/50'
                  }`}
                >
                  <span className="text-2xl mb-1 block">{emotion.emoji}</span>
                  <span className="text-sm font-medium">{emotion.label}</span>
                </button>
              ))}
            </div>
            {getEmotionWarning()}
          </div>
        );

      case 'stake-limit':
        return (
          <div className="space-y-6">
            <p className="text-muted-foreground">
              Set your maximum stake for this session. Stick to it no matter what.
            </p>
            <div className="space-y-4">
              <div className="text-center">
                <span className="text-4xl font-bold text-primary">${stakeLimit}</span>
                <p className="text-sm text-muted-foreground mt-1">Maximum stake per bet</p>
              </div>
              <Slider
                value={[stakeLimit]}
                onValueChange={(v) => setStakeLimit(v[0])}
                min={5}
                max={200}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>$5</span>
                <span>$200</span>
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Tip:</strong> Set this to an amount you're comfortable losing entirely.
              </p>
            </div>
          </div>
        );

      case 'confidence-calibration':
        return (
          <div className="space-y-6">
            <p className="text-muted-foreground">
              How confident do you feel about your betting decisions today?
            </p>
            <div className="space-y-4">
              <div className="text-center">
                <span className="text-4xl font-bold text-primary">{confidence}%</span>
                <p className="text-sm text-muted-foreground mt-1">Confidence level</p>
              </div>
              <Slider
                value={[confidence]}
                onValueChange={(v) => setConfidence(v[0])}
                min={0}
                max={100}
                step={10}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>
            {confidence > 80 && (
              <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Overconfidence alert:</strong> High confidence can lead to oversized bets. 
                  Stay disciplined.
                </p>
              </div>
            )}
            {confidence < 30 && (
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Low confidence?</strong> Consider sitting this session out or reducing stakes.
                </p>
              </div>
            )}
          </div>
        );

      case 'final-review':
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Review your pre-bet check-in:
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Emotional State</span>
                <span className="text-sm">
                  {EMOTION_OPTIONS.find(e => e.value === selectedEmotion)?.emoji}{' '}
                  {EMOTION_OPTIONS.find(e => e.value === selectedEmotion)?.label}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Stake Limit</span>
                <span className="text-sm font-bold text-primary">${stakeLimit}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Confidence</span>
                <span className="text-sm">{confidence}%</span>
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mt-4">
              <div className="flex items-start gap-2">
                <Sparkles className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    You're ready to bet mindfully
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                    Remember: stick to your limits and bet with intention.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 text-primary mb-2">
            <Sparkles className="h-6 w-6" />
            <span className="text-lg font-semibold">Smart Slip</span>
          </div>
          <CardTitle className="text-xl">
            {SMART_SLIP_STEPS[currentStep]?.title}
          </CardTitle>
          <CardDescription>
            Step {currentStep + 1} of {SMART_SLIP_STEPS.length}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Progress indicator */}
          <div className="space-y-2">
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex justify-between">
              {SMART_SLIP_STEPS.map((s, i) => (
                <div 
                  key={s.step}
                  className={`flex flex-col items-center ${
                    i <= currentStep 
                      ? 'text-primary' 
                      : 'text-muted-foreground/50'
                  }`}
                >
                  <div className={`rounded-full p-1 ${
                    i <= currentStep 
                      ? 'bg-primary/10' 
                      : 'bg-muted'
                  }`}>
                    {s.icon}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Step content */}
          <div className="min-h-[250px]">
            {renderStepContent()}
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>

            {onSkip && currentStep === 0 && (
              <Button variant="ghost" onClick={onSkip}>
                Skip for now
              </Button>
            )}

            <Button onClick={handleNext} disabled={!canProceed()}>
              {currentStep === SMART_SLIP_STEPS.length - 1 ? (
                <>
                  Complete
                  <CheckCircle2 className="h-4 w-4 ml-1" />
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SmartSlipFlowController;

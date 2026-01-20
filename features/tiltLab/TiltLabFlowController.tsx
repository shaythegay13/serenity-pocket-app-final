'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  Wind, 
  Brain, 
  RefreshCw, 
  Target,
  ChevronRight,
  ChevronLeft,
  CheckCircle2
} from 'lucide-react';
import { useFlow } from '@/contexts/FlowContext';

interface TiltLabFlowControllerProps {
  onComplete: () => void;
  onSkip?: () => void;
}

const TILT_LAB_STEPS = [
  { step: 'acknowledge', title: 'Acknowledge', icon: <AlertTriangle className="h-5 w-5" /> },
  { step: 'breathe', title: 'Breathe', icon: <Wind className="h-5 w-5" /> },
  { step: 'reflect', title: 'Reflect', icon: <Brain className="h-5 w-5" /> },
  { step: 'reframe', title: 'Reframe', icon: <RefreshCw className="h-5 w-5" /> },
  { step: 'commit', title: 'Commit', icon: <Target className="h-5 w-5" /> },
];

export function TiltLabFlowController({ onComplete, onSkip }: TiltLabFlowControllerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepData, setStepData] = useState<Record<string, any>>({});

  const progressPercentage = ((currentStep + 1) / TILT_LAB_STEPS.length) * 100;

  const handleNext = useCallback(() => {
    if (currentStep < TILT_LAB_STEPS.length - 1) {
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

  const handleStepData = useCallback((data: any) => {
    setStepData(prev => ({ ...prev, ...data }));
  }, []);

  const currentStepData = TILT_LAB_STEPS[currentStep];

  const renderStepContent = () => {
    switch (currentStepData.step) {
      case 'acknowledge':
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Losing is part of betting. Let's acknowledge what happened and process it constructively.
            </p>
            <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <p className="text-sm text-orange-800 dark:text-orange-200">
                <strong>It's okay.</strong> Every bettor experiences losses. What matters is how you respond.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Take a moment to acknowledge:</p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• The loss happened</li>
                <li>• You may feel frustrated or disappointed</li>
                <li>• These feelings are normal and temporary</li>
              </ul>
            </div>
          </div>
        );

      case 'breathe':
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Let's take a moment to calm your nervous system before making any decisions.
            </p>
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
              <Wind className="h-12 w-12 mx-auto mb-4 text-blue-500" />
              <p className="text-lg font-medium mb-2">Box Breathing</p>
              <p className="text-sm text-muted-foreground">
                Breathe in for 4 seconds, hold for 4, out for 4, hold for 4.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Repeat 3-4 times until you feel calmer.
              </p>
            </div>
          </div>
        );

      case 'reflect':
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Understanding what happened helps prevent emotional decisions.
            </p>
            <div className="space-y-3">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm font-medium mb-1">Was this loss due to:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Bad luck on a good decision?</li>
                  <li>• A decision made without proper research?</li>
                  <li>• Emotional betting (chasing, revenge)?</li>
                </ul>
              </div>
              <p className="text-sm text-muted-foreground">
                <strong>Remember:</strong> Even perfect analysis can result in losses. 
                Variance is part of the game.
              </p>
            </div>
          </div>
        );

      case 'reframe':
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Let's shift from a loss mindset to a learning mindset.
            </p>
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-sm text-green-800 dark:text-green-200">
                <strong>Reframe:</strong> This loss is data, not defeat. 
                What can you learn from it?
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Healthy perspectives:</p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• One bet doesn't define your strategy</li>
                <li>• Long-term thinking beats short-term reactions</li>
                <li>• Discipline now protects future you</li>
              </ul>
            </div>
          </div>
        );

      case 'commit':
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Before you return to betting, let's set some intentions.
            </p>
            <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <p className="text-sm text-purple-800 dark:text-purple-200 font-medium mb-2">
                Your commitment:
              </p>
              <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1">
                <li>✓ I will not chase this loss</li>
                <li>✓ I will stick to my normal stake sizes</li>
                <li>✓ I will only bet when calm and clear-headed</li>
              </ul>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>You've completed the Tilt Lab recovery process.</span>
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
          <div className="flex items-center justify-center gap-2 text-orange-500 mb-2">
            <AlertTriangle className="h-6 w-6" />
            <span className="text-lg font-semibold">Tilt Lab</span>
          </div>
          <CardTitle className="text-xl">
            {TILT_LAB_STEPS[currentStep]?.title}
          </CardTitle>
          <CardDescription>
            Step {currentStep + 1} of {TILT_LAB_STEPS.length}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Progress indicator */}
          <div className="space-y-2">
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex justify-between">
              {TILT_LAB_STEPS.map((s, i) => (
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
          <div className="min-h-[200px]">
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

            <Button onClick={handleNext}>
              {currentStep === TILT_LAB_STEPS.length - 1 ? (
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

export default TiltLabFlowController;

'use client';

import React, { useState, Suspense, lazy } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Brain, X } from 'lucide-react';

interface SerenitySurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (score: number, level: string) => void;
  onSkip?: () => void;
}

export function SerenitySurveyModal({ 
  isOpen, 
  onClose, 
  onComplete,
  onSkip 
}: SerenitySurveyModalProps) {
  const [showSurvey, setShowSurvey] = useState(false);

  // Lazy load the existing IntegratedSurveyWrapper
  const IntegratedSurveyWrapper = lazy(() => 
    import('@/components/integrated-survey-flow/IntegratedSurveyWrapper').then(m => ({
      default: m.IntegratedSurveyWrapper
    }))
  );

  const handleStartSurvey = () => {
    setShowSurvey(true);
  };

  const handleSurveyComplete = (score: number, level: string, email: string) => {
    onComplete(score, level);
    onClose();
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
    onClose();
  };

  if (showSurvey) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <div className="absolute right-4 top-4 z-50">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Suspense fallback={
            <div className="min-h-[400px] flex items-center justify-center">
              <div className="animate-pulse text-muted-foreground">Loading survey...</div>
            </div>
          }>
            <IntegratedSurveyWrapper
              onComplete={handleSurveyComplete}
              onSwitchToLogin={() => {}}
              onClose={onClose}
            />
          </Suspense>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Brain className="h-8 w-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-xl">Serenity Profile Check</DialogTitle>
          <DialogDescription className="text-center">
            Take a quick 2-minute assessment to understand your betting psychology 
            and get personalized insights.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium">What you'll discover:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Your betting behavior archetype</li>
              <li>• Personalized risk insights</li>
              <li>• Tailored strategies for smarter betting</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={handleStartSurvey} className="w-full">
              Start Assessment
            </Button>
            {onSkip && (
              <Button variant="ghost" onClick={handleSkip} className="w-full">
                Skip for now
              </Button>
            )}
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Your responses are private and help personalize your experience.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SerenitySurveyModal;

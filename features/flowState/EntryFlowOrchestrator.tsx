'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Sparkles } from 'lucide-react';
import { useEntryFlowGuard } from '@/hooks/useEntryFlowGuard';
import { useFlow } from '@/contexts/FlowContext';
import { SerenitySurveyModal } from '@/features/serenitySurvey';

interface EntryFlowOrchestratorProps {
  children: React.ReactNode;
  onFlowComplete?: () => void;
}

export function EntryFlowOrchestrator({ children, onFlowComplete }: EntryFlowOrchestratorProps) {
  const { flow } = useFlow();
  const {
    isReady,
    currentStep,
    showBetLossQuestion,
    handleLostBetResponse,
    handleSurveyComplete,
    handleTiltLabComplete,
    handleSmartSlipComplete,
  } = useEntryFlowGuard();

  const [showSurveyModal, setShowSurveyModal] = useState(false);

  // Not ready yet - show loading
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Entry question: "Did you lose a bet recently?"
  if (showBetLossQuestion) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-xl">Welcome to Serenity</CardTitle>
            <CardDescription>
              Let's personalize your experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-center text-muted-foreground">
              Before we begin, we'd like to check in with you.
            </p>
            
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="font-medium mb-4">Did you lose a bet recently?</p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => handleLostBetResponse(true)}
                  className="flex-1 max-w-[120px]"
                >
                  <AlertTriangle className="h-4 w-4 mr-2 text-orange-500" />
                  Yes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleLostBetResponse(false)}
                  className="flex-1 max-w-[120px]"
                >
                  No
                </Button>
              </div>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Your answer helps us provide the right support at the right time.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Serenity Survey flow (when user didn't lose bet, show survey first)
  if (currentStep === 'smartslip' && !flow.serenitySurveyCompleted) {
    return (
      <>
        <SerenitySurveyModal
          isOpen={true}
          onClose={() => {
            handleSurveyComplete();
          }}
          onComplete={(score, level) => {
            handleSurveyComplete();
          }}
          onSkip={() => {
            handleSurveyComplete();
          }}
        />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading survey...</div>
        </div>
      </>
    );
  }

  // Dashboard - render children (existing app content)
  if (currentStep === 'dashboard') {
    return <>{children}</>;
  }

  // Default: render children
  return <>{children}</>;
}

export default EntryFlowOrchestrator;

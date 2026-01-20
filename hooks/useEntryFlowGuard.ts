"use client";

// hooks/useEntryFlowGuard.ts
import { useFlow } from '@/contexts/FlowContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export const useEntryFlowGuard = () => {
  const { flow, setCurrentFlowStep, setLostBetRecently, setSerenitySurveyCompleted } = useFlow();
  const router = useRouter();

  const showLostBetQuestion = flow.currentFlowStep === 'entry' && flow.lostBetRecently === null;
  const isReady = true; // Always ready with Context
  const currentStep = flow.currentFlowStep;

  const handleLostBetResponse = (lostRecently: boolean) => {
    setLostBetRecently(lostRecently);
    if (lostRecently) {
      setCurrentFlowStep('tiltlab');
      window.location.href = "/insights/tiltlab";
    } else {
      // Show survey first for pre-bet flow
      setCurrentFlowStep('smartslip');
    }
  };

  const handleSurveyComplete = () => {
    setSerenitySurveyCompleted(true);
    setCurrentFlowStep('dashboard');
  };

  const handleTiltLabComplete = () => {
    setCurrentFlowStep('smartslip');
  };

  const handleSmartSlipComplete = () => {
    setCurrentFlowStep('dashboard');
  };

  return { 
    isReady,
    currentStep,
    showBetLossQuestion: showLostBetQuestion,
    handleLostBetResponse,
    handleSurveyComplete,
    handleTiltLabComplete,
    handleSmartSlipComplete,
  };
};

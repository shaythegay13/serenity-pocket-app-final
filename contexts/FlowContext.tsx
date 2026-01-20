"use client";

// contexts/FlowContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface FlowState {
  lostBetRecently: boolean | null;
  serenitySurveyCompleted: boolean;
  currentFlowStep: 'entry' | 'tiltlab' | 'smartslip' | 'dashboard';
  isNewUser: boolean;
}

interface FlowContextType {
  flow: FlowState;
  setLostBetRecently: (value: boolean) => void;
  setSerenitySurveyCompleted: (value: boolean) => void;
  setCurrentFlowStep: (step: FlowState['currentFlowStep']) => void;
  setIsNewUser: (value: boolean) => void;
}

const FlowContext = createContext<FlowContextType | undefined>(undefined);

export const FlowProvider = ({ children }: { children: ReactNode }) => {
  const [flow, setFlow] = useState<FlowState>({
    lostBetRecently: null,
    serenitySurveyCompleted: false,
    currentFlowStep: 'entry',
    isNewUser: true,
  });

  const updateFlow = (updates: Partial<FlowState>) => {
    setFlow(prev => ({ ...prev, ...updates }));
  };

  return (
    <FlowContext.Provider value={{
      flow,
      setLostBetRecently: (value) => updateFlow({ lostBetRecently: value }),
      setSerenitySurveyCompleted: (value) => updateFlow({ serenitySurveyCompleted: value }),
      setCurrentFlowStep: (step) => updateFlow({ currentFlowStep: step }),
      setIsNewUser: (value) => updateFlow({ isNewUser: value }),
    }}>
      {children}
    </FlowContext.Provider>
  );
};

export const useFlow = () => {
  const context = useContext(FlowContext);
  if (!context) throw new Error('useFlow must be used within FlowProvider');
  return context;
};

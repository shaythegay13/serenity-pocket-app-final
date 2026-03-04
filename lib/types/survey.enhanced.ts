// lib/types/survey.enhanced.ts

export interface SurveyAnswer {
  questionId: string;
  selectedOption: string;
  timestamp?: string;
}

export interface EnhancedSurveyQuestion {
  id: string;
  text: string;
  options: string[];
  weight?: number[];
  pgsiWeight?: number[];
  category?: 'serenity' | 'pgsi';
  multi?: boolean;
}

export const ENHANCED_SURVEY_QUESTIONS: EnhancedSurveyQuestion[] = [
  { id: 'c1', text: 'How often do you gamble?', options: ['Never', 'Sometimes', 'Often', 'Very often'], weight: [0, 1, 2, 3], pgsiWeight: [0, 1, 2, 3], category: 'serenity' },
  { id: 'c2', text: 'How likely are you to bet again?', options: ['Very unlikely', 'Unlikely', 'Likely', 'Very likely'], weight: [0, 1, 2, 3], pgsiWeight: [0, 1, 2, 3], category: 'pgsi' },
  { id: 'c3', text: 'Do you feel in control of your gambling?', options: ['Never', 'Sometimes', 'Often', 'Always'], weight: [0, 1, 2, 3], pgsiWeight: [0, 1, 2, 3], category: 'serenity' },
  { id: 'c4', text: 'How confident are you in quitting if needed?', options: ['Not at all', 'Somewhat', 'Mostly', 'Completely'], weight: [0, 1, 2, 3], pgsiWeight: [0, 1, 2, 3], category: 'serenity' },
];

export interface UnifiedSurveyResult {
  surveyId: string;        // MUST exist for TypeScript
  serenityScore: number;
  pgsiScore: number;
  emotionalStability: number;
  archetype: {
    id: string;
    name: string;
    description: string;
  };
  riskLevel: 'low' | 'moderate' | 'high' | 'problem';
  pgsiCategory: string;
}
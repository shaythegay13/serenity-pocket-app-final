// Type definitions for the gambling addiction survey system

export interface SurveyQuestion {
  id: string;
  text: string;
  options: string[];
  weight: number[];
}

export interface SurveyAnswer {
  questionId: string;
  selectedOption: string;
  timestamp: Date;
}

export interface AnonymousSurveySubmission {
  email: string;
  responses: SurveyAnswer[];
  score: number;
  submittedFromIp?: string;
}

export interface SurveyResponse extends AnonymousSurveySubmission {
  id: string;
  userId: string;
  createdAt: Date;
  linkedAt: Date;
  isInitialSurvey: boolean;
}

export interface SurveyHistoryData {
  surveys: SurveyResponse[];
  latestScore: number;
  scoreHistory: { date: Date; score: number }[];
}

export type TimeRangeFilter = 'three-months' | 'six-months' | 'one-year' | 'all-time';

export interface ChartDataPoint {
  date: Date;
  score: number;
  label: string;
}

// Gambling addiction assessment questions
export const SURVEY_QUESTIONS: readonly SurveyQuestion[] = [
  {
    id: 'q1',
    text: 'How often do you engage in gambling or betting activities?',
    options: ['Never or rarely', 'Once or twice a month', '1-3 times per week', '4+ times per week'],
    weight: [0, 6, 12, 18]
  },
  {
    id: 'q2',
    text: 'How much time do you spend betting?',
    options: ['Less than 30 minutes per day', '30 minutes to 1 hour per day', '1-3 hours per day', 'More than 3 hours per day'],
    weight: [0, 6, 12, 18]
  },
  {
    id: 'q3',
    text: 'When you start placing bets on a given day, how easy is it for you to stop?',
    options: ['I can stop anytime easily', 'Usually can stop when planned', 'Often place more bets than intended', 'Very hard to stop once I start'],
    weight: [0, 6, 15, 21]
  },
  {
    id: 'q4',
    text: 'Has gambling affected your personal relationships or mental wellbeing?',
    options: ['No negative impact', 'Minor stress occasionally', 'Some conflicts or anxiety', 'Significant problems'],
    weight: [0, 6, 15, 21]
  },
  {
    id: 'q5',
    text: 'Have you tried to reduce or control your gambling habits?',
    options: ["Haven't felt the need to", 'Thought about it', 'Tried with some success', "Tried but couldn't maintain"],
    weight: [0, 6, 12, 18]
  },
  {
    id: 'q6',
    text: 'After losing money on bets, what do you typically do?',
    options: ['Accept the loss and move on', 'Wait a day or more before betting again', 'Sometimes place more bets to win it back', 'Usually keep betting to recover losses'],
    weight: [0, 6, 12, 18]
  },
  {
    id: 'q7',
    text: 'Do you gamble with money you can afford to lose?',
    options: ['Always within my budget', 'Usually stay within limits', 'Sometimes exceed my budget', 'Often bet money I need'],
    weight: [0, 6, 15, 18]
  },
  {
    id: 'q8',
    text: 'Does gambling interfere with your daily responsibilities?',
    options: ['Never interferes', 'Rarely affects my schedule', 'Sometimes causes issues', 'Frequently disrupts my life'],
    weight: [0, 6, 12, 18]
  }
] as const;

// Score interpretation helper (matching original system)
export function getScoreInterpretation(score: number): string {
  if (score >= 1 && score <= 17) return 'Low risk';
  if (score >= 18 && score <= 34) return 'Medium risk';
  if (score >= 35 && score <= 50) return 'High risk';
  return 'Low risk'; // Default for score of 0
}

// Type guards
export function isValidSurveyAnswer(answer: unknown): answer is SurveyAnswer {
  return (
    typeof answer === 'object' &&
    answer !== null &&
    'questionId' in answer &&
    'selectedOption' in answer &&
    typeof (answer as any).questionId === 'string' &&
    typeof (answer as any).selectedOption === 'string'
  );
}

export function isValidSurveyResponse(response: unknown): response is SurveyResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'id' in response &&
    'userId' in response &&
    'email' in response &&
    'responses' in response &&
    Array.isArray((response as any).responses)
  );
}

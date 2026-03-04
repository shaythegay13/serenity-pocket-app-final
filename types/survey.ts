// Type definitions for the gambling addiction survey system

export interface SurveyQuestion {
  id: string;
  text: string;
  options: string[];
  weight: number[];
  multi?: boolean;
  section?: string;
}

export interface SurveyAnswer {
  questionId: string;
  selectedOption: string | string[];
  timestamp?: Date;
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
    id: 'c1',
    text: 'How often do you end up gambling longer or more intensely than planned?',
    options: ['Never', 'Rarely', 'Sometimes', 'Often'],
    weight: [0, 1, 2, 3],
    section: 'Psychological Snapshot'
  },
  {
    id: 'c2',
    text: 'How likely are you to bet when stressed, bored, or trying to change your mood?',
    options: ['Very unlikely', 'Unlikely', 'Somewhat likely', 'Very likely'],
    weight: [0, 1, 2, 3],
    section: 'Psychological Snapshot'
  },
  {
    id: 'c3',
    text: 'How often do you place bets that stretch or exceed your intended budget?',
    options: ['Never', 'Rarely', 'Sometimes', 'Often'],
    weight: [0, 1, 2, 3],
    section: 'Psychological Snapshot'
  },
  {
    id: 'c4',
    text: 'After a loss, how often do you feel the urge to win the money back right away?',
    options: ['Never', 'Rarely', 'Sometimes', 'Often'],
    weight: [0, 1, 2, 3],
    section: 'Psychological Snapshot'
  },
  {
    id: 'c5',
    text: 'Which types of bets do you usually place? (Tap all that apply)',
    options: ['Straight bets', 'Parlays', 'Same-game parlays', 'In-game/live bets', 'Props', 'Futures'],
    weight: [0, 2, 3, 3, 1, 1],
    multi: true,
    section: 'Betting Style'
  },
  {
    id: 'c6',
    text: "What’s your usual bet size?",
    options: ['Under $10', '$10–$25', '$25–$50', '$50–$100', 'Over $100'],
    weight: [0, 1, 2, 3, 4],
    section: 'Betting Style'
  },
  {
    id: 'c7',
    text: 'How often do you adjust your bet size based on confidence or excitement?',
    options: ['Never', 'Rarely', 'Sometimes', 'Often'],
    weight: [0, 1, 2, 3],
    section: 'Betting Style'
  },
  {
    id: 'c8',
    text: 'How much do you rely on research before placing a bet?',
    options: ['None', '<5 min', '5–15 min', '15+ min'],
    weight: [3, 2, 1, 0],
    section: 'Betting Style'
  },
  {
    id: 'c9',
    text: 'Which sports do you usually bet on? (Tap all that apply)',
    options: ['NFL', 'NBA', 'MLB', 'NHL', 'College sports', 'Soccer', 'UFC/MMA', 'Boxing', 'Tennis', 'Golf', 'Cricket', 'Motorsports', 'Esports'],
    weight: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    multi: true,
    section: 'Sport & Market Preferences'
  },
  {
    id: 'c10',
    text: 'Which sports do you feel you understand the most analytically?',
    options: ['NFL', 'NBA', 'MLB', 'NHL', 'College sports', 'Soccer', 'UFC/MMA', 'Boxing', 'Tennis', 'Golf', 'Cricket', 'Motorsports', 'Esports'],
    weight: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    multi: true,
    section: 'Sport & Market Preferences'
  },
  {
    id: 'c11',
    text: 'When do you typically bet most often?',
    options: ['Morning', 'Afternoon', 'Evening', 'Late night', 'No consistent pattern'],
    weight: [0, 1, 2, 3, 1],
    section: 'Sport & Market Preferences'
  },
  {
    id: 'c12',
    text: 'Do you track your betting performance?',
    options: ['No', 'Yes, informally', 'Yes, I track numbers', 'Yes, I use tools/platforms'],
    weight: [3, 2, 1, 0],
    section: 'Experience & Tracking'
  }
] as const;

export const SURVEY_C_SNAPSHOT_QUESTIONS: readonly SurveyQuestion[] = [
  {
    id: 'c1',
    text: 'How often do you end up gambling longer or more intensely than planned?',
    options: ['Never', 'Rarely', 'Sometimes', 'Often'],
    weight: [0, 1, 2, 3],
    section: 'Psychological Snapshot'
  },
  {
    id: 'c2',
    text: 'How likely are you to bet when stressed, bored, or trying to change your mood?',
    options: ['Very unlikely', 'Unlikely', 'Somewhat likely', 'Very likely'],
    weight: [0, 1, 2, 3],
    section: 'Psychological Snapshot'
  },
  {
    id: 'c3',
    text: 'How often do you place bets that stretch or exceed your intended budget?',
    options: ['Never', 'Rarely', 'Sometimes', 'Often'],
    weight: [0, 1, 2, 3],
    section: 'Psychological Snapshot'
  },
  {
    id: 'c4',
    text: 'After a loss, how often do you feel the urge to win the money back right away?',
    options: ['Never', 'Rarely', 'Sometimes', 'Often'],
    weight: [0, 1, 2, 3],
    section: 'Psychological Snapshot'
  }
] as const;

// Survey B - Alternative 10-question assessment
export const SURVEY_B_QUESTIONS: readonly SurveyQuestion[] = [
  {
    id: 'qb1',
    text: 'Frequency of Betting (in the past 12 months):',
    options: ['Less than once a month', 'Weekly', '1–4 times per week', 'Daily or nearly daily'],
    weight: [0, 5, 10, 15]
  },
  {
    id: 'qb2',
    text: 'Increasing Bet Size for Excitement:',
    options: ['Never', 'Occasionally', 'Frequently', 'Almost always'],
    weight: [0, 5, 10, 15]
  },
  {
    id: 'qb3',
    text: 'Difficulty Stopping Once You Begin:',
    options: ['Very easy', 'Usually easy', 'Often difficult', 'Very difficult'],
    weight: [0, 5, 10, 15]
  },
  {
    id: 'qb4',
    text: 'Emotional/Relationship Impact:',
    options: ['No impact', 'Minor/occasional stress', 'Noticeable conflicts or anxiety', 'Significant emotional or relational problems'],
    weight: [0, 5, 10, 15]
  },
  {
    id: 'qb5',
    text: 'Attempts to Control or Reduce Gambling:',
    options: ["No, I haven't felt the need", "I've thought about reducing", "I've tried reducing with some success", "I've tried, but it's very difficult to maintain"],
    weight: [0, 5, 10, 15]
  },
  {
    id: 'qb6',
    text: 'Response to Losses (Chasing Losses):',
    options: ['I usually accept my losses and stop', 'I sometimes take a break before betting again', 'I sometimes try to win back my losses', 'I frequently try to win back my losses immediately'],
    weight: [0, 5, 10, 15]
  },
  {
    id: 'qb7',
    text: 'Setting and Sticking to Financial Limits:',
    options: ['Never', 'Rarely', 'Sometimes', 'Often'],
    weight: [15, 10, 5, 0]  // Reversed scoring - "Often" is best
  },
  {
    id: 'qb8',
    text: 'Interference With Responsibilities (e.g., work, school, family):',
    options: ['Never', 'Rarely', 'Sometimes', 'Often'],
    weight: [0, 5, 10, 15]
  },
  {
    id: 'qb9',
    text: 'Impulsive Betting or Gambling:',
    options: ['Never', 'Rarely', 'Sometimes', 'Often'],
    weight: [0, 5, 10, 15]
  },
  {
    id: 'qb10',
    text: 'Emotional Triggers (using gambling to cope with negative emotions):',
    options: ['Very unlikely', 'Unlikely', 'Somewhat likely', 'Very likely'],
    weight: [0, 5, 10, 15]
  }
] as const;

// Score interpretation helper (0-100 scale)
export function getScoreInterpretation(score: number): string {
  if (score >= 0 && score <= 33) return 'Low risk';
  if (score >= 34 && score <= 66) return 'Medium risk';
  if (score >= 67 && score <= 100) return 'High risk';
  return 'Low risk'; // Default
}

// Score interpretation for Survey B (max score: 150)
export function getScoreInterpretationB(score: number): string {
  if (score >= 0 && score <= 37) return 'Low risk';
  if (score >= 38 && score <= 75) return 'Medium risk';
  if (score >= 76 && score <= 112) return 'High risk';
  if (score >= 113) return 'Very High risk';
  return 'Low risk'; // Default
}

// Type guards
export function isValidSurveyAnswer(answer: unknown): answer is SurveyAnswer {
  return (
    typeof answer === 'object' &&
    answer !== null &&
    'questionId' in answer &&
    'selectedOption' in answer &&
    typeof (answer as any).questionId === 'string' &&
    (typeof (answer as any).selectedOption === 'string' || Array.isArray((answer as any).selectedOption))
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

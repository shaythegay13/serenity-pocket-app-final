import { SurveyAnswer } from './survey';

// Enhanced question type with PGSI support
export interface EnhancedSurveyQuestion {
  id: string;
  text: string;
  options: string[];
  weight: number[];           // Serenity scoring (0-100 scale)
  pgsiWeight: number[];        // PGSI scoring (0-3 scale, standard)
  category: 'serenity' | 'pgsi' | 'both';
  multi?: boolean;
  section?: string;
}

// Your existing 12 questions with PGSI mappings
export const ENHANCED_SURVEY_QUESTIONS: EnhancedSurveyQuestion[] = [
  {
    id: 'c1',
    text: 'How often do you end up gambling longer or more intensely than planned?',
    options: ['Never', 'Rarely', 'Sometimes', 'Often'],
    weight: [0, 1, 2, 3],
    pgsiWeight: [0, 1, 2, 3], // PGSI Q1: Bet more than you can afford
    category: 'both',
    section: 'Psychological Snapshot'
  },
  {
    id: 'c2',
    text: 'How likely are you to bet when stressed, bored, or trying to change your mood?',
    options: ['Very unlikely', 'Unlikely', 'Somewhat likely', 'Very likely'],
    weight: [0, 1, 2, 3],
    pgsiWeight: [0, 1, 2, 3], // PGSI: Gambling to escape problems
    category: 'both',
    section: 'Psychological Snapshot'
  },
  {
    id: 'c3',
    text: 'How often do you place bets that stretch or exceed your intended budget?',
    options: ['Never', 'Rarely', 'Sometimes', 'Often'],
    weight: [0, 1, 2, 3],
    pgsiWeight: [0, 1, 2, 3], // PGSI: Financial problems
    category: 'both',
    section: 'Psychological Snapshot'
  },
  {
    id: 'c4',
    text: 'After a loss, how often do you feel the urge to win the money back right away?',
    options: ['Never', 'Rarely', 'Sometimes', 'Often'],
    weight: [0, 1, 2, 3],
    pgsiWeight: [0, 1, 2, 3], // PGSI: Chasing losses
    category: 'both',
    section: 'Psychological Snapshot'
  },
  {
    id: 'c5',
    text: 'Which types of bets do you usually place? (Tap all that apply)',
    options: ['Straight bets', 'Parlays', 'Same-game parlays', 'In-game/live bets', 'Props', 'Futures'],
    weight: [0, 2, 3, 3, 1, 1],
    pgsiWeight: [0, 1, 2, 2, 0, 0], // Complex bets = higher risk
    multi: true,
    category: 'pgsi',
    section: 'Betting Style'
  },
  {
    id: 'c6',
    text: "What's your usual bet size?",
    options: ['Under $10', '$10–$25', '$25–$50', '$50–$100', 'Over $100'],
    weight: [0, 1, 2, 3, 4],
    pgsiWeight: [0, 1, 2, 3, 4], // Higher stakes = higher risk
    category: 'both',
    section: 'Betting Style'
  },
  {
    id: 'c7',
    text: 'How often do you adjust your bet size based on confidence or excitement?',
    options: ['Never', 'Rarely', 'Sometimes', 'Often'],
    weight: [0, 1, 2, 3],
    pgsiWeight: [0, 1, 2, 3], // Impulsivity indicator
    category: 'both',
    section: 'Betting Style'
  },
  {
    id: 'c8',
    text: 'How much do you rely on research before placing a bet?',
    options: ['None', '<5 min', '5–15 min', '15+ min'],
    weight: [3, 2, 1, 0], // More research = lower risk
    pgsiWeight: [3, 2, 1, 0], // Less research = higher risk
    category: 'both',
    section: 'Betting Style'
  },
  {
    id: 'c9',
    text: 'Which sports do you usually bet on? (Tap all that apply)',
    options: ['NFL', 'NBA', 'MLB', 'NHL', 'College sports', 'Soccer', 'UFC/MMA', 'Boxing', 'Tennis', 'Golf', 'Cricket', 'Motorsports', 'Esports'],
    weight: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    pgsiWeight: [0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 1], // College/combat/esports = higher risk
    multi: true,
    category: 'pgsi',
    section: 'Sport & Market Preferences'
  },
  {
    id: 'c10',
    text: 'Which sports do you feel you understand the most analytically?',
    options: ['NFL', 'NBA', 'MLB', 'NHL', 'College sports', 'Soccer', 'UFC/MMA', 'Boxing', 'Tennis', 'Golf', 'Cricket', 'Motorsports', 'Esports'],
    weight: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    pgsiWeight: [0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 1], // College/combat/esports = higher risk
    multi: true,
    category: 'pgsi',
    section: 'Sport & Market Preferences'
  },
  {
    id: 'c11',
    text: 'When do you typically bet most often?',
    options: ['Morning', 'Afternoon', 'Evening', 'Late night', 'No consistent pattern'],
    weight: [0, 1, 2, 3, 1],
    pgsiWeight: [0, 1, 2, 3, 2], // Late night = higher risk
    category: 'both',
    section: 'Sport & Market Preferences'
  },
  {
    id: 'c12',
    text: 'Do you track your betting performance?',
    options: ['No', 'Yes, informally', 'Yes, I track numbers', 'Yes, I use tools/platforms'],
    weight: [3, 2, 1, 0], // No tracking = higher risk
    pgsiWeight: [3, 2, 1, 0], // Same for PGSI
    category: 'both',
    section: 'Experience & Tracking'
  }
];

// Export types for the unified result
export interface UnifiedSurveyResult {
  serenityScore: number;      // 0-100 scale
  pgsiScore: number;           // 0-27 scale
  emotionalStability: number;  // 0-100 scale
  archetype: {
    id: string;
    name: string;
    description: string;
    positive: string;
    negative: string;
  };
  riskLevel: 'low' | 'moderate' | 'high' | 'problem';
  pgsiCategory: string;
}

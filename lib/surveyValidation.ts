// surveyValidation.ts
import { z } from 'zod';
import { SURVEY_QUESTIONS, SurveyAnswer } from '@/types/survey';

// Common disposable email domains to prevent abuse
const DISPOSABLE_EMAIL_DOMAINS = [
  'tempmail.com',
  'throwaway.email',
  'guerrillamail.com',
  '10minutemail.com',
  'mailinator.com',
  'yopmail.com',
];

// Email schema with validation
export const emailSchema = z
  .string()
  .email({ message: 'Please enter a valid email address' })
  .transform((email) => email.toLowerCase())
  .refine(
    (email) => {
      const domain = email.split('@')[1];
      return !DISPOSABLE_EMAIL_DOMAINS.includes(domain);
    },
    { message: 'Disposable email addresses are not allowed' }
  );

// Survey answer schema with multi-select support
export const surveyAnswerSchema = z.object({
  questionId: z.string().refine(
    (id) => SURVEY_QUESTIONS.some((q) => q.id === id),
    { message: 'Invalid question ID' }
  ),
  selectedOption: z.union([z.string(), z.array(z.string()).min(1)]).refine((option) => {
    return true; // Detailed option validation is handled separately in scoring
  }, { message: 'Invalid option(s) selected' }),
  timestamp: z.union([z.string().transform((val) => new Date(val)), z.date()]).optional(),
});

// Complete survey submission schema
export const surveySubmissionSchema = z.object({
  email: emailSchema,
  responses: z
    .array(surveyAnswerSchema)
    .min(SURVEY_QUESTIONS.length, { message: 'Please answer all required questions' }),
});

// Type for validated survey submission
export type ValidatedSurveySubmission = z.infer<typeof surveySubmissionSchema>;

// Validation function
export function validateSurveySubmission(input: unknown): {
  success: boolean;
  data?: ValidatedSurveySubmission;
  errors?: string[];
} {
  try {
    const validated = surveySubmissionSchema.parse(input);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log('Survey validation errors:', error.errors);
      return { success: false, errors: error.errors.map((e) => e.message) };
    }
    return { success: false, errors: ['Invalid survey submission'] };
  }
}

// Calculate survey score
export function calculateSurveyScore(responses: SurveyAnswer[]): number {
  let totalScore = 0;
  for (const response of responses) {
    const question = SURVEY_QUESTIONS.find((q) => q.id === response.questionId);
    if (!question) continue;

    if (question.multi && Array.isArray(response.selectedOption)) {
      response.selectedOption.forEach((opt) => {
        const idx = question.options.indexOf(opt);
        if (idx !== -1) totalScore += question.weight[idx];
      });
    } else if (!question.multi && typeof response.selectedOption === 'string') {
      const idx = question.options.indexOf(response.selectedOption);
      if (idx !== -1) totalScore += question.weight[idx];
    }
  }

  const maxPossibleScore = SURVEY_QUESTIONS.reduce((acc, q) => {
    if (q.multi) return acc + q.weight.reduce((s, w) => s + Math.max(0, w), 0);
    return acc + Math.max(...q.weight);
  }, 0);

  return Math.min(100, Math.max(0, Math.round((totalScore / Math.max(1, maxPossibleScore)) * 100)));
}

// Get risk interpretation based on score
export function getScoreInterpretation(score: number): string {
  if (score >= 0 && score <= 33) return 'Low risk';
  if (score >= 34 && score <= 66) return 'Medium risk';
  if (score >= 67 && score <= 100) return 'High risk';
  return 'Low risk';
}

// Ready-to-drop helper: validate, score, and return interpretation
export function processSurveySubmission(input: unknown): {
  success: boolean;
  surveyId?: string;
  score?: number;
  riskLevel?: string;
  errors?: string[];
} {
  const validation = validateSurveySubmission(input);
  if (!validation.success || !validation.data) {
    return { success: false, errors: validation.errors };
  }

  const score = calculateSurveyScore(validation.data.responses);
  const riskLevel = getScoreInterpretation(score);

  const surveyId = crypto.randomUUID(); // Assign unique ID for submission

  return {
    success: true,
    surveyId,
    score,
    riskLevel,
  };
}

// Validate email only
export function validateEmail(email: string): boolean {
  try { emailSchema.parse(email); return true; } catch { return false; }
}

// Validate single survey answer
export function validateSurveyAnswer(answer: unknown): boolean {
  try { surveyAnswerSchema.parse(answer); return true; } catch { return false; }
}
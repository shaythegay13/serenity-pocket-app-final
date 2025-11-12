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

// Survey answer schema
export const surveyAnswerSchema = z.object({
  questionId: z.string().refine(
    (id) => SURVEY_QUESTIONS.some((q) => q.id === id),
    { message: 'Invalid question ID' }
  ),
  selectedOption: z.string().refine(
    function(option) {
      // This will be validated in the parent schema context
      return true;
    },
    { message: 'Invalid option selected' }
  ),
  timestamp: z.union([
    z.string().transform((val) => new Date(val)),
    z.date()
  ]).optional(),
});

// Complete survey submission schema
export const surveySubmissionSchema = z.object({
  email: emailSchema,
  responses: z
    .array(surveyAnswerSchema)
    .length(8, { message: 'All 8 questions must be answered' })
    .refine(
      (responses) => {
        // Check all questions are answered exactly once
        const questionIds = responses.map((r) => r.questionId);
        const uniqueIds = new Set(questionIds);
        return uniqueIds.size === 8;
      },
      { message: 'Each question must be answered exactly once' }
    )
    .refine(
      (responses) => {
        // Validate that selected options are valid for each question
        return responses.every((response) => {
          const question = SURVEY_QUESTIONS.find((q) => q.id === response.questionId);
          return question && question.options.includes(response.selectedOption);
        });
      },
      { message: 'Invalid answer option for one or more questions' }
    ),
});

// Type for validated survey submission
export type ValidatedSurveySubmission = z.infer<typeof surveySubmissionSchema>;

// Validation function with error handling
export function validateSurveySubmission(input: unknown): {
  success: boolean;
  data?: ValidatedSurveySubmission;
  errors?: string[];
} {
  try {
    const validated = surveySubmissionSchema.parse(input);
    return {
      success: true,
      data: validated,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map((e) => e.message),
      };
    }
    return {
      success: false,
      errors: ['Invalid survey submission'],
    };
  }
}

// Calculate survey score based on responses
export function calculateSurveyScore(responses: SurveyAnswer[]): number {
  let totalScore = 0;
  
  for (const response of responses) {
    const question = SURVEY_QUESTIONS.find((q) => q.id === response.questionId);
    if (!question) continue;
    
    const optionIndex = question.options.indexOf(response.selectedOption);
    if (optionIndex === -1) continue;
    
    totalScore += question.weight[optionIndex];
  }
  
  // Return raw score (max possible is around 144 points)
  // But we'll scale it to 0-50 for compatibility with original system
  const maxPossibleScore = 144; // Sum of all maximum weights
  const scaledScore = Math.round((totalScore / maxPossibleScore) * 50);
  
  return Math.min(50, Math.max(0, scaledScore));
}

// Validate email format only
export function validateEmail(email: string): boolean {
  try {
    emailSchema.parse(email);
    return true;
  } catch {
    return false;
  }
}

// Validate individual survey answer
export function validateSurveyAnswer(answer: unknown): boolean {
  try {
    surveyAnswerSchema.parse(answer);
    return true;
  } catch {
    return false;
  }
}

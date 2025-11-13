import { z } from 'zod';
import { SURVEY_B_QUESTIONS, SurveyAnswer } from '@/types/survey';

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

// Survey B answer schema
export const surveyBAnswerSchema = z.object({
  questionId: z.string().refine(
    (id) => SURVEY_B_QUESTIONS.some((q) => q.id === id),
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

// Complete Survey B submission schema
export const surveyBSubmissionSchema = z.object({
  email: emailSchema,
  responses: z
    .array(surveyBAnswerSchema)
    .length(10, { message: 'All 10 questions must be answered' })
    .refine(
      (responses) => {
        // Check all questions are answered exactly once
        const questionIds = responses.map((r) => r.questionId);
        const uniqueIds = new Set(questionIds);
        return uniqueIds.size === 10;
      },
      { message: 'Each question must be answered exactly once' }
    )
    .refine(
      (responses) => {
        // Validate that selected options are valid for each question
        return responses.every((response) => {
          const question = SURVEY_B_QUESTIONS.find((q) => q.id === response.questionId);
          return question && question.options.includes(response.selectedOption);
        });
      },
      { message: 'Invalid answer option for one or more questions' }
    ),
});

// Type for validated Survey B submission
export type ValidatedSurveyBSubmission = z.infer<typeof surveyBSubmissionSchema>;

// Validation function with error handling
export function validateSurveyBSubmission(input: unknown): {
  success: boolean;
  data?: ValidatedSurveyBSubmission;
  errors?: string[];
} {
  try {
    const validated = surveyBSubmissionSchema.parse(input);
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

// Calculate Survey B score based on responses
export function calculateSurveyBScore(responses: SurveyAnswer[]): number {
  let totalScore = 0;
  
  for (const response of responses) {
    const question = SURVEY_B_QUESTIONS.find((q) => q.id === response.questionId);
    if (!question) continue;
    
    const optionIndex = question.options.indexOf(response.selectedOption);
    if (optionIndex === -1) continue;
    
    totalScore += question.weight[optionIndex];
  }
  
  // Return raw score (max possible is 150 points)
  return Math.min(150, Math.max(0, totalScore));
}

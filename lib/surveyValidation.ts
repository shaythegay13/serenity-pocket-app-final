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
    .min(12, { message: 'Please answer all required questions' })
    .refine((responses) => {
      // For non-multi questions: exactly one answer per question
      const singles = SURVEY_QUESTIONS.filter((q) => !q.multi).map((q) => q.id);
      return singles.every((id) => responses.filter((r) => r.questionId === id).length === 1);
    }, { message: 'Each single-select question must be answered exactly once' })
    .refine((responses) => {
      // For multi questions: at least one answer per question
      const multis = SURVEY_QUESTIONS.filter((q) => q.multi).map((q) => q.id);
      return multis.every((id) => responses.filter((r) => r.questionId === id).length >= 1);
    }, { message: 'Please select at least one option for each multi-select question' })
    .refine(
      (responses) => {
        // Validate that selected options are valid for each question
        return responses.every((response) => {
          const question = SURVEY_QUESTIONS.find((q) => q.id === response.questionId);
          return question != null && question.options.includes(response.selectedOption);
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

  // Scale to 0-50 dynamically based on the theoretical maximum
  const maxPossibleScore = SURVEY_QUESTIONS.reduce((acc, q) => {
    if (q.multi) {
      // Sum positive weights since multi-select can choose multiple options
      const sum = q.weight.reduce((s, w) => s + Math.max(0, w), 0);
      return acc + sum;
    }
    return acc + Math.max(...q.weight);
  }, 0);

  const scaledScore = Math.round((totalScore / Math.max(1, maxPossibleScore)) * 50);
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

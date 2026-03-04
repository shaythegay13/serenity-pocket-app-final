import { surveyService } from './survey-service';
import { SurveyAnswer } from '@/types/survey';

/**
 * Wrapper function to submit a survey and return score + riskLevel for frontend
 */
export async function submitSurveyAndReturn(
  userId: string | null,
  anonymousId: string | null,
  responses: SurveyAnswer[]
): Promise<{
  success: boolean;
  surveyId: string;
  score: number;
  riskLevel: string;
}> {
  // Rate-limit / prevent multiple submissions if needed
  const alreadyTaken = await surveyService.hasTakenSurveyToday(userId, anonymousId);
  if (alreadyTaken) {
    return {
      success: false,
      surveyId: '',
      score: 0,
      riskLevel: 'already_submitted',
    };
  }

  try {
    const results = await surveyService.submitSurvey(userId, anonymousId, responses);

    return {
      success: true,
      surveyId: results.surveyId || '', // ensure id exists
      score: results.serenityScore,
      riskLevel: results.riskLevel,
    };
  } catch (err: any) {
    console.error('Error submitting survey:', err);
    return {
      success: false,
      surveyId: '',
      score: 0,
      riskLevel: 'error',
    };
  }
}
import { supabaseServer } from '@/lib/supabase-server';
import { SurveyAnswer } from '@/types/survey';
import {
  validateSurveyBSubmission,
  calculateSurveyBScore,
} from '@/lib/surveyValidationB';

// Submit anonymous Survey B
export async function submitAnonymousSurveyB(
  email: string,
  responses: SurveyAnswer[],
  submittedFromIp?: string
): Promise<{ surveyId: string; score: number }> {
  // Validate input
  const validation = validateSurveyBSubmission({ email, responses });
  if (!validation.success || !validation.data) {
    throw new Error(`Validation failed: ${validation.errors?.join(', ')}`);
  }

  // Calculate score
  const score = calculateSurveyBScore(responses);

  console.log('Submitting Survey B to database:', {
    email,
    score,
    responseCount: responses.length,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
  });

  // Insert into database using server client (bypasses RLS)
  // Note: Using the same table but with a flag to identify Survey B
  const { data, error } = await supabaseServer
    .from('anonymous_survey_submissions')
    .insert({
      email,
      responses,
      score,
      submitted_from_ip: submittedFromIp,
      survey_type: 'B', // Add this field to identify Survey B
    })
    .select('id')
    .single();

  if (error) {
    console.error('Database insert error:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    throw new Error(`Failed to submit survey: ${error.message} (${error.code})`);
  }

  if (!data) {
    throw new Error('No data returned from insert operation');
  }

  console.log('Survey B inserted successfully:', data.id);
  return { surveyId: data.id, score };
}

// Check if anonymous Survey B exists for email
export async function checkExistingAnonymousSurveyB(
  email: string
): Promise<boolean> {
  const { data, error } = await supabaseServer
    .from('anonymous_survey_submissions')
    .select('id')
    .eq('email', email)
    .eq('survey_type', 'B')
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 is "no rows returned"
    throw new Error(`Failed to check existing survey: ${error.message}`);
  }

  return !!data;
}

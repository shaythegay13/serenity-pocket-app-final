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

  // Insert submission record first
  const { data: submissionData, error: submissionError } = await supabaseServer
    .from('anonymous_survey_b_submissions')
    .insert({
      email,
      score,
      submitted_from_ip: submittedFromIp,
    })
    .select('id')
    .single();

  if (submissionError) {
    console.error('Database insert error:', {
      message: submissionError.message,
      code: submissionError.code,
      details: submissionError.details,
      hint: submissionError.hint
    });
    throw new Error(`Failed to submit survey: ${submissionError.message} (${submissionError.code})`);
  }

  if (!submissionData) {
    throw new Error('No data returned from insert operation');
  }

  // Insert individual answers
  const answerRecords = responses.map(response => ({
    submission_id: submissionData.id,
    question_id: response.questionId,
    selected_option: response.selectedOption,
  }));

  const { error: answersError } = await supabaseServer
    .from('anonymous_survey_b_answers')
    .insert(answerRecords);

  if (answersError) {
    console.error('Error inserting answers:', answersError);
    // Try to clean up the submission if answers failed
    await supabaseServer
      .from('anonymous_survey_b_submissions')
      .delete()
      .eq('id', submissionData.id);
    throw new Error(`Failed to insert answers: ${answersError.message}`);
  }

  console.log('Survey B inserted successfully:', submissionData.id);
  return { surveyId: submissionData.id, score };
}

// Check if anonymous Survey B exists for email
export async function checkExistingAnonymousSurveyB(
  email: string
): Promise<boolean> {
  const { data, error } = await supabaseServer
    .from('anonymous_survey_b_submissions')
    .select('id')
    .eq('email', email)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 is "no rows returned"
    throw new Error(`Failed to check existing survey: ${error.message}`);
  }

  return !!data;
}

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
      responses, // Include responses for compatibility with table schema
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

// Check if anonymous Survey B exists for email AND if user has created an account
export async function checkExistingAnonymousSurveyB(
  email: string
): Promise<boolean> {
  // First check if there's an existing anonymous survey
  const { data: surveyData, error: surveyError } = await supabaseServer
    .from('anonymous_survey_b_submissions')
    .select('id')
    .eq('email', email)
    .single();

  if (surveyError && surveyError.code !== 'PGRST116') {
    // PGRST116 is "no rows returned"
    throw new Error(`Failed to check existing survey: ${surveyError.message}`);
  }

  // If no survey exists, return false (allow submission)
  if (!surveyData) {
    return false;
  }

  // Survey exists - now check if the email has an associated user account
  const { data: userData, error: userError } = await supabaseServer.auth.admin.listUsers();

  if (userError) {
    console.error('Error checking for user account:', userError);
    // If we can't check user status, be conservative and block resubmission
    return true;
  }

  // Check if any user has this email
  const userExists = userData.users.some(user => user.email === email);

  // Only block resubmission if the user has created an account
  // If no account exists, allow them to submit again (old data is preserved)
  return userExists;
}

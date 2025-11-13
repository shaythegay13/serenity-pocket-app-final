import { supabase } from '@/lib/supabase';
import { supabaseServer } from '@/lib/supabase-server';
import {
  AnonymousSurveySubmission,
  SurveyResponse,
  SurveyHistoryData,
  TimeRangeFilter,
  SurveyAnswer,
} from '@/types/survey';
import {
  validateSurveySubmission,
  calculateSurveyScore,
} from '@/lib/surveyValidation';
import { subMonths } from 'date-fns';

// Submit anonymous survey
export async function submitAnonymousSurvey(
  email: string,
  responses: SurveyAnswer[],
  submittedFromIp?: string
): Promise<{ surveyId: string; score: number }> {
  // Validate input
  const validation = validateSurveySubmission({ email, responses });
  if (!validation.success || !validation.data) {
    throw new Error(`Validation failed: ${validation.errors?.join(', ')}`);
  }

  // Calculate score
  const score = calculateSurveyScore(responses);

  console.log('Submitting Survey A to database:', {
    email,
    score,
    responseCount: responses.length,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
  });

  // Insert submission record first
  const { data: submissionData, error: submissionError } = await supabaseServer
    .from('anonymous_survey_submissions')
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
    .from('anonymous_survey_a_answers')
    .insert(answerRecords);

  if (answersError) {
    console.error('Error inserting answers:', answersError);
    // Try to clean up the submission if answers failed
    await supabaseServer
      .from('anonymous_survey_submissions')
      .delete()
      .eq('id', submissionData.id);
    throw new Error(`Failed to insert answers: ${answersError.message}`);
  }

  console.log('Survey A inserted successfully:', submissionData.id);
  return { surveyId: submissionData.id, score };
}

// Check if anonymous survey exists for email
export async function checkExistingAnonymousSurvey(
  email: string
): Promise<boolean> {
  const { data, error } = await supabaseServer
    .from('anonymous_survey_submissions')
    .select('id')
    .eq('email', email)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 is "no rows returned"
    throw new Error(`Failed to check existing survey: ${error.message}`);
  }

  return !!data;
}

// Get user survey history
export async function getUserSurveyHistory(
  userId: string
): Promise<SurveyHistoryData> {
  const { data, error } = await supabase
    .from('survey_responses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch survey history: ${error.message}`);
  }

  const surveys: SurveyResponse[] = (data || []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    email: row.email,
    responses: row.responses,
    score: row.score,
    createdAt: new Date(row.created_at),
    linkedAt: new Date(row.linked_at),
    isInitialSurvey: row.is_initial_survey,
  }));

  const scoreHistory = surveys.map((survey) => ({
    date: survey.createdAt,
    score: survey.score,
  }));

  const latestScore = surveys.length > 0 ? surveys[0].score : 0;

  return {
    surveys,
    latestScore,
    scoreHistory,
  };
}

// Get filtered survey history by time range
export async function getUserSurveyHistoryFiltered(
  userId: string,
  timeRange: TimeRangeFilter
): Promise<SurveyHistoryData> {
  let dateThreshold: Date | null = null;

  switch (timeRange) {
    case 'three-months':
      dateThreshold = subMonths(new Date(), 3);
      break;
    case 'six-months':
      dateThreshold = subMonths(new Date(), 6);
      break;
    case 'one-year':
      dateThreshold = subMonths(new Date(), 12);
      break;
    case 'all-time':
    default:
      // No date filtering for all-time
      break;
  }

  let query = supabase
    .from('survey_responses')
    .select('*')
    .eq('user_id', userId);

  if (dateThreshold) {
    query = query.gte('created_at', dateThreshold.toISOString());
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch filtered survey history: ${error.message}`);
  }

  const surveys: SurveyResponse[] = (data || []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    email: row.email,
    responses: row.responses,
    score: row.score,
    createdAt: new Date(row.created_at),
    linkedAt: new Date(row.linked_at),
    isInitialSurvey: row.is_initial_survey,
  }));

  const scoreHistory = surveys.map((survey) => ({
    date: survey.createdAt,
    score: survey.score,
  }));

  const latestScore = surveys.length > 0 ? surveys[0].score : 0;

  return {
    surveys,
    latestScore,
    scoreHistory,
  };
}

// Submit authenticated survey (for retakes)
export async function submitAuthenticatedSurvey(
  userId: string,
  responses: SurveyAnswer[]
): Promise<{ surveyId: string; score: number }> {
  // Verify user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user || user.id !== userId) {
    throw new Error('User not authenticated or user ID mismatch');
  }

  // Calculate score
  const score = calculateSurveyScore(responses);

  // Insert into database
  const { data, error } = await supabase
    .from('survey_responses')
    .insert({
      user_id: userId,
      email: user.email,
      responses,
      score,
      is_initial_survey: false,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to submit authenticated survey: ${error.message}`);
  }

  return { surveyId: data.id, score };
}

// Migrate anonymous survey to user (called from API route)
export async function migrateAnonymousSurveyToUser(
  email: string,
  userId: string
): Promise<number> {
  const { data, error } = await supabase.rpc('migrate_anonymous_survey_to_user', {
    p_email: email,
    p_user_id: userId,
  });

  if (error) {
    throw new Error(`Failed to migrate survey: ${error.message}`);
  }

  return data as number;
}

// Get latest survey score for user
export async function getLatestSurveyScore(userId: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('survey_responses')
    .select('score')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No surveys yet
      return null;
    }
    throw new Error(`Failed to fetch latest score: ${error.message}`);
  }

  return data.score;
}

// Delete anonymous survey (for cleanup)
export async function deleteAnonymousSurvey(email: string): Promise<void> {
  const { error } = await supabase
    .from('anonymous_survey_submissions')
    .delete()
    .eq('email', email);

  if (error) {
    throw new Error(`Failed to delete anonymous survey: ${error.message}`);
  }
}

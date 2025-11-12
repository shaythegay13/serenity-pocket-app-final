import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { validateSurveySubmission, calculateSurveyScore } from '@/lib/surveyValidation';

export async function POST(request: NextRequest) {
  console.log('=== AUTHENTICATED SURVEY RETAKE API CALLED ===');

  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Extract responses
    const { responses } = body;

    // Get authenticated user
    const cookieStore = await cookies();
    // @ts-ignore - Next.js 16 cookies() returns Promise but auth helpers expect sync
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized - please log in' },
        { status: 401 }
      );
    }

    console.log('User authenticated:', user.id);

    // Validate submission (without email since user is authenticated)
    const validation = validateSurveySubmission({ email: user.email || '', responses });
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    // Calculate score
    const score = calculateSurveyScore(responses);

    console.log('Inserting survey response for user:', user.id, 'with score:', score);

    // Insert into survey_responses table
    const { data, error } = await supabase
      .from('survey_responses')
      .insert({
        user_id: user.id,
        email: user.email,
        responses,
        score,
        is_initial_survey: false,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Database insert error:', error);
      return NextResponse.json(
        {
          error: 'Failed to submit survey',
          details: error.message,
        },
        { status: 500 }
      );
    }

    console.log('Survey submitted successfully:', data.id);

    return NextResponse.json(
      {
        success: true,
        surveyId: data.id,
        score: score,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Survey retake error:', {
      message: error?.message,
      code: error?.code,
      details: error?.details,
    });

    return NextResponse.json(
      {
        error: 'Failed to submit survey',
        details: error?.message || 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

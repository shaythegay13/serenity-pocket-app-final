import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calculateSurveyScore } from '@/lib/surveyValidation';
import { computeArchetype } from '@/lib/archetypes';
import { supabaseServer } from '@/lib/supabase-server';
import type { SurveyAnswer } from '@/types/survey';

export async function POST(request: NextRequest) {
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

    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - please log in' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client to validate token
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: { user }, error: authError } = await authClient.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - please log in' },
        { status: 401 }
      );
    }

    // Lightweight validation for authenticated retake (skip email validation since user is already authenticated)
    if (!responses || !Array.isArray(responses) || responses.length === 0) {
      return NextResponse.json(
        { error: 'Validation failed', errors: ['No survey responses provided'] },
        { status: 400 }
      );
    }

    // Verify each response has required fields
    const invalidResponses = responses.filter(
      (r: any) => !r.questionId || (!r.selectedOption && r.selectedOption !== 0)
    );
    if (invalidResponses.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', errors: ['Some responses are missing questionId or selectedOption'] },
        { status: 400 }
      );
    }

    // Calculate score
    const score = calculateSurveyScore(responses);

    // Compute archetype from survey responses
    const archetype = computeArchetype(responses as SurveyAnswer[]);

    // Use server client for database operations (has service role key to bypass RLS)
    const supabase = supabaseServer;

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
      return NextResponse.json(
        {
          error: 'Failed to submit survey',
          details: error.message,
        },
        { status: 500 }
      );
    }

    // Fetch existing profile to merge survey data
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('survey_data')
      .eq('id', user.id)
      .single();

    const existingSurveyData = (profileData?.survey_data as any) || {};

    // Update user profile with archetype (merge with existing data)
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        survey_data: {
          ...existingSurveyData,
          score,
          level: score <= 33 ? 'Low Risk' : score <= 66 ? 'Moderate Risk' : 'High Risk',
          userType: archetype.name,
        }
      })
      .eq('id', user.id);

    if (profileError) {
      // Log but don't fail - survey was successfully submitted
      console.error('Error updating profile:', profileError);
    }

    return NextResponse.json(
      {
        success: true,
        surveyId: data.id,
        score: score,
        archetype: archetype.name,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Survey retake error:', error?.message);

    return NextResponse.json(
      {
        error: 'Failed to submit survey',
        details: error?.message || 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

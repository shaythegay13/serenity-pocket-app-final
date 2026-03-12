import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { migrateAnonymousSurveyToUser } from '@/lib/surveyService';

export async function POST() {
  try {
    const supabase = supabaseServer;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to continue.' },
        { status: 401 }
      );
    }

    if (!user.email) {
      return NextResponse.json(
        { error: 'No email found for user' },
        { status: 400 }
      );
    }

    // Call migration function
    const migratedCount = await migrateAnonymousSurveyToUser(
      user.email,
      user.id
    );

    if (migratedCount === 0) {
      return NextResponse.json(
        {
          error: 'No survey found',
          message: 'No anonymous survey was found for this email address.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        migratedCount: migratedCount,
        message: 'Survey successfully linked to your account.',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Migration error:', error);

    if (error?.message?.includes('already migrated')) {
      return NextResponse.json(
        {
          error: 'Already linked',
          message: 'This survey has already been linked to an account.',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to migrate survey',
        details: error?.message || 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

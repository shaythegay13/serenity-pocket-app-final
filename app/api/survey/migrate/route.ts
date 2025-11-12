import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { migrateAnonymousSurveyToUser } from '@/lib/surveyService';

export async function POST() {
  console.log('=== MANUAL SURVEY MIGRATION API CALLED ===');

  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Authentication failed:', authError);
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

    console.log('Migrating survey for user:', {
      id: user.id,
      email: user.email,
    });

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

    console.log('Survey migrated successfully:', {
      userId: user.id,
      email: user.email,
      migratedCount: migratedCount,
    });

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

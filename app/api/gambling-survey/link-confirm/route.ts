import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { migrateAnonymousSurveyToUser } from '@/lib/surveyService';

export async function POST(request: NextRequest) {
  console.log('=== SURVEY LINK CONFIRM API CALLED ===');

  try {
    // Create server-side Supabase client
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Verify authentication
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

    console.log('Authenticated user:', {
      id: user.id,
      email: user.email,
    });

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

    const { email } = body;

    // Validate email matches authenticated user
    if (!email || email !== user.email) {
      return NextResponse.json(
        {
          error: 'Email mismatch',
          message: 'The provided email does not match your account email.',
        },
        { status: 400 }
      );
    }

    // Call migration function
    try {
      const migratedCount = await migrateAnonymousSurveyToUser(
        email,
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
        email: email,
        migratedCount: migratedCount,
      });

      // Log for audit trail (non-fatal if it fails)
      const { error: auditError } = await supabase
        .from('audit_logs')
        .insert({
          user_id: user.id,
          action: 'survey_linked',
          details: {
            email: email,
            migrated_count: migratedCount,
          },
        });
      
      if (auditError) {
        // Non-fatal error, just log it
        console.error('Failed to create audit log:', auditError);
      }

      return NextResponse.json(
        {
          success: true,
          migratedCount: migratedCount,
          message: 'Survey successfully linked to your account.',
        },
        { status: 200 }
      );
    } catch (migrationError: any) {
      console.error('Migration error:', migrationError);

      // Check for specific error types
      if (migrationError?.message?.includes('already migrated')) {
        return NextResponse.json(
          {
            error: 'Already linked',
            message: 'This survey has already been linked to an account.',
          },
          { status: 409 }
        );
      }

      if (migrationError?.message?.includes('No anonymous survey')) {
        return NextResponse.json(
          {
            error: 'Survey not found',
            message: 'No survey was found with this email address.',
          },
          { status: 404 }
        );
      }

      throw migrationError;
    }
  } catch (error: any) {
    console.error('Survey link confirmation error:', {
      message: error?.message,
      code: error?.code,
      details: error?.details,
    });

    return NextResponse.json(
      {
        error: 'Failed to link survey',
        details: error?.message || 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

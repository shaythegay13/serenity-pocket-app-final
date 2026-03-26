import { NextResponse } from 'next/server';
import { surveyService } from '@/lib/services/survey-service';
import { checkRateLimit } from '@/lib/rate-limiter';
import { isFeatureEnabled } from '@/lib/features/flags';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function POST(request: Request) {
  if (!isFeatureEnabled('HYBRID_SURVEY')) {
    return NextResponse.json(
      { error: 'This survey version is not currently available' },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();
    if (!body.responses || !Array.isArray(body.responses)) {
      return NextResponse.json(
        { error: 'Invalid request body: responses array required' },
        { status: 400 }
      );
    }

    // ✅ Await cookies() because it returns a Promise in Next.js 15+
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
          set() {}, // not needed for reading
          remove() {},
        },
      }
    );

    // Try cookie-based auth first
    let { data: { user } } = await supabase.auth.getUser();

    // Fallback: validate Bearer token from Authorization header
    // (needed when session is stored in localStorage, not cookies)
    if (!user) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const { data: { user: tokenUser } } = await supabase.auth.getUser(token);
        user = tokenUser;
      }
    }

    const userId = user?.id || null;

    let anonymousId = body.anonymousSessionId;
    if (!anonymousId) {
      anonymousId = cookieStore.get('anonymous_session_id')?.value;
    }

    const identifier = userId || anonymousId;
    if (!identifier) {
      return NextResponse.json(
        { error: 'Unable to identify user' },
        { status: 400 }
      );
    }

    const limitResult = checkRateLimit(identifier, { maxRequests: 3, windowMs: 3600000 });
    if (!limitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many survey attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Only enforce the once-per-day limit for anonymous users.
    // Authenticated users are allowed to retake the survey freely.
    if (!userId) {
      const hasTaken = await surveyService.hasTakenSurveyToday(null, anonymousId);
      if (hasTaken) {
        return NextResponse.json(
          { error: 'You have already completed the survey today' },
          { status: 429 }
        );
      }
    }

    const results = await surveyService.submitSurvey(userId, anonymousId, body.responses);

    return NextResponse.json({
      success: true,
      results: {
        serenityScore: results.serenityScore,
        pgsiScore: results.pgsiScore,
        emotionalStability: results.emotionalStability,
        archetype: results.archetype,
        riskLevel: results.riskLevel
      }
    });

  } catch (error) {
    console.error('POST error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    // ✅ Await cookies() here as well
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
          set() {},
          remove() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || null;
    const anonymousId = cookieStore.get('anonymous_session_id')?.value ?? null;

    const hasTaken = await surveyService.hasTakenSurveyToday(userId, anonymousId);

    return NextResponse.json({
      canTake: !hasTaken,
      message: hasTaken ? 'Survey already completed today' : 'Survey available'
    });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Failed to check survey status' },
      { status: 500 }
    );
  }
}

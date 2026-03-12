import { NextRequest, NextResponse } from 'next/server';
import {
  submitAnonymousSurvey,
  checkExistingAnonymousSurvey,
} from '@/lib/surveyService';
import { validateSurveySubmission } from '@/lib/surveyValidation';

// Rate limiting map (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  record.count++;
  return true;
}

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

    // Extract email and responses
    const { email, responses } = body;

    // Validate submission
    const validation = validateSurveySubmission({ email, responses });
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    // Get client IP for rate limiting and storage
    const forwarded = request.headers.get('x-forwarded-for');
    const real = request.headers.get('x-real-ip');
    const clientIp = forwarded?.split(',')[0] || real || 'unknown';

    // Check rate limit
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Check if survey already exists for this email
    try {
      const exists = await checkExistingAnonymousSurvey(email);
      if (exists) {
        return NextResponse.json(
          {
            error: 'Survey already submitted',
            message: 'A survey has already been submitted with this email address.',
          },
          { status: 409 }
        );
      }
    } catch (error) {
      console.error('Error checking existing survey:', error);
      // Continue with submission if check fails
    }

    // Submit anonymous survey
    const result = await submitAnonymousSurvey(
      email,
      responses,
      clientIp !== 'unknown' ? clientIp : undefined
    );

    return NextResponse.json(
      {
        success: true,
        surveyId: result.surveyId,
        score: result.score,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Survey submission error:', error?.message);

    // Check for specific error types
    if (error?.code === 'PGRST301' || error?.message?.includes('RLS')) {
      return NextResponse.json(
        {
          error: 'Permission denied',
          message: 'Unable to submit survey due to permission restrictions.',
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to submit survey',
        details: error?.message || 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

// Clean up old rate limit records periodically
if (typeof global !== 'undefined' && !(global as any).rateLimitCleanupInterval) {
  (global as any).rateLimitCleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of rateLimitMap.entries()) {
      if (now > record.resetTime + RATE_LIMIT_WINDOW) {
        rateLimitMap.delete(ip);
      }
    }
  }, RATE_LIMIT_WINDOW * 2);
}

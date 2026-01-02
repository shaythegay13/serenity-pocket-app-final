import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  try {
    // Get auth token
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')

    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
    const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()
    const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json(
        {
          error:
            'Supabase server env vars missing. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.',
        },
        { status: 500 }
      )
    }

    if (!serviceRoleKey) {
      return NextResponse.json(
        {
          error:
            'Supabase service role key missing. Ensure SUPABASE_SERVICE_ROLE_KEY is set (server-side only).',
        },
        { status: 500 }
      )
    }

    // Use a plain server-side client to validate the user token.
    // (Avoid importing the client-component supabase helper inside route handlers.)
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseAuth = createClient(supabaseUrl, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          ...(process.env.NODE_ENV === 'development'
            ? {
                details: {
                  authError: authError
                    ? {
                        message: authError.message,
                        name: (authError as any).name,
                        status: (authError as any).status,
                      }
                    : null,
                },
              }
            : {}),
        },
        { status: 401 }
      )
    }

    // Use service role client to bypass RLS and ensure we get the latest data
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Fetch user profile with subscription data
    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .select('subscription_tier, subscription_status, subscription_started_at, subscription_ends_at')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('❌ Error fetching subscription:', error)
      return NextResponse.json(
        {
          error: error.message,
          ...(process.env.NODE_ENV === 'development'
            ? { details: { hint: (error as any)?.hint, code: (error as any)?.code } }
            : {}),
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch subscription data',
        ...(process.env.NODE_ENV === 'development'
          ? {
              details:
                error instanceof Error
                  ? { message: error.message, stack: error.stack }
                  : { message: String(error) },
            }
          : {}),
      },
      { status: 500 }
    )
  }
}

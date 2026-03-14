import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'

// TEMPORARY TEST ENDPOINT - Remove in production
export async function POST(req: Request) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { tier } = await req.json()
    
    // Validate tier
    const validTiers = ['free', 'premium', 'premium_plus', 'elite']
    if (!validTiers.includes(tier)) {
      return NextResponse.json({ error: `Invalid tier: ${tier}` }, { status: 400 })
    }
    
    // Get auth token
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Manually update subscription
    const now = new Date()
    const nextMonth = new Date(now)
    nextMonth.setMonth(nextMonth.getMonth() + 1)

    console.log(' Attempting to update subscription for user:', user.id)
    
    // Use service role client to bypass RLS
    const { createClient } = await import('@supabase/supabase-js')

    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
    const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()

    if (!supabaseUrl) {
      return NextResponse.json(
        { error: 'Missing NEXT_PUBLIC_SUPABASE_URL on server' },
        { status: 500 }
      )
    }

    if (!serviceRoleKey) {
      return NextResponse.json(
        {
          error:
            'Missing SUPABASE_SERVICE_ROLE_KEY on server. Add it to .env.local and restart the dev server.',
        },
        { status: 500 }
      )
    }

    // Basic validation to catch common misconfiguration early.
    // Supabase keys are JWTs and the service role key should typically have HS256 in its header.
    const jwtParts = serviceRoleKey.split('.')

    const urlRef = (() => {
      try {
        return new URL(supabaseUrl).hostname.split('.')[0]
      } catch {
        return undefined
      }
    })()

    const decodedPayload = (() => {
      if (jwtParts.length !== 3) return undefined
      try {
        return JSON.parse(
          Buffer.from(jwtParts[1], 'base64url').toString('utf8')
        ) as Record<string, unknown>
      } catch {
        try {
          return JSON.parse(
            Buffer.from(jwtParts[1], 'base64').toString('utf8')
          ) as Record<string, unknown>
        } catch {
          return undefined
        }
      }
    })()

    const keyRef =
      decodedPayload && typeof decodedPayload.ref === 'string'
        ? decodedPayload.ref
        : undefined

    if (jwtParts.length !== 3) {
      return NextResponse.json(
        {
          error:
            'SUPABASE_SERVICE_ROLE_KEY does not look like a JWT (expected 3 dot-separated parts). Please paste the exact service_role key from Supabase Dashboard → Settings → API.',
        },
        { status: 500 }
      )
    }

    try {
      // JWT uses base64url encoding for its parts.
      const decodedHeader = (() => {
        try {
          return Buffer.from(jwtParts[0], 'base64url').toString('utf8')
        } catch {
          // Fallback for older Node/base64url edge cases
          return Buffer.from(jwtParts[0], 'base64').toString('utf8')
        }
      })()

      const headerJson = JSON.parse(decodedHeader) as { alg?: string; typ?: string }

      if (headerJson?.alg && headerJson.alg !== 'HS256') {
        return NextResponse.json(
          {
            error: `SUPABASE_SERVICE_ROLE_KEY appears malformed (JWT alg is ${headerJson.alg}, expected HS256). Re-copy the service_role key from Supabase Dashboard → Settings → API.`,
            ...(process.env.NODE_ENV === 'development'
              ? {
                  details: {
                    header: headerJson,
                    keyPrefix: serviceRoleKey.slice(0, 24),
                  },
                }
              : {}),
          },
          { status: 500 }
        )
      }
    } catch {
      return NextResponse.json(
        {
          error:
            'SUPABASE_SERVICE_ROLE_KEY JWT header could not be decoded. Re-copy the service_role key from Supabase Dashboard → Settings → API.',
          ...(process.env.NODE_ENV === 'development'
            ? { details: { keyPrefix: serviceRoleKey.slice(0, 24) } }
            : {}),
        },
        { status: 500 }
      )
    }

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
    
    // First check if user profile exists
    const { data: existingProfiles, error: fetchError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)

    if (fetchError) {
      console.error(' Error fetching user profile:', fetchError)
      return NextResponse.json(
        {
          error: 'Database error: ' + fetchError.message,
          ...(process.env.NODE_ENV === 'development'
            ? {
                details: {
                  hint: (fetchError as any)?.hint,
                  urlRef,
                  keyRef,
                  keyPrefix: serviceRoleKey.slice(0, 24),
                  url: supabaseUrl,
                },
              }
            : {}),
        },
        { status: 500 }
      )
    }

    console.log(' Found profiles:', existingProfiles?.length || 0)
    
    if (!existingProfiles || existingProfiles.length === 0) {
      console.error(' No user profile found for user:', user.id)
      return NextResponse.json({ error: 'User profile does not exist' }, { status: 404 })
    }

    const existingProfile = existingProfiles[0]
    console.log(' Current subscription fields:', {
      tier: existingProfile?.subscription_tier,
      status: existingProfile?.subscription_status,
      has_tier_column: 'subscription_tier' in existingProfile,
      has_status_column: 'subscription_status' in existingProfile,
    })

    console.log(' Update data:', {
      subscription_tier: tier,
      subscription_status: 'active',
      subscription_started_at: now.toISOString(),
      subscription_ends_at: nextMonth.toISOString(),
    })

    // Set status based on tier
    const status = tier === 'free' ? 'inactive' : 'active'
    const updateData: any = {
      subscription_tier: tier,
      subscription_status: status,
    }
    
    // Only set dates for paid tiers
    if (tier !== 'free') {
      updateData.subscription_started_at = now.toISOString()
      updateData.subscription_ends_at = nextMonth.toISOString()
    } else {
      updateData.subscription_started_at = null
      updateData.subscription_ends_at = null
    }

    console.log(' Final update data:', updateData)

    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()

    if (error) {
      console.error(' Error updating subscription:', error)
      const extra =
        process.env.NODE_ENV === 'development'
          ? { details: { message: error.message, code: (error as any).code } }
          : {}

      return NextResponse.json({ error: error.message, ...extra }, { status: 500 })
    }

    console.log(' Subscription updated successfully:', data)
    console.log(' Updated row count:', data?.length || 0)

    if (!data || data.length === 0) {
      console.warn(' Update succeeded but no rows returned')
      return NextResponse.json({ 
        error: 'Update succeeded but no data returned' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Subscription updated to ${tier}`,
      data: data[0]
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to update subscription',
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

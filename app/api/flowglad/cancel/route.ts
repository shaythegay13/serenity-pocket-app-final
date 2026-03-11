import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { flowglad, isFlowgladConfigured } from '@/lib/flowglad'

export async function POST(req: Request) {
  try {
    // Require Flowglad credentials
    if (!isFlowgladConfigured()) {
      return NextResponse.json(
        { error: 'Payment processor not configured', code: 'FLOWGLAD_NOT_CONFIGURED' },
        { status: 503 }
      )
    }

    // Authenticate user
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - No auth token' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      )
    }

    // Fetch the user's Flowglad subscription ID
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('flowglad_subscription_id, subscription_tier')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    if (!profile.flowglad_subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription found', code: 'NO_SUBSCRIPTION' },
        { status: 400 }
      )
    }

    if (profile.subscription_tier === 'free') {
      return NextResponse.json(
        { error: 'No paid subscription to cancel', code: 'ALREADY_FREE' },
        { status: 400 }
      )
    }

    // Cancel via Flowglad SDK (at end of current billing period)
    const flowgladServer = flowglad(user.id, { email: user.email })

    await flowgladServer.cancelSubscription({
      id: profile.flowglad_subscription_id,
      cancellation: { timing: 'at_end_of_current_billing_period' },
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Error canceling subscription:', error)

    let details: string
    if (typeof error === 'object' && error !== null) {
      try { details = JSON.stringify(error) } catch { details = String(error) }
    } else {
      details = String(error)
    }

    return NextResponse.json(
      { error: 'Failed to cancel subscription', details },
      { status: 500 }
    )
  }
}

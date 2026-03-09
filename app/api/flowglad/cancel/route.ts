import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { flowglad } from '@/lib/flowglad'

export async function POST(req: Request) {
  try {
    // Authenticate user from Authorization header
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

    // Create admin client to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Look up user's subscription info
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('flowglad_subscription_id, flowglad_customer_id, subscription_status, subscription_ends_at, subscription_tier')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    if (!profile.subscription_tier || profile.subscription_tier === 'free') {
      return NextResponse.json(
        { error: 'No active paid subscription to cancel' },
        { status: 400 }
      )
    }

    if (profile.subscription_status === 'canceled') {
      return NextResponse.json(
        { error: 'Subscription is already canceled' },
        { status: 400 }
      )
    }

    const cancellationDate = profile.subscription_ends_at || new Date(
      new Date().setMonth(new Date().getMonth() + 1)
    ).toISOString()

    const hasFlowgladConfig = process.env.FLOWGLAD_SECRET_KEY &&
      process.env.FLOWGLAD_SECRET_KEY.trim().length > 0

    if (!hasFlowgladConfig) {
      // Dev mode fallback: update DB directly
      const { error: updateError } = await supabaseAdmin
        .from('user_profiles')
        .update({
          subscription_status: 'canceled',
        })
        .eq('id', user.id)

      if (updateError) {
        throw updateError
      }

      return NextResponse.json({
        success: true,
        cancellationDate,
        message: 'Subscription canceled (dev mode)',
      })
    }

    // Flowglad is configured — cancel via SDK
    if (!profile.flowglad_subscription_id) {
      return NextResponse.json(
        { error: 'No subscription ID found. Please contact support.' },
        { status: 400 }
      )
    }

    const flowgladServer = flowglad(user.id, { email: user.email })

    const result = await flowgladServer.cancelSubscription({
      id: profile.flowglad_subscription_id,
      cancellation: {
        timing: 'at_end_of_current_billing_period',
      },
    })

    // Update local DB status to reflect pending cancellation
    await supabaseAdmin
      .from('user_profiles')
      .update({
        subscription_status: 'canceled',
      })
      .eq('id', user.id)

    const periodEnd = (result as { subscription?: { currentBillingPeriodEnd?: string }; currentBillingPeriodEnd?: string })?.subscription?.currentBillingPeriodEnd
      || (result as { currentBillingPeriodEnd?: string })?.currentBillingPeriodEnd
      || cancellationDate

    return NextResponse.json({
      success: true,
      cancellationDate: periodEnd,
      message: 'Subscription will be canceled at the end of the billing period',
    })
  } catch (error: unknown) {
    let details: string
    if (typeof error === 'object' && error !== null) {
      try {
        details = JSON.stringify(error)
      } catch {
        details = String(error)
      }
    } else {
      details = String(error)
    }

    return NextResponse.json(
      { error: 'Failed to cancel subscription', details },
      { status: 500 }
    )
  }
}

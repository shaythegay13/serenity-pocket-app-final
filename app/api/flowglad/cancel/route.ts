import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { flowglad } from '@/lib/flowglad'

export async function POST(req: Request) {
  try {
    // Get authenticated user from authorization header
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

    // Check if Flowglad is configured
    if (!process.env.FLOWGLAD_SECRET_KEY || process.env.FLOWGLAD_SECRET_KEY.trim().length === 0) {
      return NextResponse.json(
        { error: 'Flowglad not configured' },
        { status: 500 }
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

    // Get the user's Flowglad subscription ID
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('flowglad_subscription_id, subscription_status')
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
        { error: 'No active subscription found' },
        { status: 400 }
      )
    }

    if (profile.subscription_status === 'canceled') {
      return NextResponse.json(
        { error: 'Subscription is already canceled' },
        { status: 400 }
      )
    }

    // Cancel subscription via Flowglad SDK
    const flowgladServer = flowglad(user.id, {
      email: user.email,
      name: (user.user_metadata as Record<string, unknown>)?.full_name as string ||
            (user.user_metadata as Record<string, unknown>)?.name as string,
    })

    await flowgladServer.cancelSubscription({
      id: profile.flowglad_subscription_id,
      cancellation: { timing: 'at_end_of_current_billing_period' },
    })

    // Update subscription status in database
    const { error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({ subscription_status: 'canceled' })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating subscription status:', updateError)
      return NextResponse.json(
        { error: 'Failed to update subscription status' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Error canceling subscription:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { flowglad, getTierPriceId, TIER_PRICES } from '@/lib/flowglad'
import { SUBSCRIPTION_TIERS } from '@/lib/subscription-tiers'

const TIER_ORDER = ['free', 'premium', 'premium_plus', 'elite'] as const
type Tier = typeof TIER_ORDER[number]

function getTierIndex(tier: string): number {
  return TIER_ORDER.indexOf(tier as Tier)
}

export async function POST(req: Request) {
  try {
    const { tier } = await req.json()

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

    // Validate the requested tier
    if (!TIER_ORDER.includes(tier as Tier)) {
      return NextResponse.json(
        { error: 'Invalid tier' },
        { status: 400 }
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

    // Look up user's current subscription
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('flowglad_subscription_id, flowglad_customer_id, subscription_tier, subscription_status, subscription_ends_at')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    const currentTier: string = profile.subscription_tier || 'free'
    const currentIndex = getTierIndex(currentTier)
    const requestedIndex = getTierIndex(tier)

    // Validate that the requested tier is lower than current
    if (requestedIndex >= currentIndex) {
      return NextResponse.json(
        { error: 'Downgrade target must be a lower tier than your current plan' },
        { status: 400 }
      )
    }

    const hasFlowgladConfig = process.env.FLOWGLAD_SECRET_KEY &&
      process.env.FLOWGLAD_SECRET_KEY.trim().length > 0

    // Downgrading to free = cancel the subscription
    if (tier === 'free') {
      if (!hasFlowgladConfig) {
        const { error: updateError } = await supabaseAdmin
          .from('user_profiles')
          .update({
            subscription_status: 'canceled',
          })
          .eq('id', user.id)

        if (updateError) throw updateError

        return NextResponse.json({
          success: true,
          message: 'Subscription canceled. You will have access until the end of your billing period.',
          cancellationDate: profile.subscription_ends_at,
        })
      }

      if (!profile.flowglad_subscription_id) {
        return NextResponse.json(
          { error: 'No subscription ID found. Please contact support.' },
          { status: 400 }
        )
      }

      const flowgladServer = flowglad(user.id, { email: user.email })
      await flowgladServer.cancelSubscription({
        id: profile.flowglad_subscription_id,
        cancellation: {
          timing: 'at_end_of_current_billing_period',
        },
      })

      await supabaseAdmin
        .from('user_profiles')
        .update({ subscription_status: 'canceled' })
        .eq('id', user.id)

      return NextResponse.json({
        success: true,
        message: 'Subscription canceled. You will have access until the end of your billing period.',
        cancellationDate: profile.subscription_ends_at,
      })
    }

    // Downgrading to a lower paid tier
    const priceId = getTierPriceId(tier as keyof typeof TIER_PRICES)
    if (!priceId) {
      return NextResponse.json(
        { error: 'Price not configured for requested tier' },
        { status: 500 }
      )
    }

    if (!hasFlowgladConfig) {
      // Dev mode: update DB directly
      const tierConfig = SUBSCRIPTION_TIERS.find(t => t.id === tier)
      const subscriptionEndsAt = new Date()
      subscriptionEndsAt.setMonth(subscriptionEndsAt.getMonth() + 1)

      const { error: updateError } = await supabaseAdmin
        .from('user_profiles')
        .update({
          subscription_tier: tier,
          subscription_status: 'active',
          subscription_ends_at: subscriptionEndsAt.toISOString(),
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      return NextResponse.json({
        success: true,
        message: `Downgraded to ${tierConfig?.displayName || tier} (dev mode)`,
        url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}?tab=account&success=true`,
      })
    }

    // Flowglad is configured — adjust subscription to the lower tier
    if (!profile.flowglad_subscription_id) {
      return NextResponse.json(
        { error: 'No subscription ID found. Please contact support.' },
        { status: 400 }
      )
    }

    const flowgladServer = flowglad(user.id, { email: user.email })
    await flowgladServer.adjustSubscription({
      priceId,
      subscriptionId: profile.flowglad_subscription_id,
      timing: 'at_end_of_current_billing_period',
    })

    const tierConfig = SUBSCRIPTION_TIERS.find(t => t.id === tier)
    return NextResponse.json({
      success: true,
      message: `Your plan will be downgraded to ${tierConfig?.displayName || tier} at the end of your billing period.`,
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
      { error: 'Failed to process downgrade', details },
      { status: 500 }
    )
  }
}

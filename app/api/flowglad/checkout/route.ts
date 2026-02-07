import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { flowglad, getTierPriceId, TIER_PRICES } from '@/lib/flowglad'
import { SUBSCRIPTION_TIERS } from '@/lib/subscription-tiers'

export async function POST(req: Request) {
  try {
    const { tier } = await req.json()
    console.log('🛒 Flowglad checkout request for tier:', tier)

    // Get authenticated user from authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      console.error('❌ No authorization header')
      return NextResponse.json(
        { error: 'Unauthorized - No auth token' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      console.error('❌ Auth error:', authError)
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      )
    }

    console.log('✅ User authenticated:', user.email)

    // Validate tier
    const validTiers = ['premium', 'premium_plus', 'elite']
    if (!validTiers.includes(tier)) {
      console.error('❌ Invalid tier')
      return NextResponse.json(
        { error: 'Invalid tier' },
        { status: 400 }
      )
    }

    // Get the price ID for the tier
    const priceId = getTierPriceId(tier as keyof typeof TIER_PRICES)
    if (!priceId) {
      console.error('❌ Price ID not configured for tier:', tier)
      return NextResponse.json(
        { error: 'Price not configured' },
        { status: 500 }
      )
    }

    // Check if Flowglad is configured
    const hasFlowgladConfig = process.env.FLOWGLAD_SECRET_KEY &&
      process.env.FLOWGLAD_SECRET_KEY.trim().length > 0

    // If no Flowglad credentials, use test mode (development only)
    if (!hasFlowgladConfig) {
      if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json(
          { error: 'Flowglad not configured' },
          { status: 500 }
        )
      }

      console.log('🧪 NO FLOWGLAD CREDENTIALS - Using test mode for:', tier)

      // Create admin client to bypass RLS
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )

      // Update user subscription directly in database
      const now = new Date()
      const tierConfig = SUBSCRIPTION_TIERS.find(t => t.id === tier)
      const trialDays = tierConfig?.trialDays || 0

      const subscriptionEndsAt = new Date()
      subscriptionEndsAt.setMonth(subscriptionEndsAt.getMonth() + 1)
      if (trialDays > 0) {
        subscriptionEndsAt.setDate(subscriptionEndsAt.getDate() + trialDays)
      }

      const { error: updateError } = await supabaseAdmin
        .from('user_profiles')
        .update({
          subscription_tier: tier,
          subscription_status: 'active',
          subscription_started_at: now.toISOString(),
          subscription_ends_at: subscriptionEndsAt.toISOString(),
          // In real Flowglad, there might be a trial_ends_at or similar
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('❌ Error updating subscription:', updateError)
        throw updateError
      }

      console.log('✅ Test mode: Subscription granted successfully')

      return NextResponse.json({
        sessionId: 'test-mode-no-payment',
        url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}?tab=account&success=true`,
        success: true,
      })
    }

    // Flowglad is configured - create real checkout session
    const flowgladServer = flowglad(user.id, {
      email: user.email,
      name: (user.user_metadata as any)?.full_name || (user.user_metadata as any)?.name,
    })

    // Ensure the customer exists before creating a checkout session.
    await flowgladServer.findOrCreateCustomer()

    const tierConfig = SUBSCRIPTION_TIERS.find(t => t.id === tier)
    const trialPeriodDays = tierConfig?.trialDays

    const checkoutSession = await flowgladServer.createCheckoutSession({
      priceId,
      successUrl: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}?tab=account&success=true`,
      cancelUrl: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}?tab=account&canceled=true`,
      ...(trialPeriodDays ? { trialPeriodDays } : {}),
    })

    console.log('✅ Flowglad checkout session created')

    return NextResponse.json({
      url: checkoutSession.url,
      success: true,
    })
  } catch (error: unknown) {
    console.error('❌ Error processing subscription:', error)

    // Try to surface as much detail as possible from Flowglad/HTTP errors
    let details: string

    if (typeof error === 'object' && error !== null) {
      try {
        // Many HTTP client errors have status, headers, and error/body fields
        details = JSON.stringify(error)
      } catch {
        details = String(error)
      }
    } else {
      details = String(error)
    }

    return NextResponse.json(
      {
        error: 'Failed to process subscription',
        details,
      },
      { status: 500 }
    )
  }
}

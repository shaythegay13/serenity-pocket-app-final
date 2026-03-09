import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { flowglad, getTierPriceId, isFlowgladConfigured, TIER_PRICES } from '@/lib/flowglad'
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
        { error: 'Price not configured', code: 'PRICE_NOT_CONFIGURED' },
        { status: 500 }
      )
    }

    // Require Flowglad credentials in all environments
    if (!isFlowgladConfigured()) {
      console.error('❌ FLOWGLAD_SECRET_KEY is not set')
      return NextResponse.json(
        { error: 'Payment processor not configured', code: 'FLOWGLAD_NOT_CONFIGURED' },
        { status: 503 }
      )
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
      outputMetadata: {
        userId: user.id,
        tier,
      },
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

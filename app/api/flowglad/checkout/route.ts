import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { flowglad, getTierPriceId, isFlowgladConfigured, TIER_PRICES } from '@/lib/flowglad'
import { SUBSCRIPTION_TIERS } from '@/lib/subscription-tiers'
import logger from '@/lib/logger'

export async function POST(req: Request) {
  try {
    const { tier } = await req.json()

    // Get authenticated user from authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      logger.warn('No authorization header', 'checkout')
      return NextResponse.json(
        { error: 'Unauthorized - No auth token' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      logger.error('Auth error during checkout', 'checkout', authError)
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      )
    }

    // Validate tier
    const validTiers = ['premium', 'premium_plus', 'elite']
    if (!validTiers.includes(tier)) {
      logger.warn('Invalid tier requested', 'checkout')
      return NextResponse.json(
        { error: 'Invalid tier' },
        { status: 400 }
      )
    }

    // Get the price ID for the tier
    const priceId = getTierPriceId(tier as keyof typeof TIER_PRICES)
    if (!priceId) {
      logger.error(`Price ID not configured for tier: ${tier}`, 'checkout')
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

      logger.info('No Flowglad credentials - using test mode', 'checkout')

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
        logger.error('Error updating subscription in test mode', 'checkout', updateError)
        throw updateError
      }

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
      outputMetadata: {
        userId: user.id,
        tier,
      },
    })

    return NextResponse.json({
      url: checkoutSession.url,
      success: true,
    })
  } catch (error: unknown) {
    console.error('Checkout error:', error)
    logger.error('Error processing subscription', 'checkout', error)

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

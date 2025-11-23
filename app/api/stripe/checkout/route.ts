import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const { tier } = await req.json()
    console.log('🛒 Checkout request for tier:', tier)

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('❌ STRIPE_SECRET_KEY not found')
      return NextResponse.json(
        { error: 'Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables.' },
        { status: 503 }
      )
    }

    console.log('✅ Stripe secret key found')
    const { stripe, STRIPE_PRICE_IDS } = await import('@/lib/stripe')
    
    if (!stripe) {
      console.error('❌ Stripe instance is null')
      return NextResponse.json(
        { error: 'Stripe is not properly initialized.' },
        { status: 503 }
      )
    }
    
    console.log('✅ Stripe initialized successfully')

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
    const priceId = STRIPE_PRICE_IDS[tier as keyof typeof STRIPE_PRICE_IDS]
    console.log('💰 Price ID for tier:', tier, '=', priceId)
    
    if (!priceId) {
      console.error('❌ Invalid tier or missing price ID')
      return NextResponse.json(
        { error: 'Invalid tier' },
        { status: 400 }
      )
    }

    console.log('🎫 Creating Stripe checkout session...')
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}?tab=account&success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}?tab=account&canceled=true`,
      metadata: {
        userId: user.id,
        tier,
      },
    })

    console.log('✅ Checkout session created:', session.id)
    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('❌ Error creating checkout session:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

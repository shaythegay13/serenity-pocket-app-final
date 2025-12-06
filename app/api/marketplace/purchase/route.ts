import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { flowglad } from '@/lib/flowglad'

/**
 * POST /api/marketplace/purchase
 * 
 * Create a Flowglad checkout session for purchasing AI service credits
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseServer

    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : undefined

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { productKey } = await request.json()

    if (!productKey) {
      return NextResponse.json(
        { error: 'Product key is required' },
        { status: 400 }
      )
    }

    // Get product details
    const { data: product, error: productError } = await supabase
      .from('ai_marketplace_products')
      .select('*')
      .eq('product_key', productKey)
      .eq('is_active', true)
      .single()

    if (productError || !product) {
      console.error('[Marketplace Purchase] Product not found:', productKey, productError)
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Validate Flowglad price ID is configured
    if (!product.flowglad_price_id) {
      console.error('[Marketplace Purchase] Product missing Flowglad price ID:', productKey)
      return NextResponse.json(
        { error: 'Product not configured for purchase' },
        { status: 500 }
      )
    }

    // Create Flowglad checkout session for one-time payment
    try {
      const flowgladClient = flowglad(user.id)
      
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
      
      // Store purchase intent in session/database before checkout
      // We'll complete it via webhook when payment succeeds
      const { error: intentError } = await supabase
        .from('ai_usage_purchases')
        .insert({
          user_id: user.id,
          purchase_type: product.product_key,
          ai_picker_credits: 0, // Will be updated on payment success
          ai_bet_analyzer_credits: 0,
          price_paid: product.price,
          flowglad_payment_id: `pending_${Date.now()}` // Temporary, will be updated by webhook
        })

      if (intentError) {
        console.error('[Marketplace Purchase] Failed to create purchase intent:', intentError)
      }

      const checkoutSession = await flowgladClient.createCheckoutSession({
        priceId: product.flowglad_price_id,
        successUrl: `${appUrl}/marketplace/success?product=${productKey}`,
        cancelUrl: `${appUrl}/marketplace`,
      })

      console.log(`✅ [Marketplace Purchase] Checkout session created for user ${user.id}, product ${productKey}`)

      return NextResponse.json({ 
        success: true,
        checkoutUrl: checkoutSession.url
      })
    } catch (flowgladError) {
      console.error('[Marketplace Purchase] Flowglad checkout creation failed:', flowgladError)
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to create checkout session' 
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[Marketplace Purchase] Unexpected error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process purchase request'
      },
      { status: 500 }
    )
  }
}

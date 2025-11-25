import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const { tier } = await req.json()
    console.log('🛒 Checkout request for tier:', tier)

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

    // TESTING MODE: Bypass Stripe and directly update subscription
    console.log('🧪 TESTING MODE: Bypassing Stripe payment, granting free access to:', tier)

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
    const oneMonthFromNow = new Date()
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1)

    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({
        subscription_tier: tier,
        subscription_status: 'active',
        subscription_started_at: now.toISOString(),
        subscription_ends_at: oneMonthFromNow.toISOString(),
      })
      .eq('id', user.id)
      .select()

    if (updateError) {
      console.error('❌ Error updating subscription:', updateError)
      return NextResponse.json(
        { error: 'Failed to update subscription' },
        { status: 500 }
      )
    }

    console.log('✅ Subscription updated successfully for user:', user.id)

    // Return success URL to redirect user back to account page
    const successUrl = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}?tab=account&success=true`

    return NextResponse.json({
      sessionId: 'test-mode-no-stripe',
      url: successUrl,
      success: true
    })
  } catch (error) {
    console.error('❌ Error processing subscription:', error)
    return NextResponse.json(
      {
        error: 'Failed to process subscription',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

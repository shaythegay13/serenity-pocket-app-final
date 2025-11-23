import { NextResponse } from 'next/server'
import Stripe from 'stripe'

// Disable body parsing for webhooks
export const runtime = 'nodejs'

export async function POST(req: Request) {
  console.log('🎣 WEBHOOK ENDPOINT HIT!')
  
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  console.log('📝 Webhook signature present:', !!signature)

  if (!signature) {
    console.error('❌ No signature in webhook request')
    return NextResponse.json(
      { error: 'No signature' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    const { stripe } = await import('@/lib/stripe')
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 503 }
      )
    }

    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  // Use admin client to bypass RLS
  const { createClient } = await import('@supabase/supabase-js')
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

  try {
    console.log('🎣 Webhook received:', event.type)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const tier = session.metadata?.tier

        console.log('💳 Checkout completed:', { userId, tier, sessionId: session.id })

        if (userId && tier) {
          // Get subscription details to extract dates
          const subscriptionId = session.subscription as string
          let subscriptionStartedAt = new Date().toISOString()
          let subscriptionEndsAt = null

          if (subscriptionId) {
            try {
              const { stripe } = await import('@/lib/stripe')
              if (stripe) {
                const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any
                if (subscription.current_period_start && subscription.current_period_end) {
                  subscriptionStartedAt = new Date(subscription.current_period_start * 1000).toISOString()
                  subscriptionEndsAt = new Date(subscription.current_period_end * 1000).toISOString()
                }
              }
            } catch (err) {
              console.error('Error fetching subscription details:', err)
            }
          }

          // Update user's subscription tier in database using admin client
          console.log('📝 Updating subscription:', {
            userId,
            tier,
            status: 'active',
            customerId: session.customer,
            subscriptionId,
            startedAt: subscriptionStartedAt,
            endsAt: subscriptionEndsAt
          })

          const { data, error } = await supabaseAdmin
            .from('user_profiles')
            .update({
              subscription_tier: tier,
              subscription_status: 'active',
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: subscriptionId,
              subscription_started_at: subscriptionStartedAt,
              subscription_ends_at: subscriptionEndsAt,
            })
            .eq('id', userId)
            .select()

          if (error) {
            console.error('❌ Error updating user subscription:', error)
            throw error
          } else {
            console.log(`✅ User ${userId} upgraded to ${tier}`, data)
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any
        const customerId = subscription.customer as string

        console.log('🔄 Subscription updated:', { customerId, status: subscription.status })

        // Get user by stripe customer ID using admin client
        const { data: user } = await supabaseAdmin
          .from('user_profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (user) {
          const status = subscription.status === 'active' ? 'active' : 'inactive'
          const startedAt = subscription.current_period_start 
            ? new Date(subscription.current_period_start * 1000).toISOString()
            : new Date().toISOString()
          const endsAt = subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null
          
          const { error } = await supabaseAdmin
            .from('user_profiles')
            .update({ 
              subscription_status: status,
              subscription_started_at: startedAt,
              subscription_ends_at: endsAt
            })
            .eq('id', user.id)

          if (error) {
            console.error('❌ Error updating subscription status:', error)
          } else {
            console.log(`✅ Subscription updated for user ${user.id}: ${status}`)
          }
        } else {
          console.warn('⚠️ User not found for customer:', customerId)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        console.log('🗑️ Subscription deleted:', { customerId })

        // Get user by stripe customer ID using admin client
        const { data: user } = await supabaseAdmin
          .from('user_profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (user) {
          // Downgrade to free tier
          const { error } = await supabaseAdmin
            .from('user_profiles')
            .update({
              subscription_tier: 'free',
              subscription_status: 'canceled',
              subscription_started_at: null,
              subscription_ends_at: null
            })
            .eq('id', user.id)

          if (error) {
            console.error('❌ Error downgrading user:', error)
          } else {
            console.log(`✅ User ${user.id} downgraded to free tier`)
          }
        } else {
          console.warn('⚠️ User not found for customer:', customerId)
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

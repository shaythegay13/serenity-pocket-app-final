import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyWebhook } from '@flowglad/nextjs/server'
import { FLOWGLAD_CONFIG } from '@/lib/flowglad'

// Disable body parsing for webhooks
export const runtime = 'nodejs'

export async function POST(req: Request) {
  console.log('🎣 FLOWGLAD WEBHOOK ENDPOINT HIT!')
  
  const body = await req.text()
  const signature = req.headers.get('flowglad-signature') || req.headers.get('x-flowglad-signature')

  console.log('📝 Webhook signature present:', !!signature)

  if (!signature) {
    console.error('❌ No signature in webhook request')
    return NextResponse.json(
      { error: 'No signature' },
      { status: 400 }
    )
  }

  // Verify webhook signature
  let event: any
  try {
    // Create headers object with the signature
    const headers: Record<string, string> = {}
    if (signature) {
      headers['flowglad-signature'] = signature
    }
    
    event = verifyWebhook(body, headers, FLOWGLAD_CONFIG.webhookSecret)
    console.log('✅ Webhook signature verified')
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  // Use admin client to bypass RLS
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
      case 'checkout.session.completed':
      case 'subscription.created': {
        const data = event.data
        const userId = data.metadata?.userId
        const tier = data.metadata?.tier
        const customerId = data.customerId || data.customer_id
        const subscriptionId = data.subscriptionId || data.subscription_id || data.id

        console.log('💳 Checkout/Subscription created:', { 
          userId, 
          tier, 
          customerId,
          subscriptionId 
        })

        if (userId && tier) {
          // Calculate subscription dates
          const now = new Date()
          const oneMonthFromNow = new Date()
          oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1)

          const subscriptionStartedAt = data.current_period_start 
            ? new Date(data.current_period_start * 1000).toISOString()
            : now.toISOString()
          const subscriptionEndsAt = data.current_period_end
            ? new Date(data.current_period_end * 1000).toISOString()
            : oneMonthFromNow.toISOString()

          // Update user's subscription tier in database using admin client
          console.log('📝 Updating subscription:', {
            userId,
            tier,
            status: 'active',
            customerId,
            subscriptionId,
            startedAt: subscriptionStartedAt,
            endsAt: subscriptionEndsAt
          })

          const { data: updateData, error } = await supabaseAdmin
            .from('user_profiles')
            .update({
              subscription_tier: tier,
              subscription_status: 'active',
              flowglad_customer_id: customerId,
              flowglad_subscription_id: subscriptionId,
              subscription_started_at: subscriptionStartedAt,
              subscription_ends_at: subscriptionEndsAt,
            })
            .eq('id', userId)
            .select()

          if (error) {
            console.error('❌ Error updating user subscription:', error)
            throw error
          } else {
            console.log(`✅ User ${userId} upgraded to ${tier}`, updateData)
          }
        }
        break
      }

      case 'subscription.updated': {
        const data = event.data
        const customerId = data.customerId || data.customer_id
        const status = data.status

        console.log('🔄 Subscription updated:', { customerId, status })

        // Get user by Flowglad customer ID using admin client
        const { data: user } = await supabaseAdmin
          .from('user_profiles')
          .select('id')
          .eq('flowglad_customer_id', customerId)
          .single()

        if (user) {
          const subscriptionStatus = status === 'active' ? 'active' : 'inactive'
          const startedAt = data.current_period_start 
            ? new Date(data.current_period_start * 1000).toISOString()
            : new Date().toISOString()
          const endsAt = data.current_period_end
            ? new Date(data.current_period_end * 1000).toISOString()
            : null
          
          const { error } = await supabaseAdmin
            .from('user_profiles')
            .update({ 
              subscription_status: subscriptionStatus,
              subscription_started_at: startedAt,
              subscription_ends_at: endsAt
            })
            .eq('id', user.id)

          if (error) {
            console.error('❌ Error updating subscription status:', error)
          } else {
            console.log(`✅ Subscription updated for user ${user.id}: ${subscriptionStatus}`)
          }
        } else {
          console.warn('⚠️ User not found for customer:', customerId)
        }
        break
      }

      case 'subscription.canceled':
      case 'subscription.deleted': {
        const data = event.data
        const customerId = data.customerId || data.customer_id

        console.log('🗑️ Subscription canceled/deleted:', { customerId })

        // Get user by Flowglad customer ID using admin client
        const { data: user } = await supabaseAdmin
          .from('user_profiles')
          .select('id')
          .eq('flowglad_customer_id', customerId)
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

      case 'payment.failed': {
        const data = event.data
        const customerId = data.customerId || data.customer_id

        console.log('❌ Payment failed:', { customerId })

        // Get user by Flowglad customer ID
        const { data: user } = await supabaseAdmin
          .from('user_profiles')
          .select('id')
          .eq('flowglad_customer_id', customerId)
          .single()

        if (user) {
          // Update status to indicate payment issue
          const { error } = await supabaseAdmin
            .from('user_profiles')
            .update({ 
              subscription_status: 'past_due'
            })
            .eq('id', user.id)

          if (error) {
            console.error('❌ Error updating payment status:', error)
          } else {
            console.log(`✅ User ${user.id} marked as past_due`)
          }
        }
        break
      }

      case 'payment.succeeded': {
        const data = event.data
        const customerId = data.customerId || data.customer_id
        const paymentId = data.id

        console.log('💰 One-time payment succeeded:', { customerId, paymentId })

        // Check if this is a marketplace purchase (one-time payment, not subscription)
        // Look for pending purchase with matching user
        const { data: user } = await supabaseAdmin
          .from('user_profiles')
          .select('id')
          .eq('flowglad_customer_id', customerId)
          .single()

        if (user) {
          // Find pending purchase for this user
          const { data: pendingPurchases } = await supabaseAdmin
            .from('ai_usage_purchases')
            .select('*')
            .eq('user_id', user.id)
            .like('flowglad_payment_id', 'pending_%')
            .order('created_at', { ascending: false })
            .limit(1)

          if (pendingPurchases && pendingPurchases.length > 0) {
            const purchase = pendingPurchases[0]
            
            // Get product details to update credits
            const { data: product } = await supabaseAdmin
              .from('ai_marketplace_products')
              .select('*')
              .eq('product_key', purchase.purchase_type)
              .single()

            if (product) {
              // Update purchase with actual payment ID and credits
              const { error: updateError } = await supabaseAdmin
                .from('ai_usage_purchases')
                .update({
                  flowglad_payment_id: paymentId,
                  ai_picker_credits: product.ai_picker_credits,
                  ai_bet_analyzer_credits: product.ai_bet_analyzer_credits,
                  price_paid: product.price
                })
                .eq('id', purchase.id)

              if (updateError) {
                console.error('❌ Error updating marketplace purchase:', updateError)
              } else {
                console.log(`✅ Marketplace purchase completed for user ${user.id}: ${product.display_name}`)
              }
            }
          }
        }
        break
      }

      default:
        console.log(`ℹ️  Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('❌ Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

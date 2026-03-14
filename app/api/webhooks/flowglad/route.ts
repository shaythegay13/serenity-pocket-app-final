import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyWebhook } from '@flowglad/nextjs/server'
import { FLOWGLAD_CONFIG } from '@/lib/flowglad'
import logger from '@/lib/logger'

// Disable body parsing for webhooks
export const runtime = 'nodejs'

// ─── Minimal types for Flowglad webhook event payloads ───────────────────────

interface FlowgladCustomerData {
  customerId?: string
  customer_id?: string
  subscriptionId?: string
  subscription_id?: string
  id?: string
  metadata?: {
    userId?: string
    tier?: string
    [key: string]: string | undefined
  }
  current_period_start?: number
  current_period_end?: number
  status?: string
}

interface FlowgladWebhookEvent {
  type: string
  data: FlowgladCustomerData
}

// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const body = await req.text()
  const signature = req.headers.get('flowglad-signature') || req.headers.get('x-flowglad-signature')

  if (!signature) {
    logger.warn('No signature in webhook request', 'webhook')
    return NextResponse.json(
      { error: 'No signature' },
      { status: 400 }
    )
  }

  // Verify webhook signature
  let event: FlowgladWebhookEvent
  try {
    const headers: Record<string, string> = {
      'flowglad-signature': signature,
    }
    
    event = verifyWebhook(body, headers, FLOWGLAD_CONFIG.webhookSecret) as FlowgladWebhookEvent
    logger.info('Webhook signature verified', 'webhook')
  } catch (err) {
    logger.error('Webhook signature verification failed', 'webhook', err)
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
    logger.info(`Webhook received: ${event.type}`, 'webhook')

    switch (event.type) {
      case 'checkout.session.completed':
      case 'subscription.created': {
        const data = event.data
        const userId = data.metadata?.userId
        const tier = data.metadata?.tier
        const customerId = data.customerId || data.customer_id
        const subscriptionId = data.subscriptionId || data.subscription_id || data.id

        if (!userId || !tier) {
          logger.warn('Missing userId or tier in webhook metadata — skipping DB update', 'webhook')
          break
        }

        // Idempotency: check if subscription is already set to the target tier
        const { data: existing } = await supabaseAdmin
          .from('user_profiles')
          .select('subscription_tier, subscription_status')
          .eq('id', userId)
          .single()

        if (
          existing &&
          existing.subscription_tier === tier &&
          existing.subscription_status === 'active'
        ) {
          logger.info(`Idempotent skip: user ${userId} already on ${tier} (active)`, 'webhook')
          break
        }

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

        const { error } = await supabaseAdmin
          .from('user_profiles')
          .update({
            subscription_tier: tier,
            subscription_status: 'active',
            flowglad_customer_id: customerId ?? null,
            flowglad_subscription_id: subscriptionId ?? null,
            subscription_started_at: subscriptionStartedAt,
            subscription_ends_at: subscriptionEndsAt,
          })
          .eq('id', userId)

        if (error) {
          logger.error(`Error updating user subscription for ${userId}`, 'webhook', error)
          throw error
        } else {
          logger.info(`User ${userId} upgraded to ${tier}`, 'webhook')
        }
        break
      }

      case 'subscription.updated': {
        const data = event.data
        const customerId = data.customerId || data.customer_id
        const status = data.status

        if (!customerId) {
          logger.warn('Missing customerId in subscription.updated — skipping', 'webhook')
          break
        }

        // Get user by Flowglad customer ID using admin client
        const { data: user } = await supabaseAdmin
          .from('user_profiles')
          .select('id')
          .eq('flowglad_customer_id', customerId)
          .single()

        if (!user) {
          logger.warn(`User not found for customer: ${customerId}`, 'webhook')
          break
        }

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
          logger.error(`Error updating subscription status for user ${user.id}`, 'webhook', error)
        } else {
          logger.info(`Subscription updated for user ${user.id}: ${subscriptionStatus}`, 'webhook')
        }
        break
      }

      case 'subscription.canceled':
      case 'subscription.deleted': {
        const data = event.data
        const customerId = data.customerId || data.customer_id

        if (!customerId) {
          logger.warn('Missing customerId in cancellation event', 'webhook')
          break
        }

        // Get user by Flowglad customer ID using admin client
        const { data: user } = await supabaseAdmin
          .from('user_profiles')
          .select('id')
          .eq('flowglad_customer_id', customerId)
          .single()

        if (!user) {
          logger.warn(`User not found for customer: ${customerId}`, 'webhook')
          break
        }

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
          logger.error(`Error downgrading user ${user.id}`, 'webhook', error)
        } else {
          logger.info(`User ${user.id} downgraded to free tier`, 'webhook')
        }
        break
      }

      case 'payment.failed': {
        const data = event.data
        const customerId = data.customerId || data.customer_id

        if (!customerId) {
          logger.warn('Missing customerId in payment.failed — skipping', 'webhook')
          break
        }

        // Get user by Flowglad customer ID
        const { data: user } = await supabaseAdmin
          .from('user_profiles')
          .select('id')
          .eq('flowglad_customer_id', customerId)
          .single()

        if (!user) {
          logger.warn(`User not found for customer: ${customerId}`, 'webhook')
          break
        }

        // Update status to indicate payment issue
        const { error } = await supabaseAdmin
          .from('user_profiles')
          .update({ 
            subscription_status: 'past_due'
          })
          .eq('id', user.id)

        if (error) {
          logger.error(`Error updating payment status for user ${user.id}`, 'webhook', error)
        } else {
          logger.info(`User ${user.id} marked as past_due`, 'webhook')
        }
        break
      }

      case 'payment.succeeded': {
        const data = event.data
        const customerId = data.customerId || data.customer_id
        const paymentId = data.id

        if (!customerId) {
          logger.warn('Missing customerId in payment.succeeded — skipping', 'webhook')
          break
        }

        // Check if this is a marketplace purchase (one-time payment, not subscription)
        // Look for pending purchase with matching user
        const { data: user } = await supabaseAdmin
          .from('user_profiles')
          .select('id')
          .eq('flowglad_customer_id', customerId)
          .single()

        if (!user) {
          logger.warn(`User not found for customer: ${customerId}`, 'webhook')
          break
        }

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
              logger.error(`Error updating marketplace purchase for user ${user.id}`, 'webhook', updateError)
            } else {
              logger.info(`Marketplace purchase completed for user ${user.id}: ${product.display_name}`, 'webhook')
            }
          }
        }
        break
      }

      default:
        logger.info(`Unhandled event type: ${event.type}`, 'webhook')
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    logger.error('Error processing webhook', 'webhook', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

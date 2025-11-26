/**
 * Flowglad Configuration
 * 
 * Flowglad replaces Stripe for subscription payment processing.
 * Uses factory pattern to create FlowgladServer instances per user.
 */

import { FlowgladServer } from '@flowglad/nextjs/server'
import { createClient } from '@supabase/supabase-js'

// Flowglad API configuration
export const FLOWGLAD_CONFIG = {
  apiKey: process.env.FLOWGLAD_SECRET_KEY || '',
  webhookSecret: process.env.FLOWGLAD_WEBHOOK_SECRET || '',
  publicKey: process.env.NEXT_PUBLIC_FLOWGLAD_PUBLIC_KEY || '',
} as const

/**
 * Flowglad Server Factory
 * Creates a FlowgladServer instance for a specific user
 * @param customerExternalId - The user ID from our database (NOT Flowglad's customer ID)
 */
export const flowglad = (customerExternalId: string) => {
  return new FlowgladServer({
    customerExternalId,
    getCustomerDetails: async (externalId) => {
      // Fetch customer details from Supabase using our user ID
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )

      const { data: user, error } = await supabase
        .from('user_profiles')
        .select('id, email, full_name')
        .eq('id', externalId)
        .single()

      if (error || !user) {
        throw new Error('Customer not found')
      }

      return {
        email: user.email || '',
        name: user.full_name || user.email?.split('@')[0] || 'User',
      }
    },
  })
}

// Flowglad product/price IDs for subscription tiers
// Configure these in your Flowglad dashboard
export const FLOWGLAD_PRICE_IDS = {
  premium: process.env.FLOWGLAD_PRICE_PREMIUM || '',
  premium_plus: process.env.FLOWGLAD_PRICE_PREMIUM_PLUS || '',
  elite: process.env.FLOWGLAD_PRICE_ELITE || '',
} as const

// Price configurations for display
export const TIER_PRICES = {
  premium: 19.99,
  premium_plus: 39.99,
  elite: 79.99,
} as const

// Tier display names
export const TIER_NAMES = {
  premium: 'Premium',
  premium_plus: 'Premium Plus',
  elite: 'Elite',
} as const

// Map tier IDs to Flowglad price IDs
export function getTierPriceId(tier: keyof typeof FLOWGLAD_PRICE_IDS): string {
  return FLOWGLAD_PRICE_IDS[tier]
}

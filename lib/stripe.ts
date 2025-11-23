import Stripe from 'stripe'

// Only initialize Stripe if the secret key is available
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-10-29.clover',
      typescript: true,
    })
  : null

export const STRIPE_PRICE_IDS = {
  premium: process.env.STRIPE_PRICE_PREMIUM || '',
  premium_plus: process.env.STRIPE_PRICE_PREMIUM_PLUS || '',
  elite: process.env.STRIPE_PRICE_ELITE || '',
}

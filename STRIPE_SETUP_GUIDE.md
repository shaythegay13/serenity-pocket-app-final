# Stripe Integration Setup Guide

## ✅ What's Been Done

1. **Installed Stripe packages** (`stripe` and `@stripe/stripe-js`)
2. **Created Stripe library** (`/lib/stripe.ts`)
3. **Created checkout API** (`/app/api/stripe/checkout/route.ts`)
4. **Created webhook handler** (`/app/api/webhooks/stripe/route.ts`)
5. **Created database migration** (`/migrations/20240108_add_subscription_fields.sql`)
6. **Added environment variables** to `.env.local`

---

## 🔧 What You Need to Do

### Step 1: Get Stripe Keys

1. **Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)**
2. **Copy your test keys:**
   - Publishable key (starts with `pk_test_`)
   - Secret key (starts with `sk_test_`)
3. **Update `.env.local`** with your keys

### Step 2: Create Products in Stripe

1. **Go to [Stripe Products](https://dashboard.stripe.com/test/products)**
2. **Create 3 products:**

   **Product 1: Premium**
   - Name: `Serenity Pocket Premium`
   - Price: `$19.99/month`
   - Billing: Recurring
   - Copy the **Price ID** (starts with `price_`)

   **Product 2: Premium Plus**
   - Name: `Serenity Pocket Premium Plus`
   - Price: `$39.99/month`
   - Billing: Recurring
   - Copy the **Price ID**

   **Product 3: Elite**
   - Name: `Serenity Pocket Elite`
   - Price: `$79.99/month`
   - Billing: Recurring
   - Copy the **Price ID**

3. **Update `.env.local`** with all 3 Price IDs

### Step 3: Run Database Migration

1. **Go to Supabase Dashboard** → SQL Editor
2. **Run the migration:**
   ```sql
   -- Copy contents from /migrations/20240108_add_subscription_fields.sql
   ```
3. **Verify columns were added** to `user_profiles` table

### Step 4: Set Up Stripe Webhooks (for production)

1. **Go to [Stripe Webhooks](https://dashboard.stripe.com/test/webhooks)**
2. **Add endpoint:** `https://your-domain.com/api/webhooks/stripe`
3. **Select events to listen to:**
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. **Copy the webhook secret** (starts with `whsec_`)
5. **Update `.env.local`** with webhook secret

### Step 5: Update Account Tab

The Account Tab needs to be updated to use real Stripe checkout instead of mock buttons.

**Update `/components/tabs/account-tab.tsx`:**

```typescript
// Add at the top
import { loadStripe } from '@stripe/stripe-js'

// Add function to handle upgrade
const handleUpgrade = async (tier: string) => {
  try {
    setUpgrading(true)
    
    // Create checkout session
    const response = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier }),
    })
    
    const { url } = await response.json()
    
    // Redirect to Stripe checkout
    if (url) {
      window.location.href = url
    }
  } catch (error) {
    console.error('Error:', error)
    toast.error('Failed to start checkout')
  } finally {
    setUpgrading(false)
  }
}

// Update upgrade buttons to call handleUpgrade
<Button onClick={() => handleUpgrade('premium')}>
  Upgrade to Premium
</Button>
```

---

## 🧪 Testing Stripe Integration

### Test Mode (Development)

1. **Use Stripe test cards:**
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Any future expiry date, any CVC

2. **Test the flow:**
   - Click "Upgrade" button
   - Complete checkout with test card
   - Verify user tier updates in database
   - Check Stripe Dashboard for payment

### Webhook Testing (Local Development)

Use Stripe CLI to forward webhooks to localhost:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Copy the webhook signing secret and add to .env.local
```

---

## 📋 Checklist

- [ ] Get Stripe test keys
- [ ] Add keys to `.env.local`
- [ ] Create 3 products in Stripe Dashboard
- [ ] Add Price IDs to `.env.local`
- [ ] Run database migration in Supabase
- [ ] Update Account Tab with real checkout
- [ ] Test checkout flow with test card
- [ ] Set up webhooks (production only)
- [ ] Test subscription updates
- [ ] Test subscription cancellation

---

## 🚨 Important Notes

1. **Never commit `.env.local`** - It contains secret keys
2. **Use test mode** until ready for production
3. **Test webhooks locally** with Stripe CLI
4. **Verify database updates** after each checkout
5. **Handle errors gracefully** in the UI

---

## 🔗 Useful Links

- [Stripe Dashboard](https://dashboard.stripe.com/)
- [Stripe Test Cards](https://stripe.com/docs/testing)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Checkout](https://stripe.com/docs/checkout)

---

## ❓ Troubleshooting

**Issue: "Invalid API Key"**
- Check that `STRIPE_SECRET_KEY` is set correctly in `.env.local`
- Make sure you're using the test key (starts with `sk_test_`)

**Issue: "Price not found"**
- Verify Price IDs in `.env.local` match Stripe Dashboard
- Make sure you copied the Price ID, not the Product ID

**Issue: Webhook not working**
- Check webhook secret is correct
- Verify endpoint URL is correct
- Use Stripe CLI for local testing

**Issue: User tier not updating**
- Check Supabase logs for errors
- Verify migration ran successfully
- Check webhook is receiving events in Stripe Dashboard

---

## Next Steps

After Stripe is working:
1. Add subscription management (cancel, change plan)
2. Add billing portal link
3. Handle failed payments
4. Add trial periods (optional)
5. Test in production with real cards

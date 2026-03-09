# Flowglad Migration Guide

This guide documents the migration from Stripe to Flowglad for payment processing in Serenity Pocket.

## ✅ Completed Changes

### 1. **Package Updates**
- ✅ Installed `@flowglad/nextjs` (v0.13.0)
- ✅ Removed `stripe` and `@stripe/stripe-js` packages

### 2. **Configuration Files**
- ✅ Created `/lib/flowglad.ts` - Flowglad configuration and utilities
- ✅ Removed `/lib/stripe.ts` (old Stripe config)

### 3. **API Routes**
- ✅ Created `/app/api/flowglad/[...path]/route.ts` - Main Flowglad API handler (required)
- ✅ Created `/app/api/flowglad/checkout/route.ts` - Flowglad checkout endpoint
- ✅ Created `/app/api/flowglad/cancel/route.ts` - Cancel subscription endpoint
- ✅ Created `/app/api/flowglad/portal/route.ts` - Billing portal URL endpoint
- ✅ Created `/app/api/webhooks/flowglad/route.ts` - Flowglad webhook handler
- ✅ Old Stripe routes deleted

### 4. **Frontend Components**
- ✅ Updated `/components/tabs/account-tab.tsx` - Uses Flowglad checkout, cancel, and billing portal endpoints; includes Manage Billing and Cancel Subscription buttons
- ✅ Updated `/components/subscription-pricing.tsx` - Payment processor text changed to Flowglad

### 5. **Database**
- ✅ Created migration script: `/migrations/20240108_migrate_to_flowglad.sql`
- Adds `flowglad_customer_id` and `flowglad_subscription_id` columns
- Preserves old `stripe_customer_id` and `stripe_subscription_id` columns temporarily

---

## 🔧 Required Setup Steps

### Step 1: Environment Variables

Add these to your `.env.local` file:

```bash
# Flowglad Configuration
FLOWGLAD_SECRET_KEY=your_secret_key_here
FLOWGLAD_WEBHOOK_SECRET=your_webhook_secret_here
NEXT_PUBLIC_FLOWGLAD_PUBLIC_KEY=your_public_key_here

# Flowglad Price IDs (from your Flowglad dashboard)
FLOWGLAD_PRICE_PREMIUM=price_id_for_premium
FLOWGLAD_PRICE_PREMIUM_PLUS=price_id_for_premium_plus
FLOWGLAD_PRICE_ELITE=price_id_for_elite
```

**Remove these old Stripe variables:**
```bash
# STRIPE_SECRET_KEY=...           # ❌ Remove
# STRIPE_WEBHOOK_SECRET=...       # ❌ Remove
# STRIPE_PRICE_PREMIUM=...        # ❌ Remove
# STRIPE_PRICE_PREMIUM_PLUS=...   # ❌ Remove
# STRIPE_PRICE_ELITE=...          # ❌ Remove
```

### Step 2: Run Database Migration

Execute the migration script in your Supabase SQL editor:

```bash
# Connect to Supabase and run:
psql -h <your-supabase-host> -U postgres -d postgres -f migrations/20240108_migrate_to_flowglad.sql
```

Or manually run the SQL from the Supabase dashboard SQL editor.

### Step 3: Configure Flowglad Dashboard

1. **Create Products in Flowglad:**
   - Premium - $19.99/month
   - Premium Plus - $39.99/month
   - Elite - $79.99/month

2. **Get Price IDs:**
   - Copy the price ID for each product
   - Add them to your `.env.local` as shown above

3. **Set up Webhook Endpoint:**
   - Webhook URL: `https://your-domain.com/api/webhooks/flowglad`
   - Events to listen for:
     - `checkout.session.completed`
     - `subscription.created`
     - `subscription.updated`
     - `subscription.canceled`
     - `subscription.deleted`
     - `payment.failed`

4. **Copy Webhook Secret:**
   - Add to `.env.local` as `FLOWGLAD_WEBHOOK_SECRET`

### Step 4: Test Flowglad Integration

The Flowglad integration includes automatic fallback to test mode in development:

1. **Test Checkout Flow:**
   ```bash
   npm run dev
   ```
   - Navigate to Account tab
   - Click "Upgrade" on any tier
   - If Flowglad is not configured, it falls back to test mode
   - Check console logs for "🧪 FALLBACK TO TEST MODE"

2. **Test with Real Flowglad:**
   - Set environment variables
   - Try creating a checkout session
   - Complete a test payment
   - Verify webhook receives events
   - Check database updates

### Step 5: Update Flowglad API Calls

⚠️ **TypeScript Errors to Fix:**

The following files have TypeScript errors because we don't have complete Flowglad API documentation:

**`/app/api/flowglad/checkout/route.ts` (3 errors):**
- Line 70: `metadata` may not exist on checkout session type
- Line 77 & 80: `id` property may not exist on response

**Solution:** Work with Flowglad team to get:
- Correct checkout session creation API
- Proper response types
- Metadata/customData field names

**`/app/api/webhooks/flowglad/route.ts` (1 error):**
- Line 28: `verifyWebhook` signature parameters

**Solution:** Confirm correct webhook verification API with Flowglad.

---

## 📋 Subscription Tier Configuration

### Current Pricing Structure:
- **Free (Mindful Bettor)**: $0/month
- **Premium (Sharp Insights)**: $19.99/month
- **Premium Plus (Behavioral Advantage)**: $39.99/month
- **Elite (AI Sharp Mode)**: $79.99/month

### Database Fields:
```sql
subscription_tier: 'free' | 'premium' | 'premium_plus' | 'elite'
subscription_status: 'active' | 'inactive' | 'canceled' | 'past_due'
subscription_started_at: TIMESTAMPTZ (nullable)
subscription_ends_at: TIMESTAMPTZ (nullable)
flowglad_customer_id: TEXT (new)
flowglad_subscription_id: TEXT (new)
stripe_customer_id: TEXT (deprecated, will be removed)
stripe_subscription_id: TEXT (deprecated, will be removed)
```

---

## 🧪 Testing Checklist

- [ ] Environment variables configured
- [ ] Database migration executed
- [ ] Flowglad products created
- [ ] Price IDs added to environment
- [ ] Webhook endpoint configured
- [ ] Test checkout creates session
- [ ] Test checkout redirects correctly
- [ ] Test subscription creation webhook
- [ ] Test subscription update webhook
- [ ] Test subscription cancelation webhook
- [ ] Test payment failure webhook
- [ ] Verify database updates correctly
- [ ] Test downgrade to free tier
- [ ] Test upgrade between paid tiers
- [ ] Test on production/staging environment

---

## 🗑️ Cleanup (After Successful Migration)

Once you've confirmed Flowglad works in production:

1. **Delete Old Stripe API Routes:**
   ```bash
   rm -rf app/api/stripe
   rm -rf app/api/webhooks/stripe
   ```

2. **Remove Stripe Database Columns:**
   ```sql
   -- Run in Supabase SQL editor
   BEGIN;
   ALTER TABLE user_profiles DROP COLUMN IF EXISTS stripe_customer_id;
   ALTER TABLE user_profiles DROP COLUMN IF EXISTS stripe_subscription_id;
   COMMIT;
   ```

3. **Remove Stripe Environment Variables** from:
   - `.env.local`
   - Vercel/deployment platform
   - Team documentation

4. **Update Documentation:**
   - Remove Stripe references from README.md
   - Update setup guides
   - Update team onboarding docs

---

## 🆘 Troubleshooting

### Issue: TypeScript errors in Flowglad routes

**Solution:** These are expected. The Flowglad SDK may have different API than assumed. Contact Flowglad support for:
- API documentation
- TypeScript type definitions
- Example Next.js integration code

### Issue: Webhook not receiving events

**Check:**
1. Webhook URL is publicly accessible
2. HTTPS is enabled (required for webhooks)
3. Webhook secret matches `.env.local`
4. Events are selected in Flowglad dashboard
5. Check webhook logs in Flowglad dashboard

### Issue: Checkout session creation fails

**Check:**
1. `FLOWGLAD_SECRET_KEY` is set correctly
2. Price IDs match Flowglad dashboard
3. User is authenticated (check `Authorization` header)
4. Flowglad API is accessible from your server
5. Check API logs for specific error messages

### Issue: Subscription not updating in database

**Check:**
1. Webhook endpoint is receiving events (check logs)
2. Webhook signature verification passes
3. User exists in database with matching customer ID
4. Supabase RLS policies allow admin client updates
5. Check webhook handler logs for errors

---

## 📞 Support Contacts

- **Flowglad Support**: [Contact Flowglad team with questions about their API]
- **Project Documentation**: See `/README.md` for overall architecture
- **Database Schema**: See `/migrations/` for all schema changes

---

## 📈 Next Steps

1. Complete Flowglad setup steps above
2. Fix TypeScript errors with correct Flowglad API
3. Test thoroughly in development
4. Deploy to staging environment
5. Test with real transactions
6. Monitor webhook logs
7. Deploy to production
8. Clean up old Stripe code

---

**Migration Status: 🟡 In Progress**

The code migration is complete, but you need to:
- Configure Flowglad credentials
- Fix TypeScript errors with correct API
- Test the integration
- Deploy and monitor

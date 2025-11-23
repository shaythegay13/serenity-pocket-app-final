# Stripe Subscription Troubleshooting Guide

## Current Status
✅ Stripe checkout flow works (redirects to Stripe)
✅ Payment completes successfully
✅ User returns to app
❌ Subscription not updating in database

## Checklist to Fix

### 1. Database Migration
**Check if columns exist:**
- Go to Supabase → Table Editor → `user_profiles`
- Look for these columns:
  - `subscription_tier`
  - `subscription_status`
  - `stripe_customer_id`
  - `stripe_subscription_id`
  - `subscription_started_at`
  - `subscription_ends_at`

**If columns don't exist, run this migration:**
```sql
-- Copy from /migrations/20240108_add_subscription_fields.sql
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(20) DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer 
ON user_profiles(stripe_customer_id);

ALTER TABLE user_profiles
ADD CONSTRAINT valid_subscription_tier 
CHECK (subscription_tier IN ('free', 'premium', 'premium_plus', 'elite'));

ALTER TABLE user_profiles
ADD CONSTRAINT valid_subscription_status 
CHECK (subscription_status IN ('active', 'inactive', 'canceled', 'past_due'));
```

### 2. Stripe Webhook Setup
**Check if webhook is running:**
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**You should see:**
- ✅ Webhook signing secret displayed
- ✅ Events logged when you complete checkout
- ✅ `checkout.session.completed` event

**If webhook secret is missing from .env.local:**
1. Copy the `whsec_...` from the stripe listen output
2. Add to `.env.local`: `STRIPE_WEBHOOK_SECRET=whsec_...`
3. Restart dev server

### 3. Test Without Stripe (Bypass Webhook)
**Use the test buttons in Account tab:**
1. Go to Account tab (in dev mode)
2. Scroll to "Test Database Subscription Update" (blue box)
3. Click "Set Premium" (or any tier)
4. Click "Sync" button
5. Check if subscription displays correctly

**This tests:**
- ✅ Database columns exist and are writable
- ✅ Storage layer works
- ✅ UI updates properly

### 4. Check Browser Console
**After clicking "Sync", look for:**
```
📊 Database subscription data: {
  tier: "premium",
  status: "active",
  started: "2024-...",
  ends: "2024-..."
}
```

**If all values are null/undefined:**
- Database columns don't exist OR
- Migration didn't run OR
- User row doesn't have data

### 5. Check Supabase Directly
**Manual verification:**
1. Go to Supabase → Table Editor → `user_profiles`
2. Find your user row (search by email or ID)
3. Check the subscription columns
4. If empty, the webhook isn't firing

### 6. Webhook Debugging
**Check dev server terminal for webhook logs:**
```
🛒 Checkout request for tier: premium
✅ Stripe secret key found
✅ Stripe initialized successfully
✅ User authenticated: user@example.com
💰 Price ID for tier: premium = price_...
🎫 Creating Stripe checkout session...
✅ Checkout session created: cs_...
```

**After completing payment, look for:**
```
Webhook event received: checkout.session.completed
✅ User {userId} upgraded to premium
```

### 7. Common Issues

**Issue: Columns don't exist**
- Solution: Run the migration in Supabase SQL Editor

**Issue: Webhook not firing**
- Solution: Start `stripe listen` command
- Make sure it's forwarding to the correct URL
- Check that STRIPE_WEBHOOK_SECRET is in .env.local

**Issue: "Sync" button doesn't work**
- Solution: Check browser console for errors
- Verify you're authenticated
- Check Supabase RLS policies allow updates

**Issue: Subscription shows but doesn't persist**
- Solution: Check localStorage vs database
- Clear localStorage and refresh
- Click "Sync" to pull from database

## Quick Test Flow

1. **Test database write:**
   - Click "Set Premium" in test box
   - Should see success toast

2. **Test database read:**
   - Click "Sync" button
   - Check browser console for data
   - Should see subscription info in UI

3. **Test Stripe flow:**
   - Start webhook: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
   - Click "Upgrade to Premium"
   - Complete checkout with test card: 4242 4242 4242 4242
   - Return to app
   - Click "Sync"
   - Should see Premium subscription

## Files Modified
- `/lib/types.ts` - Added subscription fields to UserData
- `/lib/storage-hybrid.ts` - Added subscription field handling
- `/components/tabs/account-tab.tsx` - Added subscription display and sync
- `/app/api/stripe/checkout/route.ts` - Stripe checkout session creation
- `/app/api/webhooks/stripe/route.ts` - Webhook handler
- `/app/api/test-subscription/route.ts` - Test endpoint (dev only)
- `/migrations/20240108_add_subscription_fields.sql` - Database schema

## Next Steps
1. Run database migration if not done
2. Test with "Set Premium" button
3. If that works, test real Stripe flow
4. Remove test endpoint before production

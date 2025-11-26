# Flowglad Implementation Reference

This document shows how Flowglad has been implemented in Serenity Pocket, following their official documentation.

---

## 📁 File Structure

```
/lib/flowglad.ts                         # Factory function & configuration
/app/api/flowglad/[...path]/route.ts     # Main Flowglad API handler (REQUIRED)
/app/api/flowglad/checkout/route.ts      # Custom checkout endpoint
/app/api/webhooks/flowglad/route.ts      # Webhook handler
```

---

## 🏗️ Implementation Pattern

### 1. Factory Function (`/lib/flowglad.ts`)

```typescript
export const flowglad = (customerExternalId: string) => {
  return new FlowgladServer({
    customerExternalId,
    getCustomerDetails: async (externalId) => {
      // Fetch from Supabase using OUR user ID
      const { data: user } = await supabase
        .from('user_profiles')
        .select('id, email, full_name')
        .eq('id', externalId)
        .single()

      return {
        email: user.email,
        name: user.full_name,
      }
    },
  })
}
```

**Key Points:**
- `customerExternalId` = OUR database user ID (from Supabase)
- NOT Flowglad's customer ID
- B2C app: Uses `user.id`

---

### 2. Main API Route (`/app/api/flowglad/[...path]/route.ts`)

```typescript
export const { GET, POST } = nextRouteHandler({
  flowglad,
  getCustomerExternalId: async (req) => {
    // Extract user ID from auth token
    const authHeader = req.headers.get('authorization')
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)
    
    // Return OUR database user ID
    return user.id
  },
})
```

**Key Points:**
- Required for Flowglad to work
- Handles all `/api/flowglad/*` routes
- Extracts user ID from Supabase auth
- Returns our user ID (not Flowglad's)

---

### 3. Checkout Flow

**Client Side:**
```typescript
// In account-tab.tsx
const response = await fetch('/api/flowglad/checkout', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${session.access_token}`
  },
  body: JSON.stringify({ tier: 'premium' }),
})

const { url } = await response.json()
window.location.href = url  // Redirect to Flowglad checkout
```

**Server Side:**
```typescript
// In /app/api/flowglad/checkout/route.ts
const flowgladServer = flowglad(user.id)

const checkoutSession = await flowgladServer.createCheckoutSession({
  priceId: 'price_xxxxx',
  successUrl: 'https://app.com?success=true',
  cancelUrl: 'https://app.com?canceled=true',
})

return NextResponse.json({ url: checkoutSession.url })
```

---

### 4. Webhook Handler

**Endpoint:** `/api/webhooks/flowglad`

```typescript
// Verify signature
const event = verifyWebhook(body, signature, webhookSecret)

// Handle events
switch (event.type) {
  case 'checkout.session.completed':
  case 'subscription.created':
    // Update database with subscription
    await supabase
      .from('user_profiles')
      .update({
        subscription_tier: tier,
        subscription_status: 'active',
        flowglad_customer_id: customerId,
        flowglad_subscription_id: subscriptionId,
      })
    break
    
  case 'subscription.canceled':
    // Downgrade to free
    break
}
```

---

## 🔑 Key Concepts

### Customer External ID vs Flowglad Customer ID

| ID Type | What it is | Where it comes from |
|---------|-----------|---------------------|
| **Customer External ID** | Our database user ID | Supabase `user_profiles.id` |
| **Flowglad Customer ID** | Flowglad's internal ID | Flowglad creates this automatically |

**When to use which:**
- ✅ **Use Customer External ID** when creating FlowgladServer instances
- ✅ **Use Customer External ID** in `getCustomerExternalId()`
- ✅ **Store Flowglad Customer ID** in database after checkout (for webhooks)

### Authentication Flow

```
1. User clicks "Upgrade" button
2. Client sends request with Supabase auth token
3. Server extracts user ID from token
4. Server creates flowglad(userId)
5. Server creates checkout session
6. User completes payment on Flowglad
7. Webhook updates database with Flowglad IDs
```

---

## 🗄️ Database Schema

```sql
-- Required columns
subscription_tier: 'free' | 'premium' | 'premium_plus' | 'elite'
subscription_status: 'active' | 'inactive' | 'canceled' | 'past_due'
subscription_started_at: TIMESTAMPTZ (nullable)
subscription_ends_at: TIMESTAMPTZ (nullable)

-- Flowglad columns (added by migration)
flowglad_customer_id: TEXT (nullable)
flowglad_subscription_id: TEXT (nullable)
```

**Indexes:**
- `idx_user_profiles_flowglad_customer_id` (for webhook lookups)
- `idx_user_profiles_flowglad_subscription_id` (for subscription queries)

---

## 🧪 Development Mode

The checkout endpoint automatically falls back to test mode if Flowglad is not configured:

```typescript
try {
  // Try Flowglad
  const session = await flowgladServer.createCheckoutSession(...)
} catch (error) {
  if (process.env.NODE_ENV === 'development') {
    // Fallback: Grant subscription directly
    await supabase.update({ subscription_tier: tier })
  }
}
```

**Benefits:**
- ✅ Local development works without Flowglad credentials
- ✅ Team members can test subscription features
- ✅ Only production needs real Flowglad setup

---

## 🔧 Configuration Checklist

- [ ] Set `FLOWGLAD_SECRET_KEY` in environment
- [ ] Set `FLOWGLAD_WEBHOOK_SECRET` in environment
- [ ] Set `NEXT_PUBLIC_FLOWGLAD_PUBLIC_KEY` in environment (if needed)
- [ ] Create products in Flowglad dashboard
- [ ] Get price IDs and add to environment (`FLOWGLAD_PRICE_PREMIUM`, etc.)
- [ ] Configure webhook URL: `https://your-domain.com/api/webhooks/flowglad`
- [ ] Run database migration to add Flowglad columns
- [ ] Test checkout flow in development
- [ ] Test webhook events

---

## 📊 Subscription Tiers

| Tier | Name | Price | Price ID Env Var |
|------|------|-------|------------------|
| Free | Mindful Bettor | $0 | N/A |
| Premium | Sharp Insights | $19.99/mo | `FLOWGLAD_PRICE_PREMIUM` |
| Premium Plus | Behavioral Advantage | $39.99/mo | `FLOWGLAD_PRICE_PREMIUM_PLUS` |
| Elite | AI Sharp Mode | $79.99/mo | `FLOWGLAD_PRICE_ELITE` |

---

## 🚨 Common Issues

### "Customer not found" error
- Check that user exists in `user_profiles` table
- Verify `customerExternalId` is our user ID, not Flowglad's

### Webhook signature verification fails
- Check `FLOWGLAD_WEBHOOK_SECRET` is correct
- Verify webhook URL is publicly accessible over HTTPS
- Check signature header name (might be `flowglad-signature` or `x-flowglad-signature`)

### Checkout session creation fails
- Verify `FLOWGLAD_SECRET_KEY` is set
- Check price IDs are correct
- Ensure user is authenticated
- Look at Flowglad dashboard logs

---

## 📚 Related Documentation

- [FLOWGLAD_MIGRATION_GUIDE.md](./FLOWGLAD_MIGRATION_GUIDE.md) - Setup guide
- [STRIPE_TO_FLOWGLAD_SUMMARY.md](./STRIPE_TO_FLOWGLAD_SUMMARY.md) - Migration summary
- [ENV_FLOWGLAD_TEMPLATE.txt](./ENV_FLOWGLAD_TEMPLATE.txt) - Environment variables
- [/migrations/20240108_migrate_to_flowglad.sql](./migrations/20240108_migrate_to_flowglad.sql) - Database migration

---

## ✅ Implementation Status

**Pattern**: ✅ Follows Flowglad's official documentation  
**Factory Function**: ✅ Implemented in `/lib/flowglad.ts`  
**Main API Route**: ✅ Implemented at `/app/api/flowglad/[...path]/route.ts`  
**Checkout**: ✅ Custom endpoint with fallback to test mode  
**Webhooks**: ✅ Handles all subscription events  
**Database**: ✅ Migration ready to run  

**Ready for:** Configuration and testing with real Flowglad credentials

# AI Usage Limits Migration - Implementation Complete

## Summary

Successfully implemented usage-based limits for AI services with marketplace for purchasing additional credits.

## What Changed

### Database Schema
- **New Tables:**
  - `ai_service_usage` - Tracks weekly usage per user per service
  - `ai_usage_limits` - Defines tier-based weekly limits
  - `ai_usage_purchases` - Records marketplace credit purchases
  - `ai_marketplace_products` - Product catalog for additional credits

### API Routes
- **Updated:**
  - `/api/picker/recommend` - Now checks usage limits + rate limiting
  - `/api/ai/analyze-bet` - Now checks usage limits + rate limiting
  - `/api/webhooks/flowglad` - Handles marketplace purchases

- **New:**
  - `/api/marketplace/products` - List available products
  - `/api/marketplace/purchase` - Create checkout session
  - `/api/marketplace/usage-stats` - Get user's current usage
  - `/api/cron/reset-weekly-usage` - Weekly cleanup (runs Mondays)

- **Deprecated (to be removed):**
  - `/api/analyze-bet` - Old basic analyzer
  - `/api/bet/analyze` - Duplicate old analyzer

### Frontend
- **New Components:**
  - `components/ai-usage-indicator.tsx` - Shows weekly usage stats
  - `app/marketplace/page.tsx` - Marketplace for buying credits
  - `app/marketplace/success/page.tsx` - Purchase confirmation

### Core Libraries
- `lib/ai-usage-tracker.ts` - Usage tracking and limit checking
- `lib/rate-limiter.ts` - Abuse prevention via rate limiting

## Usage Limits Per Tier

| Tier | AI Picker (weekly) | AI Bet Analyzer (weekly) | Price |
|------|-------------------|-------------------------|-------|
| Free | 0 | 0 | $0 |
| Premium | 1 | 1 | $19.99/mo |
| Premium Plus | 3 | 3 | $39.99/mo |
| Elite | 7 | 7 | $79.99/mo |

## Marketplace Products

| Product | AI Picker | AI Analyzer | Price |
|---------|-----------|-------------|-------|
| Single Picker | +1 | 0 | $30 |
| Single Analyzer | 0 | +1 | $30 |
| Bundle Single | +1 | +1 | $55 (save $5) |
| Double Picker | +2 | 0 | $60 |
| Double Analyzer | 0 | +2 | $60 |
| Bundle Double | +2 | +2 | $105 (save $15) |

## Migration Steps

### 1. Run Database Migration
```sql
-- Run this in Supabase SQL Editor
-- File: migrations/20241202_ai_usage_limits.sql
```

### 2. Configure Environment Variables
```env
# Add to .env.local
CRON_SECRET=your-random-secret-here

# Flowglad price IDs for marketplace products (configure in Flowglad dashboard)
FLOWGLAD_PRICE_SINGLE_PICKER=price_xxx
FLOWGLAD_PRICE_SINGLE_ANALYZER=price_xxx
FLOWGLAD_PRICE_BUNDLE_SINGLE=price_xxx
FLOWGLAD_PRICE_DOUBLE_PICKER=price_xxx
FLOWGLAD_PRICE_DOUBLE_ANALYZER=price_xxx
FLOWGLAD_PRICE_BUNDLE_DOUBLE=price_xxx
```

### 3. Update Flowglad Products
After creating products in Flowglad dashboard, update the database:
```sql
UPDATE ai_marketplace_products 
SET flowglad_price_id = 'price_xxx' 
WHERE product_key = 'single_picker';
-- Repeat for all products
```

### 4. Set Up Vercel Cron (if using Vercel)
The `vercel.json` file is already configured to run weekly resets every Monday at 00:00 UTC.

### 5. Remove Old Routes (Manual Step)
Delete these deprecated routes:
- `app/api/analyze-bet/` (entire directory)
- `app/api/bet/analyze/` (entire directory)

These are replaced by `/api/ai/analyze-bet` which now has usage limits.

## Testing Checklist

- [ ] Run database migration successfully
- [ ] Premium user can use AI Picker 1x/week
- [ ] Premium Plus user can use AI Picker 3x/week
- [ ] Elite user can use AI Picker 7x/week
- [ ] User blocked after hitting weekly limit
- [ ] Marketplace products display correctly
- [ ] Purchase flow creates Flowglad checkout
- [ ] Webhook updates credits after payment
- [ ] Usage indicator shows correct stats
- [ ] Weekly reset cron job runs (test manually first)
- [ ] Usage limits prevent over-consumption

## Rollback Plan

If issues arise:

1. **Disable usage checks temporarily:**
   - Comment out usage check in `/api/picker/recommend/route.ts`
   - Comment out usage check in `/api/ai/analyze-bet/route.ts`

2. **Revert to tier-only access:**
   - Change usage checks to simple tier checks (Premium+ for analyzer, Elite for picker)

3. **Database rollback:**
   ```sql
   DROP TABLE IF EXISTS ai_service_usage CASCADE;
   DROP TABLE IF EXISTS ai_usage_purchases CASCADE;
   DROP TABLE IF EXISTS ai_marketplace_products CASCADE;
   DROP TABLE IF EXISTS ai_usage_limits CASCADE;
   ```

## Support & Monitoring

### Check User Usage
```sql
SELECT 
  u.email,
  u.subscription_tier,
  COUNT(CASE WHEN service_type = 'ai_picker' THEN 1 END) as picker_uses,
  COUNT(CASE WHEN service_type = 'ai_bet_analyzer' THEN 1 END) as analyzer_uses
FROM ai_service_usage asu
JOIN user_profiles u ON u.id = asu.user_id
WHERE week_start_date = (SELECT get_week_start_date(CURRENT_DATE))
GROUP BY u.email, u.subscription_tier
ORDER BY (picker_uses + analyzer_uses) DESC;
```

### Check Marketplace Revenue
```sql
SELECT 
  purchase_type,
  COUNT(*) as purchases,
  SUM(price_paid) as total_revenue
FROM ai_usage_purchases
WHERE purchased_at >= NOW() - INTERVAL '30 days'
GROUP BY purchase_type
ORDER BY total_revenue DESC;
```

### Monitor Usage Patterns
Check application logs for:
- `[AI Usage Tracker]` entries
- Unusual usage patterns
- Users hitting limits frequently (may indicate need for tier upgrade prompts)

## Notes

- Weekly limits reset every Monday at 00:00 UTC
- Purchased credits never expire (unless you add expiration logic)
- Rate limiting library available in `lib/rate-limiter.ts` if needed later
- Tier limits are in database and can be adjusted without code changes
- Usage limits themselves provide primary abuse prevention

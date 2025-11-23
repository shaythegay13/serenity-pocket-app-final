# Database Migrations for Betting Companion Redesign

## Quick Start

Since the `bet_analyses` table already exists, follow these steps:

### Step 1: Check Current Schema (Optional)
Run this to see what columns currently exist in `bet_analyses`:
```sql
-- File: check_bet_analyses_schema.sql
```
This will show you the current structure.

### Step 2: Update bet_analyses Table
Run this to add any missing columns to the existing table:
```sql
-- File: update_bet_analyses_if_needed.sql
```
This script is **safe to run multiple times** - it only adds columns that don't exist.

### Step 3: Create Remaining Tables
Run this to create the other tables needed:
```sql
-- File: create_remaining_tables.sql
```
This creates:
- `tilt_alerts` - For tracking when users are emotionally compromised
- `ai_picks` - For storing AI-generated bet suggestions (Elite tier)
- Updates `user_profiles` with subscription tracking columns

## What Each Migration Does

### 1. `check_bet_analyses_schema.sql`
- **Purpose**: Diagnostic query to see current table structure
- **Safe**: Yes, read-only
- **Run**: Optional, for information only

### 2. `update_bet_analyses_if_needed.sql`
- **Purpose**: Updates existing `bet_analyses` table with new columns
- **Safe**: Yes, only adds missing columns
- **Adds**:
  - `bet_type` - Type of bet (straight, parlay, prop)
  - `sport` - Sport category
  - `description` - Bet description
  - `emotional_state` - User's emotion when analyzing
  - `emotional_intensity` - Intensity level (1-10)
  - `probability_estimate` - AI probability estimate
  - `expected_value` - EV calculation
  - `ai_recommendation` - AI advice
  - `outcome` - Result (pending, win, loss, push)
  - `actual_return` - Actual profit/loss
- **Also adds**:
  - Indexes for performance
  - Row Level Security (RLS) policies

### 3. `create_remaining_tables.sql`
- **Purpose**: Creates new tables for additional features
- **Safe**: Yes, uses `CREATE TABLE IF NOT EXISTS`
- **Creates**:
  - **tilt_alerts**: Tracks emotional warnings
  - **ai_picks**: Stores AI-generated picks for Elite users
  - **user_subscription_status**: View for checking subscription status
- **Updates**:
  - `user_profiles` with subscription columns

## How to Run in Supabase

### Option A: SQL Editor (Recommended)
1. Go to Supabase Dashboard
2. Click **SQL Editor** in left sidebar
3. Click **New Query**
4. Copy and paste the SQL from each file
5. Click **Run** or press `Ctrl+Enter`
6. Run in this order:
   - `update_bet_analyses_if_needed.sql` (first)
   - `create_remaining_tables.sql` (second)

### Option B: Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db push migrations/update_bet_analyses_if_needed.sql
supabase db push migrations/create_remaining_tables.sql
```

## Verification

After running migrations, verify with:

```sql
-- Check bet_analyses columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bet_analyses'
ORDER BY ordinal_position;

-- Check if new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('tilt_alerts', 'ai_picks');

-- Check user_profiles subscription columns
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name LIKE '%subscription%';
```

## Expected Results

After successful migration, you should have:

✅ **bet_analyses** table with all required columns
✅ **tilt_alerts** table for emotional warnings
✅ **ai_picks** table for Elite tier picks
✅ **user_profiles** updated with subscription tracking
✅ RLS policies enabled on all tables
✅ Indexes created for performance
✅ **user_subscription_status** view for easy subscription checks

## Troubleshooting

### Error: "relation already exists"
**Solution**: This is fine! The script uses `IF NOT EXISTS` so it won't break.

### Error: "column already exists"
**Solution**: This is expected. The script checks before adding columns.

### Error: "permission denied"
**Solution**: Make sure you're running as the database owner or have sufficient privileges.

### Error: "auth.users does not exist"
**Solution**: This shouldn't happen in Supabase, but if it does, the auth schema might not be set up correctly.

## What This Enables

After running these migrations:

1. ✅ **Save Analysis button works** - Bet analyses save to database
2. ✅ **Tilt detection** - System can track and alert on emotional states
3. ✅ **AI Picks** - Elite users can receive personalized picks
4. ✅ **Subscription tracking** - System knows user's tier and expiration
5. ✅ **Performance** - Indexes speed up queries
6. ✅ **Security** - RLS ensures users only see their own data

## Next Steps After Migration

1. Test the "Save Analysis" button in the app
2. Verify data is saving to Supabase (check the table in Supabase dashboard)
3. Move on to Phase 2: API integrations (Odds API, OpenAI)

## Rollback (If Needed)

If you need to undo these changes:

```sql
-- Drop new tables (WARNING: This deletes all data)
DROP TABLE IF EXISTS tilt_alerts CASCADE;
DROP TABLE IF EXISTS ai_picks CASCADE;
DROP VIEW IF EXISTS user_subscription_status;

-- Remove columns from user_profiles
ALTER TABLE user_profiles 
DROP COLUMN IF EXISTS subscription_tier,
DROP COLUMN IF EXISTS subscription_expires_at,
DROP COLUMN IF EXISTS stripe_customer_id,
DROP COLUMN IF EXISTS stripe_subscription_id;

-- Note: We don't drop bet_analyses since it existed before
```

## Support

If you encounter issues:
1. Check the Supabase logs in the dashboard
2. Verify you're connected to the correct project
3. Ensure you have the necessary permissions
4. Check that the `auth.users` table exists (it should in Supabase)

---

**Remember**: These migrations are designed to be safe and idempotent - you can run them multiple times without breaking anything!

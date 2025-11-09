# Supabase Schema Migration Instructions

## Overview
This migration adds emotion intensity tracking columns to store complete bet emotion data in Supabase instead of just localStorage.

## New Columns Added to `trades` table:
- `pre_trade_intensity` - Intensity of pre-betting emotion (1-5 scale)
- `during_trade_emotion` - Optional emotion during betting
- `during_trade_intensity` - Intensity during betting (1-5 scale)
- `post_trade_intensity` - Intensity of post-betting emotion (1-5 scale)
- `emotional_impact` - Overall emotional impact rating (1-5 scale)

## How to Apply the Migration

### Option 1: Using Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your Serenity Pocket project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Migration**
   - Copy the entire contents of `supabase-migration-add-intensity-columns.sql`
   - Paste into the SQL editor
   - Click "Run" or press Ctrl+Enter
   - Wait for confirmation message

4. **Verify the Migration**
   - Go to "Table Editor" in the left sidebar
   - Select the `trades` table
   - Verify the new columns appear in the schema

### Option 2: Using Supabase CLI

```bash
# Make sure you're logged in to Supabase CLI
supabase login

# Link to your project (if not already linked)
supabase link --project-ref YOUR_PROJECT_REF

# Run the migration
supabase db push

# Or apply the migration file directly
supabase db execute < supabase-migration-add-intensity-columns.sql
```

## Post-Migration Steps

1. **Test the Integration**
   - Log a new pre-betting emotion in the app
   - Complete a post-betting emotion
   - Check the Supabase dashboard to verify data is being saved

2. **Verify Data Sync**
   - Go to Supabase Dashboard → Table Editor → trades
   - You should see all new emotion entries with intensity values

3. **Historical Data**
   - Existing trades in localStorage will continue to work
   - New trades will now sync to Supabase with full emotion data
   - Historical data can be migrated manually if needed

## What Changed in the Code

### database.ts
- ✅ `addTrade()` now includes all intensity columns
- ✅ `updateTrade()` properly updates intensity values
- ✅ `mapDbToTrade()` correctly maps all emotion data

### Schema Benefits
- ✅ All emotion data stored in Supabase
- ✅ Enables future analytics and insights
- ✅ Data persists across devices when logged in
- ✅ Backup and recovery of emotion tracking data
- ✅ Supports future AI/ML features

## Rollback (If Needed)

If you need to rollback this migration:

```sql
ALTER TABLE trades DROP COLUMN IF EXISTS pre_trade_intensity;
ALTER TABLE trades DROP COLUMN IF EXISTS during_trade_emotion;
ALTER TABLE trades DROP COLUMN IF EXISTS during_trade_intensity;
ALTER TABLE trades DROP COLUMN IF EXISTS post_trade_intensity;
ALTER TABLE trades DROP COLUMN IF EXISTS emotional_impact;
```

## Support

If you encounter any issues:
1. Check the Supabase logs in the Dashboard
2. Verify your project has the latest schema
3. Ensure your Supabase project is on a paid plan (if using extensive features)
4. Check browser console for any sync errors

## Data Flow After Migration

```
User logs Pre-Betting Emotion
    ↓
Saved to localStorage (instant)
    ↓
Synced to Supabase (with intensity)
    ↓
User completes Post-Betting Emotion
    ↓
Updates localStorage
    ↓
Updates Supabase trade record
    ↓
Full emotion cycle stored in database
```

All emotion tracking data is now fully synchronized with Supabase! 🎯📊

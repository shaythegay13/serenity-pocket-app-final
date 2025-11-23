-- COMPLETE SUBSCRIPTION SETUP - Run this in Supabase SQL Editor
-- This combines columns, RLS policies, and constraints

-- Step 1: Add subscription columns
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(20) DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ;

-- Step 2: Create index
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer 
ON user_profiles(stripe_customer_id);

-- Step 3: Fix RLS policies
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Step 4: Add constraints
ALTER TABLE user_profiles
DROP CONSTRAINT IF EXISTS valid_subscription_tier;

ALTER TABLE user_profiles
ADD CONSTRAINT valid_subscription_tier 
CHECK (subscription_tier IN ('free', 'premium', 'premium_plus', 'elite'));

ALTER TABLE user_profiles
DROP CONSTRAINT IF EXISTS valid_subscription_status;

ALTER TABLE user_profiles
ADD CONSTRAINT valid_subscription_status 
CHECK (subscription_status IN ('active', 'inactive', 'canceled', 'past_due'));

-- Done! You should now be able to create profiles and update subscriptions

-- Add subscription fields to user_profiles table (safe version)
-- This version won't error if columns or constraints already exist

-- Add columns if they don't exist
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(20) DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(256),
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ;

-- Create index for faster lookups (won't error if exists)
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer 
ON user_profiles(stripe_customer_id);

-- Drop and recreate constraints to ensure they're correct
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

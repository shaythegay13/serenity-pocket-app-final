-- Migration: Replace Stripe with Flowglad
-- Date: 2024-01-08
-- Description: Updates user_profiles table to use Flowglad instead of Stripe

BEGIN;

-- Add Flowglad customer and subscription ID columns
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS flowglad_customer_id TEXT,
ADD COLUMN IF NOT EXISTS flowglad_subscription_id TEXT;

-- Create indexes for Flowglad IDs (for webhook lookups)
CREATE INDEX IF NOT EXISTS idx_user_profiles_flowglad_customer_id 
ON user_profiles(flowglad_customer_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_flowglad_subscription_id 
ON user_profiles(flowglad_subscription_id);

-- Optional: Drop Stripe columns if you're sure you don't need them
-- Uncomment these lines after you've migrated all data
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS stripe_customer_id;
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS stripe_subscription_id;

-- Note: Keep stripe_ columns temporarily to preserve data during migration
-- You can drop them later after confirming Flowglad integration works

COMMIT;

-- Rollback script (if needed):
-- BEGIN;
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS flowglad_customer_id;
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS flowglad_subscription_id;
-- DROP INDEX IF EXISTS idx_user_profiles_flowglad_customer_id;
-- DROP INDEX IF EXISTS idx_user_profiles_flowglad_subscription_id;
-- COMMIT;

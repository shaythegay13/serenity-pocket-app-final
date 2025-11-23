-- Migration: Create remaining tables for betting companion features
-- This script safely creates tables only if they don't exist

-- 1. Tilt Alerts Table
CREATE TABLE IF NOT EXISTS tilt_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  triggers TEXT[] NOT NULL,
  recommendation TEXT NOT NULL,
  cooldown_suggested BOOLEAN DEFAULT false,
  acknowledged BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for tilt_alerts
CREATE INDEX IF NOT EXISTS idx_tilt_alerts_user_id ON tilt_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_tilt_alerts_created_at ON tilt_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tilt_alerts_severity ON tilt_alerts(severity);

-- Enable RLS for tilt_alerts
ALTER TABLE tilt_alerts ENABLE ROW LEVEL SECURITY;

-- Policies for tilt_alerts
DROP POLICY IF EXISTS "Users can view their own tilt alerts" ON tilt_alerts;
DROP POLICY IF EXISTS "Users can insert their own tilt alerts" ON tilt_alerts;
DROP POLICY IF EXISTS "Users can update their own tilt alerts" ON tilt_alerts;

CREATE POLICY "Users can view their own tilt alerts"
    ON tilt_alerts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tilt alerts"
    ON tilt_alerts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tilt alerts"
    ON tilt_alerts FOR UPDATE
    USING (auth.uid() = user_id);

-- 2. AI Picks Table (Elite tier feature)
CREATE TABLE IF NOT EXISTS ai_picks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sport VARCHAR(50) NOT NULL,
  event TEXT NOT NULL,
  pick TEXT NOT NULL,
  pick_type VARCHAR(20) CHECK (pick_type IN ('straight', 'parlay', 'prop')),
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  expected_value DECIMAL,
  reasoning TEXT,
  emotional_alignment INTEGER CHECK (emotional_alignment >= 0 AND emotional_alignment <= 100),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'push', 'cancelled')),
  actual_return DECIMAL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  logged_as_bet BOOLEAN DEFAULT false
);

-- Add indexes for ai_picks
CREATE INDEX IF NOT EXISTS idx_ai_picks_user_id ON ai_picks(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_picks_created_at ON ai_picks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_picks_status ON ai_picks(status);
CREATE INDEX IF NOT EXISTS idx_ai_picks_sport ON ai_picks(sport);

-- Enable RLS for ai_picks
ALTER TABLE ai_picks ENABLE ROW LEVEL SECURITY;

-- Policies for ai_picks
DROP POLICY IF EXISTS "Users can view their own AI picks" ON ai_picks;
DROP POLICY IF EXISTS "Users can insert their own AI picks" ON ai_picks;
DROP POLICY IF EXISTS "Users can update their own AI picks" ON ai_picks;

CREATE POLICY "Users can view their own AI picks"
    ON ai_picks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI picks"
    ON ai_picks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI picks"
    ON ai_picks FOR UPDATE
    USING (auth.uid() = user_id);

-- 3. Update user_profiles table for subscription tracking
DO $$ 
BEGIN
    -- Add subscription_tier column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'subscription_tier'
    ) THEN
        ALTER TABLE user_profiles 
        ADD COLUMN subscription_tier VARCHAR(20) DEFAULT 'free' 
        CHECK (subscription_tier IN ('free', 'premium', 'premium_plus', 'elite'));
    END IF;

    -- Add subscription_expires_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'subscription_expires_at'
    ) THEN
        ALTER TABLE user_profiles 
        ADD COLUMN subscription_expires_at TIMESTAMP;
    END IF;

    -- Add stripe_customer_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'stripe_customer_id'
    ) THEN
        ALTER TABLE user_profiles 
        ADD COLUMN stripe_customer_id VARCHAR(255) UNIQUE;
    END IF;

    -- Add stripe_subscription_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'stripe_subscription_id'
    ) THEN
        ALTER TABLE user_profiles 
        ADD COLUMN stripe_subscription_id VARCHAR(255);
    END IF;
END $$;

-- Add index for subscription queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_tier ON user_profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer ON user_profiles(stripe_customer_id);

-- 4. Create a view for user subscription status
CREATE OR REPLACE VIEW user_subscription_status AS
SELECT 
    user_id,
    subscription_tier,
    subscription_expires_at,
    CASE 
        WHEN subscription_tier = 'free' THEN true
        WHEN subscription_expires_at IS NULL THEN true
        WHEN subscription_expires_at > NOW() THEN true
        ELSE false
    END AS is_active,
    CASE 
        WHEN subscription_expires_at IS NOT NULL AND subscription_expires_at <= NOW() THEN true
        ELSE false
    END AS is_expired
FROM user_profiles;

-- Grant access to the view
GRANT SELECT ON user_subscription_status TO authenticated;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Created tables: tilt_alerts, ai_picks';
    RAISE NOTICE 'Updated table: user_profiles (added subscription columns)';
    RAISE NOTICE 'Created view: user_subscription_status';
END $$;

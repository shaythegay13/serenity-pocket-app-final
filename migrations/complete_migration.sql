-- ============================================================================
-- COMPLETE DATABASE MIGRATION FOR BETTING COMPANION REDESIGN
-- Run this entire script in Supabase SQL Editor
-- Safe to run multiple times - uses IF NOT EXISTS checks
-- ============================================================================

-- ============================================================================
-- PART 1: Update bet_analyses table (already exists)
-- ============================================================================

DO $$ 
BEGIN
    RAISE NOTICE 'Starting migration...';
    RAISE NOTICE 'Part 1: Updating bet_analyses table';

    -- Add bet_type column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bet_analyses' AND column_name = 'bet_type'
    ) THEN
        ALTER TABLE bet_analyses ADD COLUMN bet_type VARCHAR(20);
        RAISE NOTICE '  ✓ Added bet_type column';
    END IF;

    -- Add sport column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bet_analyses' AND column_name = 'sport'
    ) THEN
        ALTER TABLE bet_analyses ADD COLUMN sport VARCHAR(50);
        RAISE NOTICE '  ✓ Added sport column';
    END IF;

    -- Handle description column (might be named bet_description)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bet_analyses' AND column_name = 'description'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'bet_analyses' AND column_name = 'bet_description'
        ) THEN
            ALTER TABLE bet_analyses RENAME COLUMN bet_description TO description;
            RAISE NOTICE '  ✓ Renamed bet_description to description';
        ELSE
            ALTER TABLE bet_analyses ADD COLUMN description TEXT;
            RAISE NOTICE '  ✓ Added description column';
        END IF;
    END IF;

    -- Add emotional_state column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bet_analyses' AND column_name = 'emotional_state'
    ) THEN
        ALTER TABLE bet_analyses ADD COLUMN emotional_state VARCHAR(50);
        RAISE NOTICE '  ✓ Added emotional_state column';
    END IF;

    -- Add emotional_intensity column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bet_analyses' AND column_name = 'emotional_intensity'
    ) THEN
        ALTER TABLE bet_analyses ADD COLUMN emotional_intensity INTEGER;
        RAISE NOTICE '  ✓ Added emotional_intensity column';
    END IF;

    -- Handle probability_estimate column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bet_analyses' AND column_name = 'probability_estimate'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'bet_analyses' AND column_name = 'probability'
        ) THEN
            ALTER TABLE bet_analyses RENAME COLUMN probability TO probability_estimate;
            RAISE NOTICE '  ✓ Renamed probability to probability_estimate';
        ELSE
            ALTER TABLE bet_analyses ADD COLUMN probability_estimate DECIMAL;
            RAISE NOTICE '  ✓ Added probability_estimate column';
        END IF;
    END IF;

    -- Add expected_value column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bet_analyses' AND column_name = 'expected_value'
    ) THEN
        ALTER TABLE bet_analyses ADD COLUMN expected_value DECIMAL;
        RAISE NOTICE '  ✓ Added expected_value column';
    END IF;

    -- Handle ai_recommendation column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bet_analyses' AND column_name = 'ai_recommendation'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'bet_analyses' AND column_name = 'recommendation'
        ) THEN
            ALTER TABLE bet_analyses RENAME COLUMN recommendation TO ai_recommendation;
            RAISE NOTICE '  ✓ Renamed recommendation to ai_recommendation';
        ELSE
            ALTER TABLE bet_analyses ADD COLUMN ai_recommendation TEXT;
            RAISE NOTICE '  ✓ Added ai_recommendation column';
        END IF;
    END IF;

    -- Add outcome column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bet_analyses' AND column_name = 'outcome'
    ) THEN
        ALTER TABLE bet_analyses ADD COLUMN outcome VARCHAR(20);
        RAISE NOTICE '  ✓ Added outcome column';
    END IF;

    -- Add actual_return column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bet_analyses' AND column_name = 'actual_return'
    ) THEN
        ALTER TABLE bet_analyses ADD COLUMN actual_return DECIMAL;
        RAISE NOTICE '  ✓ Added actual_return column';
    END IF;

    -- Ensure timestamp column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bet_analyses' AND column_name = 'timestamp'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'bet_analyses' AND column_name = 'created_at'
        ) THEN
            ALTER TABLE bet_analyses RENAME COLUMN created_at TO timestamp;
            RAISE NOTICE '  ✓ Renamed created_at to timestamp';
        ELSE
            ALTER TABLE bet_analyses ADD COLUMN timestamp TIMESTAMP DEFAULT NOW();
            RAISE NOTICE '  ✓ Added timestamp column';
        END IF;
    END IF;

    RAISE NOTICE 'Part 1 complete: bet_analyses table updated';
END $$;

-- Add indexes for bet_analyses
CREATE INDEX IF NOT EXISTS idx_bet_analyses_user_id ON bet_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_bet_analyses_timestamp ON bet_analyses(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_bet_analyses_outcome ON bet_analyses(outcome);

-- Enable RLS for bet_analyses
ALTER TABLE bet_analyses ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies for bet_analyses
DROP POLICY IF EXISTS "Users can view their own bet analyses" ON bet_analyses;
DROP POLICY IF EXISTS "Users can insert their own bet analyses" ON bet_analyses;
DROP POLICY IF EXISTS "Users can update their own bet analyses" ON bet_analyses;

CREATE POLICY "Users can view their own bet analyses"
    ON bet_analyses FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bet analyses"
    ON bet_analyses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bet analyses"
    ON bet_analyses FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================================================
-- PART 2: Create tilt_alerts table
-- ============================================================================

DO $$ 
BEGIN
    RAISE NOTICE 'Part 2: Creating tilt_alerts table';
END $$;

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

CREATE INDEX IF NOT EXISTS idx_tilt_alerts_user_id ON tilt_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_tilt_alerts_created_at ON tilt_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tilt_alerts_severity ON tilt_alerts(severity);

ALTER TABLE tilt_alerts ENABLE ROW LEVEL SECURITY;

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

-- ============================================================================
-- PART 3: Create ai_picks table (Elite tier)
-- ============================================================================

DO $$ 
BEGIN
    RAISE NOTICE 'Part 3: Creating ai_picks table';
END $$;

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

CREATE INDEX IF NOT EXISTS idx_ai_picks_user_id ON ai_picks(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_picks_created_at ON ai_picks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_picks_status ON ai_picks(status);
CREATE INDEX IF NOT EXISTS idx_ai_picks_sport ON ai_picks(sport);

ALTER TABLE ai_picks ENABLE ROW LEVEL SECURITY;

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

-- ============================================================================
-- PART 4: Update user_profiles for subscription tracking
-- ============================================================================

DO $$ 
BEGIN
    RAISE NOTICE 'Part 4: Updating user_profiles table';

    -- Add subscription_tier column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'subscription_tier'
    ) THEN
        ALTER TABLE user_profiles 
        ADD COLUMN subscription_tier VARCHAR(20) DEFAULT 'free' 
        CHECK (subscription_tier IN ('free', 'premium', 'premium_plus', 'elite'));
        RAISE NOTICE '  ✓ Added subscription_tier column';
    END IF;

    -- Add subscription_expires_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'subscription_expires_at'
    ) THEN
        ALTER TABLE user_profiles 
        ADD COLUMN subscription_expires_at TIMESTAMP;
        RAISE NOTICE '  ✓ Added subscription_expires_at column';
    END IF;

    -- Add stripe_customer_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'stripe_customer_id'
    ) THEN
        ALTER TABLE user_profiles 
        ADD COLUMN stripe_customer_id VARCHAR(255) UNIQUE;
        RAISE NOTICE '  ✓ Added stripe_customer_id column';
    END IF;

    -- Add stripe_subscription_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'stripe_subscription_id'
    ) THEN
        ALTER TABLE user_profiles 
        ADD COLUMN stripe_subscription_id VARCHAR(255);
        RAISE NOTICE '  ✓ Added stripe_subscription_id column';
    END IF;

    RAISE NOTICE 'Part 4 complete: user_profiles updated';
END $$;

CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_tier ON user_profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer ON user_profiles(stripe_customer_id);

-- ============================================================================
-- PART 5: Create helpful views
-- ============================================================================

DO $$ 
BEGIN
    RAISE NOTICE 'Part 5: Creating views';
END $$;

CREATE OR REPLACE VIEW user_subscription_status AS
SELECT 
    id AS user_id,
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

GRANT SELECT ON user_subscription_status TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ MIGRATION COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Tables updated/created:';
    RAISE NOTICE '  ✓ bet_analyses (updated)';
    RAISE NOTICE '  ✓ tilt_alerts (created)';
    RAISE NOTICE '  ✓ ai_picks (created)';
    RAISE NOTICE '  ✓ user_profiles (updated)';
    RAISE NOTICE '';
    RAISE NOTICE 'Views created:';
    RAISE NOTICE '  ✓ user_subscription_status';
    RAISE NOTICE '';
    RAISE NOTICE 'Security:';
    RAISE NOTICE '  ✓ Row Level Security enabled';
    RAISE NOTICE '  ✓ Policies created';
    RAISE NOTICE '  ✓ Indexes added';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Test the Save Analysis button';
    RAISE NOTICE '  2. Integrate Odds API';
    RAISE NOTICE '  3. Integrate OpenAI for analysis';
    RAISE NOTICE '';
END $$;

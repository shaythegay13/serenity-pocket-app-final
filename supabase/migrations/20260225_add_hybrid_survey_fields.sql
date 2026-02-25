-- Add hybrid survey fields to existing tables
-- This migration is SAFE to run multiple times (uses IF NOT EXISTS)

-- First, add columns to user_profiles table
DO $$ 
BEGIN
    -- Add pgsi_score column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'pgsi_score'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN pgsi_score INTEGER;
        RAISE NOTICE 'Added pgsi_score column to user_profiles';
    END IF;

    -- Add risk_level column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'risk_level'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN risk_level TEXT;
        RAISE NOTICE 'Added risk_level column to user_profiles';
    END IF;

    -- Add archetype column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'archetype'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN archetype TEXT;
        RAISE NOTICE 'Added archetype column to user_profiles';
    END IF;

    -- Add survey_completed column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'survey_completed'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN survey_completed BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added survey_completed column to user_profiles';
    END IF;

    -- Add emotional_stability column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'emotional_stability'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN emotional_stability INTEGER;
        RAISE NOTICE 'Added emotional_stability column to user_profiles';
    END IF;
END $$;

-- Add columns to survey_responses table
DO $$ 
BEGIN
    -- Add emotional_stability column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'survey_responses' AND column_name = 'emotional_stability'
    ) THEN
        ALTER TABLE survey_responses ADD COLUMN emotional_stability INTEGER;
        RAISE NOTICE 'Added emotional_stability column to survey_responses';
    END IF;

    -- Add pgsi_score column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'survey_responses' AND column_name = 'pgsi_score'
    ) THEN
        ALTER TABLE survey_responses ADD COLUMN pgsi_score INTEGER;
        RAISE NOTICE 'Added pgsi_score column to survey_responses';
    END IF;

    -- Add risk_level column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'survey_responses' AND column_name = 'risk_level'
    ) THEN
        ALTER TABLE survey_responses ADD COLUMN risk_level TEXT;
        RAISE NOTICE 'Added risk_level column to survey_responses';
    END IF;

    -- Add archetype column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'survey_responses' AND column_name = 'archetype'
    ) THEN
        ALTER TABLE survey_responses ADD COLUMN archetype TEXT;
        RAISE NOTICE 'Added archetype column to survey_responses';
    END IF;

    -- Add anonymous_session_id column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'survey_responses' AND column_name = 'anonymous_session_id'
    ) THEN
        ALTER TABLE survey_responses ADD COLUMN anonymous_session_id TEXT;
        RAISE NOTICE 'Added anonymous_session_id column to survey_responses';
    END IF;
END $$;

-- Create indexes (outside DO block to avoid transaction issues)
CREATE INDEX IF NOT EXISTS idx_user_profiles_emotional_stability 
    ON user_profiles(emotional_stability) 
    WHERE emotional_stability IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_survey_responses_anonymous_session 
    ON survey_responses(anonymous_session_id) 
    WHERE anonymous_session_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN user_profiles.pgsi_score IS 'Problem Gambling Severity Index score (0-27)';
COMMENT ON COLUMN user_profiles.risk_level IS 'Risk category: low, moderate, high, problem';
COMMENT ON COLUMN user_profiles.archetype IS 'User archetype from survey (Analyst, Thrill Seeker, etc)';
COMMENT ON COLUMN user_profiles.emotional_stability IS 'Combined emotional stability score (0-100)';
COMMENT ON COLUMN survey_responses.anonymous_session_id IS 'Anonymous session ID for non-authenticated users';

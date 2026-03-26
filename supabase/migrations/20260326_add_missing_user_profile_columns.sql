-- Migration: Add missing user_profiles columns that are referenced in application code
-- but were never formally added via a migration file.
-- Safe to run multiple times (uses IF NOT EXISTS).

-- Subscription tracking columns
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ;

-- Survey score columns (written when users complete the assessment)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS serenity_score INTEGER;

-- Basic profile / identity columns
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS biography TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS experience_years INTEGER;

-- Extended demographic columns (collected in profile settings)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS betting_experience TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS education_level TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS income_range TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS employment_status TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS marital_status TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS ethnicity TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS betting_frequency TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS typical_bet_amount TEXT;

-- survey_data JSON blob (stores raw survey answers on the profile)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS survey_data JSONB;

-- Verify final column list
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
  AND table_schema = 'public'
ORDER BY ordinal_position;

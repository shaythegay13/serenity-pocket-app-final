-- Migration: Add onboarding gate fields to user_profiles table
-- Run this in your Supabase SQL Editor

-- Add biography column (stores user's self-written bio)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS biography TEXT;

-- Add onboarding completion tracking columns
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE;

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS biography_complete BOOLEAN DEFAULT FALSE;

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS emotion_track_complete BOOLEAN DEFAULT FALSE;

-- GRANDFATHER EXISTING USERS: Mark all existing users as having completed onboarding
-- This ensures current users aren't forced through the new onboarding gate
UPDATE user_profiles
SET 
  onboarding_complete = TRUE,
  biography_complete = TRUE,
  emotion_track_complete = TRUE
WHERE onboarding_complete IS NULL OR onboarding_complete = FALSE;

-- Add comment explaining the fields
COMMENT ON COLUMN user_profiles.biography IS 'User self-written biography (min 50 chars required during onboarding)';
COMMENT ON COLUMN user_profiles.onboarding_complete IS 'Whether user has completed full onboarding gate (biography + emotion tracking)';
COMMENT ON COLUMN user_profiles.biography_complete IS 'Whether user has completed biography step of onboarding';
COMMENT ON COLUMN user_profiles.emotion_track_complete IS 'Whether user has completed emotion tracking step (pre + post bet emotions)';

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
  AND column_name IN ('biography', 'onboarding_complete', 'biography_complete', 'emotion_track_complete')
ORDER BY column_name;

-- Check how many users are grandfathered vs new
SELECT 
  COUNT(*) as total_users,
  SUM(CASE WHEN onboarding_complete = TRUE THEN 1 ELSE 0 END) as completed_onboarding,
  SUM(CASE WHEN onboarding_complete = FALSE THEN 1 ELSE 0 END) as pending_onboarding
FROM user_profiles;

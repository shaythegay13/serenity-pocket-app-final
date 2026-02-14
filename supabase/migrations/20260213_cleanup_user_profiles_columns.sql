-- Migration: Clean up outdated user_profiles columns
-- Description: Remove gamification, legacy tracking, and outdated onboarding columns
-- Created: 2026-02-13

-- First, let's check if the table exists and get current structure
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Remove gamification and streak tracking columns
ALTER TABLE user_profiles 
DROP COLUMN IF EXISTS emotional_awareness_streak,
DROP COLUMN IF EXISTS bias_recognition_score,
DROP COLUMN IF EXISTS mindful_decision_percentage,
DROP COLUMN IF EXISTS serenity_tokens,
DROP COLUMN IF EXISTS daily_rings,
DROP COLUMN IF EXISTS last_ring_reset,
DROP COLUMN IF EXISTS perfect_days,
DROP COLUMN IF EXISTS longest_streak,
DROP COLUMN IF EXISTS level,
DROP COLUMN IF EXISTS xp,
DROP COLUMN IF EXISTS xp_to_next_level;

-- Remove legacy behavioral tracking columns
ALTER TABLE user_profiles 
DROP COLUMN IF EXISTS total_modules_completed,
DROP COLUMN IF EXISTS total_breathing_exercises,
DROP COLUMN IF EXISTS most_productive_day;

-- Remove outdated onboarding flag columns
ALTER TABLE user_profiles 
DROP COLUMN IF EXISTS onboarding_complete,
DROP COLUMN IF EXISTS biography_complete,
DROP COLUMN IF EXISTS emotion_track_complete,
DROP COLUMN IF EXISTS demographics_complete;

-- Verify the final table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Create a comment documenting the cleanup
COMMENT ON TABLE user_profiles IS 'Cleaned user profile data focusing on identity, subscriptions, demographics, and current analytics. Removed outdated gamification and legacy tracking columns on 2026-02-13.';

-- Optional: Create a backup of the table before major changes (uncomment if needed)
-- CREATE TABLE user_profiles_backup_20260213 AS SELECT * FROM user_profiles;

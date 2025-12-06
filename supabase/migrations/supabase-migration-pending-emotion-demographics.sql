-- Migration: Add pending emotion tracking and demographics completion fields
-- Run this in your Supabase SQL Editor AFTER the onboarding gate migration

-- Add pending_emotion_trade_id to track incomplete emotion logs
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS pending_emotion_trade_id TEXT;

-- Add demographics_complete to track if user filled demographics for XP bonus
ALTER TABLE user_profiles  
ADD COLUMN IF NOT EXISTS demographics_complete BOOLEAN DEFAULT FALSE;

-- Add comments
COMMENT ON COLUMN user_profiles.pending_emotion_trade_id 
IS 'Trade ID from onboarding pre-bet emotion, waiting for post-bet completion';

COMMENT ON COLUMN user_profiles.demographics_complete 
IS 'Whether user has completed demographics (age range, region, occupation) for 200 XP bonus';

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
  AND column_name IN ('pending_emotion_trade_id', 'demographics_complete')
ORDER BY column_name;

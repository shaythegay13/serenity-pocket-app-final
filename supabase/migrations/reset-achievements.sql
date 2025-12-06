-- SQL Script to Reset All Achievements
-- Run this in your Supabase SQL Editor to fix incorrectly unlocked achievements
-- This will reset all achievements to their initial state (unlocked=false, progress=0)

-- Reset all achievements for all users
UPDATE achievements
SET 
  unlocked = false,
  unlocked_at = NULL,
  progress = 0
WHERE unlocked = true;

-- Verify the reset
SELECT 
  user_id,
  COUNT(*) as total_achievements,
  SUM(CASE WHEN unlocked THEN 1 ELSE 0 END) as unlocked_count
FROM achievements
GROUP BY user_id;

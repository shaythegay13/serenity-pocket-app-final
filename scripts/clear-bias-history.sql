-- SQL Script to clear bias quiz history from Supabase
-- Run this in Supabase SQL Editor for your test account

-- Option 1: Clear bias quiz history for YOUR user (replace with your user_id)
-- First, get your user_id by running:
-- SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Then delete your bias quiz history:
-- DELETE FROM bias_quiz_history WHERE user_id = 'your-user-id-here';

-- Option 2: Clear ALL bias quiz history (use with caution on test DB only!)
DELETE FROM bias_quiz_history;

-- Also reset your current bias profile (optional)
-- DELETE FROM bias_profiles WHERE user_id = 'your-user-id-here';

-- Or reset ALL bias profiles:
DELETE FROM bias_profiles;

-- Verify deletion
SELECT COUNT(*) as remaining_quiz_history FROM bias_quiz_history;
SELECT COUNT(*) as remaining_profiles FROM bias_profiles;

-- =====================================================
-- DELETE ALL DATA FOR USER: savedbytheplate@gmail.com
-- =====================================================
-- WARNING: This will permanently delete all data for this user
-- Run this in Supabase SQL Editor

-- Step 1: Find the user ID from auth.users
DO $$
DECLARE
    user_id_to_delete UUID;
BEGIN
    SELECT id INTO user_id_to_delete 
    FROM auth.users 
    WHERE email = 'savedbytheplate@gmail.com';
    
    IF user_id_to_delete IS NULL THEN
        RAISE EXCEPTION 'User with email savedbytheplate@gmail.com not found';
    END IF;
    
    RAISE NOTICE 'Deleting data for user ID: %', user_id_to_delete;
    
    -- Step 2: Delete from all user-related tables in order of dependencies
    
    -- Delete from emotion_logs (if user_id column exists)
    DELETE FROM emotion_logs WHERE user_id = user_id_to_delete;
    
    -- Delete from bet_analyses (if user_id column exists)
    DELETE FROM bet_analyses WHERE user_id = user_id_to_delete;
    
    -- Delete from user_profiles
    DELETE FROM user_profiles WHERE id = user_id_to_delete;
    
    -- Delete from user_achievements (if exists)
    DELETE FROM user_achievements WHERE user_id = user_id_to_delete;
    
    -- Delete from user_preferences (if exists)
    DELETE FROM user_preferences WHERE user_id = user_id_to_delete;
    
    -- Delete from gambling_survey_responses (if exists)
    DELETE FROM gambling_survey_responses WHERE user_id = user_id_to_delete;
    
    -- Delete from any other custom tables that might have user_id
    -- Add more tables as needed based on your schema
    
    -- Step 3: Delete from auth.users (this will cascade delete from auth.sessions)
    DELETE FROM auth.users WHERE id = user_id_to_delete;
    
    RAISE NOTICE 'Successfully deleted all data for user savedbytheplate@gmail.com';
END $$;

-- =====================================================
-- VERIFICATION QUERIES (run after deletion to verify)
-- =====================================================

-- Check if user still exists in auth.users
SELECT 'User in auth.users: ' || COUNT(*) as result 
FROM auth.users 
WHERE email = 'savedbytheplate@gmail.com';

-- Check if user data exists in main tables
SELECT 'Records in user_profiles: ' || COUNT(*) as result 
FROM user_profiles 
WHERE id = (SELECT id FROM auth.users WHERE email = 'savedbytheplate@gmail.com');

SELECT 'Records in emotion_logs: ' || COUNT(*) as result 
FROM emotion_logs 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'savedbytheplate@gmail.com');

SELECT 'Records in bet_analyses: ' || COUNT(*) as result 
FROM bet_analyses 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'savedbytheplate@gmail.com');

-- =====================================================
-- ALTERNATIVE: Manual Step-by-Step Version
-- =====================================================
-- If the above doesn't work, run these steps manually:

-- 1. Find user ID
-- SELECT id FROM auth.users WHERE email = 'savedbytheplate@gmail.com';

-- 2. Replace 'YOUR_USER_ID_HERE' with the actual ID from step 1, then run:
-- DELETE FROM emotion_logs WHERE user_id = 'YOUR_USER_ID_HERE';
-- DELETE FROM bet_analyses WHERE user_id = 'YOUR_USER_ID_HERE';
-- DELETE FROM user_profiles WHERE id = 'YOUR_USER_ID_HERE';
-- DELETE FROM user_achievements WHERE user_id = 'YOUR_USER_ID_HERE';
-- DELETE FROM user_preferences WHERE user_id = 'YOUR_USER_ID_HERE';
-- DELETE FROM gambling_survey_responses WHERE user_id = 'YOUR_USER_ID_HERE';
-- DELETE FROM auth.users WHERE id = 'YOUR_USER_ID_HERE';

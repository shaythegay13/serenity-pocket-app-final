-- =====================================================
-- DELETE ALL DATA FOR USER: savedbytheplate@gmail.com
-- =====================================================
-- VERSION 2: Handles cases where user may not exist in auth.users
-- WARNING: This will permanently delete all data for this user

-- Step 1: Check if user exists in auth.users
DO $$
DECLARE
    user_id_to_delete UUID;
    user_exists BOOLEAN := FALSE;
BEGIN
    -- Check auth.users first
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'savedbytheplate@gmail.com') INTO user_exists;
    
    IF user_exists THEN
        SELECT id INTO user_id_to_delete 
        FROM auth.users 
        WHERE email = 'savedbytheplate@gmail.com';
        
        RAISE NOTICE 'Found user in auth.users with ID: %', user_id_to_delete;
    ELSE
        RAISE NOTICE 'User not found in auth.users, checking other tables...';
        
        -- Try to find user in user_profiles table (might exist there without auth.users)
        SELECT id INTO user_id_to_delete 
        FROM user_profiles 
        WHERE email = 'savedbytheplate@gmail.com' 
        LIMIT 1;
        
        IF user_id_to_delete IS NOT NULL THEN
            RAISE NOTICE 'Found user in user_profiles with ID: %', user_id_to_delete;
        ELSE
            RAISE NOTICE 'User not found anywhere. Checking for any records...';
            
            -- Show what records exist for this email across all tables
            RAISE NOTICE 'Checking emotion_logs...';
            PERFORM * FROM emotion_logs WHERE user_id::text = 'savedbytheplate@gmail.com' LIMIT 1;
            IF FOUND THEN
                RAISE NOTICE 'Found records in emotion_logs but could not determine user_id';
            END IF;
            
            RAISE NOTICE 'No user data found to delete. User may have already been deleted.';
            RETURN;
        END IF;
    END IF;
    
    -- Step 2: Delete from all user-related tables in order of dependencies
    
    -- Delete from emotion_logs
    DELETE FROM emotion_logs WHERE user_id = user_id_to_delete;
    RAISE NOTICE 'Deleted from emotion_logs';
    
    -- Delete from bet_analyses
    DELETE FROM bet_analyses WHERE user_id = user_id_to_delete;
    RAISE NOTICE 'Deleted from bet_analyses';
    
    -- Delete from user_profiles
    DELETE FROM user_profiles WHERE id = user_id_to_delete;
    RAISE NOTICE 'Deleted from user_profiles';
    
    -- Delete from user_achievements (if exists)
    BEGIN
        DELETE FROM user_achievements WHERE user_id = user_id_to_delete;
        RAISE NOTICE 'Deleted from user_achievements';
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'Table user_achievements does not exist';
    END;
    
    -- Delete from user_preferences (if exists)
    BEGIN
        DELETE FROM user_preferences WHERE user_id = user_id_to_delete;
        RAISE NOTICE 'Deleted from user_preferences';
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'Table user_preferences does not exist';
    END;
    
    -- Delete from gambling_survey_responses (if exists)
    BEGIN
        DELETE FROM gambling_survey_responses WHERE user_id = user_id_to_delete;
        RAISE NOTICE 'Deleted from gambling_survey_responses';
    EXCEPTION WHEN undefined_table THEN
        RAISE NOTICE 'Table gambling_survey_responses does not exist';
    END;
    
    -- Delete from auth.users (only if it existed there)
    IF user_exists THEN
        DELETE FROM auth.users WHERE id = user_id_to_delete;
        RAISE NOTICE 'Deleted from auth.users';
    END IF;
    
    RAISE NOTICE 'Successfully deleted all data for user savedbytheplate@gmail.com';
END $$;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if user still exists
SELECT 'User in auth.users: ' || COUNT(*) as result 
FROM auth.users 
WHERE email = 'savedbytheplate@gmail.com';

SELECT 'Records in user_profiles: ' || COUNT(*) as result 
FROM user_profiles 
WHERE email = 'savedbytheplate@gmail.com';

-- Check for any remaining records
SELECT 'Records in emotion_logs: ' || COUNT(*) as result 
FROM emotion_logs 
WHERE user_id::text = 'savedbytheplate@gmail.com';

SELECT 'Records in bet_analyses: ' || COUNT(*) as result 
FROM bet_analyses 
WHERE user_id::text = 'savedbytheplate@gmail.com';

-- =====================================================
-- DIAGNOSTIC QUERIES (run if you need to investigate)
-- =====================================================

-- Show all tables that might contain user data
SELECT 'emotion_logs records: ' || COUNT(*) as result FROM emotion_logs;
SELECT 'bet_analyses records: ' || COUNT(*) as result FROM bet_analyses;
SELECT 'user_profiles records: ' || COUNT(*) as result FROM user_profiles;
SELECT 'auth.users records: ' || COUNT(*) as result FROM auth.users;

-- Show any records that might reference this email (as string)
SELECT 'emotion_logs with email string: ' || COUNT(*) as result 
FROM emotion_logs 
WHERE user_id::text LIKE '%savedbytheplate@gmail.com%';

SELECT 'bet_analyses with email string: ' || COUNT(*) as result 
FROM bet_analyses 
WHERE user_id::text LIKE '%savedbytheplate@gmail.com%';

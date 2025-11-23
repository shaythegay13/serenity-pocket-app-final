-- DATABASE CLEANUP SCRIPT
-- This script removes unused tables and columns to keep your database clean
-- Run this in Supabase SQL Editor

-- ============================================
-- PART 1: DROP UNUSED TABLES
-- ============================================

-- NOTE: We are keeping BOTH survey systems for A/B testing:
-- ✅ anonymous_survey_submissions - Survey A (8 questions, DSM-5 based)
-- ✅ survey_responses - Linked survey responses for Survey A
-- ✅ survey_b_submissions - Survey B (10 questions, alternative approach)
-- ✅ survey_b_responses - Linked survey responses for Survey B
-- Both systems track with survey_type column ('A' or 'B')

-- Drop only truly old/deprecated survey tables
DROP TABLE IF EXISTS survey_responses_old CASCADE;
DROP TABLE IF EXISTS old_survey_responses CASCADE;

-- Drop unused feature tables (if they exist but aren't being used)
DROP TABLE IF EXISTS tilt_alerts CASCADE;
DROP TABLE IF EXISTS ai_picks CASCADE;

-- ============================================
-- PART 2: CLEAN UP USER_PROFILES TABLE
-- ============================================

-- Remove deprecated/unused columns from user_profiles
-- Note: Only remove columns you're 100% sure are not being used

-- Check if subscription_expires_at exists (this is redundant with subscription_ends_at)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'subscription_expires_at'
    ) THEN
        ALTER TABLE user_profiles DROP COLUMN subscription_expires_at;
        RAISE NOTICE 'Dropped subscription_expires_at column';
    END IF;
END $$;

-- ============================================
-- PART 3: CLEAN UP EMOTION_LOGS TABLE
-- ============================================

-- Remove any duplicate or unused columns
-- (Currently all columns appear to be in use)

-- ============================================
-- PART 4: CLEAN UP TRADES TABLE
-- ============================================

-- Remove any unused columns
-- (Currently all columns appear to be in use)

-- ============================================
-- PART 5: CLEAN UP INDEXES
-- ============================================

-- Drop duplicate or unused indexes
-- This will improve write performance

-- Check for duplicate indexes on user_profiles
DO $$
DECLARE
    idx RECORD;
BEGIN
    FOR idx IN 
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'user_profiles' 
        AND indexname LIKE '%duplicate%'
    LOOP
        EXECUTE 'DROP INDEX IF EXISTS ' || idx.indexname;
        RAISE NOTICE 'Dropped index: %', idx.indexname;
    END LOOP;
END $$;

-- ============================================
-- PART 6: VACUUM AND ANALYZE
-- ============================================

-- Reclaim space and update statistics
VACUUM ANALYZE user_profiles;
VACUUM ANALYZE emotion_logs;
VACUUM ANALYZE trades;
VACUUM ANALYZE bias_profiles;
VACUUM ANALYZE bias_quiz_history;
VACUUM ANALYZE achievements;
VACUUM ANALYZE challenges;
VACUUM ANALYZE bet_analyses;
VACUUM ANALYZE anonymous_survey_submissions;
VACUUM ANALYZE survey_responses;
VACUUM ANALYZE survey_b_submissions;
VACUUM ANALYZE survey_b_responses;

-- ============================================
-- SUMMARY OF TABLES KEPT (ACTIVELY USED)
-- ============================================

-- Core tables:
-- ✅ user_profiles - User account and subscription data
-- ✅ emotion_logs - Emotional tracking
-- ✅ trades - Trading history
-- ✅ bias_profiles - Cognitive bias tracking
-- ✅ bias_quiz_history - Quiz results
-- ✅ achievements - User achievements
-- ✅ challenges - User challenges
-- ✅ bet_analyses - Bet analysis data
-- ✅ anonymous_survey_submissions - Survey A anonymous submissions
-- ✅ survey_responses - Survey A linked responses
-- ✅ survey_b_submissions - Survey B anonymous submissions (A/B testing)
-- ✅ survey_b_responses - Survey B linked responses (A/B testing)

-- Tables removed:
-- ❌ tilt_alerts - Not implemented in UI
-- ❌ ai_picks - Not implemented in UI
-- ❌ survey_responses_old - Deprecated old survey system

SELECT 'Cleanup complete! Database optimized.' AS status;

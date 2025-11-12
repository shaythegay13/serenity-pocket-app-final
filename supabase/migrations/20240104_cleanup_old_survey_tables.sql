-- Drop any old survey tables that might exist from previous versions
DO $$
BEGIN
    -- Drop the old survey_responses table if it exists (from very old versions)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'survey_responses_old') THEN
        DROP TABLE IF EXISTS public.survey_responses_old CASCADE;
    END IF;

    -- Drop any old triggers or functions related to the old survey system
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    DROP FUNCTION IF EXISTS public.handle_new_user();
    
    -- Drop any old views or materialized views
    DROP VIEW IF EXISTS public.user_survey_summary;
    DROP MATERIALIZED VIEW IF EXISTS public.survey_analytics;
    
    -- Clean up any old policies
    DROP POLICY IF EXISTS "Users can view their own surveys" ON public.survey_responses_old;
    DROP POLICY IF EXISTS "Users can insert their own surveys" ON public.survey_responses_old;
    
    -- Notify that cleanup is complete
    RAISE NOTICE 'Old survey tables and related objects have been cleaned up';
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error during cleanup: %', SQLERRM;
END $$;

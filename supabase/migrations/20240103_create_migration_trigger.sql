-- Create function to migrate anonymous survey to authenticated user
CREATE OR REPLACE FUNCTION migrate_anonymous_survey_to_user(
    p_email TEXT,
    p_user_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_survey_data RECORD;
    v_migrated_count INTEGER := 0;
BEGIN
    -- Start transaction
    BEGIN
        -- Find anonymous survey with matching email
        SELECT * INTO v_survey_data
        FROM anonymous_survey_submissions
        WHERE email = p_email
        ORDER BY created_at DESC
        LIMIT 1;

        -- Check if survey was found
        IF v_survey_data IS NULL THEN
            RAISE EXCEPTION 'No anonymous survey found for email: %', p_email;
        END IF;

        -- Insert into authenticated survey responses table
        INSERT INTO survey_responses (
            user_id,
            email,
            responses,
            score,
            created_at,
            linked_at,
            is_initial_survey
        ) VALUES (
            p_user_id,
            v_survey_data.email,
            v_survey_data.responses,
            v_survey_data.score,
            v_survey_data.created_at,
            NOW(),
            TRUE
        );

        -- Delete from anonymous submissions table
        DELETE FROM anonymous_survey_submissions
        WHERE id = v_survey_data.id;

        -- Get count of migrated records
        GET DIAGNOSTICS v_migrated_count = ROW_COUNT;

        RETURN v_migrated_count;

    EXCEPTION
        WHEN unique_violation THEN
            -- Survey already migrated, return 0
            RETURN 0;
        WHEN foreign_key_violation THEN
            RAISE EXCEPTION 'Invalid user ID provided for migration';
    END;
END;
$$;

-- Create trigger to automatically attempt migration after account creation
CREATE OR REPLACE FUNCTION trigger_migrate_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result INTEGER;
BEGIN
    -- Attempt to migrate survey if email matches
    BEGIN
        SELECT migrate_anonymous_survey_to_user(NEW.email, NEW.id) INTO v_result;
        
        -- Log successful migration (optional)
        IF v_result > 0 THEN
            RAISE NOTICE 'Successfully migrated % survey(s) for user %', v_result, NEW.email;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            -- Silently continue if no survey to migrate
            NULL;
    END;

    RETURN NEW;
END;
$$;

-- Create trigger on auth.users table
DROP TRIGGER IF EXISTS after_user_signup_migrate_survey ON auth.users;
CREATE TRIGGER after_user_signup_migrate_survey
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION trigger_migrate_on_signup();

-- Add comments
COMMENT ON FUNCTION migrate_anonymous_survey_to_user IS 
    'Migrates anonymous survey submission to authenticated survey_responses table.
     Called automatically after account creation or manually through API.
     Returns number of migrated records or raises exception on error.';

COMMENT ON FUNCTION trigger_migrate_on_signup IS 
    'Trigger function that attempts to migrate anonymous surveys after user signup.
     Fails silently if no matching survey exists.';

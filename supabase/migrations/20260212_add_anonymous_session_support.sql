-- ============================================================
-- Migration: Add anonymous session support for PLG public tools
-- Date: 2026-02-12
-- Purpose: Enable anonymous users to use check-in, serenity,
--          and PGSI surveys. Data migrates to their account on signup.
-- ============================================================

-- 1. Add anonymous_session_id to emotion_logs
ALTER TABLE emotion_logs
  ADD COLUMN IF NOT EXISTS anonymous_session_id UUID;

-- 2. Add anonymous_session_id to survey_responses
ALTER TABLE survey_responses
  ADD COLUMN IF NOT EXISTS anonymous_session_id UUID;

-- 3. Add anonymous_session_id to anonymous_survey_submissions
ALTER TABLE anonymous_survey_submissions
  ADD COLUMN IF NOT EXISTS anonymous_session_id UUID;

-- 4. Create indexes for efficient session-based lookups
CREATE INDEX IF NOT EXISTS idx_emotion_logs_anon_session
  ON emotion_logs(anonymous_session_id)
  WHERE anonymous_session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_survey_responses_anon_session
  ON survey_responses(anonymous_session_id)
  WHERE anonymous_session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_anon_survey_submissions_anon_session
  ON anonymous_survey_submissions(anonymous_session_id)
  WHERE anonymous_session_id IS NOT NULL;

-- 5. RLS Policies for anonymous access

-- Allow anonymous inserts to emotion_logs (user_id is null, session_id present)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'emotion_logs'
    AND policyname = 'allow_anonymous_emotion_inserts'
  ) THEN
    CREATE POLICY "allow_anonymous_emotion_inserts" ON emotion_logs
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (user_id IS NULL AND anonymous_session_id IS NOT NULL);
  END IF;
END $$;

-- Allow anonymous inserts to survey_responses
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'survey_responses'
    AND policyname = 'allow_anonymous_survey_inserts'
  ) THEN
    CREATE POLICY "allow_anonymous_survey_inserts" ON survey_responses
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (user_id IS NULL AND anonymous_session_id IS NOT NULL);
  END IF;
END $$;

-- 6. RPC function to migrate anonymous session data to authenticated user
CREATE OR REPLACE FUNCTION migrate_anonymous_session_to_user(
  p_anonymous_session_id UUID,
  p_user_id UUID
) RETURNS INTEGER AS $$
DECLARE
  migrated_count INTEGER := 0;
  emotion_count INTEGER;
  survey_count INTEGER;
  anon_survey_count INTEGER;
BEGIN
  -- Migrate emotion_logs
  UPDATE emotion_logs
  SET user_id = p_user_id, anonymous_session_id = NULL
  WHERE anonymous_session_id = p_anonymous_session_id
    AND user_id IS NULL;
  GET DIAGNOSTICS emotion_count = ROW_COUNT;
  migrated_count := migrated_count + emotion_count;

  -- Migrate survey_responses
  UPDATE survey_responses
  SET user_id = p_user_id, anonymous_session_id = NULL
  WHERE anonymous_session_id = p_anonymous_session_id
    AND user_id IS NULL;
  GET DIAGNOSTICS survey_count = ROW_COUNT;
  migrated_count := migrated_count + survey_count;

  -- Clean up anonymous_survey_submissions (mark as migrated)
  UPDATE anonymous_survey_submissions
  SET anonymous_session_id = NULL
  WHERE anonymous_session_id = p_anonymous_session_id;
  GET DIAGNOSTICS anon_survey_count = ROW_COUNT;

  RETURN migrated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION migrate_anonymous_session_to_user IS
  'Migrates all anonymous session data (emotion logs, survey responses) to an authenticated user.
   Called during signup when a user had previously used public tools anonymously.';

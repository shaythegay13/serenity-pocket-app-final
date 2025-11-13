-- Create separate tables for Survey B (10 questions)
-- This allows us to track different questions and responses independently

-- Anonymous Survey B submissions (before account creation)
CREATE TABLE IF NOT EXISTS anonymous_survey_b_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  score INTEGER NOT NULL,
  submitted_from_ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  migrated_to_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  migrated_at TIMESTAMPTZ,
  CONSTRAINT email_not_empty CHECK (email <> ''),
  CONSTRAINT score_range CHECK (score >= 0 AND score <= 150)
);

-- Individual answers for anonymous Survey B submissions
CREATE TABLE IF NOT EXISTS anonymous_survey_b_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES anonymous_survey_b_submissions(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  selected_option TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT question_id_not_empty CHECK (question_id <> ''),
  CONSTRAINT selected_option_not_empty CHECK (selected_option <> '')
);

-- Survey B responses (linked to user accounts)
CREATE TABLE IF NOT EXISTS survey_b_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  score INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_initial_survey BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT email_not_empty CHECK (email <> ''),
  CONSTRAINT score_range CHECK (score >= 0 AND score <= 150)
);

-- Individual answers for user Survey B responses
CREATE TABLE IF NOT EXISTS survey_b_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES survey_b_responses(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  selected_option TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT question_id_not_empty CHECK (question_id <> ''),
  CONSTRAINT selected_option_not_empty CHECK (selected_option <> '')
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_anonymous_survey_b_email 
    ON anonymous_survey_b_submissions USING btree (email);

CREATE INDEX IF NOT EXISTS idx_anonymous_survey_b_created 
    ON anonymous_survey_b_submissions USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_anonymous_survey_b_answers_submission 
    ON anonymous_survey_b_answers USING btree (submission_id);

CREATE INDEX IF NOT EXISTS idx_anonymous_survey_b_answers_question 
    ON anonymous_survey_b_answers USING btree (question_id);

CREATE INDEX IF NOT EXISTS idx_survey_b_responses_user 
    ON survey_b_responses USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_survey_b_responses_created 
    ON survey_b_responses USING btree (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_survey_b_answers_response 
    ON survey_b_answers USING btree (response_id);

CREATE INDEX IF NOT EXISTS idx_survey_b_answers_question 
    ON survey_b_answers USING btree (question_id);

-- Enable Row Level Security
ALTER TABLE anonymous_survey_b_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE anonymous_survey_b_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_b_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_b_answers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "Service role has full access to anonymous Survey B submissions" ON anonymous_survey_b_submissions;
DROP POLICY IF EXISTS "Service role has full access to anonymous Survey B answers" ON anonymous_survey_b_answers;
DROP POLICY IF EXISTS "Users can read their own Survey B responses" ON survey_b_responses;
DROP POLICY IF EXISTS "Service role has full access to Survey B responses" ON survey_b_responses;
DROP POLICY IF EXISTS "Users can read their own Survey B answers" ON survey_b_answers;
DROP POLICY IF EXISTS "Service role has full access to Survey B answers" ON survey_b_answers;

-- RLS Policies for anonymous_survey_b_submissions
CREATE POLICY "Service role has full access to anonymous Survey B submissions"
    ON anonymous_survey_b_submissions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- RLS Policies for anonymous_survey_b_answers
CREATE POLICY "Service role has full access to anonymous Survey B answers"
    ON anonymous_survey_b_answers
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- RLS Policies for survey_b_responses
CREATE POLICY "Users can read their own Survey B responses"
    ON survey_b_responses
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access to Survey B responses"
    ON survey_b_responses
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- RLS Policies for survey_b_answers
CREATE POLICY "Users can read their own Survey B answers"
    ON survey_b_answers
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM survey_b_responses
            WHERE survey_b_responses.id = survey_b_answers.response_id
            AND survey_b_responses.user_id = auth.uid()
        )
    );

CREATE POLICY "Service role has full access to Survey B answers"
    ON survey_b_answers
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Comments for documentation
COMMENT ON TABLE anonymous_survey_b_submissions IS 
    'Stores Survey B (10 questions) submissions before user account creation. Individual answers stored in anonymous_survey_b_answers table.';

COMMENT ON TABLE anonymous_survey_b_answers IS 
    'Stores individual answers for anonymous Survey B submissions. Each row represents one answer to one question.';

COMMENT ON TABLE survey_b_responses IS 
    'Stores Survey B (10 questions) responses linked to user accounts. Individual answers stored in survey_b_answers table.';

COMMENT ON TABLE survey_b_answers IS 
    'Stores individual answers for user Survey B responses. Each row represents one answer to one question.';

COMMENT ON COLUMN anonymous_survey_b_submissions.score IS 
    'Survey B score: 0-150 scale (Low: 0-37, Medium: 38-75, High: 76-112, Very High: 113+)';

COMMENT ON COLUMN survey_b_responses.score IS 
    'Survey B score: 0-150 scale (Low: 0-37, Medium: 38-75, High: 76-112, Very High: 113+)';

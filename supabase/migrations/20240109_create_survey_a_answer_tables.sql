-- Create answer tracking tables for Survey A (8 questions)
-- This matches the structure of Survey B for consistency

-- Individual answers for anonymous Survey A submissions
CREATE TABLE IF NOT EXISTS anonymous_survey_a_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES anonymous_survey_submissions(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  selected_option TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT question_id_not_empty CHECK (question_id <> ''),
  CONSTRAINT selected_option_not_empty CHECK (selected_option <> '')
);

-- Individual answers for user Survey A responses
CREATE TABLE IF NOT EXISTS survey_a_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES survey_responses(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  selected_option TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT question_id_not_empty CHECK (question_id <> ''),
  CONSTRAINT selected_option_not_empty CHECK (selected_option <> '')
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_anonymous_survey_a_answers_submission 
    ON anonymous_survey_a_answers USING btree (submission_id);

CREATE INDEX IF NOT EXISTS idx_anonymous_survey_a_answers_question 
    ON anonymous_survey_a_answers USING btree (question_id);

CREATE INDEX IF NOT EXISTS idx_survey_a_answers_response 
    ON survey_a_answers USING btree (response_id);

CREATE INDEX IF NOT EXISTS idx_survey_a_answers_question 
    ON survey_a_answers USING btree (question_id);

-- Enable Row Level Security
ALTER TABLE anonymous_survey_a_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_a_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for anonymous_survey_a_answers
CREATE POLICY "Service role has full access to anonymous Survey A answers"
    ON anonymous_survey_a_answers
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- RLS Policies for survey_a_answers
CREATE POLICY "Users can read their own Survey A answers"
    ON survey_a_answers
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM survey_responses
            WHERE survey_responses.id = survey_a_answers.response_id
            AND survey_responses.user_id = auth.uid()
        )
    );

CREATE POLICY "Service role has full access to Survey A answers"
    ON survey_a_answers
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Comments for documentation
COMMENT ON TABLE anonymous_survey_a_answers IS 
    'Stores individual answers for anonymous Survey A submissions. Each row represents one answer to one question.';

COMMENT ON TABLE survey_a_answers IS 
    'Stores individual answers for user Survey A responses. Each row represents one answer to one question.';

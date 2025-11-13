-- Add survey_type column to support Survey A and Survey B
ALTER TABLE anonymous_survey_submissions 
ADD COLUMN IF NOT EXISTS survey_type VARCHAR(1) DEFAULT 'A' CHECK (survey_type IN ('A', 'B'));

-- Add index for filtering by survey type
CREATE INDEX IF NOT EXISTS idx_anonymous_survey_type 
    ON anonymous_survey_submissions USING btree (survey_type);

-- Add comment explaining the column
COMMENT ON COLUMN anonymous_survey_submissions.survey_type IS 
    'Survey version: A (8 questions) or B (10 questions). Used for A/B testing.';

-- Also add to survey_responses table for linked surveys
ALTER TABLE survey_responses 
ADD COLUMN IF NOT EXISTS survey_type VARCHAR(1) DEFAULT 'A' CHECK (survey_type IN ('A', 'B'));

-- Add index for survey_responses
CREATE INDEX IF NOT EXISTS idx_survey_responses_type 
    ON survey_responses USING btree (survey_type);

-- Add comment
COMMENT ON COLUMN survey_responses.survey_type IS 
    'Survey version: A (8 questions) or B (10 questions). Copied from anonymous_survey_submissions during migration.';

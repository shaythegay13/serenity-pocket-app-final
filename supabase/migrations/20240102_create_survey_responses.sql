-- Drop existing survey_responses table if it exists (starting fresh)
DROP TABLE IF EXISTS survey_responses CASCADE;

-- Create table for authenticated user survey responses
CREATE TABLE survey_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    responses JSONB NOT NULL,
    score INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    linked_at TIMESTAMPTZ DEFAULT NOW(),
    is_initial_survey BOOLEAN DEFAULT TRUE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_survey_responses_user_id 
    ON survey_responses USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_survey_responses_created_at 
    ON survey_responses USING btree (created_at);

-- Unique constraint to prevent duplicate timestamps for same user
CREATE UNIQUE INDEX IF NOT EXISTS idx_survey_responses_user_created 
    ON survey_responses (user_id, created_at);

-- Enable Row Level Security
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view their own surveys
CREATE POLICY "allow_user_select_own" 
    ON survey_responses
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Policy to allow users to insert their own surveys
CREATE POLICY "allow_user_insert_own" 
    ON survey_responses
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Policy to allow admin users to view all surveys
CREATE POLICY "allow_admin_select_all" 
    ON survey_responses
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.uid() = id 
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Add comment explaining the table's purpose
COMMENT ON TABLE survey_responses IS 
    'Permanent storage for authenticated user survey responses. 
     Includes both migrated anonymous surveys and authenticated retakes.
     Data is retained indefinitely for progress tracking.';

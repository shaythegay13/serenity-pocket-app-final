-- Create table for temporary anonymous survey submissions
CREATE TABLE IF NOT EXISTS anonymous_survey_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    responses JSONB NOT NULL,
    score INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_from_ip INET
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_anonymous_survey_email 
    ON anonymous_survey_submissions USING btree (email);

CREATE INDEX IF NOT EXISTS idx_anonymous_survey_created_at 
    ON anonymous_survey_submissions USING btree (created_at);

-- Enable Row Level Security
ALTER TABLE anonymous_survey_submissions ENABLE ROW LEVEL SECURITY;

-- Policy to allow anonymous users to insert surveys
CREATE POLICY "allow_anonymous_insert" 
    ON anonymous_survey_submissions
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Policy to allow admin users to view all surveys
CREATE POLICY "allow_admin_select" 
    ON anonymous_survey_submissions
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
COMMENT ON TABLE anonymous_survey_submissions IS 
    'Temporary storage for anonymous survey submissions. 
     Data is automatically migrated to survey_responses table upon account creation.
     Records older than 90 days may be automatically cleaned up.';

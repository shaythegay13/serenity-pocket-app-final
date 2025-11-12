-- Enable Row Level Security on survey_responses table
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to view their own survey responses
CREATE POLICY "Users can view their own survey responses"
ON survey_responses
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Allow users to insert their own survey responses
CREATE POLICY "Users can insert their own survey responses"
ON survey_responses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Allow users to update their own survey responses
CREATE POLICY "Users can update their own survey responses"
ON survey_responses
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Allow users to delete their own survey responses
CREATE POLICY "Users can delete their own survey responses"
ON survey_responses
FOR DELETE
USING (auth.uid() = user_id);

-- Create bet_analyses table to store bet analysis data
CREATE TABLE IF NOT EXISTS bet_analyses (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL,
    bet_type VARCHAR(20),
    sport VARCHAR(50),
    description TEXT,
    odds DECIMAL,
    stake DECIMAL,
    emotional_state VARCHAR(50),
    emotional_intensity INTEGER,
    bias_warnings JSONB DEFAULT '[]'::jsonb,
    ai_recommendation TEXT,
    expected_value DECIMAL,
    probability_estimate DECIMAL,
    outcome VARCHAR(20),
    actual_return DECIMAL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_bet_analyses_user_id ON bet_analyses(user_id);

-- Create index on timestamp for sorting
CREATE INDEX IF NOT EXISTS idx_bet_analyses_timestamp ON bet_analyses(timestamp DESC);

-- Enable Row Level Security
ALTER TABLE bet_analyses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own bet analyses" ON bet_analyses;
DROP POLICY IF EXISTS "Users can insert their own bet analyses" ON bet_analyses;
DROP POLICY IF EXISTS "Users can update their own bet analyses" ON bet_analyses;
DROP POLICY IF EXISTS "Users can delete their own bet analyses" ON bet_analyses;

-- Create policy to allow users to read their own bet analyses
CREATE POLICY "Users can view their own bet analyses"
    ON bet_analyses FOR SELECT
    USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own bet analyses
CREATE POLICY "Users can insert their own bet analyses"
    ON bet_analyses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own bet analyses
CREATE POLICY "Users can update their own bet analyses"
    ON bet_analyses FOR UPDATE
    USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own bet analyses
CREATE POLICY "Users can delete their own bet analyses"
    ON bet_analyses FOR DELETE
    USING (auth.uid() = user_id);

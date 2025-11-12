-- Create bias_profiles table
CREATE TABLE IF NOT EXISTS bias_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    confirmation_bias INTEGER NOT NULL DEFAULT 50,
    loss_aversion INTEGER NOT NULL DEFAULT 50,
    anchoring_bias INTEGER NOT NULL DEFAULT 50,
    recency_bias INTEGER NOT NULL DEFAULT 50,
    overconfidence_bias INTEGER NOT NULL DEFAULT 50,
    herd_mentality INTEGER NOT NULL DEFAULT 50,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bias_profiles_user_id ON bias_profiles(user_id);

-- Enable Row Level Security
ALTER TABLE bias_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own bias profile
CREATE POLICY "users_read_own_bias_profile"
    ON bias_profiles
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own bias profile
CREATE POLICY "users_insert_own_bias_profile"
    ON bias_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own bias profile
CREATE POLICY "users_update_own_bias_profile"
    ON bias_profiles
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_bias_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER bias_profiles_updated_at
    BEFORE UPDATE ON bias_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_bias_profiles_updated_at();

-- Add comment
COMMENT ON TABLE bias_profiles IS
    'User cognitive bias profiles from bias quiz assessments';

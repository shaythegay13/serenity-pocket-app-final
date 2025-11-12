-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Trader',
    level INTEGER NOT NULL DEFAULT 1,
    xp INTEGER NOT NULL DEFAULT 0,
    xp_to_next_level INTEGER NOT NULL DEFAULT 500,
    emotional_awareness_streak INTEGER NOT NULL DEFAULT 0,
    bias_recognition_score INTEGER NOT NULL DEFAULT 0,
    mindful_decision_percentage DECIMAL NOT NULL DEFAULT 0,
    total_trades INTEGER NOT NULL DEFAULT 0,
    mindful_trades INTEGER NOT NULL DEFAULT 0,
    serenity_tokens INTEGER NOT NULL DEFAULT 0,
    daily_rings JSONB DEFAULT '{"emotionalAwareness": 0, "biasRecognition": 0, "mindfulness": 0}'::jsonb,
    last_ring_reset TIMESTAMPTZ DEFAULT NOW(),
    last_check_in TIMESTAMPTZ,
    perfect_days INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    total_emotions_logged INTEGER NOT NULL DEFAULT 0,
    total_biases_identified INTEGER NOT NULL DEFAULT 0,
    total_journals_completed INTEGER NOT NULL DEFAULT 0,
    total_modules_completed INTEGER NOT NULL DEFAULT 0,
    total_breathing_exercises INTEGER NOT NULL DEFAULT 0,
    most_productive_day INTEGER NOT NULL DEFAULT 0,
    onboarding_complete BOOLEAN DEFAULT FALSE,
    biography_complete BOOLEAN DEFAULT FALSE,
    emotion_track_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON user_profiles(id);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "users_read_own_profile"
    ON user_profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "users_insert_own_profile"
    ON user_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "users_update_own_profile"
    ON user_profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_user_profiles_updated_at();

-- Add comment
COMMENT ON TABLE user_profiles IS
    'User profiles containing XP, levels, tokens, and gamification data';
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

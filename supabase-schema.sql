-- Supabase Database Schema for Serenity Pocket
-- Run this in your Supabase SQL Editor

-- Enable Row Level Security
ALTER DATABASE postgres SET timezone TO 'UTC';

-- Profiles Table (for user account information)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  name TEXT DEFAULT 'Trader',
  avatar_url TEXT,
  age INTEGER,
  gender TEXT,
  location TEXT,
  occupation TEXT,
  experience_years INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add username column if it doesn't exist (for existing tables)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'username'
  ) THEN
    ALTER TABLE profiles ADD COLUMN username TEXT UNIQUE;
  END IF;
END $$;

-- User Profiles Table (for game data)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT DEFAULT 'Trader',
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  xp_to_next_level INTEGER DEFAULT 500,
  emotional_awareness_streak INTEGER DEFAULT 0,
  bias_recognition_score INTEGER DEFAULT 0,
  mindful_decision_percentage NUMERIC DEFAULT 0,
  total_trades INTEGER DEFAULT 0,
  mindful_trades INTEGER DEFAULT 0,
  serenity_tokens INTEGER DEFAULT 0,
  daily_rings JSONB DEFAULT '{"emotionalAwareness": 0, "biasRecognition": 0, "mindfulness": 0}'::jsonb,
  last_ring_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  perfect_days INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_emotions_logged INTEGER DEFAULT 0,
  total_biases_identified INTEGER DEFAULT 0,
  total_journals_completed INTEGER DEFAULT 0,
  total_modules_completed INTEGER DEFAULT 0,
  total_breathing_exercises INTEGER DEFAULT 0,
  most_productive_day INTEGER DEFAULT 0,
  last_check_in TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Emotion Logs Table
CREATE TABLE IF NOT EXISTS emotion_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  emotion TEXT NOT NULL,
  intensity INTEGER NOT NULL,
  notes TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trades Table
CREATE TABLE IF NOT EXISTS trades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  asset TEXT NOT NULL,
  type TEXT NOT NULL,
  entry_price NUMERIC NOT NULL,
  position_size NUMERIC NOT NULL,
  pre_trade_emotion TEXT,
  pre_trade_confidence INTEGER,
  pre_trade_notes TEXT,
  biases_identified TEXT[] DEFAULT ARRAY[]::TEXT[],
  outcome TEXT,
  exit_price NUMERIC,
  pnl NUMERIC,
  post_trade_emotion TEXT,
  post_trade_notes TEXT,
  mindful_decision BOOLEAN DEFAULT false,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Achievements Table
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  unlocked BOOLEAN DEFAULT false,
  progress INTEGER DEFAULT 0,
  max_progress INTEGER NOT NULL,
  category TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, id)
);

-- Bias Profiles Table
CREATE TABLE IF NOT EXISTS bias_profiles (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  confirmation_bias INTEGER DEFAULT 50,
  loss_aversion INTEGER DEFAULT 50,
  anchoring_bias INTEGER DEFAULT 50,
  recency_bias INTEGER DEFAULT 50,
  overconfidence_bias INTEGER DEFAULT 50,
  herd_mentality INTEGER DEFAULT 50,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Challenges Table
CREATE TABLE IF NOT EXISTS challenges (
  id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  max_progress INTEGER NOT NULL,
  xp_reward INTEGER NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY(user_id, id)
);

-- Fix existing challenges table if it has wrong primary key
DO $$ 
BEGIN
  -- Check if challenges table exists with old schema
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'challenges' 
    AND constraint_type = 'PRIMARY KEY' 
    AND constraint_name = 'challenges_pkey'
  ) THEN
    -- Drop old constraint and recreate with composite key
    ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_pkey;
    ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_user_id_id_key;
    ALTER TABLE challenges ADD PRIMARY KEY (user_id, id);
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_emotion_logs_user_id ON emotion_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_emotion_logs_timestamp ON emotion_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_timestamp ON trades(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_challenges_user_id ON challenges(user_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE emotion_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE bias_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for user_profiles
DROP POLICY IF EXISTS "Users can view own user_profile" ON user_profiles;
CREATE POLICY "Users can view own user_profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own user_profile" ON user_profiles;
CREATE POLICY "Users can insert own user_profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own user_profile" ON user_profiles;
CREATE POLICY "Users can update own user_profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for emotion_logs
DROP POLICY IF EXISTS "Users can view own emotion logs" ON emotion_logs;
CREATE POLICY "Users can view own emotion logs" ON emotion_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own emotion logs" ON emotion_logs;
CREATE POLICY "Users can insert own emotion logs" ON emotion_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for trades
DROP POLICY IF EXISTS "Users can view own trades" ON trades;
CREATE POLICY "Users can view own trades" ON trades
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own trades" ON trades;
CREATE POLICY "Users can insert own trades" ON trades
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own trades" ON trades;
CREATE POLICY "Users can update own trades" ON trades
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for achievements
DROP POLICY IF EXISTS "Users can view own achievements" ON achievements;
CREATE POLICY "Users can view own achievements" ON achievements
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own achievements" ON achievements;
CREATE POLICY "Users can insert own achievements" ON achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own achievements" ON achievements;
CREATE POLICY "Users can update own achievements" ON achievements
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for bias_profiles
DROP POLICY IF EXISTS "Users can view own bias profile" ON bias_profiles;
CREATE POLICY "Users can view own bias profile" ON bias_profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own bias profile" ON bias_profiles;
CREATE POLICY "Users can insert own bias profile" ON bias_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own bias profile" ON bias_profiles;
CREATE POLICY "Users can update own bias profile" ON bias_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for challenges
DROP POLICY IF EXISTS "Users can view own challenges" ON challenges;
CREATE POLICY "Users can view own challenges" ON challenges
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own challenges" ON challenges;
CREATE POLICY "Users can insert own challenges" ON challenges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own challenges" ON challenges;
CREATE POLICY "Users can update own challenges" ON challenges
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for user_profiles
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for bias_profiles
DROP TRIGGER IF EXISTS update_bias_profiles_updated_at ON bias_profiles;
CREATE TRIGGER update_bias_profiles_updated_at
  BEFORE UPDATE ON bias_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

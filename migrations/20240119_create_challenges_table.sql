-- Create challenges table for user challenges/goals
-- This table stores weekly challenges that users can complete for XP rewards

-- ============================================
-- PART 1: Create challenges table
-- ============================================

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

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_challenges_user_id ON challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_challenges_expires_at ON challenges(expires_at);

-- ============================================
-- PART 2: Enable Row Level Security
-- ============================================

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 3: Create RLS Policies
-- ============================================

-- Drop existing policies if they exist, then recreate them
DROP POLICY IF EXISTS "Users can view own challenges" ON challenges;
DROP POLICY IF EXISTS "Users can insert own challenges" ON challenges;
DROP POLICY IF EXISTS "Users can update own challenges" ON challenges;
DROP POLICY IF EXISTS "Users can delete own challenges" ON challenges;

-- Policy: Users can view their own challenges
CREATE POLICY "Users can view own challenges" ON challenges
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own challenges
CREATE POLICY "Users can insert own challenges" ON challenges
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own challenges
CREATE POLICY "Users can update own challenges" ON challenges
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own challenges
CREATE POLICY "Users can delete own challenges" ON challenges
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- PART 4: Optimize table
-- ============================================

ANALYZE challenges;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Summary of changes:
-- ✅ Created challenges table with composite primary key (user_id, id)
-- ✅ Added indexes for performance
-- ✅ Enabled Row Level Security
-- ✅ Created RLS policies (SELECT, INSERT, UPDATE, DELETE)
-- ✅ Optimized table with ANALYZE

-- Note: Default challenges will be automatically created by the app
-- when a user first accesses the emotions tab.

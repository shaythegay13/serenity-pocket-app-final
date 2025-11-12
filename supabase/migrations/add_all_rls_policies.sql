-- ============================================================================
-- Row Level Security (RLS) Policies for All User Tables
-- ============================================================================

-- Enable RLS on all user-related tables
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE emotion_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE bias_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bias_quiz_history ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CHALLENGES TABLE POLICIES
-- ============================================================================

CREATE POLICY "Users can view their own challenges"
ON challenges
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own challenges"
ON challenges
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own challenges"
ON challenges
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own challenges"
ON challenges
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- ACHIEVEMENTS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Users can view their own achievements"
ON achievements
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
ON achievements
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievements"
ON achievements
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own achievements"
ON achievements
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- EMOTION_LOGS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Users can view their own emotion logs"
ON emotion_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own emotion logs"
ON emotion_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own emotion logs"
ON emotion_logs
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own emotion logs"
ON emotion_logs
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- TRADES TABLE POLICIES
-- ============================================================================

CREATE POLICY "Users can view their own trades"
ON trades
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trades"
ON trades
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trades"
ON trades
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trades"
ON trades
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- BIAS_PROFILES TABLE POLICIES
-- ============================================================================

CREATE POLICY "Users can view their own bias profile"
ON bias_profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bias profile"
ON bias_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bias profile"
ON bias_profiles
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bias profile"
ON bias_profiles
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- BIAS_QUIZ_HISTORY TABLE POLICIES
-- ============================================================================

CREATE POLICY "Users can view their own bias quiz history"
ON bias_quiz_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bias quiz history"
ON bias_quiz_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bias quiz history"
ON bias_quiz_history
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bias quiz history"
ON bias_quiz_history
FOR DELETE
USING (auth.uid() = user_id);

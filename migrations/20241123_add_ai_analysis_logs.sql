-- Migration: Add AI Analysis Logs Table
-- Created: 2024-11-23
-- Description: Adds table to track AI bet advisor analysis for Elite subscribers

-- Create ai_analysis_logs table
CREATE TABLE IF NOT EXISTS ai_analysis_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sport TEXT NOT NULL,
  bet_type TEXT NOT NULL,
  bet_amount NUMERIC NOT NULL,
  recommendation TEXT NOT NULL CHECK (recommendation IN ('PLACE BET', 'DON''T PLACE BET', 'PROCEED WITH CAUTION')),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('LOW', 'MODERATE', 'HIGH')),
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  emotional_risk TEXT CHECK (emotional_risk IN ('LOW', 'MODERATE', 'HIGH')),
  emotional_state TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id and created_at for efficient querying
CREATE INDEX IF NOT EXISTS idx_ai_analysis_logs_user_id ON ai_analysis_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_logs_created_at ON ai_analysis_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_logs_user_created ON ai_analysis_logs(user_id, created_at DESC);

-- Add Row Level Security (RLS)
ALTER TABLE ai_analysis_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own analysis logs
CREATE POLICY "Users can view own analysis logs"
  ON ai_analysis_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own analysis logs
CREATE POLICY "Users can insert own analysis logs"
  ON ai_analysis_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own analysis logs
CREATE POLICY "Users can delete own analysis logs"
  ON ai_analysis_logs
  FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON ai_analysis_logs TO authenticated;
GRANT USAGE ON SEQUENCE ai_analysis_logs_id_seq TO authenticated;

-- Add comment to table
COMMENT ON TABLE ai_analysis_logs IS 'Stores AI bet advisor analysis history for Elite subscribers';
COMMENT ON COLUMN ai_analysis_logs.user_id IS 'Foreign key to auth.users table';
COMMENT ON COLUMN ai_analysis_logs.sport IS 'Sport/event for the bet (e.g., NFL, NBA)';
COMMENT ON COLUMN ai_analysis_logs.bet_type IS 'Type of bet (Moneyline, Spread, Over/Under, Parlay)';
COMMENT ON COLUMN ai_analysis_logs.bet_amount IS 'Proposed bet amount in dollars';
COMMENT ON COLUMN ai_analysis_logs.recommendation IS 'AI recommendation: PLACE BET, DON''T PLACE BET, or PROCEED WITH CAUTION';
COMMENT ON COLUMN ai_analysis_logs.risk_level IS 'Overall risk level: LOW, MODERATE, or HIGH';
COMMENT ON COLUMN ai_analysis_logs.confidence IS 'AI confidence score (0-100)';
COMMENT ON COLUMN ai_analysis_logs.emotional_risk IS 'Emotional risk assessment: LOW, MODERATE, or HIGH';
COMMENT ON COLUMN ai_analysis_logs.emotional_state IS 'User''s emotional state at time of analysis';

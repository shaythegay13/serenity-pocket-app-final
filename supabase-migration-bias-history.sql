-- Migration: Add bias quiz history table to track user's bias assessment over time
-- Run this in your Supabase SQL Editor

-- Create bias_quiz_history table
CREATE TABLE IF NOT EXISTS bias_quiz_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  confirmation_bias INTEGER NOT NULL CHECK (confirmation_bias >= 0 AND confirmation_bias <= 100),
  loss_aversion INTEGER NOT NULL CHECK (loss_aversion >= 0 AND loss_aversion <= 100),
  anchoring_bias INTEGER NOT NULL CHECK (anchoring_bias >= 0 AND anchoring_bias <= 100),
  recency_bias INTEGER NOT NULL CHECK (recency_bias >= 0 AND recency_bias <= 100),
  overconfidence_bias INTEGER NOT NULL CHECK (overconfidence_bias >= 0 AND overconfidence_bias <= 100),
  herd_mentality INTEGER NOT NULL CHECK (herd_mentality >= 0 AND herd_mentality <= 100),
  average_score INTEGER NOT NULL CHECK (average_score >= 0 AND average_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for querying history by user and timestamp
CREATE INDEX IF NOT EXISTS idx_bias_history_user_timestamp 
ON bias_quiz_history(user_id, timestamp DESC);

-- Add RLS policies
ALTER TABLE bias_quiz_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own history
CREATE POLICY "Users can view own bias quiz history"
ON bias_quiz_history FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own history
CREATE POLICY "Users can insert own bias quiz history"
ON bias_quiz_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add comments
COMMENT ON TABLE bias_quiz_history IS 'Tracks user bias quiz results over time for progress monitoring';
COMMENT ON COLUMN bias_quiz_history.average_score IS 'Average of all bias scores (0-100)';
COMMENT ON COLUMN bias_quiz_history.timestamp IS 'When the quiz was completed';

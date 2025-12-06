-- Migration: Add phase column to emotion_logs table
-- Run this in your Supabase SQL Editor

-- Add phase column to emotion_logs table
ALTER TABLE emotion_logs
ADD COLUMN IF NOT EXISTS phase TEXT CHECK (phase IN ('before', 'during', 'after'));

-- Set default to 'before' for existing rows
UPDATE emotion_logs
SET phase = 'before'
WHERE phase IS NULL;

-- Make phase NOT NULL after setting defaults
ALTER TABLE emotion_logs
ALTER COLUMN phase SET NOT NULL;

-- Create index for better query performance when filtering by phase
CREATE INDEX IF NOT EXISTS idx_emotion_logs_phase ON emotion_logs(phase);

-- Verify the change
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'emotion_logs'
ORDER BY ordinal_position;

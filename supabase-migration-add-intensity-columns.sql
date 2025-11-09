-- Migration: Add emotion intensity and during-bet tracking columns to trades table
-- Run this in your Supabase SQL Editor

-- Add intensity columns for pre, during, and post-betting emotions
ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS pre_trade_intensity INTEGER DEFAULT 3 CHECK (pre_trade_intensity >= 1 AND pre_trade_intensity <= 5);

ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS during_trade_emotion TEXT;

ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS during_trade_intensity INTEGER CHECK (during_trade_intensity >= 1 AND during_trade_intensity <= 5);

ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS post_trade_intensity INTEGER CHECK (post_trade_intensity >= 1 AND post_trade_intensity <= 5);

ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS emotional_impact INTEGER CHECK (emotional_impact >= 1 AND emotional_impact <= 5);

-- Add reflection column (might already exist as post_trade_notes, but adding for clarity)
ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS reflection TEXT;

-- Add comments to document the columns
COMMENT ON COLUMN trades.pre_trade_intensity IS 'Emotion intensity before betting (1-5 scale)';
COMMENT ON COLUMN trades.during_trade_emotion IS 'Optional emotion tracked during betting';
COMMENT ON COLUMN trades.during_trade_intensity IS 'Emotion intensity during betting (1-5 scale)';
COMMENT ON COLUMN trades.post_trade_intensity IS 'Emotion intensity after betting (1-5 scale)';
COMMENT ON COLUMN trades.emotional_impact IS 'Overall emotional impact rating (1-5 scale)';

-- Create index for querying trades by timestamp
CREATE INDEX IF NOT EXISTS idx_trades_user_timestamp ON trades(user_id, timestamp DESC);

-- Create index for pending trades (no outcome yet)
CREATE INDEX IF NOT EXISTS idx_trades_pending ON trades(user_id, outcome) WHERE outcome IS NULL;

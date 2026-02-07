-- Migration: Add is_live_bet column to trades, comprehensive_bets, and bet_analyses tables
-- This column tracks whether a bet was placed live/in-play (a significant risk factor)
-- Run this in your Supabase SQL Editor

-- Add is_live_bet column to trades table
ALTER TABLE trades
ADD COLUMN IF NOT EXISTS is_live_bet BOOLEAN DEFAULT false;

-- Add is_live_bet column to comprehensive_bets table
ALTER TABLE comprehensive_bets
ADD COLUMN IF NOT EXISTS is_live_bet BOOLEAN DEFAULT false;

-- Add is_live_bet column to bet_analyses table
ALTER TABLE bet_analyses
ADD COLUMN IF NOT EXISTS is_live_bet BOOLEAN DEFAULT false;

-- Add is_chasing_loss column to comprehensive_bets if not exists
-- (used by sequence analysis to detect loss chasing patterns)
ALTER TABLE comprehensive_bets
ADD COLUMN IF NOT EXISTS is_chasing_loss BOOLEAN DEFAULT false;

-- Create index for faster queries on live bets
CREATE INDEX IF NOT EXISTS idx_trades_is_live_bet ON trades(is_live_bet) WHERE is_live_bet = true;
CREATE INDEX IF NOT EXISTS idx_comprehensive_bets_is_live_bet ON comprehensive_bets(is_live_bet) WHERE is_live_bet = true;
CREATE INDEX IF NOT EXISTS idx_bet_analyses_is_live_bet ON bet_analyses(is_live_bet) WHERE is_live_bet = true;

-- Optional: Add comment to explain the columns
COMMENT ON COLUMN trades.is_live_bet IS 'Whether this bet was placed live/in-play. Live betting is associated with higher impulsivity risk.';
COMMENT ON COLUMN comprehensive_bets.is_live_bet IS 'Whether this bet was placed live/in-play. Live betting is associated with higher impulsivity risk.';
COMMENT ON COLUMN bet_analyses.is_live_bet IS 'Whether this bet was placed live/in-play. Live betting is associated with higher impulsivity risk.';
COMMENT ON COLUMN comprehensive_bets.is_chasing_loss IS 'Whether this bet was likely placed to chase a previous loss.';

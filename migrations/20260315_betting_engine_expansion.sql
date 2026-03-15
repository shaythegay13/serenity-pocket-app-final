-- Migration: Betting Engine Expansion
-- Adds columns for: alt lines, team props, teasers, futures, live betting,
-- system/round-robin parlays, and cash-out stub support.
-- Run this in Supabase SQL Editor.

-- ============================================================================
-- comprehensive_bets: market schema fields
-- ============================================================================

ALTER TABLE comprehensive_bets
  ADD COLUMN IF NOT EXISTS time_frame      TEXT,           -- 'full_game' | 'first_half' | 'first_quarter' etc.
  ADD COLUMN IF NOT EXISTS variant_type    TEXT,           -- 'base_line' | 'alt_line' | 'milestone'
  ADD COLUMN IF NOT EXISTS market_level    TEXT,           -- 'game' | 'team' | 'player' | 'future'
  ADD COLUMN IF NOT EXISTS season_id       TEXT,           -- e.g. 'nba_2025_26' (for futures)
  ADD COLUMN IF NOT EXISTS tournament_id   TEXT,           -- e.g. 'nba_playoffs_2026'
  ADD COLUMN IF NOT EXISTS supports_cash_out BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS cash_out_offer  JSONB;          -- CashOutOffer object (null until integrated)

-- ============================================================================
-- parlays: new parlay types + cash-out stub
-- ============================================================================

-- Drop old CHECK constraint and replace with one that includes teaser/system/round_robin.
-- Supabase/Postgres requires dropping by name. The constraint was created with the default
-- name in the original migration; use the DO block to drop it safely regardless of name.
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'parlays'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%classic%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE parlays DROP CONSTRAINT ' || quote_ident(constraint_name);
  END IF;
END $$;

ALTER TABLE parlays
  ADD CONSTRAINT parlays_type_check
    CHECK (type IN ('classic', 'sgp', 'sgp_plus', 'teaser', 'system', 'round_robin'));

ALTER TABLE parlays
  ADD COLUMN IF NOT EXISTS supports_cash_out BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS cash_out_offer    JSONB;

-- ============================================================================
-- parlay_legs: market schema fields
-- ============================================================================

ALTER TABLE parlay_legs
  ADD COLUMN IF NOT EXISTS time_frame   TEXT,
  ADD COLUMN IF NOT EXISTS variant_type TEXT,
  ADD COLUMN IF NOT EXISTS market_level TEXT;

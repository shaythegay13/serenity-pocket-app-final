-- ============================================================================
-- PARLAY SYSTEM — FULL MIGRATION (merged)
-- Creates parlays + parlay_legs tables with all constraints up to date,
-- including 'push' outcome support, DECIMAL odds, and SGP indexes.
--
-- Run this single script in Supabase SQL Editor.
-- Safe to run multiple times — uses IF NOT EXISTS / DROP IF EXISTS.
-- ============================================================================


-- ============================================================================
-- PART 1: Create parlays table
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Creating parlays table...';
END $$;

CREATE TABLE IF NOT EXISTS parlays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  anonymous_session_id VARCHAR(255),
  type VARCHAR(20) DEFAULT 'classic' CHECK (type IN ('classic', 'sgp', 'sgp_plus')),
  stake DECIMAL NOT NULL,
  total_odds_american DECIMAL NOT NULL,
  total_odds_decimal DECIMAL NOT NULL,
  implied_probability DECIMAL,
  true_probability DECIMAL,
  projected_ev DECIMAL,
  risk_score DECIMAL,
  kelly_stake_fraction DECIMAL,
  outcome VARCHAR(20) DEFAULT 'pending' CHECK (outcome IN ('pending', 'won', 'lost', 'void', 'push')),
  actual_payout DECIMAL,
  emotion_at_creation VARCHAR(50),
  emotion_intensity_at_creation INTEGER,
  tilt_signals TEXT[],
  emotion_check_in_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  settled_at TIMESTAMP
);

-- Indexes for parlays
CREATE INDEX IF NOT EXISTS idx_parlays_user_id ON parlays(user_id);
CREATE INDEX IF NOT EXISTS idx_parlays_anonymous_session ON parlays(anonymous_session_id);
CREATE INDEX IF NOT EXISTS idx_parlays_created_at ON parlays(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_parlays_outcome ON parlays(outcome);
CREATE INDEX IF NOT EXISTS idx_parlays_type ON parlays(type);
CREATE INDEX IF NOT EXISTS idx_parlays_type_outcome ON parlays(type, outcome);

-- Enable RLS
ALTER TABLE parlays ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view their own parlays" ON parlays;
DROP POLICY IF EXISTS "Users can insert their own parlays" ON parlays;
DROP POLICY IF EXISTS "Users can update their own parlays" ON parlays;

CREATE POLICY "Users can view their own parlays"
    ON parlays FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own parlays"
    ON parlays FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own parlays"
    ON parlays FOR UPDATE
    USING (auth.uid() = user_id);


-- ============================================================================
-- PART 2: Create parlay_legs table
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Creating parlay_legs table...';
END $$;

CREATE TABLE IF NOT EXISTS parlay_legs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parlay_id UUID NOT NULL REFERENCES parlays(id) ON DELETE CASCADE,
  pick_id VARCHAR(255),
  game_id VARCHAR(255),
  teams TEXT NOT NULL,
  bet_type VARCHAR(50) NOT NULL,
  line VARCHAR(50),
  odds INTEGER NOT NULL,
  confidence INTEGER,
  ai_win_probability DECIMAL,
  sport VARCHAR(50),
  league VARCHAR(100),
  selection VARCHAR(50),
  outcome VARCHAR(20) DEFAULT 'pending' CHECK (outcome IN ('pending', 'won', 'lost', 'void', 'push')),
  settled_at TIMESTAMP,
  leg_order INTEGER NOT NULL DEFAULT 0
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_parlay_legs_parlay_id ON parlay_legs(parlay_id);
CREATE INDEX IF NOT EXISTS idx_parlay_legs_game_id ON parlay_legs(game_id);
CREATE INDEX IF NOT EXISTS idx_parlay_legs_sport ON parlay_legs(sport);
CREATE INDEX IF NOT EXISTS idx_parlay_legs_outcome ON parlay_legs(outcome);

-- Enable RLS (access inherited from parent parlay)
ALTER TABLE parlay_legs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view legs of their own parlays" ON parlay_legs;
DROP POLICY IF EXISTS "Users can insert legs for their own parlays" ON parlay_legs;
DROP POLICY IF EXISTS "Users can update legs of their own parlays" ON parlay_legs;

CREATE POLICY "Users can view legs of their own parlays"
    ON parlay_legs FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM parlays WHERE parlays.id = parlay_legs.parlay_id AND parlays.user_id = auth.uid()
      )
    );

CREATE POLICY "Users can insert legs for their own parlays"
    ON parlay_legs FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM parlays WHERE parlays.id = parlay_legs.parlay_id AND parlays.user_id = auth.uid()
      )
    );

CREATE POLICY "Users can update legs of their own parlays"
    ON parlay_legs FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM parlays WHERE parlays.id = parlay_legs.parlay_id AND parlays.user_id = auth.uid()
      )
    );


-- ============================================================================
-- PART 3: Add parlay_id to emotion_logs (if table exists)
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = 'emotion_logs'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'emotion_logs' AND column_name = 'parlay_id'
        ) THEN
            ALTER TABLE emotion_logs ADD COLUMN parlay_id UUID REFERENCES parlays(id) ON DELETE SET NULL;
            RAISE NOTICE '  Added parlay_id column to emotion_logs';
        END IF;
    END IF;
END $$;


-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'PARLAY MIGRATION COMPLETED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '  parlays  (with push outcome, DECIMAL odds)';
    RAISE NOTICE '  parlay_legs  (with push outcome)';
    RAISE NOTICE '';
    RAISE NOTICE 'Security:';
    RAISE NOTICE '  Row Level Security enabled';
    RAISE NOTICE '  Policies created';
    RAISE NOTICE '  Indexes added (including type+outcome composite)';
END $$;

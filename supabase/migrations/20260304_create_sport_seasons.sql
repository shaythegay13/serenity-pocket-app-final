-- =====================================================================
-- Sport Seasons Table
-- Tracks dynamic season status for all sports/leagues
-- Updated weekly via cron job from TheOddsAPI
-- =====================================================================

CREATE TABLE IF NOT EXISTS sport_seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sport_id TEXT NOT NULL UNIQUE,
  sport_name TEXT NOT NULL,
  display_name TEXT,
  is_active BOOLEAN DEFAULT false,
  has_outrights BOOLEAN DEFAULT false,
  season_start DATE,
  season_end DATE,
  last_game_date TIMESTAMPTZ,
  next_game_date TIMESTAMPTZ,
  game_count INTEGER DEFAULT 0,
  api_source TEXT DEFAULT 'theoddsapi',
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_sport_seasons_sport_id ON sport_seasons(sport_id);
CREATE INDEX IF NOT EXISTS idx_sport_seasons_is_active ON sport_seasons(is_active);

-- RLS policies
ALTER TABLE sport_seasons ENABLE ROW LEVEL SECURITY;

-- Anyone can read sport seasons (public data)
CREATE POLICY "Anyone can view sport seasons"
  ON sport_seasons FOR SELECT
  USING (true);

-- Only service role can update (via cron job)
CREATE POLICY "Service role can manage sport seasons"
  ON sport_seasons FOR ALL
  USING (auth.role() = 'service_role');

-- Function to update sport season
CREATE OR REPLACE FUNCTION upsert_sport_season(
  p_sport_id TEXT,
  p_sport_name TEXT,
  p_display_name TEXT,
  p_is_active BOOLEAN,
  p_has_outrights BOOLEAN DEFAULT false,
  p_game_count INTEGER DEFAULT 0
)
RETURNS void AS $$
BEGIN
  INSERT INTO sport_seasons (
    sport_id, sport_name, display_name, is_active, has_outrights, game_count, last_updated_at
  )
  VALUES (
    p_sport_id, p_sport_name, p_display_name, p_is_active, p_has_outrights, p_game_count, NOW()
  )
  ON CONFLICT (sport_id) DO UPDATE SET
    sport_name = EXCLUDED.sport_name,
    display_name = EXCLUDED.display_name,
    is_active = EXCLUDED.is_active,
    has_outrights = EXCLUDED.has_outrights,
    game_count = EXCLUDED.game_count,
    last_updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE sport_seasons IS 'Dynamic sport season tracking - updated weekly from TheOddsAPI';

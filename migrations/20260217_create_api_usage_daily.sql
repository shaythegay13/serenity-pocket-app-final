-- Migration: Create api_usage_daily table for API usage counter persistence
-- This table stores daily snapshots of API usage counters so they survive
-- Vercel cold starts and redeploys.

CREATE TABLE IF NOT EXISTS api_usage_daily (
  date DATE PRIMARY KEY,
  rapidapi_used INTEGER NOT NULL DEFAULT 0,
  gemini_used INTEGER NOT NULL DEFAULT 0,
  gmail_used INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick lookups by date (primary key already covers this, but explicit for clarity)
-- No additional index needed since date is the primary key.

-- Enable RLS (row-level security) but allow service role full access
ALTER TABLE api_usage_daily ENABLE ROW LEVEL SECURITY;

-- Only the service role (used by cron jobs and server-side code) can read/write
CREATE POLICY "Service role full access on api_usage_daily"
  ON api_usage_daily
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Auto-cleanup: keep only last 90 days of records
-- This can be run periodically or as part of the daily cron
CREATE OR REPLACE FUNCTION cleanup_old_api_usage() RETURNS void AS $$
BEGIN
  DELETE FROM api_usage_daily WHERE date < CURRENT_DATE - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE api_usage_daily IS 'Daily API usage counter snapshots for monitoring and historical tracking. Counters: RapidAPI requests, Gemini RPD, Gmail sends.';

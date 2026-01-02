-- AI Service Usage Limits Migration
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. AI Service Usage Tracking Table
-- ============================================
CREATE TABLE IF NOT EXISTS ai_service_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_type VARCHAR(50) NOT NULL CHECK (service_type IN ('ai_picker', 'ai_bet_analyzer')),
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  week_start_date DATE NOT NULL,
  tier_at_time_of_use VARCHAR(20) NOT NULL,
  request_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_service_week 
  ON ai_service_usage(user_id, service_type, week_start_date);

CREATE INDEX IF NOT EXISTS idx_ai_usage_week_start 
  ON ai_service_usage(week_start_date);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_created
  ON ai_service_usage(user_id, created_at DESC);

-- ============================================
-- 2. AI Usage Limits Per Tier
-- ============================================
CREATE TABLE IF NOT EXISTS ai_usage_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier VARCHAR(20) NOT NULL UNIQUE CHECK (tier IN ('free', 'premium', 'premium_plus', 'elite')),
  ai_picker_weekly_limit INT NOT NULL DEFAULT 0,
  ai_bet_analyzer_weekly_limit INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial limits based on requirements
INSERT INTO ai_usage_limits (tier, ai_picker_weekly_limit, ai_bet_analyzer_weekly_limit) VALUES
  ('free', 0, 0),
  ('premium', 1, 1),
  ('premium_plus', 3, 3),
  ('elite', 7, 7)
ON CONFLICT (tier) DO UPDATE SET
  ai_picker_weekly_limit = EXCLUDED.ai_picker_weekly_limit,
  ai_bet_analyzer_weekly_limit = EXCLUDED.ai_bet_analyzer_weekly_limit,
  updated_at = NOW();

-- ============================================
-- 3. Marketplace Purchases (Additional Credits)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_usage_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  purchase_type VARCHAR(50) NOT NULL,
  ai_picker_credits INT NOT NULL DEFAULT 0,
  ai_bet_analyzer_credits INT NOT NULL DEFAULT 0,
  price_paid DECIMAL(10,2) NOT NULL,
  flowglad_payment_id VARCHAR(255),
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_purchases_user 
  ON ai_usage_purchases(user_id, purchased_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_purchases_flowglad
  ON ai_usage_purchases(flowglad_payment_id);

-- ============================================
-- 4. Marketplace Product Catalog
-- ============================================
CREATE TABLE IF NOT EXISTS ai_marketplace_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_key VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  ai_picker_credits INT NOT NULL DEFAULT 0,
  ai_bet_analyzer_credits INT NOT NULL DEFAULT 0,
  is_bundle BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  flowglad_price_id VARCHAR(255),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed marketplace products
INSERT INTO ai_marketplace_products (product_key, display_name, description, price, ai_picker_credits, ai_bet_analyzer_credits, is_bundle, sort_order) VALUES
  ('single_picker', 'SmartSlip - 1 Use', 'One additional SmartSlip analysis', 30.00, 1, 0, false, 1),
  ('single_analyzer', 'TiltLab - 1 Use', 'One additional TiltLab session', 30.00, 0, 1, false, 2),
  ('bundle_single', 'Bundle: Both Services - 1 Use Each', 'One use of SmartSlip + One use of TiltLab', 55.00, 1, 1, true, 3),
  ('double_picker', 'SmartSlip - 2 Uses', 'Two additional SmartSlip analyses', 60.00, 2, 0, false, 4),
  ('double_analyzer', 'TiltLab - 2 Uses', 'Two additional TiltLab sessions', 60.00, 0, 2, false, 5),
  ('bundle_double', 'Bundle: Both Services - 2 Uses Each', 'Two uses of SmartSlip + Two uses of TiltLab', 105.00, 2, 2, true, 6)
ON CONFLICT (product_key) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  ai_picker_credits = EXCLUDED.ai_picker_credits,
  ai_bet_analyzer_credits = EXCLUDED.ai_bet_analyzer_credits,
  is_bundle = EXCLUDED.is_bundle,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- ============================================
-- 5. Row Level Security (RLS) Policies
-- ============================================

-- ai_service_usage policies
ALTER TABLE ai_service_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own usage" ON ai_service_usage;
CREATE POLICY "Users can view own usage"
  ON ai_service_usage FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can insert usage" ON ai_service_usage;
CREATE POLICY "Service can insert usage"
  ON ai_service_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ai_usage_purchases policies
ALTER TABLE ai_usage_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own purchases" ON ai_usage_purchases;
CREATE POLICY "Users can view own purchases"
  ON ai_usage_purchases FOR SELECT
  USING (auth.uid() = user_id);

-- ai_marketplace_products is public read
ALTER TABLE ai_marketplace_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active products" ON ai_marketplace_products;
CREATE POLICY "Anyone can view active products"
  ON ai_marketplace_products FOR SELECT
  USING (is_active = true);

-- ai_usage_limits is public read
ALTER TABLE ai_usage_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view limits" ON ai_usage_limits;
CREATE POLICY "Anyone can view limits"
  ON ai_usage_limits FOR SELECT
  USING (true);

-- ============================================
-- 6. Helper Functions
-- ============================================

-- Function to get current week's Monday date
CREATE OR REPLACE FUNCTION get_week_start_date(check_date DATE DEFAULT CURRENT_DATE)
RETURNS DATE AS $$
DECLARE
  day_of_week INT;
  days_to_subtract INT;
BEGIN
  day_of_week := EXTRACT(DOW FROM check_date)::INT;
  
  -- If Sunday (0), go back 6 days; otherwise go back (day_of_week - 1) days
  IF day_of_week = 0 THEN
    days_to_subtract := 6;
  ELSE
    days_to_subtract := day_of_week - 1;
  END IF;
  
  RETURN check_date - days_to_subtract;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 7. Cleanup Old Data (Optional - for maintenance)
-- ============================================

-- Function to archive old usage data (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_ai_usage()
RETURNS void AS $$
BEGIN
  DELETE FROM ai_service_usage
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Migration Complete
-- ============================================

-- Verify tables were created
DO $$
BEGIN
  RAISE NOTICE 'AI Usage Limits Migration Complete!';
  RAISE NOTICE 'Tables created: ai_service_usage, ai_usage_limits, ai_usage_purchases, ai_marketplace_products';
  RAISE NOTICE 'RLS policies enabled on all tables';
  RAISE NOTICE 'Initial data seeded for limits and products';
END $$;

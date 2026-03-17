-- AI-Guided Decisions Refactor Migration
-- Adds unified decision tracking, updates tier limits, and replaces marketplace products.
-- All changes are non-destructive — existing rows and columns are preserved.

-- ============================================================
-- 1. Add decision_credits column to ai_usage_purchases
--    (existing ai_picker_credits / ai_bet_analyzer_credits kept for backward compat)
-- ============================================================
ALTER TABLE ai_usage_purchases
  ADD COLUMN IF NOT EXISTS decision_credits INT NOT NULL DEFAULT 0;

-- ============================================================
-- 2. Add ai_decisions_weekly_limit column to ai_usage_limits
-- ============================================================
ALTER TABLE ai_usage_limits
  ADD COLUMN IF NOT EXISTS ai_decisions_weekly_limit INT NOT NULL DEFAULT 0;

-- Seed updated weekly decision limits per tier
UPDATE ai_usage_limits SET ai_decisions_weekly_limit = 0  WHERE tier = 'free';
UPDATE ai_usage_limits SET ai_decisions_weekly_limit = 3  WHERE tier = 'premium';
UPDATE ai_usage_limits SET ai_decisions_weekly_limit = 7  WHERE tier = 'premium_plus';
UPDATE ai_usage_limits SET ai_decisions_weekly_limit = 14 WHERE tier = 'elite';

-- ============================================================
-- 3. Extend ai_service_usage.service_type CHECK to include 'ai_decision'
-- ============================================================
ALTER TABLE ai_service_usage
  DROP CONSTRAINT IF EXISTS ai_service_usage_service_type_check;

ALTER TABLE ai_service_usage
  ADD CONSTRAINT ai_service_usage_service_type_check
  CHECK (service_type IN ('ai_picker', 'ai_bet_analyzer', 'ai_decision'));

-- ============================================================
-- 4. Deactivate all legacy marketplace products
--    (not deleted — preserved for purchase history / webhook idempotency)
-- ============================================================
UPDATE ai_marketplace_products
SET is_active = FALSE, updated_at = NOW()
WHERE product_key IN (
  'single_picker', 'single_analyzer', 'bundle_single',
  'double_picker', 'double_analyzer', 'bundle_double'
);

-- ============================================================
-- 5. Insert new unified AI-guided decision products
-- ============================================================

-- Add decision_credits column to catalog if it doesn't exist
ALTER TABLE ai_marketplace_products
  ADD COLUMN IF NOT EXISTS decision_credits INT NOT NULL DEFAULT 0;

INSERT INTO ai_marketplace_products (
  product_key, display_name, description,
  price, decision_credits,
  ai_picker_credits, ai_bet_analyzer_credits,
  is_bundle, is_active, sort_order
) VALUES
  (
    'decision_single',
    '1 AI Decision',
    'Guide one bet with a full SmartSlip + TiltLab AI analysis',
    4.00, 1, 0, 0, false, true, 10
  ),
  (
    'decision_5pack',
    '5 AI Decisions',
    '5 AI-guided betting decisions — save vs. buying individually',
    16.00, 5, 0, 0, false, true, 11
  ),
  (
    'decision_10pack',
    '10 AI Decisions',
    '10 AI-guided betting decisions — best value pack',
    28.00, 10, 0, 0, false, true, 12
  )
ON CONFLICT (product_key) DO UPDATE SET
  display_name    = EXCLUDED.display_name,
  description     = EXCLUDED.description,
  price           = EXCLUDED.price,
  decision_credits = EXCLUDED.decision_credits,
  is_active       = EXCLUDED.is_active,
  sort_order      = EXCLUDED.sort_order,
  updated_at      = NOW();

-- ============================================================
-- 6. Index for decision credit queries
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_ai_purchases_decision_credits
  ON ai_usage_purchases(user_id, purchased_at)
  WHERE decision_credits > 0;

-- ============================================================
-- Migration complete
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE 'AI Decisions Refactor Migration Complete!';
  RAISE NOTICE 'Added: decision_credits to ai_usage_purchases';
  RAISE NOTICE 'Added: ai_decisions_weekly_limit to ai_usage_limits (0/3/7/14)';
  RAISE NOTICE 'Extended: ai_service_usage.service_type CHECK to include ai_decision';
  RAISE NOTICE 'Deactivated: 6 legacy marketplace products';
  RAISE NOTICE 'Inserted: 3 new decision marketplace products ($4/$16/$28)';
END $$;

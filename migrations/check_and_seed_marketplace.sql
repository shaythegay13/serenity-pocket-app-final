--- Check and Seed AI Marketplace Products
-- Run this in Supabase SQL Editor to diagnose and fix the marketplace issue

-- ============================================
-- 1. Check if table exists and view current products
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '🔍 Checking ai_marketplace_products table...';
END $$;

-- View existing products (if any)
SELECT
  product_key,
  display_name,
  price,
  ai_picker_credits,
  ai_bet_analyzer_credits,
  is_bundle,
  is_active,
  sort_order
FROM ai_marketplace_products
ORDER BY sort_order;

-- Count active products
SELECT
  COUNT(*) as total_products,
  COUNT(*) FILTER (WHERE is_active = true) as active_products,
  COUNT(*) FILTER (WHERE is_active = false) as inactive_products
FROM ai_marketplace_products;

-- ============================================
-- 2. Create table if it doesn't exist
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

-- ============================================
-- 3. Enable RLS and create policies
-- ============================================
ALTER TABLE ai_marketplace_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active products" ON ai_marketplace_products;
CREATE POLICY "Anyone can view active products"
  ON ai_marketplace_products FOR SELECT
  USING (is_active = true);

-- ============================================
-- 4. Seed/Update marketplace products
-- ============================================
INSERT INTO ai_marketplace_products (
  product_key,
  display_name,
  description,
  price,
  ai_picker_credits,
  ai_bet_analyzer_credits,
  is_bundle,
  is_active,
  sort_order
) VALUES
  (
    'single_picker',
    'SmartSlip - 1 Use',
    'One additional SmartSlip analysis',
    30.00,
    1,
    0,
    false,
    true,
    1
  ),
  (
    'single_analyzer',
    'TiltLab - 1 Use',
    'One additional TiltLab session',
    30.00,
    0,
    1,
    false,
    true,
    2
  ),
  (
    'bundle_single',
    'Bundle: Both Services - 1 Use Each',
    'One use of SmartSlip + One use of TiltLab',
    55.00,
    1,
    1,
    true,
    true,
    3
  ),
  (
    'double_picker',
    'SmartSlip - 2 Uses',
    'Two additional SmartSlip analyses',
    60.00,
    2,
    0,
    false,
    true,
    4
  ),
  (
    'double_analyzer',
    'TiltLab - 2 Uses',
    'Two additional TiltLab sessions',
    60.00,
    0,
    2,
    false,
    true,
    5
  ),
  (
    'bundle_double',
    'Bundle: Both Services - 2 Uses Each',
    'Two uses of SmartSlip + Two uses of TiltLab',
    105.00,
    2,
    2,
    true,
    true,
    6
  )
ON CONFLICT (product_key) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  ai_picker_credits = EXCLUDED.ai_picker_credits,
  ai_bet_analyzer_credits = EXCLUDED.ai_bet_analyzer_credits,
  is_bundle = EXCLUDED.is_bundle,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- ============================================
-- 5. Verify the products were added
-- ============================================
DO $$
DECLARE
  product_count INT;
BEGIN
  SELECT COUNT(*) INTO product_count
  FROM ai_marketplace_products
  WHERE is_active = true;

  IF product_count >= 6 THEN
    RAISE NOTICE '✅ Success! % active products in marketplace', product_count;
  ELSE
    RAISE NOTICE '⚠️  Only % active products found. Expected at least 6.', product_count;
  END IF;
END $$;

-- Final verification query
SELECT
  '✅ Marketplace products seeded successfully!' as status,
  COUNT(*) as total_products,
  COUNT(*) FILTER (WHERE is_active = true) as active_products
FROM ai_marketplace_products;

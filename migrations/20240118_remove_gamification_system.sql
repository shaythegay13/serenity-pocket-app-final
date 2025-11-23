-- Remove gamification system (XP, levels, achievements)
-- Features are now gated by subscription tiers only

-- ============================================
-- PART 1: Remove gamification columns from user_profiles
-- ============================================

ALTER TABLE user_profiles
DROP COLUMN IF EXISTS level,
DROP COLUMN IF EXISTS xp,
DROP COLUMN IF EXISTS xp_to_next_level;

-- ============================================
-- PART 2: Drop achievements table
-- ============================================

DROP TABLE IF EXISTS achievements CASCADE;

-- ============================================
-- PART 3: Drop any gamification-related indexes
-- ============================================

DROP INDEX IF EXISTS idx_user_profiles_level;
DROP INDEX IF EXISTS idx_user_profiles_xp;
DROP INDEX IF EXISTS idx_achievements_user_id;

-- ============================================
-- PART 4: Clean up any gamification functions/triggers
-- ============================================

-- Drop any level-up triggers if they exist
DROP TRIGGER IF EXISTS update_user_level ON user_profiles;
DROP FUNCTION IF EXISTS calculate_user_level();

-- ============================================
-- PART 5: Analyze tables (VACUUM must be run separately)
-- ============================================

ANALYZE user_profiles;

-- Note: Run VACUUM manually if needed:
-- VACUUM user_profiles;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Summary of changes:
-- ✅ Removed level, xp, xp_to_next_level columns from user_profiles
-- ✅ Dropped achievements table
-- ✅ Removed gamification indexes
-- ✅ Cleaned up any related functions/triggers
-- ✅ Vacuumed and analyzed tables

-- Note: The following are preserved:
-- ✓ Subscription tier system (subscription_tier, subscription_status, etc.)
-- ✓ Analytics metrics (bias_recognition_score, mindful_decision_percentage, etc.)
-- ✓ Tracking counters (total_emotions_logged, total_biases_identified, etc.)
-- ✓ Daily rings (emotional_awareness, bias_recognition, mindfulness progress)

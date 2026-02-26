-- ============================================================
-- Migration: Add email + display_name to all user-linked tables
-- Date: 2026-02-26
--
-- Uses ADD COLUMN IF NOT EXISTS so this is safe to re-run.
-- survey_responses already has an email column — only
-- display_name is added there.
-- user_profiles already has name as its display_name —
-- only the email backfill is run there.
-- parlay_legs has no direct user_id (linked via parlay_id)
-- and is intentionally excluded.
-- System tables excluded: ai_marketplace_products,
-- ai_usage_limits, api_usage_daily.
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1. emotion_logs
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.emotion_logs
  ADD COLUMN IF NOT EXISTS email        TEXT,
  ADD COLUMN IF NOT EXISTS display_name TEXT;

UPDATE public.emotion_logs t
SET
  email        = au.email,
  display_name = up.name
FROM auth.users au
LEFT JOIN public.user_profiles up ON up.id = au.id
WHERE t.user_id = au.id
  AND (t.email IS NULL OR t.display_name IS NULL);


-- ────────────────────────────────────────────────────────────
-- 2. trades
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS email        TEXT,
  ADD COLUMN IF NOT EXISTS display_name TEXT;

UPDATE public.trades t
SET
  email        = au.email,
  display_name = up.name
FROM auth.users au
LEFT JOIN public.user_profiles up ON up.id = au.id
WHERE t.user_id = au.id
  AND (t.email IS NULL OR t.display_name IS NULL);


-- ────────────────────────────────────────────────────────────
-- 3. comprehensive_bets
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.comprehensive_bets
  ADD COLUMN IF NOT EXISTS email        TEXT,
  ADD COLUMN IF NOT EXISTS display_name TEXT;

UPDATE public.comprehensive_bets t
SET
  email        = au.email,
  display_name = up.name
FROM auth.users au
LEFT JOIN public.user_profiles up ON up.id = au.id
WHERE t.user_id = au.id
  AND (t.email IS NULL OR t.display_name IS NULL);


-- ────────────────────────────────────────────────────────────
-- 4. parlays
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.parlays
  ADD COLUMN IF NOT EXISTS email        TEXT,
  ADD COLUMN IF NOT EXISTS display_name TEXT;

UPDATE public.parlays t
SET
  email        = au.email,
  display_name = up.name
FROM auth.users au
LEFT JOIN public.user_profiles up ON up.id = au.id
WHERE t.user_id = au.id
  AND (t.email IS NULL OR t.display_name IS NULL);


-- ────────────────────────────────────────────────────────────
-- 5. survey_responses (already has email — only add display_name)
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.survey_responses
  ADD COLUMN IF NOT EXISTS display_name TEXT;

UPDATE public.survey_responses t
SET
  display_name = up.name
FROM public.user_profiles up
WHERE t.user_id = up.id
  AND t.display_name IS NULL;


-- ────────────────────────────────────────────────────────────
-- 6. achievements
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.achievements
  ADD COLUMN IF NOT EXISTS email        TEXT,
  ADD COLUMN IF NOT EXISTS display_name TEXT;

UPDATE public.achievements t
SET
  email        = au.email,
  display_name = up.name
FROM auth.users au
LEFT JOIN public.user_profiles up ON up.id = au.id
WHERE t.user_id = au.id
  AND (t.email IS NULL OR t.display_name IS NULL);


-- ────────────────────────────────────────────────────────────
-- 7. challenges
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS email        TEXT,
  ADD COLUMN IF NOT EXISTS display_name TEXT;

UPDATE public.challenges t
SET
  email        = au.email,
  display_name = up.name
FROM auth.users au
LEFT JOIN public.user_profiles up ON up.id = au.id
WHERE t.user_id = au.id
  AND (t.email IS NULL OR t.display_name IS NULL);


-- ────────────────────────────────────────────────────────────
-- 8. bias_quiz_history
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.bias_quiz_history
  ADD COLUMN IF NOT EXISTS email        TEXT,
  ADD COLUMN IF NOT EXISTS display_name TEXT;

UPDATE public.bias_quiz_history t
SET
  email        = au.email,
  display_name = up.name
FROM auth.users au
LEFT JOIN public.user_profiles up ON up.id = au.id
WHERE t.user_id = au.id
  AND (t.email IS NULL OR t.display_name IS NULL);


-- ────────────────────────────────────────────────────────────
-- 9. ai_analysis_logs
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.ai_analysis_logs
  ADD COLUMN IF NOT EXISTS email        TEXT,
  ADD COLUMN IF NOT EXISTS display_name TEXT;

UPDATE public.ai_analysis_logs t
SET
  email        = au.email,
  display_name = up.name
FROM auth.users au
LEFT JOIN public.user_profiles up ON up.id = au.id
WHERE t.user_id = au.id
  AND (t.email IS NULL OR t.display_name IS NULL);


-- ────────────────────────────────────────────────────────────
-- 10. ai_service_usage
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.ai_service_usage
  ADD COLUMN IF NOT EXISTS email        TEXT,
  ADD COLUMN IF NOT EXISTS display_name TEXT;

UPDATE public.ai_service_usage t
SET
  email        = au.email,
  display_name = up.name
FROM auth.users au
LEFT JOIN public.user_profiles up ON up.id = au.id
WHERE t.user_id = au.id
  AND (t.email IS NULL OR t.display_name IS NULL);


-- ────────────────────────────────────────────────────────────
-- 11. bet_analyses
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.bet_analyses
  ADD COLUMN IF NOT EXISTS email        TEXT,
  ADD COLUMN IF NOT EXISTS display_name TEXT;

UPDATE public.bet_analyses t
SET
  email        = au.email,
  display_name = up.name
FROM auth.users au
LEFT JOIN public.user_profiles up ON up.id = au.id
WHERE t.user_id = au.id
  AND (t.email IS NULL OR t.display_name IS NULL);


-- ────────────────────────────────────────────────────────────
-- 12. ai_usage_purchases
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.ai_usage_purchases
  ADD COLUMN IF NOT EXISTS email        TEXT,
  ADD COLUMN IF NOT EXISTS display_name TEXT;

UPDATE public.ai_usage_purchases t
SET
  email        = au.email,
  display_name = up.name
FROM auth.users au
LEFT JOIN public.user_profiles up ON up.id = au.id
WHERE t.user_id = au.id
  AND (t.email IS NULL OR t.display_name IS NULL);


-- ────────────────────────────────────────────────────────────
-- 13. bias_profiles (user_id is the PK here)
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.bias_profiles
  ADD COLUMN IF NOT EXISTS email        TEXT,
  ADD COLUMN IF NOT EXISTS display_name TEXT;

UPDATE public.bias_profiles t
SET
  email        = au.email,
  display_name = up.name
FROM auth.users au
LEFT JOIN public.user_profiles up ON up.id = au.id
WHERE t.user_id = au.id
  AND (t.email IS NULL OR t.display_name IS NULL);


-- ────────────────────────────────────────────────────────────
-- 14. user_profiles
-- The name column IS the display_name here, so only backfill
-- email (the column was added in 20240120 but backfill was
-- left commented out).
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS email TEXT;

UPDATE public.user_profiles up
SET email = au.email
FROM auth.users au
WHERE up.id = au.id
  AND up.email IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_profiles_email
  ON public.user_profiles (email);


-- ────────────────────────────────────────────────────────────
-- 15. game_lines
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.game_lines
  ADD COLUMN IF NOT EXISTS email        TEXT,
  ADD COLUMN IF NOT EXISTS display_name TEXT;

UPDATE public.game_lines t
SET
  email        = au.email,
  display_name = up.name
FROM auth.users au
LEFT JOIN public.user_profiles up ON up.id = au.id
WHERE t.user_id = au.id
  AND (t.email IS NULL OR t.display_name IS NULL);

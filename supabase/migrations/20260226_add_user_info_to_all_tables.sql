-- ============================================================
-- Migration: Add email + display_name to all user-linked tables
-- Date: 2026-02-26
--
-- Each block checks whether the table exists before touching it,
-- so the migration is safe to run even if some tables have not
-- been created yet.  It is also safe to re-run — every ALTER
-- uses ADD COLUMN IF NOT EXISTS and every UPDATE only touches
-- rows where the column is still NULL.
--
-- survey_responses already has an email column — only
-- display_name is added there.
-- user_profiles already has name as its display_name —
-- only the email backfill is run there.
-- parlay_legs has no direct user_id and is intentionally skipped.
-- System tables excluded: ai_marketplace_products,
-- ai_usage_limits, api_usage_daily.
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- Helper: run a block only when the table exists
-- ────────────────────────────────────────────────────────────


-- ────────────────────────────────────────────────────────────
-- 1. emotion_logs
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'emotion_logs') THEN
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

    RAISE NOTICE 'emotion_logs: done';
  ELSE
    RAISE NOTICE 'emotion_logs: table not found, skipped';
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────
-- 2. trades
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'trades') THEN
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

    RAISE NOTICE 'trades: done';
  ELSE
    RAISE NOTICE 'trades: table not found, skipped';
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────
-- 3. comprehensive_bets
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'comprehensive_bets') THEN
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

    RAISE NOTICE 'comprehensive_bets: done';
  ELSE
    RAISE NOTICE 'comprehensive_bets: table not found, skipped';
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────
-- 4. parlays
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'parlays') THEN
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

    RAISE NOTICE 'parlays: done';
  ELSE
    RAISE NOTICE 'parlays: table not found, skipped';
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────
-- 5. survey_responses (already has email — only add display_name)
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'survey_responses') THEN
    ALTER TABLE public.survey_responses
      ADD COLUMN IF NOT EXISTS display_name TEXT;

    UPDATE public.survey_responses t
    SET display_name = up.name
    FROM public.user_profiles up
    WHERE t.user_id = up.id
      AND t.display_name IS NULL;

    RAISE NOTICE 'survey_responses: done';
  ELSE
    RAISE NOTICE 'survey_responses: table not found, skipped';
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────
-- 6. achievements
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'achievements') THEN
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

    RAISE NOTICE 'achievements: done';
  ELSE
    RAISE NOTICE 'achievements: table not found, skipped';
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────
-- 7. challenges
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'challenges') THEN
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

    RAISE NOTICE 'challenges: done';
  ELSE
    RAISE NOTICE 'challenges: table not found, skipped';
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────
-- 8. bias_quiz_history
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'bias_quiz_history') THEN
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

    RAISE NOTICE 'bias_quiz_history: done';
  ELSE
    RAISE NOTICE 'bias_quiz_history: table not found, skipped';
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────
-- 9. ai_analysis_logs
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'ai_analysis_logs') THEN
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

    RAISE NOTICE 'ai_analysis_logs: done';
  ELSE
    RAISE NOTICE 'ai_analysis_logs: table not found, skipped';
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────
-- 10. ai_service_usage
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'ai_service_usage') THEN
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

    RAISE NOTICE 'ai_service_usage: done';
  ELSE
    RAISE NOTICE 'ai_service_usage: table not found, skipped';
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────
-- 11. bet_analyses
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'bet_analyses') THEN
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

    RAISE NOTICE 'bet_analyses: done';
  ELSE
    RAISE NOTICE 'bet_analyses: table not found, skipped';
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────
-- 12. ai_usage_purchases
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'ai_usage_purchases') THEN
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

    RAISE NOTICE 'ai_usage_purchases: done';
  ELSE
    RAISE NOTICE 'ai_usage_purchases: table not found, skipped';
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────
-- 13. bias_profiles (user_id is the PK here)
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'bias_profiles') THEN
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

    RAISE NOTICE 'bias_profiles: done';
  ELSE
    RAISE NOTICE 'bias_profiles: table not found, skipped';
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────
-- 14. user_profiles
-- name IS the display_name here — only backfill email.
-- The column was added in 20240120 but the backfill was
-- left commented out.
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
    ALTER TABLE public.user_profiles
      ADD COLUMN IF NOT EXISTS email TEXT;

    UPDATE public.user_profiles up
    SET email = au.email
    FROM auth.users au
    WHERE up.id = au.id
      AND up.email IS NULL;

    CREATE INDEX IF NOT EXISTS idx_user_profiles_email
      ON public.user_profiles (email);

    RAISE NOTICE 'user_profiles: done';
  ELSE
    RAISE NOTICE 'user_profiles: table not found, skipped';
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────
-- 15. game_lines
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'game_lines') THEN
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

    RAISE NOTICE 'game_lines: done';
  ELSE
    RAISE NOTICE 'game_lines: table not found, skipped';
  END IF;
END $$;

-- ============================================================
-- Migration: Auto-populate email + display_name on INSERT
-- Date: 2026-02-26
--
-- Creates a single BEFORE INSERT trigger function that fills
-- email and display_name from auth.users / user_profiles
-- whenever a row is inserted into any user-linked table.
--
-- Benefits over updating every insert call in app code:
--   • One change covers all current AND future inserts
--   • Anonymous rows (user_id IS NULL) are left untouched
--   • survey_responses keeps its existing email column logic
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- Shared trigger function
-- Runs BEFORE INSERT; looks up auth.users + user_profiles
-- using NEW.user_id and fills NEW.email / NEW.display_name
-- only when they are not already supplied by the caller.
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.populate_user_info()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only act when there is a real authenticated user_id
  IF NEW.user_id IS NOT NULL THEN
    -- Fill email if missing
    IF NEW.email IS NULL THEN
      SELECT au.email
      INTO NEW.email
      FROM auth.users au
      WHERE au.id = NEW.user_id;
    END IF;

    -- Fill display_name if missing
    IF NEW.display_name IS NULL THEN
      SELECT up.name
      INTO NEW.display_name
      FROM public.user_profiles up
      WHERE up.id = NEW.user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


-- ────────────────────────────────────────────────────────────
-- Separate function for user_profiles where id = the user
-- (no user_id column — uses id directly)
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.populate_user_profiles_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NULL THEN
    SELECT au.email
    INTO NEW.email
    FROM auth.users au
    WHERE au.id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;


-- ────────────────────────────────────────────────────────────
-- Helper macro: drop + recreate trigger on a table
-- (re-running this file is safe)
-- ────────────────────────────────────────────────────────────


-- ────────────────────────────────────────────────────────────
-- 1. emotion_logs
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'emotion_logs') THEN
    DROP TRIGGER IF EXISTS trg_emotion_logs_user_info ON public.emotion_logs;
    CREATE TRIGGER trg_emotion_logs_user_info
      BEFORE INSERT ON public.emotion_logs
      FOR EACH ROW EXECUTE FUNCTION public.populate_user_info();
    RAISE NOTICE 'trigger created: emotion_logs';
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────
-- 2. trades
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'trades') THEN
    DROP TRIGGER IF EXISTS trg_trades_user_info ON public.trades;
    CREATE TRIGGER trg_trades_user_info
      BEFORE INSERT ON public.trades
      FOR EACH ROW EXECUTE FUNCTION public.populate_user_info();
    RAISE NOTICE 'trigger created: trades';
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────
-- 3. comprehensive_bets
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'comprehensive_bets') THEN
    DROP TRIGGER IF EXISTS trg_comprehensive_bets_user_info ON public.comprehensive_bets;
    CREATE TRIGGER trg_comprehensive_bets_user_info
      BEFORE INSERT ON public.comprehensive_bets
      FOR EACH ROW EXECUTE FUNCTION public.populate_user_info();
    RAISE NOTICE 'trigger created: comprehensive_bets';
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────
-- 4. parlays
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'parlays') THEN
    DROP TRIGGER IF EXISTS trg_parlays_user_info ON public.parlays;
    CREATE TRIGGER trg_parlays_user_info
      BEFORE INSERT ON public.parlays
      FOR EACH ROW EXECUTE FUNCTION public.populate_user_info();
    RAISE NOTICE 'trigger created: parlays';
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────
-- 5. survey_responses
-- email may already be supplied by the caller — the trigger
-- only fills it (and display_name) when NULL.
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'survey_responses') THEN
    DROP TRIGGER IF EXISTS trg_survey_responses_user_info ON public.survey_responses;
    CREATE TRIGGER trg_survey_responses_user_info
      BEFORE INSERT ON public.survey_responses
      FOR EACH ROW EXECUTE FUNCTION public.populate_user_info();
    RAISE NOTICE 'trigger created: survey_responses';
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────
-- 6. achievements
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'achievements') THEN
    DROP TRIGGER IF EXISTS trg_achievements_user_info ON public.achievements;
    CREATE TRIGGER trg_achievements_user_info
      BEFORE INSERT ON public.achievements
      FOR EACH ROW EXECUTE FUNCTION public.populate_user_info();
    RAISE NOTICE 'trigger created: achievements';
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────
-- 7. challenges
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'challenges') THEN
    DROP TRIGGER IF EXISTS trg_challenges_user_info ON public.challenges;
    CREATE TRIGGER trg_challenges_user_info
      BEFORE INSERT ON public.challenges
      FOR EACH ROW EXECUTE FUNCTION public.populate_user_info();
    RAISE NOTICE 'trigger created: challenges';
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────
-- 8. bias_quiz_history
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'bias_quiz_history') THEN
    DROP TRIGGER IF EXISTS trg_bias_quiz_history_user_info ON public.bias_quiz_history;
    CREATE TRIGGER trg_bias_quiz_history_user_info
      BEFORE INSERT ON public.bias_quiz_history
      FOR EACH ROW EXECUTE FUNCTION public.populate_user_info();
    RAISE NOTICE 'trigger created: bias_quiz_history';
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────
-- 9. ai_analysis_logs
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'ai_analysis_logs') THEN
    DROP TRIGGER IF EXISTS trg_ai_analysis_logs_user_info ON public.ai_analysis_logs;
    CREATE TRIGGER trg_ai_analysis_logs_user_info
      BEFORE INSERT ON public.ai_analysis_logs
      FOR EACH ROW EXECUTE FUNCTION public.populate_user_info();
    RAISE NOTICE 'trigger created: ai_analysis_logs';
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────
-- 10. ai_service_usage
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'ai_service_usage') THEN
    DROP TRIGGER IF EXISTS trg_ai_service_usage_user_info ON public.ai_service_usage;
    CREATE TRIGGER trg_ai_service_usage_user_info
      BEFORE INSERT ON public.ai_service_usage
      FOR EACH ROW EXECUTE FUNCTION public.populate_user_info();
    RAISE NOTICE 'trigger created: ai_service_usage';
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────
-- 11. bet_analyses
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'bet_analyses') THEN
    DROP TRIGGER IF EXISTS trg_bet_analyses_user_info ON public.bet_analyses;
    CREATE TRIGGER trg_bet_analyses_user_info
      BEFORE INSERT ON public.bet_analyses
      FOR EACH ROW EXECUTE FUNCTION public.populate_user_info();
    RAISE NOTICE 'trigger created: bet_analyses';
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────
-- 12. ai_usage_purchases
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'ai_usage_purchases') THEN
    DROP TRIGGER IF EXISTS trg_ai_usage_purchases_user_info ON public.ai_usage_purchases;
    CREATE TRIGGER trg_ai_usage_purchases_user_info
      BEFORE INSERT ON public.ai_usage_purchases
      FOR EACH ROW EXECUTE FUNCTION public.populate_user_info();
    RAISE NOTICE 'trigger created: ai_usage_purchases';
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────
-- 13. bias_profiles
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'bias_profiles') THEN
    DROP TRIGGER IF EXISTS trg_bias_profiles_user_info ON public.bias_profiles;
    CREATE TRIGGER trg_bias_profiles_user_info
      BEFORE INSERT ON public.bias_profiles
      FOR EACH ROW EXECUTE FUNCTION public.populate_user_info();
    RAISE NOTICE 'trigger created: bias_profiles';
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────
-- 14. user_profiles (id = the user, no user_id column)
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
    DROP TRIGGER IF EXISTS trg_user_profiles_email ON public.user_profiles;
    CREATE TRIGGER trg_user_profiles_email
      BEFORE INSERT ON public.user_profiles
      FOR EACH ROW EXECUTE FUNCTION public.populate_user_profiles_email();
    RAISE NOTICE 'trigger created: user_profiles';
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────
-- 15. game_lines
-- ────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'game_lines') THEN
    DROP TRIGGER IF EXISTS trg_game_lines_user_info ON public.game_lines;
    CREATE TRIGGER trg_game_lines_user_info
      BEFORE INSERT ON public.game_lines
      FOR EACH ROW EXECUTE FUNCTION public.populate_user_info();
    RAISE NOTICE 'trigger created: game_lines';
  END IF;
END $$;

-- Migration: Sync Auth Email and Username to User Profiles
-- Description: Automatically populates user_profiles with email and username from auth.users
-- Created: 2026-02-15

-- 1. Create a function to handle the sync
CREATE OR REPLACE FUNCTION public.handle_user_sync()
RETURNS TRIGGER AS $$
BEGIN
  -- We use UPSERT logic: If the profile doesn't exist, create it.
  -- If it does exist, just update the email and username.
  INSERT INTO public.user_profiles (id, email, username, name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'username', 'Trader')
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    username = COALESCE(user_profiles.username, EXCLUDED.username),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger on auth.users
-- This runs on both INSERT (new users) and UPDATE (if they change their email)
DROP TRIGGER IF EXISTS on_auth_user_sync ON auth.users;
CREATE TRIGGER on_auth_user_sync
  AFTER INSERT OR UPDATE OF email, raw_user_meta_data ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_sync();

-- 3. Run a one-time sync for all existing users to fix the backlog
INSERT INTO public.user_profiles (id, email, username, name)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'username', SPLIT_PART(email, '@', 1)),
  COALESCE(raw_user_meta_data->>'username', 'Trader')
FROM auth.users
ON CONFLICT (id) DO UPDATE
SET 
  email = EXCLUDED.email,
  username = COALESCE(user_profiles.username, EXCLUDED.username);

-- Output message for verification
DO $$
BEGIN
  RAISE NOTICE 'Auth sync trigger created and existing profiles updated.';
END $$;

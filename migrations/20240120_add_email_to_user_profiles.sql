-- Add email field to user_profiles table
-- This stores the user's email directly in the profile for easier access
-- The email is synced from auth.users during profile creation

-- Add the email column
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS email TEXT;

-- Create an index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Add comment
COMMENT ON COLUMN user_profiles.email IS
    'User email address, synced from auth.users.email during profile creation';

-- Optional: Update existing profiles with email from auth.users
-- This query can be run manually if you have existing profiles without emails
-- UPDATE user_profiles up
-- SET email = au.email
-- FROM auth.users au
-- WHERE up.id = au.id AND up.email IS NULL;

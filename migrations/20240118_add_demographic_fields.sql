-- Add demographic fields to user_profiles table
-- These fields are all optional for collecting user demographic information

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS username VARCHAR(255),
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS gender VARCHAR(100),
ADD COLUMN IF NOT EXISTS location VARCHAR(255),
ADD COLUMN IF NOT EXISTS betting_experience VARCHAR(50),
ADD COLUMN IF NOT EXISTS education_level VARCHAR(50),
ADD COLUMN IF NOT EXISTS income_range VARCHAR(50),
ADD COLUMN IF NOT EXISTS employment_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS marital_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS ethnicity VARCHAR(100),
ADD COLUMN IF NOT EXISTS betting_frequency VARCHAR(50),
ADD COLUMN IF NOT EXISTS typical_bet_amount VARCHAR(50);

-- Add index on username for faster lookups (if users search by username)
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);

-- Add check constraint for age (must be 18+)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'valid_age' 
        AND conrelid = 'user_profiles'::regclass
    ) THEN
        ALTER TABLE user_profiles 
        ADD CONSTRAINT valid_age CHECK (age IS NULL OR age >= 18);
    END IF;
END $$;

-- Add comment to table for documentation
COMMENT ON COLUMN user_profiles.username IS 'Optional username for the user';
COMMENT ON COLUMN user_profiles.age IS 'User age (must be 18+)';
COMMENT ON COLUMN user_profiles.gender IS 'User gender identity';
COMMENT ON COLUMN user_profiles.location IS 'User location (city, state/country)';
COMMENT ON COLUMN user_profiles.betting_experience IS 'Betting experience level';
COMMENT ON COLUMN user_profiles.education_level IS 'Highest education level completed';
COMMENT ON COLUMN user_profiles.income_range IS 'Annual income range';
COMMENT ON COLUMN user_profiles.employment_status IS 'Current employment status';
COMMENT ON COLUMN user_profiles.marital_status IS 'Marital/relationship status';
COMMENT ON COLUMN user_profiles.ethnicity IS 'Ethnicity/race';
COMMENT ON COLUMN user_profiles.betting_frequency IS 'How often user places bets';
COMMENT ON COLUMN user_profiles.typical_bet_amount IS 'Typical bet amount range';

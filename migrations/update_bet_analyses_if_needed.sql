-- Migration: Update bet_analyses table to match new schema
-- Run this ONLY if the table structure doesn't match our requirements

-- First, check if columns exist before adding them
DO $$ 
BEGIN
    -- Add bet_type column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bet_analyses' AND column_name = 'bet_type'
    ) THEN
        ALTER TABLE bet_analyses ADD COLUMN bet_type VARCHAR(20);
    END IF;

    -- Add sport column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bet_analyses' AND column_name = 'sport'
    ) THEN
        ALTER TABLE bet_analyses ADD COLUMN sport VARCHAR(50);
    END IF;

    -- Add description column if it doesn't exist (might be named differently)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bet_analyses' AND column_name = 'description'
    ) THEN
        -- Check if bet_description exists instead
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'bet_analyses' AND column_name = 'bet_description'
        ) THEN
            ALTER TABLE bet_analyses RENAME COLUMN bet_description TO description;
        ELSE
            ALTER TABLE bet_analyses ADD COLUMN description TEXT;
        END IF;
    END IF;

    -- Add emotional_state column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bet_analyses' AND column_name = 'emotional_state'
    ) THEN
        ALTER TABLE bet_analyses ADD COLUMN emotional_state VARCHAR(50);
    END IF;

    -- Add emotional_intensity column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bet_analyses' AND column_name = 'emotional_intensity'
    ) THEN
        ALTER TABLE bet_analyses ADD COLUMN emotional_intensity INTEGER;
    END IF;

    -- Add probability_estimate column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bet_analyses' AND column_name = 'probability_estimate'
    ) THEN
        -- Check if probability exists instead
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'bet_analyses' AND column_name = 'probability'
        ) THEN
            ALTER TABLE bet_analyses RENAME COLUMN probability TO probability_estimate;
        ELSE
            ALTER TABLE bet_analyses ADD COLUMN probability_estimate DECIMAL;
        END IF;
    END IF;

    -- Add expected_value column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bet_analyses' AND column_name = 'expected_value'
    ) THEN
        ALTER TABLE bet_analyses ADD COLUMN expected_value DECIMAL;
    END IF;

    -- Add ai_recommendation column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bet_analyses' AND column_name = 'ai_recommendation'
    ) THEN
        -- Check if recommendation exists instead
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'bet_analyses' AND column_name = 'recommendation'
        ) THEN
            ALTER TABLE bet_analyses RENAME COLUMN recommendation TO ai_recommendation;
        ELSE
            ALTER TABLE bet_analyses ADD COLUMN ai_recommendation TEXT;
        END IF;
    END IF;

    -- Add outcome column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bet_analyses' AND column_name = 'outcome'
    ) THEN
        ALTER TABLE bet_analyses ADD COLUMN outcome VARCHAR(20);
    END IF;

    -- Add actual_return column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bet_analyses' AND column_name = 'actual_return'
    ) THEN
        ALTER TABLE bet_analyses ADD COLUMN actual_return DECIMAL;
    END IF;

    -- Ensure timestamp column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bet_analyses' AND column_name = 'timestamp'
    ) THEN
        -- Check if created_at exists instead
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'bet_analyses' AND column_name = 'created_at'
        ) THEN
            ALTER TABLE bet_analyses RENAME COLUMN created_at TO timestamp;
        ELSE
            ALTER TABLE bet_analyses ADD COLUMN timestamp TIMESTAMP DEFAULT NOW();
        END IF;
    END IF;

END $$;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bet_analyses_user_id ON bet_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_bet_analyses_timestamp ON bet_analyses(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_bet_analyses_outcome ON bet_analyses(outcome);

-- Add RLS (Row Level Security) policies if not already set
ALTER TABLE bet_analyses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own bet analyses" ON bet_analyses;
DROP POLICY IF EXISTS "Users can insert their own bet analyses" ON bet_analyses;
DROP POLICY IF EXISTS "Users can update their own bet analyses" ON bet_analyses;

-- Create policies
CREATE POLICY "Users can view their own bet analyses"
    ON bet_analyses FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bet analyses"
    ON bet_analyses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bet analyses"
    ON bet_analyses FOR UPDATE
    USING (auth.uid() = user_id);

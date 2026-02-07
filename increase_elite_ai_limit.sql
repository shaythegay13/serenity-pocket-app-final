-- Increase Elite (Apex) SmartSlip AI weekly limit from 7 to 25
-- Run this in Supabase SQL Editor

UPDATE ai_usage_limits 
SET 
  ai_picker_weekly_limit = 25,
  ai_bet_analyzer_weekly_limit = 25,
  updated_at = NOW()
WHERE tier = 'elite';

-- Verify the update
SELECT * FROM ai_usage_limits WHERE tier = 'elite';

-- This will allow Apex subscribers to use 25 SmartSlip AI analyses per week instead of 7

-- Drop the problematic admin policy that references auth.users
-- This policy causes "permission denied for table users" errors
-- because RLS policies can't directly query auth.users without special permissions

DROP POLICY IF EXISTS "allow_admin_select_all" ON survey_responses;

-- If we need admin access in the future, we can implement it differently
-- For example, using a custom function with SECURITY DEFINER
-- or by granting specific permissions to an admin role

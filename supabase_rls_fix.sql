-- Fix: Allow the handle_new_user trigger to insert profiles without RLS blocking it
-- Drop the restrictive insert policy and add a permissive one for the trigger
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- Allow service role / triggers to insert profiles freely
CREATE POLICY "Allow insert profile" ON user_profiles
  FOR INSERT WITH CHECK (true);

-- Also allow users to read any profile (needed for AuthProvider)
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Allow read profile" ON user_profiles
  FOR SELECT USING (true);

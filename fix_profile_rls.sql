-- Script to ensure the RLS policy for profiles is exactly as requested
-- Run this in the Supabase SQL Editor

-- 1. Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing SELECT policy if it has a different name but same purpose (optional but cleaner)
DROP POLICY IF EXISTS "Profiles are viewable by owner" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- 3. Create the policy as requested
CREATE POLICY "Users can view own profile" ON profiles 
FOR SELECT 
USING (auth.uid() = id);

-- 4. Ensure other necessary policies exist for self-healing (Insert/Update)
DROP POLICY IF EXISTS "Profiles are insertable by owner" ON profiles;
CREATE POLICY "Profiles are insertable by owner" ON profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Profiles are updatable by owner" ON profiles;
CREATE POLICY "Profiles are updatable by owner" ON profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Verify policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';

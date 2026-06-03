/*
  # Simplify admin_profiles RLS policies - remove recursive checks

  Issue: Admin verification subqueries cause infinite recursion
  Solution: Remove admin-view-all and complex admin policies, use simpler approach
  
  Users can only:
  - View their own profile (SELECT)
  - Update their own profile (UPDATE)
  - Cannot insert/delete their own profile after creation
*/

-- Drop all policies
DROP POLICY IF EXISTS "Users can view own profile" ON admin_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON admin_profiles;
DROP POLICY IF EXISTS "Authenticated users can insert own profile" ON admin_profiles;
DROP POLICY IF EXISTS "Admins can create profiles" ON admin_profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON admin_profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON admin_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON admin_profiles;

-- Very simple RLS: only allow users to view their own profile
CREATE POLICY "view_own_profile"
  ON admin_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to update their own profile (for last_login, etc)
CREATE POLICY "update_own_profile"
  ON admin_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Note: INSERT and DELETE are handled via service role in edge functions
-- Client-side cannot create/delete profiles directly

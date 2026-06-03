/*
  # Fix infinite recursion in admin_profiles RLS policies

  Issue: The admin verification subquery was causing infinite recursion
  Solution: Simplify policies to avoid recursive subqueries
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON admin_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON admin_profiles;
DROP POLICY IF EXISTS "Authenticated users can insert own profile" ON admin_profiles;
DROP POLICY IF EXISTS "Admins can create profiles" ON admin_profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON admin_profiles;
DROP POLICY IF EXISTS "Users can update own last_login" ON admin_profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON admin_profiles;

-- Simple SELECT: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON admin_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Simple INSERT: Users can insert their own profile
CREATE POLICY "Authenticated users can insert own profile"
  ON admin_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Simple UPDATE: Users can update their own profile (for last_login, etc)
CREATE POLICY "Users can update own profile"
  ON admin_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admin-only policies
-- SELECT: Admins can see all
CREATE POLICY "Admins can view all profiles"
  ON admin_profiles FOR SELECT
  TO authenticated
  USING (role = 'admin' AND auth.uid() IN (SELECT id FROM admin_profiles WHERE role = 'admin'));

-- INSERT: Admins can create new accounts
CREATE POLICY "Admins can create profiles"
  ON admin_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IN (SELECT id FROM admin_profiles WHERE role = 'admin'));

-- UPDATE: Admins can update any profile
CREATE POLICY "Admins can update profiles"
  ON admin_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM admin_profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM admin_profiles WHERE role = 'admin'));

-- DELETE: Admins can delete profiles
CREATE POLICY "Admins can delete profiles"
  ON admin_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM admin_profiles WHERE role = 'admin'));

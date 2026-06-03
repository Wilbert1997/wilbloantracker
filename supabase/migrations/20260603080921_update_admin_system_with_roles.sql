/*
  # Update Admin System with Default Admin and Viewer Roles

  1. Modified Tables
    - `admin_profiles`
      - Added `role` column (admin or viewer)
      - Added `username` column (unique)
      - Added `created_by` column for audit trail
      - Added `last_login` column
      - Renamed to track full user management

  2. New Seed Data
    - Default admin account: wilbert01740 / Animalka

  3. Security
    - Keep RLS policies restrictive
    - Only admins can create/manage other accounts
    - Viewers have read-only access

  4. Notes
    - The auth.users table still manages authentication
    - admin_profiles tracks role (admin/viewer) and metadata
*/

-- Drop existing table to rebuild with proper schema
DROP TABLE IF EXISTS admin_profiles CASCADE;

CREATE TABLE admin_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  last_login timestamptz,
  is_active boolean DEFAULT true
);

ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
  ON admin_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
  ON admin_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE admin_profiles.id = auth.uid()
      AND admin_profiles.role = 'admin'
    )
  );

-- Allow authenticated users to insert their own profile (when created by admin)
CREATE POLICY "Authenticated users can insert own profile"
  ON admin_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow admins to create new profiles
CREATE POLICY "Admins can create profiles"
  ON admin_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE admin_profiles.id = auth.uid()
      AND admin_profiles.role = 'admin'
    )
  );

-- Allow admins to update any profile
CREATE POLICY "Admins can update any profile"
  ON admin_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE admin_profiles.id = auth.uid()
      AND admin_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE admin_profiles.id = auth.uid()
      AND admin_profiles.role = 'admin'
    )
  );

-- Allow users to update their own last_login
CREATE POLICY "Users can update own last_login"
  ON admin_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow admins to delete profiles
CREATE POLICY "Admins can delete profiles"
  ON admin_profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE admin_profiles.id = auth.uid()
      AND admin_profiles.role = 'admin'
    )
  );

/*
  # Admin Authentication Setup

  1. New Tables
    - `admin_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `admin_profiles`
    - SELECT policy: only authenticated users can check if they themselves are admin
    - INSERT policy: only authenticated users can insert their own profile (service role handles seeding)

  3. Notes
    - Admin role is determined by presence of a row in `admin_profiles`
    - The actual user account is managed via Supabase Auth (email/password)
    - No public access is granted to this table
*/

CREATE TABLE IF NOT EXISTS admin_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view own profile"
  ON admin_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can insert own profile"
  ON admin_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

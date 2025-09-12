-- Fix RLS policies to work with the automatic user creation trigger
-- This ensures the trigger can create user records without RLS blocking it

-- Drop existing policies
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;

-- Create new policies that work with the trigger
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = auth_user_id);

-- Allow the trigger function to insert user records
-- This policy allows inserts when the auth_user_id matches the authenticated user
CREATE POLICY "users_insert_own" ON users
  FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

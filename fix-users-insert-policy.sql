-- Add missing INSERT policy for users table
-- This allows users to create their own record when they first sign in

CREATE POLICY "users_insert_own" ON users
  FOR INSERT WITH CHECK (auth.uid()::text = auth_user_id::text);

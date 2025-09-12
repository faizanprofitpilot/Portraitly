-- Fix RLS policies to allow user creation properly

-- First, let's drop existing policies and recreate them
DROP POLICY IF EXISTS "users_by_owner" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;

-- Create new policies that work better with RPC functions
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "users_insert_own" ON users
  FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = auth_user_id);

-- Also create a policy for service role (if needed)
CREATE POLICY "users_service_role_all" ON users
  FOR ALL USING (auth.role() = 'service_role');

-- Safe version that handles existing policy
DROP POLICY IF EXISTS "users_insert_own" ON users;
CREATE POLICY "users_insert_own" ON users
  FOR INSERT WITH CHECK (auth.uid()::text = auth_user_id::text);

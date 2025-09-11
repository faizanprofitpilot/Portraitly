-- Test if the database is set up correctly
-- Run this in Supabase SQL Editor to verify

-- Check if users table exists and has correct structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Check if photos table exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'photos' 
ORDER BY ordinal_position;

-- Check if consume_credit function exists
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'consume_credit';

-- Check if policies exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('users', 'photos');

-- Test insert permission (this should work if everything is set up correctly)
-- You can run this to test if you can insert a test user
-- INSERT INTO users (auth_user_id, email, plan, credits_remaining) 
-- VALUES ('00000000-0000-0000-0000-000000000000', 'test@example.com', 'free', 10)
-- ON CONFLICT (auth_user_id) DO NOTHING;

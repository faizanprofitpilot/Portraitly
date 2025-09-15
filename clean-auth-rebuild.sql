-- Clean auth system rebuild
-- Run this in Supabase SQL Editor

-- Drop existing tables and policies
DROP TABLE IF EXISTS photos CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create simple users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  credits INTEGER NOT NULL DEFAULT 10,
  plan TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Simple RLS policy - users can only see their own data
CREATE POLICY "Users can view own data" ON users
  FOR ALL USING (email = auth.jwt() ->> 'email');

-- Create photos table
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email TEXT NOT NULL REFERENCES users(email),
  original_url TEXT,
  generated_url TEXT NOT NULL,
  style TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for photos
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Simple RLS policy for photos
CREATE POLICY "Users can view own photos" ON photos
  FOR ALL USING (user_email = auth.jwt() ->> 'email');

-- Create mobile uploads table for cross-device communication (if not exists)
CREATE TABLE IF NOT EXISTS mobile_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for mobile uploads
ALTER TABLE mobile_uploads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow mobile upload inserts" ON mobile_uploads;
DROP POLICY IF EXISTS "Allow mobile upload reads" ON mobile_uploads;

-- Allow anyone to insert mobile uploads (they're session-based, not user-based)
CREATE POLICY "Allow mobile upload inserts" ON mobile_uploads
  FOR INSERT WITH CHECK (true);

-- Allow anyone to read mobile uploads by session_id
CREATE POLICY "Allow mobile upload reads" ON mobile_uploads
  FOR SELECT USING (true);

-- Function to consume credits
CREATE OR REPLACE FUNCTION consume_credit(user_email_param TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  -- Get current credits
  SELECT credits INTO current_credits
  FROM users
  WHERE email = user_email_param;
  
  -- Check if user has credits
  IF current_credits IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  IF current_credits <= 0 THEN
    RAISE EXCEPTION 'No credits remaining';
  END IF;
  
  -- Decrement credits
  UPDATE users
  SET credits = credits - 1
  WHERE email = user_email_param;
  
  -- Return new credit count
  SELECT credits INTO current_credits
  FROM users
  WHERE email = user_email_param;
  
  RETURN current_credits;
END;
$$;

-- SECURE DATABASE SCHEMA FOR PORTRAITLY
-- Run this in Supabase SQL Editor to fix security issues

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table with proper schema
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE NOT NULL, -- maps to supabase auth.users.id
  email TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free', -- 'free' | 'pro'
  credits INTEGER NOT NULL DEFAULT 10, -- free plan starter
  subscription_status TEXT DEFAULT 'free',
  subscription_plan TEXT,
  subscription_id TEXT,
  stripe_customer_id TEXT,
  last_payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create photos table
CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  original_url TEXT NOT NULL,
  generated_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create mobile_uploads table with proper security
CREATE TABLE IF NOT EXISTS mobile_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours' -- Auto-expire
);

-- Create function to consume credits atomically
CREATE OR REPLACE FUNCTION consume_credit(p_auth_user_id UUID)
RETURNS TABLE(remaining INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user users%ROWTYPE;
BEGIN
  SELECT * INTO v_user
  FROM users
  WHERE auth_user_id = p_auth_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Pro users have unlimited credits
  IF v_user.plan = 'pro' THEN
    remaining := v_user.credits; -- ignore
    RETURN NEXT;
    RETURN;
  END IF;

  -- Free users need credits
  IF v_user.credits <= 0 THEN
    RAISE EXCEPTION 'No credits remaining';
  END IF;

  UPDATE users SET credits = credits - 1 WHERE auth_user_id = p_auth_user_id;
  SELECT credits INTO remaining FROM users WHERE auth_user_id = p_auth_user_id;
  RETURN NEXT;
END;
$$;

-- Create function to handle updated_at timestamp
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS t_users_updated ON users;
CREATE TRIGGER t_users_updated 
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE mobile_uploads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "users_by_owner" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "photos_by_owner" ON photos;
DROP POLICY IF EXISTS "photos_insert_own" ON photos;
DROP POLICY IF EXISTS "photos_update_own" ON photos;
DROP POLICY IF EXISTS "photos_delete_own" ON photos;
DROP POLICY IF EXISTS "allow insert for anyone" ON mobile_uploads;
DROP POLICY IF EXISTS "allow select for anyone" ON mobile_uploads;

-- Create SECURE policies for users table
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid()::text = auth_user_id::text);

CREATE POLICY "users_insert_own" ON users
  FOR INSERT WITH CHECK (auth.uid()::text = auth_user_id::text);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid()::text = auth_user_id::text);

-- Create SECURE policies for photos table
CREATE POLICY "photos_select_own" ON photos
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = photos.user_id AND u.auth_user_id::text = auth.uid()::text)
  );

CREATE POLICY "photos_insert_own" ON photos
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.id = photos.user_id AND u.auth_user_id::text = auth.uid()::text)
  );

CREATE POLICY "photos_update_own" ON photos
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = photos.user_id AND u.auth_user_id::text = auth.uid()::text)
  );

CREATE POLICY "photos_delete_own" ON photos
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = photos.user_id AND u.auth_user_id::text = auth.uid()::text)
  );

-- Create SECURE policies for mobile_uploads table
-- Only allow access to uploads with valid session IDs
CREATE POLICY "mobile_uploads_insert_valid_session" ON mobile_uploads
  FOR INSERT WITH CHECK (
    session_id ~ '^upload_\d+_[a-z0-9]+$' AND
    length(session_id) >= 10
  );

CREATE POLICY "mobile_uploads_select_valid_session" ON mobile_uploads
  FOR SELECT USING (
    session_id ~ '^upload_\d+_[a-z0-9]+$' AND
    length(session_id) >= 10
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_photos_user_id ON photos(user_id);
CREATE INDEX IF NOT EXISTS idx_mobile_uploads_session_id ON mobile_uploads(session_id);
CREATE INDEX IF NOT EXISTS idx_mobile_uploads_expires_at ON mobile_uploads(expires_at);

-- Create cleanup function for expired mobile uploads
CREATE OR REPLACE FUNCTION cleanup_expired_mobile_uploads()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM mobile_uploads 
  WHERE expires_at < NOW();
END;
$$;

-- Create storage bucket for photos (run this in Supabase Dashboard > Storage)
-- CREATE BUCKET 'photos' WITH PUBLIC = false;

-- Create storage bucket for mobile uploads (run this in Supabase Dashboard > Storage)
-- CREATE BUCKET 'mobile-uploads' WITH PUBLIC = false;

-- Storage policies (run this after creating buckets)
-- CREATE POLICY "Users can upload photos" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can view own photos" ON storage.objects
--   FOR SELECT USING (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can delete own photos" ON storage.objects
--   FOR DELETE USING (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Allow mobile uploads" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'mobile-uploads');

-- CREATE POLICY "Allow mobile downloads" ON storage.objects
--   FOR SELECT USING (bucket_id = 'mobile-uploads');

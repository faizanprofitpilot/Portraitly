-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE NOT NULL, -- maps to supabase auth.users.id
  email TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free', -- 'free' | 'pro'
  credits_remaining INTEGER NOT NULL DEFAULT 10, -- free plan starter
  stripe_customer_id TEXT, -- optional Stripe customer ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create photos table
CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  original_url TEXT NOT NULL,
  generated_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to consume credits atomically
CREATE OR REPLACE FUNCTION consume_credit(p_auth_user_id UUID)
RETURNS TABLE(remaining INTEGER)
LANGUAGE plpgsql
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
    remaining := v_user.credits_remaining; -- ignore
    RETURN NEXT;
    RETURN;
  END IF;

  -- Free users need credits
  IF v_user.credits_remaining <= 0 THEN
    RAISE EXCEPTION 'No credits remaining';
  END IF;

  UPDATE users SET credits_remaining = credits_remaining - 1 WHERE auth_user_id = p_auth_user_id;
  SELECT credits_remaining INTO remaining FROM users WHERE auth_user_id = p_auth_user_id;
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

-- Create policies for users table
CREATE POLICY "users_by_owner" ON users
  FOR SELECT USING (auth.uid()::text = auth_user_id::text);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid()::text = auth_user_id::text);

-- Create policies for photos table
CREATE POLICY "photos_by_owner" ON photos
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

-- Create storage bucket for photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Users can upload photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);
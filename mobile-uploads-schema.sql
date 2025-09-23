-- Mobile uploads production-ready schema
-- Run this in Supabase SQL Editor

-- Create mobile uploads table
CREATE TABLE IF NOT EXISTS mobile_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE mobile_uploads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "allow insert for authenticated" ON mobile_uploads;
DROP POLICY IF EXISTS "allow select for authenticated" ON mobile_uploads;

-- Allow anyone to insert mobile uploads (they're session-based, not user-based)
CREATE POLICY "allow insert for anyone" ON mobile_uploads
  FOR INSERT WITH CHECK (true);

-- Allow anyone to select mobile uploads by session_id
CREATE POLICY "allow select for anyone" ON mobile_uploads
  FOR SELECT USING (true);

-- Create mobile-uploads storage bucket (run this in Supabase Dashboard > Storage)
-- CREATE BUCKET 'mobile-uploads' WITH PUBLIC = false;

-- Storage policies (run this after creating bucket)
-- CREATE POLICY "Allow anyone to upload" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'mobile-uploads');

-- CREATE POLICY "Allow anyone to download" ON storage.objects
--   FOR SELECT USING (bucket_id = 'mobile-uploads');

-- Automatic cleanup function (delete uploads older than 24h)
CREATE OR REPLACE FUNCTION cleanup_old_mobile_uploads()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM mobile_uploads 
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- Optional: Create a scheduled job to run cleanup every hour
-- This would need to be set up in Supabase Dashboard > Database > Extensions > pg_cron

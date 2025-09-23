-- Mobile uploads production-ready schema
-- Run this in Supabase SQL Editor

-- Create mobile uploads table
CREATE TABLE IF NOT EXISTS mobile_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  file_url TEXT NOT NULL,
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

-- Allow authenticated users to insert mobile uploads
CREATE POLICY "allow insert for authenticated" ON mobile_uploads
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to select mobile uploads
CREATE POLICY "allow select for authenticated" ON mobile_uploads
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create mobile-uploads storage bucket (run this in Supabase Dashboard > Storage)
-- CREATE BUCKET 'mobile-uploads' WITH PUBLIC = true;

-- Storage policies (run this after creating bucket)
-- CREATE POLICY "Allow authenticated uploads" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'mobile-uploads' AND auth.role() = 'authenticated');

-- CREATE POLICY "Allow public access" ON storage.objects
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

-- Fix mobile uploads table policies
-- Run this in Supabase SQL Editor

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow mobile upload inserts" ON mobile_uploads;
DROP POLICY IF EXISTS "Allow mobile upload reads" ON mobile_uploads;

-- Allow anyone to insert mobile uploads (they're session-based, not user-based)
CREATE POLICY "Allow mobile upload inserts" ON mobile_uploads
  FOR INSERT WITH CHECK (true);

-- Allow anyone to read mobile uploads by session_id
CREATE POLICY "Allow mobile upload reads" ON mobile_uploads
  FOR SELECT USING (true);

-- Fix RLS policies to allow service role to insert users
-- Run this in Supabase SQL Editor

-- Add policy to allow service role to insert users
CREATE POLICY "Allow service role to insert users" ON users
  FOR INSERT WITH CHECK (true);

-- Add policy to allow service role to select users  
CREATE POLICY "Allow service role to select users" ON users
  FOR SELECT USING (true);

-- Add policy to allow service role to update users
CREATE POLICY "Allow service role to update users" ON users
  FOR UPDATE USING (true);

-- Add policy to allow service role to delete users
CREATE POLICY "Allow service role to delete users" ON users
  FOR DELETE USING (true);

-- Also add policies for photos table
CREATE POLICY "Allow service role to insert photos" ON photos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service role to select photos" ON photos
  FOR SELECT USING (true);

CREATE POLICY "Allow service role to update photos" ON photos
  FOR UPDATE USING (true);

CREATE POLICY "Allow service role to delete photos" ON photos
  FOR DELETE USING (true);

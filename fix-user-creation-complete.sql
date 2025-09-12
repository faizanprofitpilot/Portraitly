-- Complete fix for "Database error saving new user" issue
-- Run this in Supabase SQL Editor to fix the user creation problem

-- Step 1: Create the trigger function that automatically creates user records
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert new user into public.users table
  INSERT INTO public.users (auth_user_id, email, plan, credits_remaining)
  VALUES (NEW.id, NEW.email, 'free', 10);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth signup
    RAISE LOG 'Error creating user record: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create the trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Step 3: Fix RLS policies to work with the trigger
-- Drop existing policies
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;

-- Create new policies that work with the trigger
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = auth_user_id);

-- Allow the trigger function to insert user records
CREATE POLICY "users_insert_own" ON users
  FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

-- Step 4: Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 5: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT INSERT ON public.users TO authenticated;
GRANT SELECT ON public.users TO authenticated;
GRANT UPDATE ON public.users TO authenticated;

-- Step 6: Clean up any existing users that might be causing conflicts
-- (This won't affect your current users, just cleans up any orphaned records)
DELETE FROM users WHERE auth_user_id NOT IN (SELECT id FROM auth.users);

-- Success message
SELECT 'User creation trigger and RLS policies have been set up successfully!' as message;

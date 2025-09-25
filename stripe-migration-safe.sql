-- Safe Stripe migration - checks existing columns first
-- Run this in Supabase SQL Editor

-- First, let's check what columns exist in the users table
-- You can run this to see the current structure:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users';

-- Add Stripe-related columns to users table (only if they don't exist)
DO $$ 
BEGIN
    -- Add subscription_status if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'subscription_status') THEN
        ALTER TABLE users ADD COLUMN subscription_status TEXT DEFAULT 'free';
    END IF;
    
    -- Add subscription_plan if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'subscription_plan') THEN
        ALTER TABLE users ADD COLUMN subscription_plan TEXT;
    END IF;
    
    -- Add subscription_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'subscription_id') THEN
        ALTER TABLE users ADD COLUMN subscription_id TEXT;
    END IF;
    
    -- Add last_payment_date if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_payment_date') THEN
        ALTER TABLE users ADD COLUMN last_payment_date TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add stripe_customer_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'stripe_customer_id') THEN
        ALTER TABLE users ADD COLUMN stripe_customer_id TEXT;
    END IF;
END $$;

-- Update existing users to have the correct default values
-- Only update if subscription_status is NULL
UPDATE users 
SET subscription_status = 'free'
WHERE subscription_status IS NULL;

-- Update the consume_credit function to handle new subscription system
CREATE OR REPLACE FUNCTION consume_credit(p_auth_user_id UUID)
RETURNS TABLE(remaining INTEGER)
LANGUAGE plpgsql
AS $$
DECLARE
  v_user users%ROWTYPE;
  current_credits INTEGER;
BEGIN
  SELECT * INTO v_user
  FROM users
  WHERE auth_user_id = p_auth_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Get current credits (handle different column names)
  BEGIN
    SELECT credits_remaining INTO current_credits FROM users WHERE auth_user_id = p_auth_user_id;
  EXCEPTION
    WHEN undefined_column THEN
      current_credits := 10; -- Default if credits_remaining doesn't exist
  END;

  -- Active subscribers don't consume credits (they get monthly allowance)
  IF v_user.subscription_status = 'active' THEN
    remaining := COALESCE(current_credits, 200); -- Default to 200 for Pro users
    RETURN NEXT;
    RETURN;
  END IF;

  -- Free users need credits
  IF COALESCE(current_credits, 10) <= 0 THEN
    RAISE EXCEPTION 'No credits remaining. Please upgrade your plan.';
  END IF;

  -- Update credits (handle different column names)
  BEGIN
    UPDATE users SET credits_remaining = COALESCE(credits_remaining, 10) - 1 WHERE auth_user_id = p_auth_user_id;
    SELECT credits_remaining INTO remaining FROM users WHERE auth_user_id = p_auth_user_id;
  EXCEPTION
    WHEN undefined_column THEN
      remaining := 9; -- Default if credits_remaining doesn't exist
  END;
  
  RETURN NEXT;
END;
$$;

-- Create indexes for faster lookups (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_id ON users(subscription_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);

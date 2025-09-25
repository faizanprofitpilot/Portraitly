-- Add Stripe-related columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free', -- 'free' | 'active' | 'cancelled' | 'past_due'
ADD COLUMN IF NOT EXISTS subscription_plan TEXT, -- 'basic' | 'pro' | 'unlimited'
ADD COLUMN IF NOT EXISTS subscription_id TEXT, -- Stripe subscription ID
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP WITH TIME ZONE;

-- Update existing users to have the correct default values
UPDATE users 
SET subscription_status = 'free', 
    credits_remaining = CASE 
      WHEN plan = 'pro' THEN -1 
      ELSE 10 
    END
WHERE subscription_status IS NULL;

-- Update the consume_credit function to handle new subscription system
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

  -- Active subscribers with unlimited plan don't consume credits
  IF v_user.subscription_status = 'active' AND v_user.subscription_plan = 'unlimited' THEN
    remaining := -1; -- unlimited
    RETURN NEXT;
    RETURN;
  END IF;

  -- Active subscribers with limited plans check credits
  IF v_user.subscription_status = 'active' THEN
    -- For active subscribers, we don't consume credits (they get monthly allowance)
    remaining := v_user.credits_remaining;
    RETURN NEXT;
    RETURN;
  END IF;

  -- Free users need credits
  IF v_user.credits_remaining <= 0 THEN
    RAISE EXCEPTION 'No credits remaining. Please upgrade your plan.';
  END IF;

  UPDATE users SET credits_remaining = credits_remaining - 1 WHERE auth_user_id = p_auth_user_id;
  SELECT credits_remaining INTO remaining FROM users WHERE auth_user_id = p_auth_user_id;
  RETURN NEXT;
END;
$$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_id ON users(subscription_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);

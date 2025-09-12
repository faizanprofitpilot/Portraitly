-- Create RPC function for secure user creation
-- This replaces client-side user creation with server-side atomic operation

CREATE OR REPLACE FUNCTION ensure_user_exists()
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  plan TEXT,
  credits_remaining INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_auth_user_id UUID;
  v_email TEXT;
  v_user_record users%ROWTYPE;
BEGIN
  -- Get current authenticated user
  v_auth_user_id := auth.uid();
  v_email := auth.email();
  
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Check if user already exists
  SELECT * INTO v_user_record
  FROM users
  WHERE auth_user_id = v_auth_user_id;
  
  IF FOUND THEN
    -- User exists, return their data
    user_id := v_user_record.id;
    email := v_user_record.email;
    plan := v_user_record.plan;
    credits_remaining := v_user_record.credits_remaining;
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- User doesn't exist, create them
  INSERT INTO users (auth_user_id, email, plan, credits_remaining)
  VALUES (v_auth_user_id, v_email, 'free', 10)
  RETURNING id, email, plan, credits_remaining
  INTO user_id, email, plan, credits_remaining;
  
  RETURN NEXT;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION ensure_user_exists() TO authenticated;

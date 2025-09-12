-- Working RPC function that handles RLS properly
CREATE OR REPLACE FUNCTION ensure_user_exists()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_user_id UUID;
  v_email TEXT;
  v_user_record RECORD;
BEGIN
  -- Get current authenticated user
  v_auth_user_id := auth.uid();
  v_email := auth.email();
  
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Check if user already exists
  BEGIN
    SELECT id, email, plan, credits_remaining INTO v_user_record
    FROM users
    WHERE auth_user_id = v_auth_user_id;
    
    IF FOUND THEN
      -- User exists, return their data
      RETURN json_build_object(
        'user_id', v_user_record.id,
        'email', v_user_record.email,
        'plan', v_user_record.plan,
        'credits_remaining', v_user_record.credits_remaining
      );
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- User doesn't exist, continue to creation
      NULL;
  END;
  
  -- User doesn't exist, create them
  BEGIN
    INSERT INTO users (auth_user_id, email, plan, credits_remaining)
    VALUES (v_auth_user_id, v_email, 'free', 10)
    RETURNING id, email, plan, credits_remaining
    INTO v_user_record;
    
    RETURN json_build_object(
      'user_id', v_user_record.id,
      'email', v_user_record.email,
      'plan', v_user_record.plan,
      'credits_remaining', v_user_record.credits_remaining
    );
  EXCEPTION
    WHEN OTHERS THEN
      RAISE EXCEPTION 'Failed to create user: %', SQLERRM;
  END;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION ensure_user_exists() TO authenticated;

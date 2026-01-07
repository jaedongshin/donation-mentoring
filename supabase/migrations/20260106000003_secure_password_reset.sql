-- Function to securely reset mentor password using a token
CREATE OR REPLACE FUNCTION reset_mentor_password(p_token text, p_new_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_mentor_id uuid;
BEGIN
    -- Find mentor with valid token
    SELECT id INTO v_mentor_id
    FROM mentors
    WHERE reset_token = p_token
      AND reset_token_expires_at > now();

    -- If no valid token found, return false
    IF v_mentor_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Update password (hashed) and clear token
    UPDATE mentors
    SET password = crypt(p_new_password, gen_salt('bf')),
        reset_token = NULL,
        reset_token_expires_at = NULL
    WHERE id = v_mentor_id;

    RETURN TRUE;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION reset_mentor_password(text, text) TO anon, authenticated, service_role;

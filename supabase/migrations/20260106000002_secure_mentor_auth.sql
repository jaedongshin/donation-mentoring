-- Function to securely login a mentor
CREATE OR REPLACE FUNCTION login_mentor(p_email text, p_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_mentor mentors;
BEGIN
    -- Find mentor by email
    SELECT * INTO v_mentor
    FROM mentors
    WHERE email = p_email;

    -- If no mentor found, return null
    IF v_mentor.id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Check if password matches the hash
    -- We use crypt(p_password, v_mentor.password) which hashes the input password
    -- using the salt extracted from the stored hash (v_mentor.password).
    -- If they match, the password is correct.
    IF v_mentor.password = crypt(p_password, v_mentor.password) THEN
        -- Return relevant mentor profile data (excluding password)
        RETURN json_build_object(
            'id', v_mentor.id,
            'email', v_mentor.email,
            'name_en', v_mentor.name_en,
            'name_ko', v_mentor.name_ko,
            'picture_url', v_mentor.picture_url,
            'role', v_mentor.role
        );
    ELSE
        RETURN NULL;
    END IF;
END;
$$;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION login_mentor(text, text) TO anon, authenticated, service_role;
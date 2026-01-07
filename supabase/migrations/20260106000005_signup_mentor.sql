-- Function to securely signup a mentor
CREATE OR REPLACE FUNCTION signup_mentor(p_email text, p_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_mentor mentors;
    v_id uuid;
BEGIN
    -- Check if email already exists
    IF EXISTS (SELECT 1 FROM mentors WHERE email = p_email) THEN
        RAISE EXCEPTION 'Email already registered';
    END IF;

    -- Insert new mentor
    -- We use crypt(p_password, gen_salt('bf')) to hash the password
    INSERT INTO mentors (
        email,
        password,
        role,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        p_email,
        crypt(p_password, gen_salt('bf')),
        'mentor',
        false, -- Default to inactive until profile is filled? Or true? Let's say false/draft.
        now(),
        now()
    ) RETURNING id INTO v_id;

    -- Fetch the created mentor to return
    SELECT * INTO v_mentor FROM mentors WHERE id = v_id;

    -- Return relevant mentor profile data
    RETURN json_build_object(
        'id', v_mentor.id,
        'email', v_mentor.email,
        'role', v_mentor.role,
        'is_active', v_mentor.is_active
    );
END;
$$;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION signup_mentor(text, text) TO anon, authenticated, service_role;

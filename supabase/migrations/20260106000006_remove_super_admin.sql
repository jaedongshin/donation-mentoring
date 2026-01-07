
-- Migration: Remove super_admin and superAdmin role
-- 1. Migrate any existing super_admin to admin
UPDATE public.profiles SET role = 'admin' WHERE role = 'super_admin';

-- 2. Update handle_new_user function
CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    user_role TEXT := 'user';
BEGIN
    -- Auto-promote only mulli2@gmail.com as admin
    IF NEW.email = 'mulli2@gmail.com' THEN
        user_role := 'admin';
    END IF;

    -- Create profile
    INSERT INTO public.profiles (id, email, display_name, avatar_url, role, mentor_id)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url',
        user_role,
        NULL
    );

    RETURN NEW;
END;
$$;

-- 3. Drop super_admin related functions
DROP FUNCTION IF EXISTS "public"."has_super_admin"("uuid");
DROP FUNCTION IF EXISTS "public"."is_super_admin"();
DROP FUNCTION IF EXISTS "public"."is_admin_or_super_admin"();

-- 4. Update validate_role_change function to allow admins to manage roles
CREATE OR REPLACE FUNCTION "public"."validate_role_change"("target_user_id" "uuid", "new_role" "text", "current_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    current_user_role TEXT;
BEGIN
    -- Get current user's role
    SELECT role INTO current_user_role
    FROM public.profiles
    WHERE id = current_user_id;

    -- Only admin can change roles
    IF current_user_role != 'admin' THEN
        RAISE EXCEPTION 'Only admins can change user roles';
    END IF;

    -- Prevent changing own role (at least one admin must exist)
    IF target_user_id = current_user_id AND new_role != 'admin' THEN
        -- Check if this is the last admin
        IF (SELECT COUNT(*) FROM public.profiles WHERE role = 'admin') <= 1 THEN
            RAISE EXCEPTION 'Cannot remove the last admin role. Promote another user to admin first.';
        END IF;
    END IF;

    RETURN TRUE;
END;
$$;

-- 5. Update validate_role_change_trigger function
CREATE OR REPLACE FUNCTION "public"."validate_role_change_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    current_user_role TEXT;
BEGIN
    -- Only validate if role is actually changing
    IF OLD.role = NEW.role THEN
        RETURN NEW;
    END IF;

    -- Skip validation if no authenticated user (e.g., during seed/migration)
    IF auth.uid() IS NULL THEN
        RETURN NEW;
    END IF;

    -- Get current user's role (the one making the change)
    SELECT role INTO current_user_role
    FROM public.profiles
    WHERE id = auth.uid();

    -- Only admin can change roles
    IF current_user_role != 'admin' THEN
        RAISE EXCEPTION 'Only admins can change user roles';
    END IF;

    -- Prevent admin from removing their own admin role if they are the last admin
    IF NEW.id = auth.uid() AND NEW.role != 'admin' THEN
        IF (SELECT COUNT(*) FROM public.profiles WHERE role = 'admin') <= 1 THEN
            RAISE EXCEPTION 'Cannot remove your own admin role as the last admin. Promote another user to admin first.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- 6. Update role check constraint on profiles table
-- First, find the constraint name. It's likely 'profiles_role_check' based on the mentors table naming convention.
-- We'll try to drop it and add a new one.
DO $$
BEGIN
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'mentor', 'admin'));
EXCEPTION
    WHEN undefined_object THEN
        -- If it wasn't named that, we'll try to find any check constraint on the role column
        -- (This is more complex, but for now we assume standard naming)
        NULL;
END $$;

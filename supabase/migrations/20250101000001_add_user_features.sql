-- ============================================
-- ADD USER FEATURES MIGRATION
-- ============================================
-- This migration adds new features on top of the production baseline:
-- 1. Add 'user' role option (new default for signups)
-- 2. Add policy_accepted_at column
-- 3. Add role validation functions and triggers
-- 4. Update handle_new_user() with super_admin auto-promotion
-- 5. Add new RLS policies
--
-- SAFE: Uses IF NOT EXISTS, CREATE OR REPLACE, doesn't drop existing data
-- ============================================

-- ============================================
-- 1. ADD NEW COLUMN: policy_accepted_at
-- ============================================
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS policy_accepted_at TIMESTAMPTZ;

-- ============================================
-- 2. UPDATE ROLE CHECK CONSTRAINT
-- ============================================
-- Add 'user' role to allowed values
-- Production has: mentor, admin, super_admin
-- New: user, mentor, admin, super_admin
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('user', 'mentor', 'admin', 'super_admin'));

-- Update default role from 'mentor' to 'user' for new signups
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'user';

-- ============================================
-- 3. NEW INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_unlinked ON public.profiles(id) WHERE mentor_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_policy_not_accepted ON public.profiles(policy_accepted_at) WHERE policy_accepted_at IS NULL;

-- ============================================
-- 4. NEW HELPER FUNCTIONS
-- ============================================

-- Check if there's already a super_admin (enforce only 1 super admin)
CREATE OR REPLACE FUNCTION public.has_super_admin(exclude_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE role = 'super_admin'
        AND (exclude_id IS NULL OR id != exclude_id)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Validate role change based on privilege rules
CREATE OR REPLACE FUNCTION public.validate_role_change(
    target_user_id UUID,
    new_role TEXT,
    current_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    current_user_role TEXT;
    target_user_role TEXT;
BEGIN
    -- Get current user's role
    SELECT role INTO current_user_role
    FROM public.profiles
    WHERE id = current_user_id;

    -- Get target user's current role
    SELECT role INTO target_user_role
    FROM public.profiles
    WHERE id = target_user_id;

    -- Only super_admin can change roles
    IF current_user_role != 'super_admin' THEN
        RAISE EXCEPTION 'Only super_admin can change user roles';
    END IF;

    -- If changing to super_admin, check if one already exists
    IF new_role = 'super_admin' THEN
        IF public.has_super_admin(target_user_id) THEN
            RAISE EXCEPTION 'Only one super_admin is allowed. Transfer super_admin role from existing super_admin first.';
        END IF;
    END IF;

    -- Prevent changing own role (super_admin must transfer to another user first)
    IF target_user_id = current_user_id AND new_role != 'super_admin' THEN
        RAISE EXCEPTION 'Super_admin cannot change their own role. Transfer super_admin to another user first.';
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- 5. UPDATE handle_new_user() WITH AUTO-PROMOTION
-- ============================================
-- NOTE: We do NOT auto-link mentor profiles here.
-- Even if an email matches an existing mentor, users must explicitly
-- choose to link via the dashboard UI. This ensures:
-- 1. User consent - they actively choose to link
-- 2. Correct flow - user sees the dropdown with options  
-- 3. No confusion - user understands what's happening
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT := 'user';
    existing_super_admin BOOLEAN;
BEGIN
    -- Auto-promote only mulli2@gmail.com as super_admin
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE role = 'super_admin') INTO existing_super_admin;
    
    IF NEW.email = 'mulli2@gmail.com' THEN
        IF existing_super_admin THEN
            user_role := 'user';
        ELSE
            user_role := 'super_admin';
        END IF;
    END IF;

    -- Create profile with mentor_id = NULL
    -- User will link via dashboard UI (with email match pre-selected in dropdown)
    INSERT INTO public.profiles (id, email, display_name, avatar_url, role, mentor_id)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url',
        user_role,
        NULL  -- Never auto-link - user must explicitly choose in dashboard
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. ROLE CHANGE VALIDATION TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION public.validate_role_change_trigger()
RETURNS TRIGGER AS $$
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

    -- Admin can only change user ↔ mentor
    IF current_user_role = 'admin' THEN
        -- Admin can change user → mentor or mentor → user
        IF NOT ((OLD.role = 'user' AND NEW.role = 'mentor') OR 
                (OLD.role = 'mentor' AND NEW.role = 'user')) THEN
            RAISE EXCEPTION 'Admin can only change user ↔ mentor roles';
        END IF;
        RETURN NEW;
    END IF;

    -- Only super_admin can change other roles (user, mentor, admin)
    IF current_user_role != 'super_admin' THEN
        RAISE EXCEPTION 'Only super_admin can change user roles';
    END IF;

    -- Super_admin cannot change to super_admin via regular role change (must use transfer)
    IF NEW.role = 'super_admin' THEN
        IF public.has_super_admin(NEW.id) THEN
            RAISE EXCEPTION 'Only one super_admin is allowed. Transfer super_admin role from existing super_admin first.';
        END IF;
    END IF;

    -- Prevent super_admin from changing their own role (except via transfer)
    IF NEW.id = auth.uid() AND NEW.role != 'super_admin' THEN
        RAISE EXCEPTION 'Super_admin cannot change their own role. Transfer super_admin to another user first.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the validation trigger
DROP TRIGGER IF EXISTS validate_role_change_on_profiles ON public.profiles;
CREATE TRIGGER validate_role_change_on_profiles
    BEFORE UPDATE OF role ON public.profiles
    FOR EACH ROW
    WHEN (OLD.role IS DISTINCT FROM NEW.role)
    EXECUTE FUNCTION public.validate_role_change_trigger();

-- ============================================
-- 7. NEW RLS POLICIES
-- ============================================

-- Users can insert their own profile (fallback if trigger fails)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Update: Admins (not just super_admin) can update all profiles
-- Note: Role changes still restricted via validate_role_change_trigger
DROP POLICY IF EXISTS "Super admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (public.is_admin_or_super_admin());

-- ============================================
-- 8. GRANTS FOR NEW FUNCTIONS
-- ============================================
GRANT EXECUTE ON FUNCTION public.has_super_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_role_change(UUID, TEXT, UUID) TO authenticated;


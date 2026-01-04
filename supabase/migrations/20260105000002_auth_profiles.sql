-- Auth Profiles: User authentication and authorization
-- Links Supabase Auth users to the application

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'mentor', 'admin', 'super_admin')),
    mentor_id UUID REFERENCES public.mentors(id) ON DELETE SET NULL,  -- NULL = needs to link/register
    policy_accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_mentor_id ON public.profiles(mentor_id);
CREATE INDEX IF NOT EXISTS idx_profiles_unlinked ON public.profiles(id) WHERE mentor_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_policy_not_accepted ON public.profiles(policy_accepted_at) WHERE policy_accepted_at IS NULL;

-- ============================================
-- SECURITY DEFINER FUNCTIONS (avoid RLS recursion)
-- ============================================

-- Check if current user is admin or super_admin
CREATE OR REPLACE FUNCTION public.is_admin_or_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Check if current user is super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can insert their own profile (fallback if trigger fails)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile (limited fields handled by app)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Admins can view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (public.is_admin_or_super_admin());

-- Admins can update any profile (for approval)
-- Note: Role changes restricted to super_admin via validate_role_change function
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (public.is_admin_or_super_admin());

-- ============================================
-- AUTO-CREATE PROFILE ON USER SIGNUP
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

-- Trigger on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_profiles_updated_at();

-- ============================================
-- ROLE CHANGE VALIDATION TRIGGER
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

DROP TRIGGER IF EXISTS validate_role_change_on_profiles ON public.profiles;
CREATE TRIGGER validate_role_change_on_profiles
    BEFORE UPDATE OF role ON public.profiles
    FOR EACH ROW
    WHEN (OLD.role IS DISTINCT FROM NEW.role)
    EXECUTE FUNCTION public.validate_role_change_trigger();

-- ============================================
-- GRANTS
-- ============================================
GRANT ALL ON public.profiles TO anon;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

GRANT EXECUTE ON FUNCTION public.is_admin_or_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_super_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_role_change(UUID, TEXT, UUID) TO authenticated;

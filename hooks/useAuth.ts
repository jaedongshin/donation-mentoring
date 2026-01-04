'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/utils/supabase';
import { User } from '@supabase/supabase-js';

export type UserRole = 'mentor' | 'admin' | 'super_admin';

export interface MentorProfileData {
  name_en: string;
  name_ko: string;
  description_en?: string;
  description_ko?: string;
  position_en?: string;
  position_ko?: string;
  company_en?: string;
  company_ko?: string;
  location_en?: string;
  location_ko?: string;
  linkedin_url?: string;
  calendly_url?: string;
  email?: string;
  languages?: string[];
  session_time_minutes?: number | null;
  session_price_usd?: number | null;
  tags?: string[];
  picture_url?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: UserRole;
  isApproved: boolean;
  mentorId: string | null;  // NULL = needs to link/register mentor profile
  policyAcceptedAt: string | null;
}

interface UseAuthReturn {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  // Auth methods
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  // Policy
  policyAccepted: boolean;
  acceptPolicy: () => Promise<void>;
  // Mentor linking
  needsMentorLink: boolean;  // true if mentor_id is NULL
  linkMentorProfile: (mentorId: string | null, isNewMentor: boolean, profileData?: MentorProfileData) => Promise<void>;
  // Role checks
  isMentor: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isApproved: boolean;
}

/**
 * Authentication hook using Supabase Auth
 * Supports Google OAuth and Email/Password authentication
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [policyAccepted, setPolicyAccepted] = useState(false);

  // Convert Supabase user to AuthUser
  const mapSupabaseUser = useCallback(async (supabaseUser: User): Promise<AuthUser> => {
    // Try to get user profile from profiles table
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role, is_approved, display_name, mentor_id, policy_accepted_at')
      .eq('id', supabaseUser.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
    }

    // Update policy accepted state
    setPolicyAccepted(!!profile?.policy_accepted_at);

    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      displayName: profile?.display_name || supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
      avatarUrl: supabaseUser.user_metadata?.avatar_url,
      role: (profile?.role as UserRole) || 'mentor',
      isApproved: profile?.is_approved ?? false,
      mentorId: profile?.mentor_id || null,
      policyAcceptedAt: profile?.policy_accepted_at || null,
    };
  }, []);

  // Load user on mount
  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const authUser = await mapSupabaseUser(session.user);
        setUser(authUser);
      }
      setIsLoading(false);
    };

    initAuth();
  }, [mapSupabaseUser]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const authUser = await mapSupabaseUser(session.user);
          setUser(authUser);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setPolicyAccepted(false);
        } else if (event === 'PASSWORD_RECOVERY') {
          // User clicked password reset link - they're now authenticated
          // The reset-password page will handle the actual password update
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [mapSupabaseUser]);

  // Google OAuth login
  const loginWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      console.error('Google login error:', error);
      throw error;
    }
  }, []);

  // Email/Password login
  const loginWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Email login error:', error);
      throw error;
    }
  }, []);

  // Email/Password signup
  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }, []);

  // Request password reset
  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }, []);

  // Update password (for reset flow)
  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error('Update password error:', error);
      throw error;
    }
  }, []);

  // Accept policy
  const acceptPolicy = useCallback(async () => {
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ policy_accepted_at: new Date().toISOString() })
      .eq('id', user.id);

    if (error) {
      console.error('Accept policy error:', error);
      throw error;
    }

    // Update local state
    setPolicyAccepted(true);
    setUser(prev => prev ? { ...prev, policyAcceptedAt: new Date().toISOString() } : null);
  }, [user]);

  // Logout
  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error);
      throw error;
    }
    setUser(null);
    setPolicyAccepted(false);
  }, []);

  // Link mentor profile (existing or new)
  const linkMentorProfile = useCallback(async (
    mentorId: string | null,
    isNewMentor: boolean,
    profileData?: MentorProfileData
  ) => {
    if (!user) return;

    let linkedMentorId = mentorId;

    // If registering as new mentor, create a new mentor record first
    if (isNewMentor) {
      const mentorData = profileData
        ? {
            name_en: profileData.name_en || user.displayName,
            name_ko: profileData.name_ko || user.displayName,
            description_en: profileData.description_en || '',
            description_ko: profileData.description_ko || '',
            position_en: profileData.position_en || '',
            position_ko: profileData.position_ko || '',
            company_en: profileData.company_en || '',
            company_ko: profileData.company_ko || '',
            location_en: profileData.location_en || '',
            location_ko: profileData.location_ko || '',
            linkedin_url: profileData.linkedin_url || '',
            calendly_url: profileData.calendly_url || '',
            email: profileData.email || user.email,
            languages: profileData.languages || [],
            session_time_minutes: profileData.session_time_minutes,
            session_price_usd: profileData.session_price_usd,
            tags: profileData.tags || [],
            picture_url: profileData.picture_url || '',
            is_active: false, // Not active until approved
          }
        : {
            name_en: user.displayName,
            name_ko: user.displayName,
            email: user.email,
            is_active: false,
          };

      const { data: newMentor, error: createError } = await supabase
        .from('mentors')
        .insert(mentorData)
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating mentor:', createError);
        throw createError;
      }

      linkedMentorId = newMentor.id;
    }

    // Update profile with mentor_id
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ mentor_id: linkedMentorId })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error linking profile:', updateError);
      throw updateError;
    }

    // Update local state
    setUser(prev => prev ? { ...prev, mentorId: linkedMentorId } : null);
  }, [user]);

  const isAuthenticated = !!user;
  const isMentor = user?.role === 'mentor';
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isSuperAdmin = user?.role === 'super_admin';
  const isApproved = user?.isApproved ?? false;
  const needsMentorLink = user?.mentorId === null;

  return {
    user,
    isLoading,
    isAuthenticated,
    loginWithGoogle,
    loginWithEmail,
    signUpWithEmail,
    resetPassword,
    updatePassword,
    logout,
    policyAccepted,
    acceptPolicy,
    needsMentorLink,
    linkMentorProfile,
    isMentor,
    isAdmin,
    isSuperAdmin,
    isApproved,
  };
}

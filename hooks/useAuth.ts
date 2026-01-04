'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/utils/supabase';
import { User } from '@supabase/supabase-js';

export type UserRole = 'user' | 'mentor' | 'admin' | 'super_admin';

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
    // Use maybeSingle() instead of single() to handle missing profiles gracefully
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role, is_approved, display_name, mentor_id, policy_accepted_at')
      .eq('id', supabaseUser.id)
      .maybeSingle();

    // If profile doesn't exist, create it (fallback for users created before trigger)
    if (error || !profile) {
      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "0 rows" which is expected if profile doesn't exist
        console.error('Error fetching profile:', error);
      }

      // Only try to create profile if we didn't get a foreign key error
      // Foreign key error (23503) means user doesn't exist in auth.users - clear stale session
      if (error && error.code === '23503') {
        // User doesn't exist in auth.users - invalid/stale session, clear it
        console.warn('Stale session detected: user does not exist in auth.users. Clearing session...');
        try {
          await supabase.auth.signOut();
        } catch (signOutError) {
          // Ignore signOut errors (e.g., 403) - session is already invalid
          console.debug('SignOut error (expected for invalid sessions):', signOutError);
        }
        // Return null to indicate no valid user
        throw new Error('Invalid session: user does not exist');
      } else {
        // Auto-create profile if it doesn't exist
        const userRole: UserRole = supabaseUser.email && 
          ['mulli2@gmail.com', 'tk.hfes@gmail.com'].includes(supabaseUser.email)
          ? 'super_admin'
          : 'mentor';
        
        const isApproved = userRole === 'super_admin';

        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            display_name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
            avatar_url: supabaseUser.user_metadata?.avatar_url,
            role: userRole,
            is_approved: isApproved,
            mentor_id: null,
          })
          .select('role, is_approved, display_name, mentor_id, policy_accepted_at')
          .single();

        if (createError) {
          // Handle foreign key constraint violation (user doesn't exist in auth.users)
          if (createError.code === '23503') {
            // Stale session - user doesn't exist in auth.users, clear it
            console.warn('Stale session detected: user does not exist in auth.users. Clearing session...');
            try {
              await supabase.auth.signOut();
            } catch (signOutError) {
              // Ignore signOut errors (e.g., 403) - session is already invalid
              console.debug('SignOut error (expected for invalid sessions):', signOutError);
            }
            throw new Error('Invalid session: user does not exist');
          } else {
            console.error('Error creating profile:', createError);
          }
        } else if (newProfile) {
          // Use the newly created profile
          setPolicyAccepted(!!newProfile?.policy_accepted_at);
          
          return {
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            displayName: newProfile?.display_name || supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
            avatarUrl: supabaseUser.user_metadata?.avatar_url,
            role: (newProfile?.role as UserRole) || userRole,
            isApproved: newProfile?.is_approved ?? isApproved,
            mentorId: newProfile?.mentor_id || null,
            policyAcceptedAt: newProfile?.policy_accepted_at || null,
          };
        }
      }
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
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      // If there's an error getting the session, clear any stale data
      if (sessionError) {
        console.debug('Error getting session on mount:', sessionError);
        setUser(null);
        setPolicyAccepted(false);
        setIsLoading(false);
        return;
      }
      
      if (session?.user) {
        try {
          const authUser = await mapSupabaseUser(session.user);
          setUser(authUser);
        } catch (error) {
          // Invalid session (e.g., user doesn't exist in auth.users)
          // Session has been cleared, set user to null
          // Only log if it's not the expected "Invalid session" error
          if (error instanceof Error && error.message === 'Invalid session: user does not exist') {
            console.debug('Stale session cleared successfully');
          } else {
            console.warn('Failed to map user, clearing session:', error);
          }
          setUser(null);
          setPolicyAccepted(false);
        }
      } else {
        // No session - ensure state is cleared
        setUser(null);
        setPolicyAccepted(false);
      }
      setIsLoading(false);
    };

    initAuth();
  }, [mapSupabaseUser]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.debug('Auth state change:', event, session ? 'has session' : 'no session');
        
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            const authUser = await mapSupabaseUser(session.user);
            setUser(authUser);
          } catch (error) {
            // Invalid session (e.g., user doesn't exist in auth.users)
            // Session has been cleared, set user to null
            // Only log if it's not the expected "Invalid session" error
            if (error instanceof Error && error.message === 'Invalid session: user does not exist') {
              console.debug('Stale session cleared successfully after sign in');
            } else {
              console.warn('Failed to map user after sign in, clearing session:', error);
            }
            setUser(null);
            setPolicyAccepted(false);
          }
        } else if (event === 'SIGNED_OUT' || (!session && event !== 'SIGNED_IN')) {
          // Clear state on sign out or when session is removed
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
    // Clear local state immediately to prevent race conditions
    setUser(null);
    setPolicyAccepted(false);
    
    // Sign out from Supabase (this will trigger SIGNED_OUT event)
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Logout error:', error);
      // Even if there's an error, we've already cleared local state
      // Don't throw - allow the logout to proceed
    }
    
    // Clear any cached session data from localStorage
    // Supabase stores session in localStorage with key pattern: sb-<project-ref>-auth-token
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('supabase.auth.token') || key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      // Ignore localStorage errors (e.g., in private browsing)
      console.debug('Could not clear localStorage:', e);
    }
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
  // Only mentors need to link mentor profiles (not 'user' role)
  const needsMentorLink = isMentor && user?.mentorId === null;

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

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
  mentorId: string | null;  // NULL = needs to link/register mentor profile
  policyAcceptedAt: string | null;
}

interface UseAuthReturn {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  // Auth methods
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  // Mentor linking
  needsMentorLink: boolean;  // true if mentor_id is NULL
  linkMentorProfile: (mentorId: string | null, isNewMentor: boolean, profileData?: MentorProfileData) => Promise<void>;
  // Role checks
  isMentor: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isApproved: boolean; // Derived from role: mentor/admin/super_admin = approved, user = not approved
}

/**
 * Authentication hook using Supabase Auth
 * Supports Google OAuth and Email/Password authentication
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Convert Supabase user to AuthUser
  // Returns null if this is a LOGIN attempt but user doesn't exist (should have signed up first)
  const mapSupabaseUser = useCallback(async (supabaseUser: User): Promise<AuthUser | null> => {
    // Check if this was a login vs signup attempt
    const authMode = typeof window !== 'undefined' ? sessionStorage.getItem('authMode') : null;
    
    // Try to get user profile from profiles table
    // Use maybeSingle() instead of single() to handle missing profiles gracefully
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role, display_name, mentor_id, created_at')
      .eq('id', supabaseUser.id)
      .maybeSingle();
    
    // Check if this is a LOGIN attempt with a newly created profile (created within last 30 seconds)
    // This happens because the database trigger auto-creates profiles on auth.users insert
    if (authMode === 'login' && profile?.created_at) {
      const createdAt = new Date(profile.created_at).getTime();
      const now = Date.now();
      const isNewlyCreated = (now - createdAt) < 30000; // 30 seconds
      
      if (isNewlyCreated) {
        console.warn('Login attempted but profile was just created - must signup first');
        sessionStorage.removeItem('authMode');
        sessionStorage.setItem('loginError', 'accountNotFound');
        
        // Delete the auto-created profile
        await supabase.from('profiles').delete().eq('id', supabaseUser.id);
        
        // Sign out the user
        try {
          await supabase.auth.signOut();
        } catch (signOutError) {
          console.debug('SignOut error:', signOutError);
        }
        
        // Redirect to login page
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return null;
      }
    }
    
    // Clear auth mode flag for existing users
    if (typeof window !== 'undefined' && authMode) {
      sessionStorage.removeItem('authMode');
    }

    // If profile doesn't exist, handle based on auth mode
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
        throw new Error('Invalid session: user does not exist');
      }
      
      // Auto-create profile (this is a signup flow - fallback if trigger didn't run)
      // NOTE: We do NOT auto-link to mentor profiles here for regular users.
      // Even if an email matches, users should explicitly choose to link via the dashboard UI.
      // EXCEPTION: mulli2@gmail.com (super admin) auto-links to existing mentor profile.

      const isSuperAdminEmail = supabaseUser.email === 'mulli2@gmail.com';
      const userRole: UserRole = isSuperAdminEmail ? 'super_admin' : 'user';

      // For super admin (mulli2@gmail.com only), auto-detect and link existing mentor profile
      let autoLinkedMentorId: string | null = null;
      if (isSuperAdminEmail && supabaseUser.email) {
        const { data: existingMentor } = await supabase
          .from('mentors')
          .select('id')
          .eq('email', supabaseUser.email)
          .maybeSingle();
        
        if (existingMentor) {
          autoLinkedMentorId = existingMentor.id;
          console.log('Super admin auto-linked to existing mentor profile:', autoLinkedMentorId);
        }
      }

      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          display_name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
          avatar_url: supabaseUser.user_metadata?.avatar_url,
          role: userRole,
          mentor_id: autoLinkedMentorId,  // Auto-link for super admin, null for others
        })
        .select('role, display_name, mentor_id')
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
          const finalRole = (newProfile?.role as UserRole) || userRole;
          return {
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            displayName: newProfile?.display_name || supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
            avatarUrl: supabaseUser.user_metadata?.avatar_url,
            role: finalRole,
            mentorId: newProfile?.mentor_id || null,
            policyAcceptedAt: null, // Removed field
          };
        }
    }

    // If role is not set but mentor_id exists, infer role as 'mentor'
    // Otherwise default to 'user'
    let finalRole: UserRole = (profile?.role as UserRole) || 'user';
    if (!profile?.role && profile?.mentor_id) {
      finalRole = 'mentor';
    }

    let finalMentorId = profile?.mentor_id || null;
    const isSuperAdminEmail = supabaseUser.email === 'mulli2@gmail.com';

    // For super admin (mulli2@gmail.com only), ensure role is super_admin and auto-link to existing mentor
    if (isSuperAdminEmail) {
      // Ensure role is super_admin
      if (finalRole !== 'super_admin') {
        finalRole = 'super_admin';
        await supabase
          .from('profiles')
          .update({ role: 'super_admin' })
          .eq('id', supabaseUser.id);
        console.log('Super admin role set for mulli2@gmail.com');
      }
    }

    // For super admin (mulli2@gmail.com only), auto-link to existing mentor if not already linked
    if (isSuperAdminEmail && !finalMentorId) {
      const { data: existingMentor } = await supabase
        .from('mentors')
        .select('id')
        .eq('email', supabaseUser.email)
        .maybeSingle();
      
      if (existingMentor) {
        finalMentorId = existingMentor.id;
        // Update the profile to link the mentor
        await supabase
          .from('profiles')
          .update({ mentor_id: finalMentorId })
          .eq('id', supabaseUser.id);
        console.log('Super admin auto-linked to existing mentor profile:', finalMentorId);
      }
    }

    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      displayName: profile?.display_name || supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
      avatarUrl: supabaseUser.user_metadata?.avatar_url,
      role: finalRole,
      mentorId: finalMentorId,
      policyAcceptedAt: null, // Removed field
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
        setIsLoading(false);
        return;
      }
      
      if (session?.user) {
        try {
          const authUser = await mapSupabaseUser(session.user);
          if (authUser) {
            setUser(authUser);
          }
          // If null, user was redirected (login without account) - do nothing
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
        }
      } else {
        // No session - ensure state is cleared
        setUser(null);
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
            if (authUser) {
              setUser(authUser);
            }
            // If null, user was redirected (login without account) - do nothing
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
          }
        } else if (event === 'SIGNED_OUT' || (!session && event !== 'SIGNED_IN')) {
          // Clear state on sign out or when session is removed
          setUser(null);
        } else if (event === 'PASSWORD_RECOVERY') {
          // User clicked password reset link - they're now authenticated
          // The reset-password page will handle the actual password update
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [mapSupabaseUser]);

  // Email/Password login
  const loginWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
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
      // Don't log "User already registered" as an error in console, as it's a validation case
      if (error.message && !error.message.includes('already registered')) {
        console.error('Signup error:', error);
      }
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

  // Logout
  const logout = useCallback(async () => {
    // Clear local state immediately to prevent race conditions
    setUser(null);
    
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
  // Approved = mentor/admin/super_admin (not 'user' role)
  const isApproved = user ? (user.role === 'mentor' || user.role === 'admin' || user.role === 'super_admin') : false;
  // Users with 'user' or 'mentor' role need to link mentor profiles if mentor_id is null
  const needsMentorLink = !!(user && (user.role === 'user' || user.role === 'mentor') && user.mentorId === null);

  return {
    user,
    isLoading,
    isAuthenticated,
    loginWithEmail,
    signUpWithEmail,
    resetPassword,
    updatePassword,
    logout,
    needsMentorLink,
    linkMentorProfile,
    isMentor,
    isAdmin,
    isSuperAdmin,
    isApproved,
  };
}

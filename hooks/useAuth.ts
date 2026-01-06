'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/utils/supabase';

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
  mentorId: string | null;
  policyAcceptedAt: string | null;
}

interface UseAuthReturn {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  needsMentorLink: boolean;
  linkMentorProfile: (mentorId: string | null, isNewMentor: boolean, profileData?: MentorProfileData) => Promise<void>;
  isMentor: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isApproved: boolean;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from sessionStorage on mount
  useEffect(() => {
    try {
      const storedUser = sessionStorage.getItem('donation_mentoring_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Failed to parse stored user:', error);
      sessionStorage.removeItem('donation_mentoring_user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    try {
      // Query the mentors table directly
      // Note: This assumes the password column exists and stores plain text (based on migration)
      const { data: mentor, error } = await supabase
        .from('mentors')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();

      if (error) {
        console.error('Login error:', error);
        throw new Error('Invalid login credentials');
      }

      if (!mentor) {
        throw new Error('User not found');
      }

      // Map mentor to AuthUser
      const authUser: AuthUser = {
        id: mentor.id,
        email: mentor.email || '',
        displayName: mentor.name_en || mentor.name_ko || 'Mentor',
        avatarUrl: mentor.picture_url,
        role: (mentor.role as UserRole) || 'mentor',
        mentorId: mentor.id,
        policyAcceptedAt: null,
      };

      setUser(authUser);
      sessionStorage.setItem('donation_mentoring_user', JSON.stringify(authUser));

    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    sessionStorage.removeItem('donation_mentoring_user');
    // Also sign out from Supabase just in case, though we are managing session manually now
    await supabase.auth.signOut();
  }, []);

  // Stubs for Supabase Auth functions that are temporarily disabled or need refactoring
  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    console.warn('SignUp is not currently supported with this auth method.');
    // TODO: Implement mentor creation with password
    throw new Error('SignUp not implemented');
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    console.warn('Reset password is not currently supported.');
    // TODO: Implement password reset logic for custom auth
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    console.warn('Update password is not currently supported.');
    // TODO: Implement password update logic for custom auth
  }, []);

  const linkMentorProfile = useCallback(async (
    mentorId: string | null,
    isNewMentor: boolean,
    profileData?: MentorProfileData
  ) => {
    // This functionality might need review as we are now authenticating AS a mentor directly
    console.log('linkMentorProfile called', { mentorId, isNewMentor, profileData });
  }, []);

  const isAuthenticated = !!user;
  const isMentor = user?.role === 'mentor';
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isSuperAdmin = user?.role === 'super_admin';
  const isApproved = true; // Mentors are implicitly approved in this simplified flow
  const needsMentorLink = false; // Since we log in as mentor, we are linked

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

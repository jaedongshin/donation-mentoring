'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  isMockAuthEnabled,
  getMockUser,
  mockLogin,
  mockLogout,
  MockUser,
  MOCK_USERS,
} from '@/utils/mockAuth';

export type { MockUser, UserRole } from '@/utils/mockAuth';

interface UseAuthReturn {
  user: MockUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isMockAuth: boolean;
  login: (userType: keyof typeof MOCK_USERS) => void;
  logout: () => void;
  // Role checks
  isMentor: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isApproved: boolean;
}

/**
 * Authentication hook that works with both mock and real auth
 *
 * When NEXT_PUBLIC_MOCK_AUTH=true, uses localStorage-based mock auth
 * When false, will use Supabase auth (to be implemented)
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<MockUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isMockAuth = isMockAuthEnabled();

  // Load user on mount
  useEffect(() => {
    if (isMockAuth) {
      // Mock auth: load from localStorage
      const storedUser = getMockUser();
      setUser(storedUser);
      setIsLoading(false);
    } else {
      // Real auth: TODO - implement Supabase auth
      // For now, just set loading to false
      setIsLoading(false);
    }
  }, [isMockAuth]);

  // Listen for storage changes (for multi-tab sync in mock mode)
  useEffect(() => {
    if (!isMockAuth) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'mockAuthUser') {
        const newUser = e.newValue ? JSON.parse(e.newValue) : null;
        setUser(newUser);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isMockAuth]);

  const login = useCallback(
    (userType: keyof typeof MOCK_USERS) => {
      if (isMockAuth) {
        const newUser = mockLogin(userType);
        setUser(newUser);
      } else {
        // Real auth: TODO - redirect to OAuth
        console.warn('Real auth not implemented yet');
      }
    },
    [isMockAuth]
  );

  const logout = useCallback(() => {
    if (isMockAuth) {
      mockLogout();
      setUser(null);
    } else {
      // Real auth: TODO - implement Supabase signOut
      console.warn('Real auth not implemented yet');
    }
  }, [isMockAuth]);

  const isAuthenticated = !!user;
  const isMentor = user?.role === 'mentor';
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isSuperAdmin = user?.role === 'super_admin';
  const isApproved = user?.isApproved ?? false;

  return {
    user,
    isLoading,
    isAuthenticated,
    isMockAuth,
    login,
    logout,
    isMentor,
    isAdmin,
    isSuperAdmin,
    isApproved,
  };
}

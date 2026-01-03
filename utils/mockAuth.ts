/**
 * Mock Authentication Utilities
 *
 * This file provides mock authentication for UI testing without requiring
 * Supabase OAuth setup. Enable via NEXT_PUBLIC_MOCK_AUTH=true in .env.local
 *
 * REMOVAL: When real OAuth is ready, delete this file and update hooks/useAuth.ts
 */

export type UserRole = 'mentor' | 'admin' | 'super_admin';

export interface MockUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: UserRole;
  isApproved: boolean;
}

const MOCK_USER_KEY = 'mockAuthUser';

/**
 * Check if mock auth is enabled via environment variable
 */
export const isMockAuthEnabled = (): boolean => {
  return process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';
};

/**
 * Get the current mock user from localStorage
 */
export const getMockUser = (): MockUser | null => {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(MOCK_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

/**
 * Set the mock user in localStorage
 */
export const setMockUser = (user: MockUser): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
};

/**
 * Clear the mock user from localStorage
 */
export const clearMockUser = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(MOCK_USER_KEY);
};

/**
 * Predefined mock users for different roles
 */
export const MOCK_USERS: Record<string, MockUser> = {
  pendingMentor: {
    id: 'mock-pending-mentor',
    email: 'pending@example.com',
    displayName: 'Pending Mentor',
    role: 'mentor',
    isApproved: false,
  },
  approvedMentor: {
    id: 'mock-approved-mentor',
    email: 'mentor@example.com',
    displayName: 'Test Mentor',
    role: 'mentor',
    isApproved: true,
  },
  admin: {
    id: 'mock-admin',
    email: 'admin@example.com',
    displayName: 'Test Admin',
    role: 'admin',
    isApproved: true,
  },
  superAdmin: {
    id: 'mock-super-admin',
    email: 'superadmin@example.com',
    displayName: 'Super Admin',
    role: 'super_admin',
    isApproved: true,
  },
};

/**
 * Login as a predefined mock user
 */
export const mockLogin = (userType: keyof typeof MOCK_USERS): MockUser => {
  const user = MOCK_USERS[userType];
  setMockUser(user);
  return user;
};

/**
 * Logout (clear mock user)
 */
export const mockLogout = (): void => {
  clearMockUser();
};

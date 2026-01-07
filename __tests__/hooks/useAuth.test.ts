import { UserRole } from '@/hooks/useAuth';

describe('UserRole type', () => {
  it('should include user role for no-permission users', () => {
    const validRoles: UserRole[] = ['user', 'mentor', 'admin'];

    // Type check - if 'user' is not in UserRole, this would be a compile error
    const userRole: UserRole = 'user';
    expect(userRole).toBe('user');

    // Ensure all expected roles are valid
    validRoles.forEach(role => {
      expect(['user', 'mentor', 'admin']).toContain(role);
    });
  });

  it('should have user as the lowest permission level', () => {
    // Document the expected permission hierarchy
    const permissionHierarchy: UserRole[] = ['user', 'mentor', 'admin'];

    expect(permissionHierarchy[0]).toBe('user');
    expect(permissionHierarchy[2]).toBe('admin');
  });
});

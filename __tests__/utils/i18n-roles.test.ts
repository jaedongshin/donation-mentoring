import { auth } from '@/utils/i18n/auth';
import { UserRole } from '@/hooks/useAuth';

describe('Role translations', () => {
  const allRoles: UserRole[] = ['user', 'mentor', 'admin', 'super_admin'];

  it('should have English translations for all roles', () => {
    expect(auth.en.roleUser).toBeDefined();
    expect(auth.en.roleMentor).toBeDefined();
    expect(auth.en.roleAdmin).toBeDefined();
    expect(auth.en.roleSuperAdmin).toBeDefined();

    // Ensure translations are non-empty strings
    expect(auth.en.roleUser.length).toBeGreaterThan(0);
    expect(auth.en.roleMentor.length).toBeGreaterThan(0);
    expect(auth.en.roleAdmin.length).toBeGreaterThan(0);
    expect(auth.en.roleSuperAdmin.length).toBeGreaterThan(0);
  });

  it('should have Korean translations for all roles', () => {
    expect(auth.ko.roleUser).toBeDefined();
    expect(auth.ko.roleMentor).toBeDefined();
    expect(auth.ko.roleAdmin).toBeDefined();
    expect(auth.ko.roleSuperAdmin).toBeDefined();

    // Ensure translations are non-empty strings
    expect(auth.ko.roleUser.length).toBeGreaterThan(0);
    expect(auth.ko.roleMentor.length).toBeGreaterThan(0);
    expect(auth.ko.roleAdmin.length).toBeGreaterThan(0);
    expect(auth.ko.roleSuperAdmin.length).toBeGreaterThan(0);
  });

  it('should have matching role translation keys for en and ko', () => {
    // Get all role-related keys from English translations
    const enRoleKeys = Object.keys(auth.en).filter(key => key.startsWith('role'));
    const koRoleKeys = Object.keys(auth.ko).filter(key => key.startsWith('role'));

    // Both languages should have the same role keys
    expect(enRoleKeys.sort()).toEqual(koRoleKeys.sort());

    // Should have exactly 4 role translations
    expect(enRoleKeys).toHaveLength(4);
  });

  it('should map UserRole values to translation keys', () => {
    // Verify the naming convention: role 'user' -> roleUser, 'super_admin' -> roleSuperAdmin
    const roleToTranslationKey: Record<UserRole, keyof typeof auth.en> = {
      user: 'roleUser',
      mentor: 'roleMentor',
      admin: 'roleAdmin',
      super_admin: 'roleSuperAdmin',
    };

    allRoles.forEach(role => {
      const key = roleToTranslationKey[role];
      expect(auth.en[key]).toBeDefined();
      expect(auth.ko[key]).toBeDefined();
    });
  });
});

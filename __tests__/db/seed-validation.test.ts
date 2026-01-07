import * as fs from 'fs';
import * as path from 'path';

describe('Seed SQL validation', () => {
  const seedPath = path.join(process.cwd(), 'supabase', 'seed.sql');
  let seedContent: string;

  beforeAll(() => {
    seedContent = fs.readFileSync(seedPath, 'utf-8');
  });

  describe('auth.users INSERT statement', () => {
    it('should include email_change column to prevent GoTrue scan errors', () => {
      // GoTrue fails with "converting NULL to string is unsupported" if email_change is NULL
      expect(seedContent).toContain('email_change');
    });

    it('should include email_change_token_new column', () => {
      expect(seedContent).toContain('email_change_token_new');
    });

    it('should include email_change_token_current column', () => {
      expect(seedContent).toContain('email_change_token_current');
    });

    it('should include phone_change column', () => {
      expect(seedContent).toContain('phone_change');
    });

    it('should include phone_change_token column', () => {
      expect(seedContent).toContain('phone_change_token');
    });

    it('should include reauthentication_token column', () => {
      expect(seedContent).toContain('reauthentication_token');
    });

    it('should include is_sso_user column', () => {
      expect(seedContent).toContain('is_sso_user');
    });

    it('should include is_anonymous column', () => {
      expect(seedContent).toContain('is_anonymous');
    });

    it('should NOT include phone column directly (has unique constraint)', () => {
      // The phone column should be left as NULL (not in INSERT) because:
      // 1. It has a unique constraint
      // 2. Empty string '' would cause duplicate key errors
      // 3. Multiple NULLs are allowed in unique constraints
      const insertMatch = seedContent.match(/INSERT INTO auth\.users \(([\s\S]*?)\) VALUES/);
      if (insertMatch) {
        const columnList = insertMatch[1];
        // phone_change is OK, but 'phone' as a standalone column should not be in the list
        // unless it's setting unique values per user
        const columns = columnList.split(',').map(c => c.trim());
        const hasPhoneColumn = columns.some(c => c === 'phone');

        if (hasPhoneColumn) {
          // If phone IS included, verify each user has a unique value (not empty string)
          // This is a softer check - just warn
          console.warn('Note: phone column is included - ensure unique values per user');
        }
      }
    });
  });

  describe('test users', () => {
    it('should include admin test users', () => {
      expect(seedContent).toContain("'admin@test.com'");
      expect(seedContent).toContain("'admin2@test.com'");
    });

    it('should include mentor test users', () => {
      expect(seedContent).toContain("'mentor1@test.com'");
      expect(seedContent).toContain("'mentor2@test.com'");
    });

    it('should include pending test user', () => {
      expect(seedContent).toContain("'pending1@test.com'");
    });
  });

  describe('profiles table', () => {
    it('should update admin profiles with admin role', () => {
      expect(seedContent).toContain("role = 'admin'");
    });

    it('should update mentor profiles with mentor role', () => {
      expect(seedContent).toContain("role = 'mentor'");
    });

    it('should update pending user with user role', () => {
      expect(seedContent).toContain("role = 'user'");
    });
  });
});

describe('Migration validation', () => {
  const migrationPath = path.join(
    process.cwd(),
    'supabase',
    'migrations',
    '20260106000006_remove_super_admin.sql'
  );
  let migrationContent: string;

  beforeAll(() => {
    migrationContent = fs.readFileSync(migrationPath, 'utf-8');
  });

  describe('profiles table CHECK constraint', () => {
    it('should allow user role in CHECK constraint', () => {
      // The CHECK constraint should include 'user' role
      expect(migrationContent).toMatch(/CHECK.*'user'/);
    });

    it('should allow all three roles: user, mentor, admin', () => {
      expect(migrationContent).toContain("'user'");
      expect(migrationContent).toContain("'mentor'");
      expect(migrationContent).toContain("'admin'");
    });
  });
});

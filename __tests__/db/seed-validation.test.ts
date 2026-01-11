import * as fs from 'fs';
import * as path from 'path';

describe('Seed SQL validation', () => {
  const seedPath = path.join(process.cwd(), 'supabase', 'seed.sql');
  let seedContent: string;

  beforeAll(() => {
    seedContent = fs.readFileSync(seedPath, 'utf-8');
  });

  describe('seed file format', () => {
    it('should be a valid PostgreSQL dump', () => {
      expect(seedContent).toContain('PostgreSQL database dump');
    });

    it('should contain auth.users data', () => {
      expect(seedContent).toContain('auth');
      expect(seedContent).toContain('users');
    });

    it('should contain mentors table data', () => {
      expect(seedContent).toContain('mentors');
    });
  });
});

describe('Migration validation', () => {
  describe('init schema migration', () => {
    const migrationPath = path.join(
      process.cwd(),
      'supabase',
      'migrations',
      '20260106000000_init_schema.sql'
    );
    let migrationContent: string;

    beforeAll(() => {
      migrationContent = fs.readFileSync(migrationPath, 'utf-8');
    });

    it('should create mentors table', () => {
      expect(migrationContent).toContain('CREATE TABLE');
      expect(migrationContent).toContain('mentors');
    });

    it('should include role column', () => {
      expect(migrationContent).toContain('role');
    });
  });

  describe('email system migration', () => {
    const migrationPath = path.join(
      process.cwd(),
      'supabase',
      'migrations',
      '20260107000000_email_system.sql'
    );
    let migrationContent: string;

    beforeAll(() => {
      migrationContent = fs.readFileSync(migrationPath, 'utf-8');
    });

    it('should add email_subscribed column to mentors', () => {
      expect(migrationContent).toContain('email_subscribed');
    });

    it('should create email_logs table', () => {
      expect(migrationContent).toContain('email_logs');
    });

    it('should include email tracking columns', () => {
      expect(migrationContent).toContain('opens');
      expect(migrationContent).toContain('clicks');
    });
  });
});

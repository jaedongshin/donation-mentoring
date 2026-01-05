import { translations, i18n } from '@/utils/i18n';
import { common } from '@/utils/i18n/common';
import { auth } from '@/utils/i18n/auth';
import { dashboard } from '@/utils/i18n/dashboard';
import { mentor } from '@/utils/i18n/mentor';
import { admin } from '@/utils/i18n/admin';
import { home } from '@/utils/i18n/home';

describe('i18n index', () => {
  describe('translations flat merge', () => {
    it('should merge all translation modules for English', () => {
      expect(translations.en).toHaveProperty('save');
      expect(translations.en).toHaveProperty('login');
      expect(translations.en).toHaveProperty('title');
    });

    it('should merge all translation modules for Korean', () => {
      expect(translations.ko).toHaveProperty('save');
      expect(translations.ko).toHaveProperty('login');
      expect(translations.ko).toHaveProperty('title');
    });

    it('should include common translations', () => {
      const commonKeys = Object.keys(common.en);
      commonKeys.forEach((key) => {
        expect(translations.en).toHaveProperty(key);
        expect(translations.ko).toHaveProperty(key);
      });
    });

    it('should include auth translations', () => {
      const authKeys = Object.keys(auth.en);
      authKeys.forEach((key) => {
        expect(translations.en).toHaveProperty(key);
        expect(translations.ko).toHaveProperty(key);
      });
    });
  });

  describe('i18n namespaced structure', () => {
    it('should have namespaced structure for English', () => {
      expect(i18n.en).toHaveProperty('common');
      expect(i18n.en).toHaveProperty('auth');
      expect(i18n.en).toHaveProperty('dashboard');
      expect(i18n.en).toHaveProperty('mentor');
      expect(i18n.en).toHaveProperty('admin');
      expect(i18n.en).toHaveProperty('home');
    });

    it('should have namespaced structure for Korean', () => {
      expect(i18n.ko).toHaveProperty('common');
      expect(i18n.ko).toHaveProperty('auth');
      expect(i18n.ko).toHaveProperty('dashboard');
      expect(i18n.ko).toHaveProperty('mentor');
      expect(i18n.ko).toHaveProperty('admin');
      expect(i18n.ko).toHaveProperty('home');
    });

    it('should match module content in namespaced structure', () => {
      expect(i18n.en.common).toEqual(common.en);
      expect(i18n.en.auth).toEqual(auth.en);
      expect(i18n.en.dashboard).toEqual(dashboard.en);
      expect(i18n.en.mentor).toEqual(mentor.en);
      expect(i18n.en.admin).toEqual(admin.en);
      expect(i18n.en.home).toEqual(home.en);
    });
  });

  describe('translation key consistency', () => {
    it('should have same keys in both languages for flat translations', () => {
      const enKeys = Object.keys(translations.en).sort();
      const koKeys = Object.keys(translations.ko).sort();
      expect(enKeys).toEqual(koKeys);
    });

    it('should have same namespaces in both languages', () => {
      const enNamespaces = Object.keys(i18n.en).sort();
      const koNamespaces = Object.keys(i18n.ko).sort();
      expect(enNamespaces).toEqual(koNamespaces);
    });
  });
});


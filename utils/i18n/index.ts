// i18n index - merges all translation modules
import { common } from './common';
import { auth } from './auth';
import { dashboard } from './dashboard';
import { mentor } from './mentor';
import { admin } from './admin';
import { home } from './home';

export type Language = 'en' | 'ko';

// Flat merge for backward compatibility
// Usage: t.login, t.save, etc.
export const translations = {
  en: {
    ...common.en,
    ...auth.en,
    ...dashboard.en,
    ...mentor.en,
    ...admin.en,
    ...home.en,
  },
  ko: {
    ...common.ko,
    ...auth.ko,
    ...dashboard.ko,
    ...mentor.ko,
    ...admin.ko,
    ...home.ko,
  },
};

// Namespaced version for cleaner organization
// Usage: t.auth.login, t.common.save, etc.
export const i18n = {
  en: {
    common: common.en,
    auth: auth.en,
    dashboard: dashboard.en,
    mentor: mentor.en,
    admin: admin.en,
    home: home.en,
  },
  ko: {
    common: common.ko,
    auth: auth.ko,
    dashboard: dashboard.ko,
    mentor: mentor.ko,
    admin: admin.ko,
    home: home.ko,
  },
};

export type TranslationKey = keyof typeof translations.en;

// Re-export modules for direct access if needed
export { common, auth, dashboard, mentor, admin, home };

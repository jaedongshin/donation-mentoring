export type Language = 'en' | 'ko';

export interface TranslationSet {
  en: Record<string, unknown>;
  ko: Record<string, unknown>;
}

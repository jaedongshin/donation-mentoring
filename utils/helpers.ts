import { Mentor } from '@/types/mentor';
import { Language } from '@/utils/i18n';

/**
 * Ensures a URL has a protocol (http:// or https://)
 * If no protocol is present, defaults to https://
 */
export function ensureProtocol(url: string): string {
  if (!url) return '';
  return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
}

/**
 * Gets localized mentor display data based on the current language
 */
export function getMentorDisplay(mentor: Mentor, lang: Language) {
  const name = lang === 'en' ? mentor.name_en : mentor.name_ko;
  const description = lang === 'en' ? mentor.description_en : mentor.description_ko;
  const position = lang === 'en' ? mentor.position_en : mentor.position_ko;
  const location = lang === 'en' ? mentor.location_en : mentor.location_ko;
  const company = lang === 'en' ? mentor.company_en : mentor.company_ko;

  return {
    name: name || mentor.name_en || mentor.name_ko || 'No Name',
    description: description || mentor.description_en || mentor.description_ko || '',
    position: position || mentor.position_en || mentor.position_ko || '',
    location: location || mentor.location_en || mentor.location_ko || '',
    company: company || mentor.company_en || mentor.company_ko || '',
  };
}

/**
 * Smoothly scrolls to an element by ID
 */
export function scrollToElement(elementId: string) {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}


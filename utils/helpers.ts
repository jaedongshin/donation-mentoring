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

/**
 * Shuffles an array using Fisher-Yates algorithm
 * Returns a new shuffled array without mutating the original
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Selects a daily mentor deterministically based on the current date.
 * Uses the date as a seed to ensure the same mentor is selected for the entire day.
 * Mentors are sorted by ID first to ensure stable ordering.
 * Uses UTC date to avoid timezone issues.
 */
export function getDailyMentor(mentors: Mentor[]): Mentor | null {
  if (!mentors || mentors.length === 0) return null;
  
  // Sort by ID to ensure stable ordering
  const sortedMentors = [...mentors].sort((a, b) => a.id.localeCompare(b.id));
  
  // Use UTC date to ensure consistent selection across timezones
  const today = new Date();
  const year = today.getUTCFullYear();
  const month = today.getUTCMonth() + 1;
  const day = today.getUTCDate();
  
  // Create a seed from YYYYMMDD (UTC)
  const seed = year * 10000 + month * 100 + day;
  
  // Use the seed to pick a mentor from the sorted array
  const selectedIndex = seed % sortedMentors.length;
  const selectedMentor = sortedMentors[selectedIndex];
  
  // Debug logging (can be removed in production)
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('[getDailyMentor]', {
      date: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
      seed,
      mentorCount: sortedMentors.length,
      selectedIndex,
      selectedMentor: selectedMentor.name_ko || selectedMentor.name_en,
    });
  }
  
  return selectedMentor;
}


import { useMemo } from 'react';
import { Mentor } from '@/types/mentor';
import { Language } from './i18n';

export interface FilterState {
  expertise: string[];
  locations: string[];
  sessionLength: number | null;
  priceRange: [number, number];
}

export const DEFAULT_FILTERS: FilterState = {
  expertise: [],
  locations: [],
  sessionLength: null,
  priceRange: [0, 100],
};

interface UseMentorFiltersProps {
  mentors: Mentor[];
  search: string;
  lang: Language;
  filters: FilterState;
}

interface UseMentorFiltersReturn {
  filteredMentors: Mentor[];
  availableTags: string[];
  availableLocations: string[];
  activeFilterCount: number;
  hasActiveFilters: boolean;
}

/**
 * Custom hook for filtering mentors based on search, language, and filter criteria.
 * Applies SOLID SRP by extracting filtering logic from the page component.
 */
export function useMentorFilters({
  mentors,
  search,
  lang,
  filters,
}: UseMentorFiltersProps): UseMentorFiltersReturn {
  // Extract available filter options from mentors (DRY - computed once)
  // Normalize tags: group similar tags (case-insensitive, space-insensitive)
  const { availableTags, tagNormMap, availableLocations } = useMemo(() => {
    const tagGroups = new Map<string, { display: string; count: number }>();
    const locationsSet = new Set<string>();

    mentors.forEach((mentor) => {
      mentor.tags?.forEach((tag) => {
        const normalized = normalizeTag(tag);
        const existing = tagGroups.get(normalized);
        if (existing) {
          existing.count++;
          // Prefer: spaces over no-spaces, title case over lowercase
          if (preferDisplayName(tag, existing.display)) {
            existing.display = tag;
          }
        } else {
          tagGroups.set(normalized, { display: tag, count: 1 });
        }
      });
      const loc = lang === 'en' ? mentor.location_en : mentor.location_ko;
      const fallbackLoc = mentor.location_en || mentor.location_ko;
      if (loc || fallbackLoc) {
        locationsSet.add(loc || fallbackLoc || '');
      }
    });

    // Sort by count (most popular first), then alphabetically
    const sortedTags = Array.from(tagGroups.entries())
      .sort((a, b) => b[1].count - a[1].count || a[1].display.localeCompare(b[1].display))
      .map(([, v]) => v.display);

    // Create map from display name to normalized (for filtering)
    const normMap = new Map<string, string>();
    tagGroups.forEach((v, k) => normMap.set(v.display, k));

    return {
      availableTags: sortedTags,
      tagNormMap: normMap,
      availableLocations: Array.from(locationsSet).filter(Boolean).sort(),
    };
  }, [mentors, lang]);

  // Apply all filters (SRP - single filtering responsibility)
  const filteredMentors = useMemo(() => {
    return mentors.filter((mentor) => {
      // Language filtering
      if (!matchesLanguage(mentor, lang)) return false;

      // Search text filtering
      if (search && !matchesSearch(mentor, search)) return false;

      // Expertise (tags) filter - use normalized comparison
      if (filters.expertise.length > 0) {
        const mentorTagsNormalized = (mentor.tags || []).map(normalizeTag);
        const filterTagsNormalized = filters.expertise.map((t) => tagNormMap.get(t) || normalizeTag(t));
        if (!filterTagsNormalized.some((ft) => mentorTagsNormalized.includes(ft))) return false;
      }

      // Location filter
      if (filters.locations.length > 0) {
        const mentorLocation = getMentorLocation(mentor, lang);
        if (!filters.locations.includes(mentorLocation)) return false;
      }

      // Session length filter
      if (filters.sessionLength !== null) {
        if (mentor.session_time_minutes !== filters.sessionLength) return false;
      }

      // Price range filter
      if (mentor.session_price_usd) {
        const [min, max] = filters.priceRange;
        if (mentor.session_price_usd < min || mentor.session_price_usd > max) return false;
      }

      return true;
    });
  }, [mentors, search, lang, filters, tagNormMap]);

  // Count active filters (for UI badge)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.expertise.length > 0) count++;
    if (filters.locations.length > 0) count++;
    if (filters.sessionLength !== null) count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 100) count++;
    return count;
  }, [filters]);

  return {
    filteredMentors,
    availableTags,
    availableLocations,
    activeFilterCount,
    hasActiveFilters: activeFilterCount > 0,
  };
}

// Helper functions (DRY - reusable logic)
function matchesLanguage(mentor: Mentor, lang: Language): boolean {
  const supportedLangs = (mentor.languages || []).map((l) => l.toLowerCase());
  const isKorean = lang === 'ko';

  return isKorean
    ? supportedLangs.some((l) => l.includes('korean') || l.includes('한국어') || l.includes('ko'))
    : supportedLangs.some((l) => l.includes('english') || l.includes('영어') || l.includes('en'));
}

function matchesSearch(mentor: Mentor, search: string): boolean {
  const query = search.toLowerCase();
  const allText = [
    mentor.name_en,
    mentor.name_ko,
    mentor.location_en,
    mentor.location_ko,
    mentor.position_en,
    mentor.position_ko,
    ...(mentor.tags || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return allText.includes(query);
}

function getMentorLocation(mentor: Mentor, lang: Language): string {
  const loc = lang === 'en' ? mentor.location_en : mentor.location_ko;
  return loc || mentor.location_en || mentor.location_ko || '';
}

// Normalize tag for comparison: lowercase + remove spaces
function normalizeTag(tag: string): string {
  return tag.toLowerCase().replace(/\s+/g, '');
}

// Prefer display names with: spaces over no-spaces, title case over lowercase
function preferDisplayName(candidate: string, current: string): boolean {
  const candidateHasSpace = candidate.includes(' ');
  const currentHasSpace = current.includes(' ');

  // Prefer with spaces (more readable)
  if (candidateHasSpace && !currentHasSpace) return true;
  if (!candidateHasSpace && currentHasSpace) return false;

  // Prefer title case (first letter uppercase)
  const candidateIsTitle = candidate[0] === candidate[0].toUpperCase();
  const currentIsTitle = current[0] === current[0].toUpperCase();
  if (candidateIsTitle && !currentIsTitle) return true;

  return false;
}

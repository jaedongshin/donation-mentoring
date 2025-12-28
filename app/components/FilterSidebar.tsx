'use client';

import { useState } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { Language, translations } from '@/utils/i18n';
import { FilterState } from '@/utils/useMentorFilters';

interface FilterSidebarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  availableTags: string[];
  availableLocations: string[];
  lang: Language;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  darkMode?: boolean;
}

const SESSION_LENGTHS = [30, 45, 60];
const INITIAL_TAGS_SHOWN = 10;

export default function FilterSidebar({
  filters,
  onFilterChange,
  availableTags,
  availableLocations,
  lang,
  isMobileOpen = false,
  onMobileClose,
  darkMode = false,
}: FilterSidebarProps) {
  const t = translations[lang];
  const [showAllTags, setShowAllTags] = useState(false);

  const visibleTags = showAllTags ? availableTags : availableTags.slice(0, INITIAL_TAGS_SHOWN);
  const hasMoreTags = availableTags.length > INITIAL_TAGS_SHOWN;

  // Dark mode styles
  const dm = {
    bg: darkMode ? 'bg-gray-800' : 'bg-white',
    text: darkMode ? 'text-gray-100' : 'text-gray-900',
    textMuted: darkMode ? 'text-gray-400' : 'text-gray-600',
    textSubtle: darkMode ? 'text-gray-300' : 'text-gray-800',
    border: darkMode ? 'border-gray-600' : 'border-gray-300',
    hover: darkMode ? 'hover:text-gray-200' : 'hover:text-black',
    checkbox: darkMode ? 'border-gray-500 bg-gray-700' : 'border-gray-600 bg-white',
    input: darkMode ? 'bg-gray-700 border-gray-500 text-gray-100' : 'bg-white border-gray-400',
  };

  const handleExpertiseToggle = (tag: string) => {
    const newExpertise = filters.expertise.includes(tag)
      ? filters.expertise.filter((t) => t !== tag)
      : [...filters.expertise, tag];
    onFilterChange({ ...filters, expertise: newExpertise });
  };

  const handleLocationToggle = (location: string) => {
    const newLocations = filters.locations.includes(location)
      ? filters.locations.filter((l) => l !== location)
      : [...filters.locations, location];
    onFilterChange({ ...filters, locations: newLocations });
  };

  const handleSessionLengthChange = (length: number | null) => {
    onFilterChange({ ...filters, sessionLength: length });
  };

  const handlePriceRangeChange = (value: number, index: 0 | 1) => {
    const newRange: [number, number] = [...filters.priceRange] as [number, number];
    newRange[index] = value;
    if (index === 0 && newRange[0] > newRange[1]) {
      newRange[1] = newRange[0];
    }
    if (index === 1 && newRange[1] < newRange[0]) {
      newRange[0] = newRange[1];
    }
    onFilterChange({ ...filters, priceRange: newRange });
  };

  const clearAllFilters = () => {
    onFilterChange({
      expertise: [],
      locations: [],
      sessionLength: null,
      priceRange: [0, 100],
    });
  };

  const hasActiveFilters =
    filters.expertise.length > 0 ||
    filters.locations.length > 0 ||
    filters.sessionLength !== null ||
    filters.priceRange[0] > 0 ||
    filters.priceRange[1] < 100;

  const sidebarContent = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className={`text-lg font-semibold ${dm.text}`}>{t.filterTitle}</h3>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-sky-600 hover:text-sky-800 font-medium"
          >
            {t.filterClearAll}
          </button>
        )}
      </div>

      {/* Expertise Filter - 2 columns with show more */}
      {availableTags.length > 0 && (
        <div>
          <h4 className={`text-sm font-medium ${dm.textSubtle} mb-3`}>{t.filterExpertise}</h4>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
            {visibleTags.map((tag) => (
              <label key={tag} className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.expertise.includes(tag)}
                  onChange={() => handleExpertiseToggle(tag)}
                  className={`w-3.5 h-3.5 text-sky-600 rounded focus:ring-sky-500 ${dm.checkbox}`}
                />
                <span className={`ml-1.5 text-xs ${dm.textMuted} ${dm.hover} truncate`}>
                  {tag}
                </span>
              </label>
            ))}
          </div>
          {hasMoreTags && (
            <button
              onClick={() => setShowAllTags(!showAllTags)}
              className="mt-2 flex items-center gap-1 text-xs text-sky-600 hover:text-sky-800 font-medium cursor-pointer"
            >
              {showAllTags ? (
                <>
                  <span>{lang === 'ko' ? '접기' : 'Show less'}</span>
                  <ChevronUp size={14} />
                </>
              ) : (
                <>
                  <span>{lang === 'ko' ? `+${availableTags.length - INITIAL_TAGS_SHOWN}개 더보기` : `+${availableTags.length - INITIAL_TAGS_SHOWN} more`}</span>
                  <ChevronDown size={14} />
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Location Filter - 2 columns */}
      {availableLocations.length > 0 && (
        <div>
          <h4 className={`text-sm font-medium ${dm.textSubtle} mb-3`}>{t.filterLocation}</h4>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
            {availableLocations.map((location) => (
              <label key={location} className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.locations.includes(location)}
                  onChange={() => handleLocationToggle(location)}
                  className={`w-3.5 h-3.5 text-sky-600 rounded focus:ring-sky-500 ${dm.checkbox}`}
                />
                <span className={`ml-1.5 text-xs ${dm.textMuted} ${dm.hover} truncate`}>
                  {location}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Session Length Filter */}
      <div>
        <h4 className={`text-sm font-medium ${dm.textSubtle} mb-3`}>{t.filterSessionLength}</h4>
        <div className="space-y-2">
          <label className="flex items-center cursor-pointer group">
            <input
              type="radio"
              name="sessionLength"
              checked={filters.sessionLength === null}
              onChange={() => handleSessionLengthChange(null)}
              className={`w-4 h-4 text-sky-600 border-gray-300 focus:ring-sky-500 ${darkMode ? 'bg-gray-700 border-gray-600' : ''}`}
            />
            <span className={`ml-2 text-sm ${dm.textMuted} ${dm.hover}`}>
              {t.filterAnyLength}
            </span>
          </label>
          {SESSION_LENGTHS.map((length) => (
            <label key={length} className="flex items-center cursor-pointer group">
              <input
                type="radio"
                name="sessionLength"
                checked={filters.sessionLength === length}
                onChange={() => handleSessionLengthChange(length)}
                className={`w-4 h-4 text-sky-600 border-gray-300 focus:ring-sky-500 ${darkMode ? 'bg-gray-700 border-gray-600' : ''}`}
              />
              <span className={`ml-2 text-sm ${dm.textMuted} ${dm.hover}`}>
                {length} {t.filterMin}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Donation Amount Filter */}
      <div>
        <h4 className={`text-sm font-medium ${dm.textSubtle} mb-3`}>{t.filterPriceRange}</h4>
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center">
              <span className={`text-xs ${dm.textMuted} mr-1`}>$</span>
              <input
                type="number"
                min={0}
                max={100}
                value={filters.priceRange[0]}
                onChange={(e) => handlePriceRangeChange(Number(e.target.value), 0)}
                className={`w-14 px-1.5 py-1 text-xs border rounded focus:ring-sky-500 focus:border-sky-500 ${dm.input} ${dm.border}`}
              />
            </div>
            <span className={`${dm.textMuted} text-xs`}>~</span>
            <div className="flex items-center">
              <span className={`text-xs ${dm.textMuted} mr-1`}>$</span>
              <input
                type="number"
                min={0}
                max={100}
                value={filters.priceRange[1]}
                onChange={(e) => handlePriceRangeChange(Number(e.target.value), 1)}
                className={`w-14 px-1.5 py-1 text-xs border rounded focus:ring-sky-500 focus:border-sky-500 ${dm.input} ${dm.border}`}
              />
            </div>
            <span className={`text-xs ${dm.textMuted}`}>Donation</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={filters.priceRange[1]}
            onChange={(e) => handlePriceRangeChange(Number(e.target.value), 1)}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className={`sticky top-24 ${dm.bg} rounded-lg shadow-sm border ${dm.border} p-5 transition-colors duration-300`}>
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          <div className={`absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] ${dm.bg} shadow-xl transition-colors duration-300`}>
            <div className={`flex items-center justify-between p-4 border-b ${dm.border}`}>
              <h3 className={`text-lg font-semibold ${dm.text}`}>{t.filterTitle}</h3>
              <button
                onClick={onMobileClose}
                className={`p-2 hover:bg-gray-100 ${darkMode ? 'hover:bg-gray-700' : ''} rounded-full transition-colors`}
              >
                <X size={20} className={dm.textMuted} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto h-[calc(100%-65px)]">
              {sidebarContent}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

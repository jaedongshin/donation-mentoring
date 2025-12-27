'use client';

import { X } from 'lucide-react';
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
}

const SESSION_LENGTHS = [30, 45, 60];

export default function FilterSidebar({
  filters,
  onFilterChange,
  availableTags,
  availableLocations,
  lang,
  isMobileOpen = false,
  onMobileClose,
}: FilterSidebarProps) {
  const t = translations[lang];

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
        <h3 className="text-lg font-semibold text-gray-900">{t.filterTitle}</h3>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {t.filterClearAll}
          </button>
        )}
      </div>

      {/* Expertise Filter - 2 columns */}
      {availableTags.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">{t.filterExpertise}</h4>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
            {availableTags.map((tag) => (
              <label key={tag} className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.expertise.includes(tag)}
                  onChange={() => handleExpertiseToggle(tag)}
                  className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-1.5 text-xs text-gray-600 group-hover:text-gray-900 truncate">
                  {tag}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Location Filter - 2 columns */}
      {availableLocations.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">{t.filterLocation}</h4>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
            {availableLocations.map((location) => (
              <label key={location} className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.locations.includes(location)}
                  onChange={() => handleLocationToggle(location)}
                  className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-1.5 text-xs text-gray-600 group-hover:text-gray-900 truncate">
                  {location}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Session Length Filter */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">{t.filterSessionLength}</h4>
        <div className="space-y-2">
          <label className="flex items-center cursor-pointer group">
            <input
              type="radio"
              name="sessionLength"
              checked={filters.sessionLength === null}
              onChange={() => handleSessionLengthChange(null)}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-600 group-hover:text-gray-900">
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
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-600 group-hover:text-gray-900">
                {length} {t.filterMin}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Donation Amount Filter */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">{t.filterPriceRange}</h4>
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center">
              <span className="text-xs text-gray-500 mr-1">$</span>
              <input
                type="number"
                min={0}
                max={100}
                value={filters.priceRange[0]}
                onChange={(e) => handlePriceRangeChange(Number(e.target.value), 0)}
                className="w-14 px-1.5 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <span className="text-gray-400 text-xs">~</span>
            <div className="flex items-center">
              <span className="text-xs text-gray-500 mr-1">$</span>
              <input
                type="number"
                min={0}
                max={100}
                value={filters.priceRange[1]}
                onChange={(e) => handlePriceRangeChange(Number(e.target.value), 1)}
                className="w-14 px-1.5 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <span className="text-xs text-gray-500">Donation</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={filters.priceRange[1]}
            onChange={(e) => handlePriceRangeChange(Number(e.target.value), 1)}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-24 bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={onMobileClose}
          />
          <div className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{t.filterTitle}</h3>
              <button
                onClick={onMobileClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500" />
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

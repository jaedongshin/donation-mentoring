'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/utils/supabase';
import { Mentor } from '@/types/mentor';
import MentorCard from '@/app/components/MentorCard';
import FilterSidebar from '@/app/components/FilterSidebar';
import MentorModal from '@/app/components/MentorModal';
import { translations, Language } from '@/utils/i18n';
import { scrollToElement, shuffleArray } from '@/utils/helpers';
import Link from 'next/link';
import { Search, X, ChevronDown, ChevronUp, Filter, Users, Heart, Calendar, Video, ArrowDown, Moon, Sun } from 'lucide-react';
import { useMentorFilters, FilterState, DEFAULT_FILTERS } from '@/utils/useMentorFilters';

// Luxury two-tone palettes - sophisticated & professional
type LuxuryTheme = 'slate-burgundy' | 'navy-brass' | 'charcoal-dusty';

const LUXURY_THEMES = {
  'slate-burgundy': {
    label: 'Slate & Burgundy',
    // Primary (dark slate)
    primaryBg: 'bg-slate-800',
    primaryHover: 'hover:bg-slate-900',
    primaryText: 'text-slate-800',
    primaryLight: 'bg-slate-100',
    // Accent (wine/burgundy - sophisticated, not harsh)
    accentBg: 'bg-rose-800',
    accentHover: 'hover:bg-rose-900',
    accentText: 'text-rose-800',
    accentLight: 'bg-rose-50',
    accentBorder: 'border-rose-200',
    step1: { bg: 'bg-slate-100', text: 'text-slate-700' },
    step2: { bg: 'bg-rose-100', text: 'text-rose-800' },
    step3: { bg: 'bg-slate-100', text: 'text-slate-700' },
    step4: { bg: 'bg-rose-100', text: 'text-rose-800' },
    badge: 'bg-rose-800',
    bullet: 'text-rose-700',
  },
  'navy-brass': {
    label: 'Navy & Brass',
    // Primary (deep navy)
    primaryBg: 'bg-slate-900',
    primaryHover: 'hover:bg-slate-950',
    primaryText: 'text-slate-900',
    primaryLight: 'bg-slate-100',
    // Accent (brass/bronze - warmer, subtler than gold)
    accentBg: 'bg-yellow-700',
    accentHover: 'hover:bg-yellow-800',
    accentText: 'text-yellow-700',
    accentLight: 'bg-yellow-50',
    accentBorder: 'border-yellow-200',
    step1: { bg: 'bg-slate-100', text: 'text-slate-700' },
    step2: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    step3: { bg: 'bg-slate-100', text: 'text-slate-700' },
    step4: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    badge: 'bg-yellow-700',
    bullet: 'text-yellow-700',
  },
  'charcoal-dusty': {
    label: 'Charcoal & Dusty Blue',
    // Primary (charcoal)
    primaryBg: 'bg-neutral-800',
    primaryHover: 'hover:bg-neutral-900',
    primaryText: 'text-neutral-800',
    primaryLight: 'bg-neutral-100',
    // Accent (sky blue - soothing but visible in dark mode)
    accentBg: 'bg-sky-600',
    accentHover: 'hover:bg-sky-700',
    accentText: 'text-sky-600',
    accentLight: 'bg-sky-50',
    accentBorder: 'border-sky-200',
    step1: { bg: 'bg-neutral-100', text: 'text-neutral-700' },
    step2: { bg: 'bg-sky-100', text: 'text-sky-700' },
    step3: { bg: 'bg-neutral-100', text: 'text-neutral-700' },
    step4: { bg: 'bg-sky-100', text: 'text-sky-700' },
    badge: 'bg-sky-600',
    bullet: 'text-sky-600',
  },
};

export default function Home() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lang, setLang] = useState<Language>('ko');
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [showDetailedSteps, setShowDetailedSteps] = useState(false);
  const [luxuryTheme, setLuxuryTheme] = useState<LuxuryTheme>('slate-burgundy');
  const [darkMode, setDarkMode] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const mentorsSectionRef = useRef<HTMLElement>(null);

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Get base theme, then adjust charcoal-dusty accent for light/dark mode
  const baseTheme = LUXURY_THEMES[luxuryTheme];
  const theme = luxuryTheme === 'charcoal-dusty'
    ? {
        ...baseTheme,
        // Light mode: muted slate, Dark mode: vibrant sky
        accentBg: darkMode ? 'bg-sky-600' : 'bg-slate-500',
        accentHover: darkMode ? 'hover:bg-sky-700' : 'hover:bg-slate-600',
        accentText: darkMode ? 'text-sky-500' : 'text-slate-600',
        accentLight: darkMode ? 'bg-sky-900/30' : 'bg-slate-100',
      }
    : baseTheme;

  // Dark mode classes
  const dm = {
    bg: darkMode ? 'bg-gray-900' : 'bg-gray-50',
    bgCard: darkMode ? 'bg-gray-800' : 'bg-white',
    bgCardAlt: darkMode ? 'bg-gray-800/50' : 'bg-gray-50',
    text: darkMode ? 'text-gray-100' : 'text-gray-900',
    textMuted: darkMode ? 'text-gray-400' : 'text-gray-600',
    textSubtle: darkMode ? 'text-gray-500' : 'text-gray-500',
    border: darkMode ? 'border-gray-700' : 'border-gray-100',
    headerBg: darkMode ? 'bg-gray-900/95' : 'bg-white/95',
  };

  const { filteredMentors, availableTags, availableLocations, activeFilterCount, hasActiveFilters } =
    useMentorFilters({ mentors, search, lang, filters });

  const fetchMentors = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('mentors')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching mentors:', error);
      setMentors([]);
    } else {
      setMentors(shuffleArray(data || []));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMentors();
  }, []);

  const t = translations[lang];

  const clearFilters = () => setFilters(DEFAULT_FILTERS);

  const scrollToMentors = () => {
    mentorsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className={`min-h-screen ${dm.bg} scroll-smooth transition-colors duration-300`}>
      {/* Sticky Navigation */}
      <header className={`${dm.headerBg} backdrop-blur-sm shadow-sm sticky top-0 z-40 transition-colors duration-300`}>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className={`text-lg font-bold ${dm.text} flex-shrink-0`}>
              {t.title}
            </Link>

            {/* Subtle Theme Selector */}
            <div className="hidden md:flex items-center gap-1 text-xs">
              {(Object.keys(LUXURY_THEMES) as LuxuryTheme[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setLuxuryTheme(key)}
                  className={`px-2 py-1 rounded transition-all ${
                    luxuryTheme === key
                      ? `${theme.primaryBg} text-white`
                      : `${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`
                  }`}
                >
                  {LUXURY_THEMES[key].label}
                </button>
              ))}
              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`ml-2 p-1.5 rounded-lg transition-all ${
                  darkMode ? 'bg-gray-700 text-amber-400' : 'bg-gray-100 text-gray-600'
                }`}
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun size={14} /> : <Moon size={14} />}
              </button>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {!searchExpanded && (
                <>
                  <nav className="hidden sm:flex items-center gap-1">
                    <a
                      href="#hero"
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToElement('hero');
                      }}
                      className={`px-3 py-1.5 text-sm font-medium ${dm.textMuted} hover:${dm.text} ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} rounded-lg transition-colors`}
                    >
                      {t.navHowItWorks}
                    </a>
                    <a
                      href="#mentors"
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToMentors();
                      }}
                      className={`px-3 py-1.5 text-sm font-medium ${dm.textMuted} hover:${dm.text} ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} rounded-lg transition-colors`}
                    >
                      {t.navMentors}
                    </a>
                  </nav>

                  <button
                    onClick={() => setSearchExpanded(true)}
                    className={`p-2 ${dm.textMuted} hover:${dm.text} ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} rounded-lg transition-colors`}
                    aria-label="Search"
                  >
                    <Search size={18} />
                  </button>
                </>
              )}

              {searchExpanded && (
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      autoFocus
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={t.searchPlaceholder}
                      className={`w-full pl-9 pr-3 py-1.5 text-sm ${dm.bgCard} ${dm.text} border ${dm.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    />
                  </div>
                  <button
                    onClick={() => {
                      setSearchExpanded(false);
                      setSearch('');
                    }}
                    className={`p-2 ${dm.textMuted} hover:${dm.text} ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} rounded-lg transition-colors`}
                    aria-label="Close search"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}

              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as Language)}
                className={`text-sm font-medium ${dm.textMuted} ${dm.bgCard} border ${dm.border} rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                <option value="ko">🇰🇷 KO</option>
                <option value="en">🇺🇸 EN</option>
              </select>

              <Link
                href="/admin"
                className={`text-sm font-medium ${dm.textMuted} hover:${dm.text} transition-colors`}
              >
                Admin
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Bento Style with Parallax */}
      <section id="hero" className={`${darkMode ? 'bg-gradient-to-b from-gray-900 to-gray-800' : 'bg-gradient-to-b from-white via-gray-50 to-gray-100'} py-8 sm:py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 overflow-hidden relative`}>
        {/* Parallax Background Elements */}
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          aria-hidden="true"
        >
          <div
            className={`absolute -top-20 -right-20 w-72 h-72 ${darkMode ? 'bg-gray-700/20' : 'bg-gray-200/40'} rounded-full blur-3xl`}
            style={{ transform: `translateY(${scrollY * 0.1}px)` }}
          />
          <div
            className={`absolute top-1/2 -left-20 w-64 h-64 ${darkMode ? 'bg-gray-700/20' : 'bg-gray-200/40'} rounded-full blur-3xl`}
            style={{ transform: `translateY(${scrollY * 0.15}px)` }}
          />
        </div>

        <div className="max-w-6xl mx-auto relative">
          {/* About Row - Bento Cards with parallax hover */}
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4"
            style={{ transform: `translateY(${scrollY * 0.02}px)` }}
          >
            <div className={`${dm.bgCard} rounded-2xl p-4 sm:p-5 shadow-sm border ${dm.border} hover:shadow-lg hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm`}>
              <h2 className={`text-base sm:text-lg font-bold ${dm.text} mb-2`}>{t.mentoringTitle}</h2>
              <p className={`${dm.textMuted} text-xs sm:text-sm leading-relaxed`}>{t.mentoringDesc}</p>
            </div>
            <div className={`${dm.bgCard} rounded-2xl p-4 sm:p-5 shadow-sm border ${dm.border} hover:shadow-lg hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm`}>
              <h2 className={`text-base sm:text-lg font-bold ${dm.text} mb-2`}>{t.donationMentoringTitle}</h2>
              <p className={`${dm.textMuted} text-xs sm:text-sm leading-relaxed`}>{t.donationMentoringDesc}</p>
            </div>
          </div>

          {/* Values Row - Bento Cards */}
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4"
            style={{ transform: `translateY(${scrollY * 0.03}px)` }}
          >
            <div className={`${dm.bgCard} rounded-2xl p-4 sm:p-5 shadow-sm border ${dm.border} hover:shadow-lg hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm`}>
              <h3 className={`text-sm sm:text-base font-semibold ${dm.text} mb-2 sm:mb-3 flex items-center gap-2`}>
                <span className={`w-7 h-7 sm:w-8 sm:h-8 ${theme.primaryLight} rounded-lg flex items-center justify-center`}>
                  <Users size={14} className={`${theme.primaryText} sm:w-4 sm:h-4`} />
                </span>
                {t.mentorValueTitle}
              </h3>
              <ul className="space-y-1 sm:space-y-1.5">
                {t.mentorValuePoints.map((point, i) => (
                  <li key={i} className={`${dm.textMuted} text-[11px] sm:text-xs flex items-start gap-2`}>
                    <span className={`${theme.bullet} mt-0.5`}>•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className={`${dm.bgCard} rounded-2xl p-4 sm:p-5 shadow-sm border ${dm.border} hover:shadow-lg hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm`}>
              <h3 className={`text-sm sm:text-base font-semibold ${dm.text} mb-2 sm:mb-3 flex items-center gap-2`}>
                <span className={`w-7 h-7 sm:w-8 sm:h-8 ${theme.accentLight} rounded-lg flex items-center justify-center`}>
                  <Heart size={14} className={`${theme.accentText} sm:w-4 sm:h-4`} />
                </span>
                {t.menteeValueTitle}
              </h3>
              <ul className="space-y-1 sm:space-y-1.5">
                {t.menteeValuePoints.map((point, i) => (
                  <li key={i} className={`${dm.textMuted} text-[11px] sm:text-xs flex items-start gap-2`}>
                    <span className={`${theme.bullet} mt-0.5`}>•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* How it Works - Bento Card */}
          <div className={`${dm.bgCardAlt} rounded-2xl p-4 sm:p-6 shadow-sm border ${dm.border} transition-all`}>
            <h2 className={`text-lg sm:text-xl font-bold ${dm.text} mb-4 sm:mb-6 text-center`}>{t.howToDonate}</h2>

            {/* 4 Steps - Icons use primary, Numbers use accent */}
            <div className="grid grid-cols-4 gap-1.5 sm:gap-3 mb-3 sm:mb-4">
              <div className="text-center group">
                <div className={`w-9 h-9 sm:w-12 sm:h-12 mx-auto mb-1.5 sm:mb-2 ${theme.primaryLight} rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <Users className={`w-4 h-4 sm:w-5 sm:h-5 ${theme.primaryText}`} />
                </div>
                <div className={`inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 ${theme.accentBg} text-white text-[9px] sm:text-[10px] font-bold rounded-full mb-1`}>
                  1
                </div>
                <h3 className={`text-[10px] sm:text-xs font-semibold ${dm.text} mb-0.5`}>{t.howToStep1Title}</h3>
                <p className={`${dm.textSubtle} text-[9px] sm:text-[10px] hidden sm:block leading-tight`}>{t.howToStep1Desc}</p>
              </div>

              <div className="text-center group">
                <div className={`w-9 h-9 sm:w-12 sm:h-12 mx-auto mb-1.5 sm:mb-2 ${theme.primaryLight} rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${theme.primaryText}`} />
                </div>
                <div className={`inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 ${theme.accentBg} text-white text-[9px] sm:text-[10px] font-bold rounded-full mb-1`}>
                  2
                </div>
                <h3 className={`text-[10px] sm:text-xs font-semibold ${dm.text} mb-0.5`}>{t.howToStep2Title}</h3>
                <p className={`${dm.textSubtle} text-[9px] sm:text-[10px] hidden sm:block leading-tight`}>{t.howToStep2Desc}</p>
              </div>

              <div className="text-center group">
                <div className={`w-9 h-9 sm:w-12 sm:h-12 mx-auto mb-1.5 sm:mb-2 ${theme.primaryLight} rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <Calendar className={`w-4 h-4 sm:w-5 sm:h-5 ${theme.primaryText}`} />
                </div>
                <div className={`inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 ${theme.accentBg} text-white text-[9px] sm:text-[10px] font-bold rounded-full mb-1`}>
                  3
                </div>
                <h3 className={`text-[10px] sm:text-xs font-semibold ${dm.text} mb-0.5`}>{t.howToStep3Title}</h3>
                <p className={`${dm.textSubtle} text-[9px] sm:text-[10px] hidden sm:block leading-tight`}>{t.howToStep3Desc}</p>
              </div>

              <div className="text-center group">
                <div className={`w-9 h-9 sm:w-12 sm:h-12 mx-auto mb-1.5 sm:mb-2 ${theme.primaryLight} rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <Video className={`w-4 h-4 sm:w-5 sm:h-5 ${theme.primaryText}`} />
                </div>
                <div className={`inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 ${theme.accentBg} text-white text-[9px] sm:text-[10px] font-bold rounded-full mb-1`}>
                  4
                </div>
                <h3 className={`text-[10px] sm:text-xs font-semibold ${dm.text} mb-0.5`}>{t.howToStep4Title}</h3>
                <p className={`${dm.textSubtle} text-[9px] sm:text-[10px] hidden sm:block leading-tight`}>{t.howToStep4Desc}</p>
              </div>
            </div>

            {/* Subtle Detailed Steps (between steps and CTA) */}
            <button
              onClick={() => setShowDetailedSteps(!showDetailedSteps)}
              className="mx-auto flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mb-4 transition-colors"
            >
              <span>{t.howToDetailedTitle}</span>
              {showDetailedSteps ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showDetailedSteps && (
              <div className={`${dm.bgCard} rounded-xl p-4 mb-4 border ${dm.border}`}>
                <ol className="space-y-2 text-xs">
                  {t.howToDonateSteps.map((step, index) => {
                    const urlMatch = step.match(/\(https?:\/\/[^)]+\)/);
                    if (urlMatch) {
                      const url = urlMatch[0].slice(1, -1);
                      const parts = step.split(urlMatch[0]);
                      return (
                        <li key={index} className={`flex items-start gap-2 ${dm.textMuted}`}>
                          <span className={`flex-shrink-0 w-5 h-5 ${theme.accentBg} text-white rounded-full flex items-center justify-center text-[10px] font-bold`}>
                            {index + 1}
                          </span>
                          <span>
                            {parts[0]}
                            <a href={url} target="_blank" rel="noopener noreferrer" className={`${theme.accentText} hover:underline`}>
                              {url}
                            </a>
                            {parts[1]}
                          </span>
                        </li>
                      );
                    }
                    return (
                      <li key={index} className={`flex items-start gap-2 ${dm.textMuted}`}>
                        <span className={`flex-shrink-0 w-5 h-5 ${theme.accentBg} text-white rounded-full flex items-center justify-center text-[10px] font-bold`}>
                          {index + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}

          </div>

          {/* CTA Button - Outside the bento box */}
          <div className="text-center mt-4 sm:mt-6">
            <button
              onClick={scrollToMentors}
              className={`inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 ${theme.accentBg} ${theme.accentHover} text-white text-sm font-medium rounded-lg transition-all shadow-md hover:shadow-lg active:scale-[0.98] group`}
            >
              <span>{t.findMentors}</span>
              <ArrowDown size={16} className="group-hover:translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Mentors Section */}
      <section ref={mentorsSectionRef} id="mentors" className={`${dm.bg} py-10 scroll-mt-14 transition-colors duration-300`}>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-xl font-bold ${dm.text}`}>{t.navMentors}</h2>

            <button
              onClick={() => setMobileFilterOpen(true)}
              className={`lg:hidden flex items-center gap-2 px-3 py-1.5 ${dm.bgCard} border ${dm.border} rounded-lg text-sm font-medium ${dm.textMuted} hover:opacity-80 transition-colors`}
            >
              <Filter size={16} />
              <span>{t.filterTitle}</span>
              {activeFilterCount > 0 && (
                <span className={`${theme.accentBg} text-white text-xs font-bold px-1.5 py-0.5 rounded-full`}>
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          <div className="flex gap-6">
            <FilterSidebar
              filters={filters}
              onFilterChange={setFilters}
              availableTags={availableTags}
              availableLocations={availableLocations}
              lang={lang}
              isMobileOpen={mobileFilterOpen}
              onMobileClose={() => setMobileFilterOpen(false)}
            />

            <main className="flex-1 min-w-0">
              {loading ? (
                <div className={`text-center py-12 ${dm.textMuted}`}>{t.loading}</div>
              ) : filteredMentors.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {filteredMentors.map((mentor) => (
                    <MentorCard
                      key={mentor.id}
                      mentor={mentor}
                      lang={lang}
                      onClick={setSelectedMentor}
                      theme={theme}
                      darkMode={dm}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  message={t.noMentors}
                  showClearButton={hasActiveFilters}
                  clearButtonText={t.filterClearAll}
                  onClear={clearFilters}
                />
              )}
            </main>
          </div>

          {/* Back to Top Button */}
          {filteredMentors.length > 0 && (
            <div className="flex justify-center mt-10 pt-6 border-t border-gray-200/50">
              <button
                onClick={scrollToMentors}
                className={`flex flex-col items-center gap-1 ${dm.textMuted} hover:${dm.text} transition-colors group`}
                aria-label="Back to top of mentor list"
              >
                <ChevronUp size={24} className="group-hover:-translate-y-1 transition-transform" />
                <span className="text-xs font-medium opacity-60">Top</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Mentor Detail Modal */}
      {selectedMentor && (
        <MentorModal
          mentor={selectedMentor}
          lang={lang}
          onClose={() => setSelectedMentor(null)}
          theme={theme}
          darkMode={dm}
        />
      )}

      {/* Footer */}
      <footer className={`${dm.bg} border-t ${dm.border} py-6 transition-colors duration-300`}>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className={`text-sm ${dm.textMuted}`}>
            © 2024 Donation Mentoring. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

interface EmptyStateProps {
  message: string;
  showClearButton: boolean;
  clearButtonText: string;
  onClear: () => void;
}

function EmptyState({ message, showClearButton, clearButtonText, onClear }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="text-gray-400 mb-4">
        <Search size={48} className="mx-auto" />
      </div>
      <p className="text-gray-500 mb-4">{message}</p>
      {showClearButton && (
        <button onClick={onClear} className="text-blue-600 hover:text-blue-800 font-medium">
          {clearButtonText}
        </button>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/utils/supabase';
import { Mentor } from '@/types/mentor';
import MentorCard from '@/app/components/MentorCard';
import FilterSidebar from '@/app/components/FilterSidebar';
import MentorModal from '@/app/components/MentorModal';
import MentorApplicationModal from '@/app/components/MentorApplicationModal';
import { translations, Language } from '@/utils/i18n';
import { scrollToElement, shuffleArray } from '@/utils/helpers';
import Link from 'next/link';
import { Search, X, ChevronDown, ChevronUp, Filter, Users, Heart, Calendar, Video, Moon, Sun, Plus, User } from 'lucide-react';
import { useMentorFilters, FilterState, DEFAULT_FILTERS } from '@/utils/useMentorFilters';

// Charcoal & Dusty Blue theme - locked in
const BASE_THEME = {
  primaryBg: 'bg-neutral-800',
  primaryHover: 'hover:bg-neutral-900',
  primaryText: 'text-neutral-800',
  primaryLight: 'bg-neutral-100',
  accentBg: 'bg-sky-600',
  accentHover: 'hover:bg-sky-700',
  accentText: 'text-sky-600',
  accentLight: 'bg-sky-50',
  accentBorder: 'border-sky-200',
  badge: 'bg-sky-600',
  bullet: 'text-sky-600',
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
  const [darkMode, setDarkMode] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  const [isMentorModalOpen, setIsMentorModalOpen] = useState(false);
  const mentorsSectionRef = useRef<HTMLElement>(null);

  // Persist dark mode across site
  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) setDarkMode(saved === 'true');
  }, []);

  const toggleDarkMode = () => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    localStorage.setItem('darkMode', String(newValue));
  };

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Theme - same sky blue accent for both modes, slight adjustments for contrast
  const theme = {
    ...BASE_THEME,
    accentText: darkMode ? 'text-sky-500' : 'text-sky-600',
    accentLight: darkMode ? 'bg-sky-900/30' : 'bg-sky-50',
  };

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
            {/* Logo */}
            <Link href="/" className={`text-lg font-bold ${dm.text} flex-shrink-0 mr-8`}>
              {t.title}
            </Link>

            {/* Right side controls */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {!searchExpanded && (
                <>
                  <nav className="hidden sm:flex items-center gap-1 mr-2">
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
                <div className="flex items-center gap-1.5 flex-1 max-w-md">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      autoFocus
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={t.searchPlaceholder}
                      className={`w-full pl-9 pr-3 py-1.5 text-sm ${dm.bgCard} ${dm.text} border ${dm.border} rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500/40 focus:border-sky-500/40`}
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

              <button
                onClick={() => setIsMentorModalOpen(true)}
                className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors cursor-pointer"
              >
                <Plus size={18} />
                {t.addMentor}
              </button>

              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as Language)}
                className={`text-sm font-medium ${dm.textMuted} ${dm.bgCard} border ${dm.border} rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                <option value="ko">🇰🇷 KO</option>
                <option value="en">🇺🇸 EN</option>
              </select>

              {/* Dark mode toggle */}
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg transition-all ${
                  darkMode ? 'bg-gray-700 text-amber-400' : 'bg-gray-100 text-gray-600'
                }`}
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>

              {/* Admin/Login */}
              <Link
                href="/admin"
                className={`p-2 ${dm.textMuted} hover:${dm.text} ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} rounded-lg transition-colors`}
                aria-label="Admin"
              >
                <User size={18} />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Bento Style with Parallax */}
      <section id="hero" className={`${darkMode ? 'bg-gradient-to-b from-gray-900 to-gray-800' : 'bg-gradient-to-b from-white via-gray-50 to-gray-100'} py-4 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 overflow-hidden relative`}>
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
          {/* How it Works - Bento Card */}
          <div className={`${dm.bgCardAlt} rounded-2xl p-3 sm:p-4 md:p-6 shadow-sm border ${dm.border} transition-all`}>
            {/* About Section - Bento Cards - Always visible */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 sm:mb-4 md:mb-6">
              <div className={`${dm.bgCardAlt} rounded-xl p-4 border ${dm.border} hover:shadow-lg hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm`}>
                <h3 className={`text-sm font-semibold ${dm.text} mb-2`}>{t.mentoringTitle}</h3>
                <p className={`${dm.textMuted} text-xs leading-relaxed`}>{t.mentoringDesc}</p>
              </div>
              <div className={`${dm.bgCardAlt} rounded-xl p-4 border ${dm.border} hover:shadow-lg hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm`}>
                <h3 className={`text-sm font-semibold ${dm.text} mb-2`}>{t.donationMentoringTitle}</h3>
                <p className={`${dm.textMuted} text-xs leading-relaxed`}>{t.donationMentoringDesc}</p>
              </div>
            </div>

            {/* Values Section - Bento Cards - Always visible */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 sm:mb-4 md:mb-6">
              <div className={`${dm.bgCardAlt} rounded-xl p-4 border ${dm.border} hover:shadow-lg hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-7 h-7 ${theme.primaryLight} rounded-lg flex items-center justify-center`}>
                    <Users size={14} className={theme.primaryText} />
                  </span>
                  <span className={`text-sm font-medium ${dm.text}`}>{t.mentorValueTitle}</span>
                </div>
                <ul className="space-y-1.5">
                  {t.mentorValuePoints.map((point, i) => (
                    <li key={i} className={`${dm.textMuted} text-xs flex items-start gap-2`}>
                      <span className={`${theme.bullet} mt-0.5`}>•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={`${dm.bgCardAlt} rounded-xl p-4 border ${dm.border} hover:shadow-lg hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-7 h-7 ${theme.primaryLight} rounded-lg flex items-center justify-center`}>
                    <Heart size={14} className={theme.accentText} />
                  </span>
                  <span className={`text-sm font-medium ${dm.text}`}>{t.menteeValueTitle}</span>
                </div>
                <ul className="space-y-1.5">
                  {t.menteeValuePoints.map((point, i) => (
                    <li key={i} className={`${dm.textMuted} text-xs flex items-start gap-2`}>
                      <span className={`${theme.bullet} mt-0.5`}>•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <h2 className={`text-base sm:text-lg md:text-xl font-bold ${dm.text} mb-3 sm:mb-4 md:mb-6 text-center`}>{t.howToDonate}</h2>

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

            {/* Learn More Toggle */}
            <button
              onClick={() => setShowDetailedSteps(!showDetailedSteps)}
              className={`mx-auto flex items-center gap-1 text-xs ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'} transition-colors cursor-pointer`}
            >
              <span>{t.moreDetails}</span>
              {showDetailedSteps ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showDetailedSteps && (
              <div className={`${dm.bgCard} rounded-xl p-4 mt-3 border ${dm.border} space-y-4`}>
                {/* Detailed steps */}
                <div className={`pt-3 border-t ${dm.border}`}>
                  <h4 className={`text-xs font-medium ${dm.textMuted} mb-3`}>{t.howToDetailedTitle}</h4>
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
              </div>
            )}

          </div>


        </div>
      </section>

      {/* Mentors Section */}
      <section ref={mentorsSectionRef} id="mentors" className={`${dm.bg} py-10 scroll-mt-14 transition-colors duration-300`}>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Sticky section header - stays visible while browsing mentors */}
          <div className={`flex items-center justify-between mb-6 sticky top-14 z-20 ${dm.bg} py-2 -mt-2 lg:static`}>
            <h2 className={`text-xl font-bold ${dm.text}`}>{t.navMentors}</h2>

            <button
              onClick={() => setMobileFilterOpen(true)}
              className={`lg:hidden flex items-center gap-2 px-3 py-1.5 ${dm.bgCard} border ${dm.border} rounded-lg text-sm font-medium ${dm.textMuted} hover:opacity-80 transition-colors cursor-pointer`}
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
              darkMode={darkMode}
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

      <MentorApplicationModal
        isOpen={isMentorModalOpen}
        onClose={() => setIsMentorModalOpen(false)}
        lang={lang}
        darkMode={darkMode}
      />

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

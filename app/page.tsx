'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/utils/supabase';
import { Mentor } from '@/types/mentor';
import MentorCard from '@/app/components/MentorCard';
import { translations, Language } from '@/utils/i18n';
import { ensureProtocol, getMentorDisplay, shuffleArray } from '@/utils/helpers';
import Link from 'next/link';
import Image from 'next/image';
import { Search, X, Briefcase, MapPin, Building2, Linkedin, Calendar, Mail, ChevronDown } from 'lucide-react';

// Custom hook for debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export default function Home() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [lang, setLang] = useState<Language>('ko');
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

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
      const shuffledMentors = shuffleArray(data || []);
      setMentors(shuffledMentors);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMentors();
  }, []);

  const filteredMentors = useMemo(() => {
    return mentors.filter(mentor => {
      const query = debouncedSearch.toLowerCase();
      const supportedLangs = (mentor.languages || []).map(l => l.toLowerCase());
      const isKorean = lang === 'ko';

      const matchesLang = isKorean
        ? supportedLangs.some(l => l.includes('korean') || l.includes('한국어') || l.includes('ko'))
        : supportedLangs.some(l => l.includes('english') || l.includes('영어') || l.includes('en'));

      if (!matchesLang) return false;

      const tags = mentor.tags || [];
      const allText = [
        mentor.name_en, mentor.name_ko,
        mentor.location_en, mentor.location_ko,
        mentor.position_en, mentor.position_ko,
        mentor.company_en, mentor.company_ko,
        mentor.description_en, mentor.description_ko,
        ...tags
      ].filter(Boolean).join(' ').toLowerCase();

      return allText.includes(query);
    });
  }, [mentors, debouncedSearch, lang]);

  const t = translations[lang];

  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-warm-50">
      {/* Airbnb-style Header */}
      <header className="bg-white sticky top-0 z-30 border-b border-warm-200">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[72px]">
            {/* Logo */}
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-primary-500">{t.title}</h1>
            </div>

            {/* Center Search Bar */}
            <div className="flex-1 max-w-xl mx-4 sm:mx-8">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-warm-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-4 py-3 border border-warm-300 rounded-full bg-white text-warm-900 placeholder-warm-400 text-sm
                    shadow-sm hover:shadow-md focus:shadow-md focus:outline-none focus:ring-1 focus:ring-warm-300 transition-all"
                  placeholder={t.searchPlaceholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as Language)}
                className="text-sm font-medium text-warm-700 bg-transparent border-none focus:outline-none cursor-pointer"
              >
                <option value="ko">🇰🇷</option>
                <option value="en">🇺🇸</option>
              </select>

              <Link
                href="/admin"
                className="text-sm font-medium text-warm-600 hover:text-warm-900 transition-colors"
              >
                Admin
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mentors Grid */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mb-4" />
            <p className="text-warm-500">{t.loading}</p>
          </div>
        ) : filteredMentors.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredMentors.map((mentor, index) => (
              <div
                key={mentor.id}
                className="animate-fade-in-up opacity-0"
                style={{ animationDelay: `${Math.min(index * 50, 400)}ms` }}
              >
                <MentorCard
                  mentor={mentor}
                  lang={lang}
                  onClick={(m) => setSelectedMentor(m)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-warm-500 text-lg">{t.noMentors}</p>
          </div>
        )}
      </main>

      {/* Accordion Section */}
      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl border border-warm-100 overflow-hidden">
          {/* About Accordion */}
          <div className="border-b border-warm-100">
            <button
              onClick={() => toggleAccordion('about')}
              className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-warm-50 transition-colors"
            >
              <span className="text-lg font-semibold text-warm-900">{t.navAbout}</span>
              <ChevronDown
                className={`w-5 h-5 text-warm-500 transition-transform duration-300 ${openAccordion === 'about' ? 'rotate-180' : ''}`}
              />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${openAccordion === 'about' ? 'max-h-[500px]' : 'max-h-0'}`}>
              <div className="px-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-semibold text-warm-900 mb-3">{t.mentoringTitle}</h3>
                    <p className="text-warm-600 leading-relaxed">{t.mentoringDesc}</p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-warm-900 mb-3">{t.donationMentoringTitle}</h3>
                    <p className="text-warm-600 leading-relaxed">{t.donationMentoringDesc}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Values Accordion */}
          <div className="border-b border-warm-100">
            <button
              onClick={() => toggleAccordion('values')}
              className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-warm-50 transition-colors"
            >
              <span className="text-lg font-semibold text-warm-900">{t.navValues}</span>
              <ChevronDown
                className={`w-5 h-5 text-warm-500 transition-transform duration-300 ${openAccordion === 'values' ? 'rotate-180' : ''}`}
              />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${openAccordion === 'values' ? 'max-h-[600px]' : 'max-h-0'}`}>
              <div className="px-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-semibold text-warm-900 mb-4">{t.mentorValueTitle}</h3>
                    <ul className="space-y-3">
                      {t.mentorValuePoints.map((point, index) => (
                        <li key={index} className="flex items-start">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-secondary-500 text-white text-xs flex items-center justify-center mr-3 mt-0.5">✓</span>
                          <span className="text-warm-600">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-warm-900 mb-4">{t.menteeValueTitle}</h3>
                    <ul className="space-y-3">
                      {t.menteeValuePoints.map((point, index) => (
                        <li key={index} className="flex items-start">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center mr-3 mt-0.5">✓</span>
                          <span className="text-warm-600">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* How to Accordion */}
          <div>
            <button
              onClick={() => toggleAccordion('howto')}
              className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-warm-50 transition-colors"
            >
              <span className="text-lg font-semibold text-warm-900">{t.navHowTo}</span>
              <ChevronDown
                className={`w-5 h-5 text-warm-500 transition-transform duration-300 ${openAccordion === 'howto' ? 'rotate-180' : ''}`}
              />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${openAccordion === 'howto' ? 'max-h-[800px]' : 'max-h-0'}`}>
              <div className="px-6 pb-6">
                <ol className="space-y-4 max-w-3xl">
                  {t.howToDonateSteps.map((step, index) => {
                    const urlMatch = step.match(/\(https?:\/\/[^)]+\)/);
                    if (urlMatch) {
                      const url = urlMatch[0].slice(1, -1);
                      const parts = step.split(urlMatch[0]);
                      return (
                        <li key={index} className="flex items-start">
                          <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-primary-500 text-white rounded-full font-semibold text-sm mr-4">
                            {index + 1}
                          </span>
                          <span className="text-warm-600 leading-relaxed pt-1">
                            {parts[0]}
                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                              ({url})
                            </a>
                            {parts[1]}
                          </span>
                        </li>
                      );
                    }
                    return (
                      <li key={index} className="flex items-start">
                        <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-primary-500 text-white rounded-full font-semibold text-sm mr-4">
                          {index + 1}
                        </span>
                        <span className="text-warm-600 leading-relaxed pt-1">{step}</span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-warm-200 bg-white py-6">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-warm-500">
          © 2024 Donation Mentoring. All rights reserved.
        </div>
      </footer>

      {/* Detail Popup Modal */}
      {selectedMentor && (() => {
        const display = getMentorDisplay(selectedMentor, lang);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedMentor(null)}></div>

            <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col animate-scale-in">
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={() => setSelectedMentor(null)}
                  className="p-2 bg-white rounded-full hover:bg-warm-100 transition-all shadow-md"
                >
                  <X size={20} className="text-warm-600" />
                </button>
              </div>

              <div className="relative h-72 w-full bg-warm-100 shrink-0 overflow-hidden">
                {selectedMentor.picture_url && !imageErrors.has(selectedMentor.picture_url) ? (
                  <>
                    <Image
                      src={selectedMentor.picture_url}
                      alt={display.name}
                      fill
                      className="object-cover"
                      unoptimized={selectedMentor.picture_url.includes('supabase.co')}
                      onError={() => setImageErrors(prev => new Set(prev).add(selectedMentor.picture_url!))}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-warm-400 text-lg">
                    No Image
                  </div>
                )}
              </div>

              <div className="p-6 sm:p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-warm-900 mb-3">{display.name}</h2>
                  <div className="flex flex-col gap-2 text-warm-600">
                    <div className="flex items-center">
                      <Briefcase className="mr-2 text-primary-500 w-5 h-5" />
                      <span className="font-medium">{display.position}</span>
                    </div>
                    {display.company && (
                      <div className="flex items-center">
                        <Building2 className="mr-2 text-primary-500 w-5 h-5" />
                        <span>{display.company}</span>
                      </div>
                    )}
                    <div className="flex items-center text-warm-500">
                      <MapPin className="mr-2 text-warm-400 w-5 h-5" />
                      <span>{display.location}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {selectedMentor.tags?.map((tag, index) => (
                    <span key={index} className="px-3 py-1 bg-warm-100 text-warm-700 text-sm font-medium rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="text-warm-600 mb-8 whitespace-pre-line leading-relaxed">
                  {display.description}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-warm-100">
                  {selectedMentor.calendly_url && (
                    <a
                      href={ensureProtocol(selectedMentor.calendly_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 flex-1 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors"
                    >
                      <Calendar size={20} />
                      <span>Book Session</span>
                    </a>
                  )}
                  {selectedMentor.email && (
                    <a
                      href={`mailto:${selectedMentor.email}`}
                      className="flex items-center justify-center gap-2 flex-1 px-6 py-3 bg-white border border-warm-300 text-warm-700 hover:bg-warm-50 font-semibold rounded-lg transition-colors"
                    >
                      <Mail size={20} />
                      <span>Email</span>
                    </a>
                  )}
                  {selectedMentor.linkedin_url && (
                    <a
                      href={ensureProtocol(selectedMentor.linkedin_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 flex-1 px-6 py-3 bg-[#0A66C2] hover:bg-[#004182] text-white font-semibold rounded-lg transition-colors"
                    >
                      <Linkedin size={20} />
                      <span>LinkedIn</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

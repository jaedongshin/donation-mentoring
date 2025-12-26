'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Mentor } from '@/types/mentor';
import MentorCard from '@/app/components/MentorCard';
import { translations, Language } from '@/utils/i18n';
import { ensureProtocol, getMentorDisplay, scrollToElement, shuffleArray } from '@/utils/helpers';
import Link from 'next/link';
import Image from 'next/image';
import { Search, X, Briefcase, MapPin, Building2, Linkedin, Calendar, Mail } from 'lucide-react';

export default function Home() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lang, setLang] = useState<Language>('ko');
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const fetchMentors = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('mentors')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching mentors:', error);
      setMentors([]); // Ensure mentors array is empty on error
    } else {
      // Randomly shuffle mentors for even distribution
      const shuffledMentors = shuffleArray(data || []);
      setMentors(shuffledMentors);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMentors();
  }, []);

  const filteredMentors = mentors.filter(mentor => {
    const query = search.toLowerCase();
    
    // Language filtering
    const supportedLangs = (mentor.languages || []).map(l => l.toLowerCase());
    const isKorean = lang === 'ko';
    
    // Strict filtering: Mentors must explicitly contain the selected language
    const matchesLang = isKorean 
      ? supportedLangs.some(l => l.includes('korean') || l.includes('한국어') || l.includes('ko'))
      : supportedLangs.some(l => l.includes('english') || l.includes('영어') || l.includes('en'));

    // If language data is missing or doesn't match, hide the mentor
    if (!matchesLang) return false;

    const tags = mentor.tags || [];
    const allText = [
      mentor.name_en, mentor.name_ko,
      mentor.location_en, mentor.location_ko,
      mentor.position_en, mentor.position_ko,
      ...tags
    ].filter(Boolean).join(' ').toLowerCase();

    return allText.includes(query);
  });

  const t = translations[lang];

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center py-4 gap-4">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t.title}</h1>
            
            <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-4">
              <nav className="flex items-center gap-1 sm:gap-2">
                <a
                  href="#about"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToElement('about');
                  }}
                  className="px-2 py-1.5 text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-all border border-blue-100"
                >
                  {t.navAbout}
                </a>
                <a
                  href="#values"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToElement('values');
                  }}
                  className="px-2 py-1.5 text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-all border border-blue-100"
                >
                  {t.navValues}
                </a>
                <a
                  href="#how-to-donate"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToElement('how-to-donate');
                  }}
                  className="px-2 py-1.5 text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-all border border-blue-100"
                >
                  {t.navHowTo}
                </a>
                <a
                  href="#search-mentors"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToElement('search-mentors');
                  }}
                  className="px-2 py-1.5 text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-all border border-blue-100"
                >
                  {t.navMentors}
                </a>
              </nav>

              <div className="flex items-center gap-2 border-l pl-2 border-gray-200">
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value as Language)}
                  className="text-xs sm:text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded px-1 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="ko">🇰🇷 KO</option>
                  <option value="en">🇺🇸 EN</option>
                </select>

                <Link
                  href="/admin"
                  className="text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  {t.viewAdmin}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* About Section */}
      <section id="about" className="bg-white border-b border-gray-100 py-12 scroll-mt-20">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.mentoringTitle}</h2>
              <p className="text-gray-600 leading-relaxed text-lg">
                {t.mentoringDesc}
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.donationMentoringTitle}</h2>
              <p className="text-gray-600 leading-relaxed text-lg">
                {t.donationMentoringDesc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section id="values" className="bg-gray-50 py-12 scroll-mt-20">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{t.mentorValueTitle}</h2>
              <ul className="space-y-3">
                {t.mentorValuePoints.map((point, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span className="text-gray-600">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{t.menteeValueTitle}</h2>
              <ul className="space-y-3">
                {t.menteeValuePoints.map((point, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span className="text-gray-600">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How to Donate Section */}
      <section id="how-to-donate" className="mt-16 mb-12 scroll-mt-20">
        <div className="bg-white rounded-lg shadow-md p-8 sm:p-10">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-8 text-center">
            {t.howToDonate}
          </h2>
          <ol className="space-y-4 max-w-3xl mx-auto">
            {t.howToDonateSteps.map((step, index) => {
              // Find URL pattern like (https://...)
              const urlMatch = step.match(/\(https?:\/\/[^)]+\)/);
              if (urlMatch) {
                const url = urlMatch[0].slice(1, -1); // Remove parentheses
                const parts = step.split(urlMatch[0]);
                return (
                  <li key={index} className="flex items-start">
                    <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full font-bold text-sm mr-4 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="text-lg text-gray-700 leading-relaxed">
                      {parts[0]}
                      <a 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        ({url})
                      </a>
                      {parts[1]}
                    </span>
                  </li>
                );
              }
              
              return (
                <li key={index} className="flex items-start">
                  <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full font-bold text-sm mr-4 mt-0.5">
                    {index + 1}
                  </span>
                  <span className="text-lg text-gray-700 leading-relaxed">
                    {step}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Hero / Search */}
      <div id="search-mentors" className="bg-blue-600 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl mb-4">
            {t.subtitle}
          </h2>
          <div className="mt-8 relative max-w-xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-3 border border-transparent rounded-md leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-0 sm:text-sm"
              placeholder={t.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Mentors Grid */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12 scroll-mt-20">
        {loading ? (
          <div className="text-center py-12 text-gray-500">{t.loading}</div>
        ) : filteredMentors.length > 0 ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredMentors.map((mentor) => (
              <MentorCard 
                key={mentor.id} 
                mentor={mentor} 
                lang={lang} 
                onClick={(m) => setSelectedMentor(m)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">{t.noMentors}</div>
        )}
      </main>

      {/* Detail Popup Modal */}
      {selectedMentor && (() => {
        const display = getMentorDisplay(selectedMentor, lang);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => setSelectedMentor(null)}></div>
            
            <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
              <div className="absolute top-4 right-4 z-10">
                <button 
                  onClick={() => setSelectedMentor(null)}
                  className="p-2 bg-white/80 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X size={24} className="text-gray-500" />
                </button>
              </div>

              <div className="relative h-64 w-full bg-gray-200 shrink-0">
                {selectedMentor.picture_url && !imageErrors.has(selectedMentor.picture_url) ? (
                  <Image
                    src={selectedMentor.picture_url}
                    alt={display.name}
                    fill
                    className="object-cover"
                    unoptimized={selectedMentor.picture_url.includes('supabase.co')}
                    onError={() => setImageErrors(prev => new Set(prev).add(selectedMentor.picture_url!))}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-lg">
                    No Image
                  </div>
                )}
              </div>

              <div className="p-6 sm:p-8">
                <div className="mb-6">
                  <h2 className="text-3xl font-extrabold text-gray-900 mb-2">{display.name}</h2>
                  <div className="flex flex-col gap-2 text-gray-600">
                    <div className="flex items-center text-lg">
                      <Briefcase className="mr-2 text-blue-600 w-5 h-5" />
                      <span className="font-medium">{display.position}</span>
                    </div>
                    {display.company && (
                      <div className="flex items-center text-lg">
                        <Building2 className="mr-2 text-blue-600 w-5 h-5" />
                        <span>{display.company}</span>
                      </div>
                    )}
                    <div className="flex items-center text-gray-500">
                      <MapPin className="mr-2 text-gray-400 w-5 h-5" />
                      <span>{display.location}</span>
                    </div>
                  </div>
                </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {selectedMentor.tags?.map((tag, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="prose prose-blue max-w-none text-gray-600 mb-8 whitespace-pre-line leading-relaxed">
                {display.description}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-100">
                {selectedMentor.calendly_url && (
                  <a 
                    href={ensureProtocol(selectedMentor.calendly_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow-md"
                  >
                    <Calendar size={20} />
                    <span>Book Session</span>
                  </a>
                )}
                {selectedMentor.email && (
                  <a 
                    href={`mailto:${selectedMentor.email}`}
                    className="flex items-center justify-center gap-2 flex-1 px-6 py-3 bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold rounded-xl transition-all shadow-sm"
                  >
                    <Mail size={20} />
                    <span>Email Mentor</span>
                  </a>
                )}
                {selectedMentor.linkedin_url && (
                  <a 
                    href={ensureProtocol(selectedMentor.linkedin_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 flex-1 px-6 py-3 bg-[#0A66C2] hover:bg-[#004182] text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow-md"
                  >
                    <Linkedin size={20} />
                    <span>LinkedIn Profile</span>
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

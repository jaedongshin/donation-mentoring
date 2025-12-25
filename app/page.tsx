'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Mentor } from '@/types/mentor';
import MentorCard from '@/app/components/MentorCard';
import { translations, Language } from '@/utils/i18n';
import Link from 'next/link';
import Image from 'next/image';
import { Search, X, Briefcase, MapPin, Building2, Linkedin, Calendar, Mail } from 'lucide-react';

export default function Home() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lang, setLang] = useState<Language>('ko');
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);

  useEffect(() => {
    fetchMentors();
  }, []);

  const fetchMentors = async () => {
    setLoading(true);
    // Query based on the actual schema: is_active instead of enabled
    const { data, error } = await supabase
      .from('mentors')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching mentors:', error);
    } else {
      setMentors(data || []);
    }
    setLoading(false);
  };

  const filteredMentors = mentors.filter(mentor => {
    const query = search.toLowerCase();
    
    // Language filtering
    const supportedLangs = (mentor.languages || []).map(l => l.toLowerCase());
    const isKorean = lang === 'ko';
    
    // Check if mentor supports the selected language
    // If languages is empty, we might show them or hide them? 
    // Prompt says "Show only Korean mentors... when show '한국어'". 
    // I'll assume strictly filtering if the languages field is populated. 
    // If empty, maybe show? Or hide? 
    // Safer to show if empty? No, "Show only...". 
    // Let's assume if 'languages' has data, we filter. If null/empty, maybe allow?
    // Let's stick to strict: must include.
    
    const matchesLang = isKorean 
      ? supportedLangs.some(l => l === 'korean' || l === '한국어' || l === 'ko') 
      : supportedLangs.some(l => l === 'english' || l === '영어' || l === 'en');

    // If no languages defined, maybe show all? Or hide?
    // Given the explicit requirement, let's strictly filter if languages are present.
    // If languages is null/empty, let's treat it as "unknown" and maybe show them?
    // But usually "Show only..." means hide others.
    // Let's assume if languages is populated, we filter. If empty, we show (fallback).
    // Actually, user likely will populate "Korean, English" for everyone.
    // If I hide empty ones, existing mentors (who have null languages) will disappear.
    // I should probably treat null/empty as "show".
    
    const hasLangData = supportedLangs.length > 0;
    if (hasLangData && !matchesLang) return false;

    const name = (lang === 'en' ? mentor.name_en : mentor.name_ko) || '';
    const location = (lang === 'en' ? mentor.location_en : mentor.location_ko) || '';
    const position = (lang === 'en' ? mentor.position_en : mentor.position_ko) || '';
    const tags = mentor.tags || [];

    // Fallback search in other language if primary is empty? 
    // For now, let's search across both languages to be safe
    const allText = [
      mentor.name_en, mentor.name_ko,
      mentor.location_en, mentor.location_ko,
      mentor.position_en, mentor.position_ko,
      ...(tags)
    ].filter(Boolean).join(' ').toLowerCase();

    return allText.includes(query);
  });

  const t = translations[lang];

  const getMentorDisplay = (mentor: Mentor) => {
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
  };

  const ensureProtocol = (url: string) => {
    if (!url) return '';
    return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLang(lang === 'en' ? 'ko' : 'en')}
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              {lang === 'en' ? '🇰🇷 한국어' : '🇺🇸 English'}
            </button>
            <Link
              href="/admin"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              {t.viewAdmin}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero / Search */}
      <div className="bg-blue-600 py-16 px-4 sm:px-6 lg:px-8">
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="text-center py-12 text-gray-500">{t.loading}</div>
        ) : filteredMentors.length > 0 ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
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
      {selectedMentor && (
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
              {selectedMentor.picture_url ? (
                <Image
                  src={selectedMentor.picture_url}
                  alt={getMentorDisplay(selectedMentor).name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-lg">
                  No Image
                </div>
              )}
            </div>

            <div className="p-6 sm:p-8">
              <div className="mb-6">
                <h2 className="text-3xl font-extrabold text-gray-900 mb-2">{getMentorDisplay(selectedMentor).name}</h2>
                <div className="flex flex-col gap-2 text-gray-600">
                  <div className="flex items-center text-lg">
                    <Briefcase className="mr-2 text-blue-600 w-5 h-5" />
                    <span className="font-medium">{getMentorDisplay(selectedMentor).position}</span>
                  </div>
                  {getMentorDisplay(selectedMentor).company && (
                    <div className="flex items-center text-lg">
                      <Building2 className="mr-2 text-blue-600 w-5 h-5" />
                      <span>{getMentorDisplay(selectedMentor).company}</span>
                    </div>
                  )}
                  <div className="flex items-center text-gray-500">
                    <MapPin className="mr-2 text-gray-400 w-5 h-5" />
                    <span>{getMentorDisplay(selectedMentor).location}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {selectedMentor.tags && selectedMentor.tags.map((tag, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="prose prose-blue max-w-none text-gray-600 mb-8 whitespace-pre-line leading-relaxed">
                {getMentorDisplay(selectedMentor).description}
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
      )}
    </div>
  );
}

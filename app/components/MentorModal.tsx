'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, Briefcase, Building2, MapPin, Calendar, Mail, Linkedin } from 'lucide-react';
import { Mentor } from '@/types/mentor';
import { Language, translations } from '@/utils/i18n';
import { ensureProtocol, getMentorDisplay } from '@/utils/helpers';

interface ThemeConfig {
  primaryBg: string;
  primaryHover: string;
  primaryText: string;
  primaryLight: string;
  accentBg: string;
  accentHover: string;
  accentText: string;
  accentLight: string;
}

interface DarkModeConfig {
  bg: string;
  bgCard: string;
  text: string;
  textMuted: string;
  border: string;
}

interface MentorModalProps {
  mentor: Mentor;
  lang: Language;
  onClose: () => void;
  theme?: ThemeConfig;
  darkMode?: DarkModeConfig;
}

// Default theme (slate-gold)
const defaultTheme: ThemeConfig = {
  primaryBg: 'bg-slate-800',
  primaryHover: 'hover:bg-slate-900',
  primaryText: 'text-slate-800',
  primaryLight: 'bg-slate-100',
  accentBg: 'bg-amber-500',
  accentHover: 'hover:bg-amber-600',
  accentText: 'text-amber-500',
  accentLight: 'bg-amber-50',
};

// Default dark mode (light mode)
const defaultDarkMode: DarkModeConfig = {
  bg: 'bg-gray-50',
  bgCard: 'bg-white',
  text: 'text-gray-900',
  textMuted: 'text-gray-600',
  border: 'border-gray-100',
};

export default function MentorModal({ mentor, lang, onClose, theme = defaultTheme, darkMode = defaultDarkMode }: MentorModalProps) {
  const [imageError, setImageError] = useState(false);
  const display = getMentorDisplay(mentor, lang);
  const t = translations[lang];
  const dm = darkMode;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className={`relative ${dm.bgCard} rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col`}>
        {/* Close Button */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={onClose}
            className={`p-2 ${dm.bgCard}/80 rounded-full hover:opacity-80 transition-colors`}
            aria-label="Close"
          >
            <X size={24} className={dm.textMuted} />
          </button>
        </div>

        {/* Hero Image */}
        <div className={`relative h-64 w-full ${dm.bgCard} shrink-0`}>
          {mentor.picture_url && !imageError ? (
            <Image
              src={mentor.picture_url}
              alt={display.name}
              fill
              className="object-cover"
              unoptimized={mentor.picture_url.includes('supabase.co')}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className={`flex items-center justify-center h-full ${dm.textMuted} text-6xl font-bold`}>
              {display.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8">
          {/* Header Info */}
          <div className="mb-6">
            <h2 className={`text-3xl font-extrabold ${dm.text} mb-2`}>{display.name}</h2>
            <div className={`flex flex-col gap-2 ${dm.textMuted}`}>
              <div className="flex items-center text-lg">
                <Briefcase className={`mr-2 ${theme.accentText} w-5 h-5`} />
                <span className="font-medium">{display.position}</span>
              </div>
              {display.company && (
                <div className="flex items-center text-lg">
                  <Building2 className={`mr-2 ${theme.accentText} w-5 h-5`} />
                  <span>{display.company}</span>
                </div>
              )}
              <div className={`flex items-center ${dm.textMuted} opacity-80`}>
                <MapPin className="mr-2 opacity-60 w-5 h-5" />
                <span>{display.location}</span>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {mentor.tags?.map((tag, index) => (
              <span
                key={index}
                className={`px-3 py-1 ${theme.primaryLight} ${theme.primaryText} text-sm font-medium rounded-full`}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Description */}
          <div className={`prose max-w-none ${dm.textMuted} mb-8 whitespace-pre-line leading-relaxed`}>
            {display.description}
          </div>

          {/* Action Buttons */}
          <div className={`flex flex-col sm:flex-row gap-4 pt-4 border-t ${dm.border}`}>
            {mentor.calendly_url && (
              <a
                href={ensureProtocol(mentor.calendly_url)}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-center gap-2 flex-1 px-6 py-3 ${theme.accentBg} ${theme.accentHover} text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow-md`}
              >
                <Calendar size={20} />
                <span>{t.bookSession}</span>
              </a>
            )}
            {mentor.email && (
              <a
                href={`mailto:${mentor.email}`}
                className={`flex items-center justify-center gap-2 flex-1 px-6 py-3 ${dm.bgCard} border-2 ${dm.border} ${dm.textMuted} hover:opacity-80 font-semibold rounded-xl transition-all shadow-sm`}
              >
                <Mail size={20} />
                <span>Email</span>
              </a>
            )}
            {mentor.linkedin_url && (
              <a
                href={ensureProtocol(mentor.linkedin_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 flex-1 px-6 py-3 bg-[#0A66C2] hover:bg-[#004182] text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow-md"
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
}

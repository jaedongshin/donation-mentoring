'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Briefcase, Building2, MapPin, Calendar, Mail, Linkedin, Clock, DollarSign, Share2, Check, QrCode } from 'lucide-react';
import { Mentor } from '@/types/mentor';
import { Language, translations } from '@/utils/i18n';
import { ensureProtocol, getMentorDisplay } from '@/utils/helpers';
import { QRCodeSVG } from 'qrcode.react';

interface ThemeConfig {
  primaryBg: string;
  primaryHover: string;
  primaryText: string;
  primaryLight: string;
  accentBg: string;
  accentHover: string;
  accentText: string;
  accentLight: string;
  accentBorder: string;
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
  accentBorder: 'border-amber-200',
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
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const display = getMentorDisplay(mentor, lang);
  const t = translations[lang];
  const dm = darkMode;

  // Prevent background scrolling when modal is open
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const handleShare = () => {
    // Fallback to ID if slug is missing (should not happen with recent DB updates)
    const slug = mentor.slug || mentor.id; 
    const url = `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
      <div className={`relative ${dm.bgCard} rounded-2xl shadow-xl max-w-2xl w-full flex flex-col max-h-[90vh]`}>
        {/* Close Button */}
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={onClose}
            className="p-2 bg-gray-800/80 hover:bg-gray-700 active:bg-gray-600 text-gray-400 hover:text-gray-200 rounded-lg transition-colors active:scale-95"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 rounded-2xl">
          {/* Hero Image */}
          <div className={`relative h-64 w-full overflow-hidden shrink-0`}>
            {mentor.picture_url && !imageError ? (
              <>
                {/* Blurred background layer - same image scaled and blurred */}
                <Image
                  src={mentor.picture_url}
                  alt=""
                  fill
                  className="object-cover scale-110 blur-xl opacity-80"
                  unoptimized={mentor.picture_url.includes('supabase.co')}
                  aria-hidden="true"
                />
                {/* Main image - contained to show full image */}
                <Image
                  src={mentor.picture_url}
                  alt={display.name}
                  fill
                  className="object-contain relative z-10"
                  unoptimized={mentor.picture_url.includes('supabase.co')}
                  onError={() => setImageError(true)}
                />
              </>
            ) : (
              <div className={`flex items-center justify-center h-full bg-gray-200 ${dm.textMuted} text-6xl font-bold`}>
                {display.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8">
            {/* Header Info */}
            <div className="mb-6">
              <div className="flex justify-between items-start gap-4 mb-4">
                <h2 className={`text-3xl font-extrabold ${dm.text}`}>{display.name}</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowQR(!showQR)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      showQR
                        ? 'bg-sky-600 text-white'
                        : `${theme.primaryLight} ${theme.primaryText} hover:opacity-80`
                    }`}
                    title={t.showQRCode}
                  >
                    <QrCode size={16} />
                  </button>
                  <button
                    onClick={handleShare}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      copied
                        ? 'bg-green-500 text-white'
                        : `${theme.primaryLight} ${theme.primaryText} hover:opacity-80`
                    }`}
                  >
                    {copied ? <Check size={16} /> : <Share2 size={16} />}
                    <span>{copied ? t.linkCopied : t.shareProfile}</span>
                  </button>
                </div>
              </div>
              
              {/* QR Code Overlay */}
              {showQR && (
                <div className={`mb-6 p-6 ${darkMode.bgCard} border-2 ${theme.accentBorder} rounded-xl flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-200`}>
                  <div className="p-4 bg-white rounded-lg">
                    <QRCodeSVG 
                      value={`${window.location.origin}/${mentor.slug || mentor.id}`}
                      size={180}
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                  <p className={`text-xs ${dm.textMuted} font-medium text-center`}>
                    {window.location.origin}/{mentor.slug || mentor.id}
                  </p>
                  <button 
                    onClick={() => setShowQR(false)}
                    className={`text-xs ${theme.accentText} hover:underline`}
                  >
                    {t.qrCode} {lang === 'ko' ? '닫기' : 'Close'}
                  </button>
                </div>
              )}

              {/* 2x2 Grid for info */}
              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 ${dm.textMuted}`}>
                <div className="flex items-center">
                  <Briefcase className={`mr-2 ${theme.accentText} w-5 h-5 flex-shrink-0`} />
                  <span className="font-medium truncate">{display.position}</span>
                </div>
                {display.company && (
                  <div className="flex items-center">
                    <Building2 className={`mr-2 ${theme.accentText} w-5 h-5 flex-shrink-0`} />
                    <span className="truncate">{display.company}</span>
                  </div>
                )}
                <div className="flex items-center opacity-80">
                  <MapPin className={`mr-2 ${theme.accentText} w-5 h-5 flex-shrink-0`} />
                  <span className="truncate">{display.location}</span>
                </div>
                {/* Session info */}
                {(mentor.session_time_minutes || mentor.session_price_usd) && (
                  <div className={`flex items-center gap-3 ${theme.accentText} font-medium`}>
                    {mentor.session_time_minutes && (
                      <div className="flex items-center">
                        <Clock size={18} className="mr-1" />
                        <span>{mentor.session_time_minutes}min</span>
                      </div>
                    )}
                    {mentor.session_price_usd && (
                      <div className="flex items-center">
                        <DollarSign size={18} className="mr-0.5" />
                        <span>{mentor.session_price_usd} {t.unicefDonation}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {mentor.tags?.map((tag) => (
                <span
                  key={tag}
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
              {/* Book Session (calendly) or Request Session (email fallback) */}
              {mentor.calendly_url ? (
                <a
                  href={ensureProtocol(mentor.calendly_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-center gap-2 flex-1 px-6 py-3 ${theme.accentBg} ${theme.accentHover} text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow-md`}
                >
                  <Calendar size={20} />
                  <span>{t.bookSession}</span>
                </a>
              ) : mentor.email ? (
                <a
                  href={`mailto:${mentor.email}?subject=${encodeURIComponent(lang === 'ko' ? `[멘토링 요청] ${display.name} 멘토님께` : `[Session Request] To ${display.name}`)}`}
                  className={`flex items-center justify-center gap-2 flex-1 px-6 py-3 ${theme.accentBg} ${theme.accentHover} text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow-md`}
                >
                  <Calendar size={20} />
                  <span>{t.requestSession}</span>
                </a>
              ) : null}
              {/* Contact Mentor (email) */}
              {mentor.email && (
                <a
                  href={`mailto:${mentor.email}`}
                  className={`flex items-center justify-center gap-2 flex-1 px-6 py-3 ${dm.bgCard} border-2 ${dm.border} ${dm.textMuted} hover:opacity-80 font-semibold rounded-xl transition-all`}
                >
                  <Mail size={20} />
                  <span>{t.contactMentor}</span>
                </a>
              )}
              {/* LinkedIn */}
              {mentor.linkedin_url && (
                <a
                  href={ensureProtocol(mentor.linkedin_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-center gap-2 flex-1 px-6 py-3 ${dm.bgCard} border-2 ${dm.border} ${dm.textMuted} hover:opacity-80 font-semibold rounded-xl transition-all`}
                >
                  <Linkedin size={20} />
                  <span>LinkedIn</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

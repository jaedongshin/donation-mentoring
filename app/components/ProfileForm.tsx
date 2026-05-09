'use client';

import { translations, Language } from '@/utils/i18n';
import Image from 'next/image';
import { Info, X, Link, Check } from 'lucide-react';
import { useState } from 'react';

// Input/Label class generators
const getInputClass = (dark: boolean) => `block w-full rounded-lg ${dark ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} border p-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500/40 focus:border-sky-500/40 transition-all text-sm`;
const getLabelClass = (dark: boolean) => `block text-sm font-medium ${dark ? 'text-gray-300' : 'text-gray-700'} mb-1.5`;

export interface ProfileFormData {
  mentorId?: string;
  name_en: string;
  name_ko: string;
  description_en: string;
  description_ko: string;
  position_en: string;
  position_ko: string;
  company_en: string;
  company_ko: string;
  location_en: string;
  location_ko: string;
  linkedin_url: string;
  calendly_url: string;
  email: string;
  slug: string;
  languages: string[];
  session_time_minutes: number | null;
  session_price_usd: number | null;
  tags: string[];
  picture_url: string;
}

interface ProfileFormProps {
  formData: ProfileFormData;
  onChange: (data: ProfileFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onImageUpload?: (file: File) => Promise<string | null>;
  darkMode: boolean;
  lang: Language;
  formId?: string;
  showSubmitButton?: boolean;
  isUploading?: boolean;
}

export default function ProfileForm({
  formData,
  onChange,
  onSubmit,
  onImageUpload,
  darkMode,
  lang,
  formId = 'profile-form',
  showSubmitButton = false,
  isUploading = false,
}: ProfileFormProps) {
  const t = translations[lang];
  const dm = {
    textMuted: darkMode ? 'text-gray-400' : 'text-gray-600',
    textSubtle: darkMode ? 'text-gray-500' : 'text-gray-500',
  };

  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const identifier = formData.slug || formData.mentorId;
    if (!identifier) return;
    
    const url = `${window.location.origin}/?m=${identifier}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateField = (field: keyof ProfileFormData, value: string | string[]) => {
    onChange({ ...formData, [field]: value });
  };

  const toggleLanguage = (language: string, checked: boolean) => {
    if (checked) {
      onChange({ ...formData, languages: [...formData.languages, language] });
    } else {
      onChange({ ...formData, languages: formData.languages.filter(l => l !== language) });
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImageUpload) {
      const url = await onImageUpload(file);
      if (url) {
        onChange({ ...formData, picture_url: url });
      }
    }
  };

  const handleEmailChange = (value: string) => {
    onChange({ ...formData, email: value.replace(/\s+/g, '').toLowerCase() });
  };

  // Use local state for tags input to avoid controlled input issues
  const tagsString = formData.tags.join(', ');
  const [tagsInputValue, setTagsInputValue] = useState(tagsString);
  const [prevTagsString, setPrevTagsString] = useState(tagsString);
  const [isTagsFocused, setIsTagsFocused] = useState(false);

  // Sync local state when formData.tags changes from outside (but not while user is typing)
  if (tagsString !== prevTagsString && !isTagsFocused) {
    setPrevTagsString(tagsString);
    setTagsInputValue(tagsString);
  }

  const handleTagsChange = (value: string) => {
    setTagsInputValue(value);
  };

  const handleTagsFocus = () => {
    setIsTagsFocused(true);
  };

  const handleTagsBlur = () => {
    setIsTagsFocused(false);
    const tags = tagsInputValue.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
    onChange({ ...formData, tags });
    setTagsInputValue(tags.join(', ')); // Normalize display after blur
  };

  return (
    <form id={formId} onSubmit={onSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label className={getLabelClass(darkMode)}>{t.name}</label>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🇰🇷</span>
            <input
              type="text"
              className={`${getInputClass(darkMode)} pl-9`}
              value={formData.name_ko}
              onChange={e => updateField('name_ko', e.target.value)}
              placeholder="한국어"
            />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🇺🇸</span>
            <input
              type="text"
              className={`${getInputClass(darkMode)} pl-9`}
              value={formData.name_en}
              onChange={e => updateField('name_en', e.target.value)}
              placeholder="English"
            />
          </div>
        </div>
      </div>

      {/* Company */}
      <div>
        <label className={getLabelClass(darkMode)}>{t.company}</label>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🇰🇷</span>
            <input
              type="text"
              className={`${getInputClass(darkMode)} pl-9`}
              value={formData.company_ko}
              onChange={e => updateField('company_ko', e.target.value)}
              placeholder="한국어"
            />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🇺🇸</span>
            <input
              type="text"
              className={`${getInputClass(darkMode)} pl-9`}
              value={formData.company_en}
              onChange={e => updateField('company_en', e.target.value)}
              placeholder="English"
            />
          </div>
        </div>
      </div>

      {/* Position */}
      <div>
        <label className={getLabelClass(darkMode)}>{t.position}</label>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🇰🇷</span>
            <input
              type="text"
              className={`${getInputClass(darkMode)} pl-9`}
              value={formData.position_ko}
              onChange={e => updateField('position_ko', e.target.value)}
              placeholder="한국어"
            />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🇺🇸</span>
            <input
              type="text"
              className={`${getInputClass(darkMode)} pl-9`}
              value={formData.position_en}
              onChange={e => updateField('position_en', e.target.value)}
              placeholder="English"
            />
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className={getLabelClass(darkMode)}>{t.description}</label>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <span className="absolute left-3 top-3 text-sm">🇰🇷</span>
            <textarea
              rows={3}
              className={`${getInputClass(darkMode)} pl-9`}
              value={formData.description_ko}
              onChange={e => updateField('description_ko', e.target.value)}
              placeholder="한국어"
            />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-3 text-sm">🇺🇸</span>
            <textarea
              rows={3}
              className={`${getInputClass(darkMode)} pl-9`}
              value={formData.description_en}
              onChange={e => updateField('description_en', e.target.value)}
              placeholder="English"
            />
          </div>
        </div>
      </div>

      {/* Location */}
      <div>
        <label className={getLabelClass(darkMode)}>{t.location}</label>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🇰🇷</span>
            <input
              type="text"
              className={`${getInputClass(darkMode)} pl-9`}
              value={formData.location_ko}
              onChange={e => updateField('location_ko', e.target.value)}
              placeholder="한국어"
            />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🇺🇸</span>
            <input
              type="text"
              className={`${getInputClass(darkMode)} pl-9`}
              value={formData.location_en}
              onChange={e => updateField('location_en', e.target.value)}
              placeholder="English"
            />
          </div>
        </div>
      </div>

      {/* URLs and Slug */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={getLabelClass(darkMode)}>Profile Slug</label>
          <input
            type="text"
            className={getInputClass(darkMode)}
            value={formData.slug}
            onChange={e => updateField('slug', e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
            placeholder="john-doe"
          />
        </div>
        <div>
          <label className={getLabelClass(darkMode)}>LinkedIn URL</label>
          <input
            type="text"
            className={getInputClass(darkMode)}
            value={formData.linkedin_url}
            onChange={e => updateField('linkedin_url', e.target.value)}
            placeholder="https://linkedin.com/in/..."
          />
        </div>
      </div>

      <div>
        <label className={`${getLabelClass(darkMode)} flex items-center justify-between`}>
          <span>{t.calendarUrl}</span>
          <span className="relative group">
            <Info size={14} className={`${dm.textSubtle} cursor-help`} />
            <span className={`absolute right-0 bottom-full mb-2 px-3 py-2 text-xs ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-800 text-white'} rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg`}>
              {t.calendarUrlTooltip}
            </span>
          </span>
        </label>
        <div className="relative">
          <input
            type="text"
            className={`${getInputClass(darkMode)} ${formData.calendly_url ? 'pr-9' : ''}`}
            value={formData.calendly_url}
            onChange={e => updateField('calendly_url', e.target.value)}
            placeholder="https://calendly.com/..."
          />
          {formData.calendly_url && (
            <button
              type="button"
              onClick={() => updateField('calendly_url', '')}
              className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded ${darkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'} transition-colors`}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Email and Languages row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={getLabelClass(darkMode)}>Email</label>
          <input
            type="email"
            className={getInputClass(darkMode)}
            value={formData.email}
            onChange={e => handleEmailChange(e.target.value)}
            placeholder="your@email.com"
          />
        </div>
        <div>
          <label className={getLabelClass(darkMode)}>{t.languages}</label>
          <div className="flex gap-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.languages.includes('Korean')}
                onChange={(e) => toggleLanguage('Korean', e.target.checked)}
                className={`h-4 w-4 rounded ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-white'} text-sky-600 focus:ring-sky-500`}
              />
              <span className={`text-sm ${dm.textMuted}`}>Korean</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.languages.includes('English')}
                onChange={(e) => toggleLanguage('English', e.target.checked)}
                className={`h-4 w-4 rounded ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-white'} text-sky-600 focus:ring-sky-500`}
              />
              <span className={`text-sm ${dm.textMuted}`}>English</span>
            </label>
          </div>
        </div>
      </div>

      {/* Session Time and Price */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={getLabelClass(darkMode)}>{t.sessionTime}</label>
          <input
            type="number"
            className={getInputClass(darkMode)}
            value={formData.session_time_minutes ?? ''}
            onChange={e => onChange({ ...formData, session_time_minutes: e.target.value ? parseInt(e.target.value) : null })}
            placeholder="30"
          />
        </div>
        <div>
          <label className={getLabelClass(darkMode)}>{t.sessionPrice}</label>
          <input
            type="number"
            step="0.01"
            className={getInputClass(darkMode)}
            value={formData.session_price_usd ?? ''}
            onChange={e => onChange({ ...formData, session_price_usd: e.target.value ? parseFloat(e.target.value) : null })}
            placeholder="0"
          />
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className={getLabelClass(darkMode)}>{t.tags}</label>
        <input
          type="text"
          className={getInputClass(darkMode)}
          value={tagsInputValue}
          onChange={e => handleTagsChange(e.target.value)}
          onFocus={handleTagsFocus}
          onBlur={handleTagsBlur}
          placeholder="Frontend, UX, AI, ..."
        />
      </div>

      {/* Photo */}
      <div>
        <label className={getLabelClass(darkMode)}>{t.photo}</label>
        <div className="flex items-center gap-4 pt-2">
          {formData.picture_url && (
            <div className="relative w-16 h-16 flex-shrink-0 group">
              <Image
                src={formData.picture_url}
                alt="Profile"
                fill
                className="rounded-lg object-cover"
                unoptimized={formData.picture_url.includes('supabase.co')}
              />
              <button
                type="button"
                onClick={handleCopyLink}
                disabled={!formData.slug && !formData.mentorId}
                className={`absolute bottom-0 right-0 p-1 rounded-tl-lg rounded-br-lg shadow-sm border ${
                  darkMode 
                    ? 'bg-gray-800/90 border-gray-700 text-sky-400 hover:text-sky-300' 
                    : 'bg-white/90 border-gray-200 text-sky-600 hover:text-sky-700'
                } transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
                title={t.copySharableUrl}
              >
                {copied ? <Check size={12} /> : <Link size={12} />}
              </button>
            </div>
          )}
          <label className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
            darkMode
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {isUploading ? t.uploading : t.upload}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
              disabled={isUploading}
            />
          </label>
        </div>
      </div>

      {/* Optional Submit Button */}
      {showSubmitButton && (
        <div className="pt-2">
          <button
            type="submit"
            className="py-2.5 px-5 bg-sky-600 hover:bg-sky-700 rounded-lg text-sm font-medium text-white transition-colors cursor-pointer"
          >
            {t.save}
          </button>
        </div>
      )}
    </form>
  );
}

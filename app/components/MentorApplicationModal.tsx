'use client';

import { useState } from 'react';
import { supabase } from '@/utils/supabase';
import { translations, Language } from '@/utils/i18n';
import Image from 'next/image';
import { X } from 'lucide-react';

interface MentorApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  darkMode?: boolean;
}

export default function MentorApplicationModal({ isOpen, onClose, lang, darkMode = false }: MentorApplicationModalProps) {
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<{
    name_en: string;
    name_ko: string;
    description_en: string;
    description_ko: string;
    location_en: string;
    location_ko: string;
    position_en: string;
    position_ko: string;
    company_en: string;
    company_ko: string;
    picture_url: string;
    linkedin_url: string;
    calendly_url: string;
    email: string;
    languages: string[];
    tags: string;
    session_time_minutes: string;
    session_price_usd: string;
  }>({
    name_en: '',
    name_ko: '',
    description_en: '',
    description_ko: '',
    location_en: '',
    location_ko: '',
    position_en: '',
    position_ko: '',
    company_en: '',
    company_ko: '',
    picture_url: '',
    linkedin_url: '',
    calendly_url: '',
    email: '',
    languages: [],
    tags: '',
    session_time_minutes: '',
    session_price_usd: '',
  });

  const t = translations[lang];

  // Dark mode styling helpers
  const dm = {
    bg: darkMode ? 'bg-gray-800' : 'bg-white',
    text: darkMode ? 'text-gray-100' : 'text-gray-900',
    textMuted: darkMode ? 'text-gray-400' : 'text-gray-700',
    border: darkMode ? 'border-gray-700' : 'border-gray-300',
    input: darkMode ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900',
    hover: darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100',
  };

  if (!isOpen) return null;

  const handleLanguageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setFormData(prev => {
      if (checked) {
        return { ...prev, languages: [...prev.languages, value] };
      } else {
        return { ...prev, languages: prev.languages.filter(l => l !== value) };
      }
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    setUploading(true);
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('mentor-pictures')
      .upload(filePath, file);

    if (uploadError) {
      alert('Error uploading image');
      console.error(uploadError);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from('mentor-pictures').getPublicUrl(filePath);
    
    setFormData(prev => ({ ...prev, picture_url: data.publicUrl }));
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
    // const languagesArray = formData.languages.split(',').map(l => l.trim()).filter(l => l !== '');
    const languagesArray = formData.languages;
    const sessionTimeMinutes = formData.session_time_minutes ? parseInt(formData.session_time_minutes, 10) : null;
    const sessionPriceUsd = formData.session_price_usd ? parseFloat(formData.session_price_usd) : null;

    const mentorData = {
      name_en: formData.name_en,
      name_ko: formData.name_ko,
      description_en: formData.description_en,
      description_ko: formData.description_ko,
      location_en: formData.location_en,
      location_ko: formData.location_ko,
      position_en: formData.position_en,
      position_ko: formData.position_ko,
      company_en: formData.company_en,
      company_ko: formData.company_ko,
      picture_url: formData.picture_url,
      linkedin_url: formData.linkedin_url,
      calendly_url: formData.calendly_url,
      email: formData.email,
      languages: languagesArray,
      tags: tagsArray,
      is_active: false, // Explicitly set to false
      session_time_minutes: sessionTimeMinutes,
      session_price_usd: sessionPriceUsd,
    };

    // Create
    const { error } = await supabase
    .from('mentors')
    .insert([mentorData]);
    
    if (error) {
        alert('Error submitting application');
        console.error(error);
        setIsSubmitting(false);
        return;
    }

    // Send Email
    try {
        await fetch('/api/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name_ko: formData.name_ko,
                name_en: formData.name_en,
                email: formData.email,
                position_ko: formData.position_ko,
                company_ko: formData.company_ko,
            }),
        });
    } catch (emailError) {
        console.error('Error sending email notification:', emailError);
        // We don't block success if email fails, but maybe log it
    }

    alert(t.applicationSuccess);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className={`${dm.bg} rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 animate-scale-in transition-colors duration-300`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-xl font-semibold ${dm.text}`}>{t.applyMentor}</h2>
          <button onClick={onClose} className={`p-2 ${dm.textMuted} hover:text-gray-600 ${dm.hover} rounded-full transition-all`}>
            <X size={22} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Name */}
          <div>
            <label className={`block text-sm font-medium ${dm.textMuted} mb-1.5`}>{t.name}</label>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🇰🇷</span>
                <input required type="text" className={`block w-full rounded-lg border p-2.5 pl-9 focus:outline-none focus:ring-1 focus:ring-sky-500/40 focus:border-sky-500/40 transition-all text-sm ${dm.input}`} value={formData.name_ko} onChange={e => setFormData({...formData, name_ko: e.target.value})} placeholder="한국어" />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🇺🇸</span>
                <input required type="text" className={`block w-full rounded-lg border p-2.5 pl-9 focus:outline-none focus:ring-1 focus:ring-sky-500/40 focus:border-sky-500/40 transition-all text-sm ${dm.input}`} value={formData.name_en} onChange={e => setFormData({...formData, name_en: e.target.value})} placeholder="English" />
              </div>
            </div>
          </div>

          {/* Company */}
          <div>
            <label className={`block text-sm font-medium ${dm.textMuted} mb-1.5`}>{t.company}</label>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🇰🇷</span>
                <input type="text" className={`block w-full rounded-lg border p-2.5 pl-9 focus:outline-none focus:ring-1 focus:ring-sky-500/40 focus:border-sky-500/40 transition-all text-sm ${dm.input}`} value={formData.company_ko} onChange={e => setFormData({...formData, company_ko: e.target.value})} placeholder="한국어" />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🇺🇸</span>
                <input type="text" className={`block w-full rounded-lg border p-2.5 pl-9 focus:outline-none focus:ring-1 focus:ring-sky-500/40 focus:border-sky-500/40 transition-all text-sm ${dm.input}`} value={formData.company_en} onChange={e => setFormData({...formData, company_en: e.target.value})} placeholder="English" />
              </div>
            </div>
          </div>

          {/* Position */}
          <div>
            <label className={`block text-sm font-medium ${dm.textMuted} mb-1.5`}>{t.position}</label>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🇰🇷</span>
                <input required type="text" className={`block w-full rounded-lg border p-2.5 pl-9 focus:outline-none focus:ring-1 focus:ring-sky-500/40 focus:border-sky-500/40 transition-all text-sm ${dm.input}`} value={formData.position_ko} onChange={e => setFormData({...formData, position_ko: e.target.value})} placeholder="한국어" />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🇺🇸</span>
                <input required type="text" className={`block w-full rounded-lg border p-2.5 pl-9 focus:outline-none focus:ring-1 focus:ring-sky-500/40 focus:border-sky-500/40 transition-all text-sm ${dm.input}`} value={formData.position_en} onChange={e => setFormData({...formData, position_en: e.target.value})} placeholder="English" />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={`block text-sm font-medium ${dm.textMuted} mb-1.5`}>{t.description}</label>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <span className="absolute left-3 top-3 text-sm">🇰🇷</span>
                <textarea rows={3} className={`block w-full rounded-lg border p-2.5 pl-9 focus:outline-none focus:ring-1 focus:ring-sky-500/40 focus:border-sky-500/40 transition-all text-sm ${dm.input}`} value={formData.description_ko} onChange={e => setFormData({...formData, description_ko: e.target.value})} placeholder="한국어" />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-3 text-sm">🇺🇸</span>
                <textarea rows={3} className={`block w-full rounded-lg border p-2.5 pl-9 focus:outline-none focus:ring-1 focus:ring-sky-500/40 focus:border-sky-500/40 transition-all text-sm ${dm.input}`} value={formData.description_en} onChange={e => setFormData({...formData, description_en: e.target.value})} placeholder="English" />
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className={`block text-sm font-medium ${dm.textMuted} mb-1.5`}>{t.location}</label>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🇰🇷</span>
                <input type="text" className={`block w-full rounded-lg border p-2.5 pl-9 focus:outline-none focus:ring-1 focus:ring-sky-500/40 focus:border-sky-500/40 transition-all text-sm ${dm.input}`} value={formData.location_ko} onChange={e => setFormData({...formData, location_ko: e.target.value})} placeholder="한국어" />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🇺🇸</span>
                <input type="text" className={`block w-full rounded-lg border p-2.5 pl-9 focus:outline-none focus:ring-1 focus:ring-sky-500/40 focus:border-sky-500/40 transition-all text-sm ${dm.input}`} value={formData.location_en} onChange={e => setFormData({...formData, location_en: e.target.value})} placeholder="English" />
              </div>
            </div>
          </div>

          {/* URLs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium ${dm.textMuted} mb-1.5`}>LinkedIn URL</label>
              <input type="text" className={`block w-full rounded-lg border p-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500/40 focus:border-sky-500/40 transition-all text-sm ${dm.input}`} value={formData.linkedin_url} onChange={e => setFormData({...formData, linkedin_url: e.target.value})} />
            </div>
            <div>
              <label className={`block text-sm font-medium ${dm.textMuted} mb-1.5`}>{t.calendarUrl}</label>
              <input type="text" className={`block w-full rounded-lg border p-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500/40 focus:border-sky-500/40 transition-all text-sm ${dm.input}`} value={formData.calendly_url} onChange={e => setFormData({...formData, calendly_url: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium ${dm.textMuted} mb-1.5`}>Email</label>
              <input required type="email" className={`block w-full rounded-lg border p-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500/40 focus:border-sky-500/40 transition-all text-sm ${dm.input}`} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div>
              <label className={`block text-sm font-medium ${dm.textMuted} mb-1.5`}>{t.languages}</label>
              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    value="Korean"
                    checked={formData.languages.includes('Korean')}
                    onChange={handleLanguageChange}
                    className={`w-4 h-4 text-sky-600 rounded focus:ring-sky-500 ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300'}`}
                  />
                  <span className={`text-sm ${dm.textMuted}`}>Korean</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    value="English"
                    checked={formData.languages.includes('English')}
                    onChange={handleLanguageChange}
                    className={`w-4 h-4 text-sky-600 rounded focus:ring-sky-500 ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300'}`}
                  />
                  <span className={`text-sm ${dm.textMuted}`}>English</span>
                </label>
              </div>
            </div>
          </div>

          {/* Session Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium ${dm.textMuted} mb-1.5`}>{t.sessionTime}</label>
              <input
                type="number"
                min="0"
                className={`block w-full rounded-lg border p-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500/40 focus:border-sky-500/40 transition-all text-sm ${dm.input}`}
                value={formData.session_time_minutes}
                onChange={e => setFormData({...formData, session_time_minutes: e.target.value})}
                placeholder="60"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${dm.textMuted} mb-1.5`}>{t.sessionPrice}</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={`block w-full rounded-lg border p-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500/40 focus:border-sky-500/40 transition-all text-sm ${dm.input}`}
                value={formData.session_price_usd}
                onChange={e => setFormData({...formData, session_price_usd: e.target.value})}
                placeholder="30.00"
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium ${dm.textMuted} mb-1.5`}>{t.tags}</label>
            <input
              type="text"
              className={`block w-full rounded-lg border p-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500/40 focus:border-sky-500/40 transition-all text-sm ${dm.input}`}
              value={formData.tags}
              onChange={e => setFormData({...formData, tags: e.target.value})}
              placeholder="Java, Spring, Career"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${dm.textMuted} mb-1.5`}>{t.photo}</label>
            <div className="flex items-center gap-4">
              {formData.picture_url && (
                <div className={`relative h-16 w-16 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg overflow-hidden`}>
                  <Image
                    src={formData.picture_url}
                    alt="Preview"
                    fill
                    className="object-cover"
                    unoptimized={formData.picture_url.includes('supabase.co')}
                  />
                </div>
              )}
              <label className={`cursor-pointer ${dm.bg} border-2 border-dashed ${dm.border} rounded-lg py-3 px-4 flex items-center justify-center text-sm font-medium ${dm.textMuted} hover:border-sky-500 hover:text-sky-600 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-sky-50'} transition-all`}>
                {uploading ? t.loading : t.upload}
                <input type="file" className="sr-only" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
              </label>
            </div>
          </div>

          <div className={`pt-5 flex justify-end gap-3 border-t ${dm.border}`}>
            <button
              type="button"
              onClick={onClose}
              className={`py-2.5 px-5 border ${dm.border} rounded-lg text-sm font-medium ${dm.textMuted} ${dm.hover} transition-all`}
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-sky-600 hover:bg-sky-700 text-white py-2.5 px-6 rounded-lg text-sm font-semibold disabled:opacity-50"
            >
              {isSubmitting ? t.submitting : t.submitApplication}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

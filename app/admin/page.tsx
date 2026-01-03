'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { Mentor } from '@/types/mentor';
import { translations, Language } from '@/utils/i18n';
import Image from 'next/image';
import { Trash2, Plus, X, Pencil, FlaskConical } from 'lucide-react';
import TopNav from '@/app/components/TopNav';
import { useAuth } from '@/hooks/useAuth';

// Input class generator (DRY)
const getInputClass = (dark: boolean) => `block w-full rounded-lg ${dark ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} border p-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500/40 focus:border-sky-500/40 transition-all text-sm`;
const getLabelClass = (dark: boolean) => `block text-sm font-medium ${dark ? 'text-gray-300' : 'text-gray-700'} mb-1.5`;

export default function AdminPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated, isAdmin, isMockAuth, logout } = useAuth();

  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<Language>('ko');
  const [editingMentor, setEditingMentor] = useState<Partial<Mentor> | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? saved === 'true' : true;
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const toggleDarkMode = () => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    localStorage.setItem('darkMode', String(newValue));
  };

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, isAdmin, router]);

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
    is_active: boolean;
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
    is_active: true,
    session_time_minutes: '',
    session_price_usd: '',
  });

  const t = translations[lang];

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

  // Filter mentors by search
  const filteredMentors = mentors.filter(m => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      m.name_ko?.toLowerCase().includes(q) ||
      m.name_en?.toLowerCase().includes(q) ||
      m.position_ko?.toLowerCase().includes(q) ||
      m.position_en?.toLowerCase().includes(q)
    );
  });

  // Dark mode classes
  const dm = {
    bg: darkMode ? 'bg-gray-900' : 'bg-gray-50',
    bgCard: darkMode ? 'bg-gray-800' : 'bg-white',
    text: darkMode ? 'text-gray-100' : 'text-gray-900',
    textMuted: darkMode ? 'text-gray-400' : 'text-gray-600',
    textSubtle: darkMode ? 'text-gray-500' : 'text-gray-500',
    border: darkMode ? 'border-gray-700' : 'border-gray-200',
    divider: darkMode ? 'divide-gray-700' : 'divide-gray-200',
    input: darkMode
      ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400',
    rowHover: darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-sky-50',
  };

  const fetchMentors = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('mentors')
      .select('*')
      .order('name_ko', { ascending: true });

    if (error) {
      console.error('Error fetching mentors:', error);
    } else {
      setMentors(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    const loadMentors = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('mentors')
        .select('*')
        .order('name_ko', { ascending: true });

      if (error) {
        console.error('Error fetching mentors:', error);
      } else {
        setMentors(data || []);
      }
      setLoading(false);
    };
    loadMentors();
  }, []);

  const handleEdit = (mentor: Mentor) => {
    setEditingMentor(mentor);
    setFormData({
      name_en: mentor.name_en || '',
      name_ko: mentor.name_ko || '',
      description_en: mentor.description_en || '',
      description_ko: mentor.description_ko || '',
      location_en: mentor.location_en || '',
      location_ko: mentor.location_ko || '',
      position_en: mentor.position_en || '',
      position_ko: mentor.position_ko || '',
      company_en: mentor.company_en || '',
      company_ko: mentor.company_ko || '',
      picture_url: mentor.picture_url || '',
      linkedin_url: mentor.linkedin_url || '',
      calendly_url: mentor.calendly_url || '',
      email: mentor.email || '',
      languages: mentor.languages || [],
      tags: mentor.tags ? mentor.tags.join(', ') : '',
      is_active: mentor.is_active,
      session_time_minutes: mentor.session_time_minutes?.toString() || '',
      session_price_usd: mentor.session_price_usd?.toString() || '',
    });
    setIsFormOpen(true);
  };

  const handleDeleteClick = (mentor: Mentor) => {
    setDeleteConfirm({ id: mentor.id, name: mentor.name_ko || mentor.name_en || 'this mentor' });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;

    const { error } = await supabase.from('mentors').delete().eq('id', deleteConfirm.id);
    if (error) {
      alert('Error deleting mentor');
    } else {
      fetchMentors();
    }
    setDeleteConfirm(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setUploading(true);
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('mentor-pictures')
      .upload(fileName, file);

    if (uploadError) {
      alert('Error uploading image');
      console.error(uploadError);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from('mentor-pictures').getPublicUrl(fileName);
    setFormData(prev => ({ ...prev, picture_url: data.publicUrl }));
    setUploading(false);
  };

  const toggleActive = async (mentor: Mentor) => {
    const newStatus = !mentor.is_active;
    const { error } = await supabase
      .from('mentors')
      .update({ is_active: newStatus })
      .eq('id', mentor.id);

    if (error) {
      alert('Error updating status');
    } else {
      setMentors(mentors.map(m => m.id === mentor.id ? { ...m, is_active: newStatus } : m));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      languages: formData.languages,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      is_active: formData.is_active,
      session_time_minutes: formData.session_time_minutes ? parseInt(formData.session_time_minutes, 10) : null,
      session_price_usd: formData.session_price_usd ? parseFloat(formData.session_price_usd) : null,
    };

    if (editingMentor?.id) {
      const { error } = await supabase.from('mentors').update(mentorData).eq('id', editingMentor.id);
      if (error) alert('Error updating mentor');
    } else {
      const { error } = await supabase.from('mentors').insert([mentorData]);
      if (error) alert('Error creating mentor');
    }

    setIsFormOpen(false);
    setEditingMentor(null);
    fetchMentors();
  };

  const openNewForm = () => {
    setEditingMentor(null);
    setFormData({
      name_en: '', name_ko: '', description_en: '', description_ko: '',
      location_en: '', location_ko: '', position_en: '', position_ko: '',
      company_en: '', company_ko: '', picture_url: '', linkedin_url: '',
      calendly_url: '', email: '', languages: [], tags: '',
      is_active: true, session_time_minutes: '', session_price_usd: '',
    });
    setIsFormOpen(true);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // Show loading while checking auth
  if (authLoading || !isAuthenticated || !isAdmin) {
    return (
      <div className={`min-h-screen ${dm.bg} flex items-center justify-center`}>
        <p className={dm.textMuted}>{t.loading}</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${dm.bg} transition-colors duration-300`}>
      {/* Header */}
      <TopNav
        variant="admin"
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        lang={lang}
        onLangChange={setLang}
        showSearch={true}
        searchValue={search}
        onSearchChange={setSearch}
        user={user ? {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          role: user.role,
        } : undefined}
        onLogout={handleLogout}
      />

      {/* Dev Mode Banner */}
      {isMockAuth && (
        <div className="bg-amber-500 text-amber-950 text-center py-2 px-4 text-sm font-medium flex items-center justify-center gap-2">
          <FlaskConical size={16} />
          {t.devModeBanner}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Sticky CTA row */}
        <div className={`flex justify-between items-center mb-4 sticky top-14 z-20 ${dm.bg} py-2 -mt-2`}>
          <span className={`text-sm ${dm.textMuted}`}>
            {filteredMentors.length} mentor{filteredMentors.length !== 1 ? 's' : ''}
            {search && ` matching "${search}"`}
          </span>
          <button
            onClick={openNewForm}
            className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors cursor-pointer"
          >
            <Plus size={18} />
            {t.applyMentor}
          </button>
        </div>

        {/* Mentor List */}
        <div className={`${dm.bgCard} border ${dm.border} rounded-xl overflow-hidden transition-colors duration-300`}>
          {loading ? (
            <div className={`px-6 py-12 text-center ${dm.textSubtle}`}>{t.loading}</div>
          ) : filteredMentors.length === 0 ? (
            <div className={`px-6 py-12 text-center ${dm.textSubtle}`}>
              {search ? `No mentors matching "${search}"` : 'No mentors found.'}
            </div>
          ) : (
            <ul className={`divide-y ${dm.divider}`}>
              {filteredMentors.map((mentor) => (
                <li key={mentor.id} className={`${dm.rowHover} transition-colors`}>
                  <div className="px-4 py-3 sm:px-5 flex items-center justify-between gap-4">
                    {/* Clickable area for edit */}
                    <button
                      onClick={() => handleEdit(mentor)}
                      className="flex items-center min-w-0 flex-1 text-left cursor-pointer group active:opacity-80"
                    >
                      <div className={`flex-shrink-0 h-10 w-10 relative ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg overflow-hidden`}>
                        {mentor.picture_url ? (
                          <Image
                            src={mentor.picture_url}
                            alt={mentor.name_en || 'Mentor'}
                            fill
                            className="object-cover"
                            unoptimized={mentor.picture_url.includes('supabase.co')}
                          />
                        ) : (
                          <div className={`flex items-center justify-center h-full ${dm.textSubtle} text-sm`}>👤</div>
                        )}
                      </div>
                      <div className="ml-3 min-w-0">
                        <div className={`text-sm font-medium ${dm.text} truncate group-hover:text-sky-500 transition-colors`}>
                          {mentor.name_ko} / {mentor.name_en}
                        </div>
                        <div className={`text-xs ${dm.textSubtle} truncate`}>
                          {mentor.position_ko || mentor.position_en}
                        </div>
                      </div>
                      {/* Edit icon - mobile only (desktop has hover) */}
                      <Pencil size={14} className={`ml-2 flex-shrink-0 ${dm.textSubtle} sm:hidden`} />
                    </button>
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                      {/* Toggle */}
                      <button
                        onClick={() => toggleActive(mentor)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all cursor-pointer hover:opacity-80 hover:ring-2 hover:ring-offset-1 active:scale-95 ${darkMode ? 'hover:ring-offset-gray-800' : 'hover:ring-offset-white'} ${
                          mentor.is_active ? 'bg-sky-600 hover:ring-sky-400' : darkMode ? 'bg-gray-600 hover:ring-gray-500' : 'bg-gray-300 hover:ring-gray-400'
                        }`}
                        role="switch"
                        aria-checked={mentor.is_active}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                          mentor.is_active ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(mentor)}
                        className={`p-2 ${dm.textSubtle} hover:text-red-400 ${darkMode ? 'hover:bg-gray-700 active:bg-gray-600' : 'hover:bg-gray-100 active:bg-gray-200'} rounded-lg transition-colors cursor-pointer active:scale-95`}
                        aria-label="Delete mentor"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      {/* Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`${dm.bgCard} border ${dm.border} rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors duration-300`}>
            <div className={`sticky top-0 ${dm.bgCard} border-b ${dm.border} px-5 py-4 flex justify-between items-center`}>
              <h2 className={`text-lg font-semibold ${dm.text}`}>
                {editingMentor ? t.edit : t.applyMentor}
              </h2>
              <button
                onClick={() => setIsFormOpen(false)}
                className={`p-2 ${dm.textSubtle} hover:${dm.text} ${darkMode ? 'hover:bg-gray-700 active:bg-gray-600' : 'hover:bg-gray-100 active:bg-gray-200'} rounded-lg transition-colors active:scale-95`}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Bilingual Fields - each row clearly labeled */}
              {/* Name */}
              <div>
                <label className={getLabelClass(darkMode)}>{t.name}</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🇰🇷</span>
                    <input type="text" className={`${getInputClass(darkMode)} pl-9`} value={formData.name_ko} onChange={e => setFormData({...formData, name_ko: e.target.value})} placeholder="한국어" />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🇺🇸</span>
                    <input type="text" className={`${getInputClass(darkMode)} pl-9`} value={formData.name_en} onChange={e => setFormData({...formData, name_en: e.target.value})} placeholder="English" />
                  </div>
                </div>
              </div>

              {/* Company */}
              <div>
                <label className={getLabelClass(darkMode)}>{t.company}</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🇰🇷</span>
                    <input type="text" className={`${getInputClass(darkMode)} pl-9`} value={formData.company_ko} onChange={e => setFormData({...formData, company_ko: e.target.value})} placeholder="한국어" />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🇺🇸</span>
                    <input type="text" className={`${getInputClass(darkMode)} pl-9`} value={formData.company_en} onChange={e => setFormData({...formData, company_en: e.target.value})} placeholder="English" />
                  </div>
                </div>
              </div>

              {/* Position */}
              <div>
                <label className={getLabelClass(darkMode)}>{t.position}</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🇰🇷</span>
                    <input type="text" className={`${getInputClass(darkMode)} pl-9`} value={formData.position_ko} onChange={e => setFormData({...formData, position_ko: e.target.value})} placeholder="한국어" />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🇺🇸</span>
                    <input type="text" className={`${getInputClass(darkMode)} pl-9`} value={formData.position_en} onChange={e => setFormData({...formData, position_en: e.target.value})} placeholder="English" />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className={getLabelClass(darkMode)}>{t.description}</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-sm">🇰🇷</span>
                    <textarea rows={3} className={`${getInputClass(darkMode)} pl-9`} value={formData.description_ko} onChange={e => setFormData({...formData, description_ko: e.target.value})} placeholder="한국어" />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-sm">🇺🇸</span>
                    <textarea rows={3} className={`${getInputClass(darkMode)} pl-9`} value={formData.description_en} onChange={e => setFormData({...formData, description_en: e.target.value})} placeholder="English" />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className={getLabelClass(darkMode)}>{t.location}</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🇰🇷</span>
                    <input type="text" className={`${getInputClass(darkMode)} pl-9`} value={formData.location_ko} onChange={e => setFormData({...formData, location_ko: e.target.value})} placeholder="한국어" />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🇺🇸</span>
                    <input type="text" className={`${getInputClass(darkMode)} pl-9`} value={formData.location_en} onChange={e => setFormData({...formData, location_en: e.target.value})} placeholder="English" />
                  </div>
                </div>
              </div>

              {/* Other Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={getLabelClass(darkMode)}>LinkedIn URL</label>
                  <input type="text" className={getInputClass(darkMode)} value={formData.linkedin_url} onChange={e => setFormData({...formData, linkedin_url: e.target.value})} />
                </div>
                <div>
                  <label className={getLabelClass(darkMode)}>{t.calendarUrl}</label>
                  <input type="text" className={getInputClass(darkMode)} value={formData.calendly_url} onChange={e => setFormData({...formData, calendly_url: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={getLabelClass(darkMode)}>Email</label>
                  <input type="email" className={getInputClass(darkMode)} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div>
                  <label className={getLabelClass(darkMode)}>{t.languages}</label>
                  <div className="flex gap-4 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        value="Korean"
                        checked={formData.languages.includes('Korean')}
                        onChange={handleLanguageChange}
                        className={`h-4 w-4 rounded ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-white'} text-sky-600 focus:ring-sky-500`}
                      />
                      <span className={`text-sm ${dm.textMuted}`}>Korean</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        value="English"
                        checked={formData.languages.includes('English')}
                        onChange={handleLanguageChange}
                        className={`h-4 w-4 rounded ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-white'} text-sky-600 focus:ring-sky-500`}
                      />
                      <span className={`text-sm ${dm.textMuted}`}>English</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={getLabelClass(darkMode)}>{t.sessionTime}</label>
                  <input type="number" min="0" className={getInputClass(darkMode)} value={formData.session_time_minutes} onChange={e => setFormData({...formData, session_time_minutes: e.target.value})} placeholder="60" />
                </div>
                <div>
                  <label className={getLabelClass(darkMode)}>{t.sessionPrice}</label>
                  <input type="number" step="0.01" min="0" className={getInputClass(darkMode)} value={formData.session_price_usd} onChange={e => setFormData({...formData, session_price_usd: e.target.value})} placeholder="30.00" />
                </div>
              </div>

              <div>
                <label className={getLabelClass(darkMode)}>{t.tags}</label>
                <input type="text" className={getInputClass(darkMode)} value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} placeholder="Java, Spring, Career" />
              </div>

              {/* Photo */}
              <div>
                <label className={getLabelClass(darkMode)}>{t.photo}</label>
                <div className="flex items-center gap-3">
                  {formData.picture_url && (
                    <div className={`relative h-14 w-14 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg overflow-hidden flex-shrink-0`}>
                      <Image src={formData.picture_url} alt="Preview" fill className="object-cover" unoptimized={formData.picture_url.includes('supabase.co')} />
                    </div>
                  )}
                  <label className={`cursor-pointer ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-400' : 'bg-gray-50 border-gray-300 text-gray-600'} border border-dashed rounded-lg py-2.5 px-4 text-sm font-medium hover:border-sky-500 hover:text-sky-400 active:border-sky-600 active:bg-sky-900/20 transition-colors`}>
                    {uploading ? t.loading : t.upload}
                    <input type="file" className="sr-only" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                  </label>
                </div>
              </div>

              {/* Active checkbox */}
              <div className="flex items-center gap-2">
                <input
                  id="enabled"
                  type="checkbox"
                  className={`h-4 w-4 rounded ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-white'} text-sky-600 focus:ring-sky-500`}
                  checked={formData.is_active}
                  onChange={e => setFormData({...formData, is_active: e.target.checked})}
                />
                <label htmlFor="enabled" className={`text-sm ${dm.textMuted}`}>{t.enabled}</label>
              </div>

              {/* Actions */}
              <div className={`pt-4 flex justify-end gap-3 border-t ${dm.border}`}>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className={`py-2 px-4 border ${dm.border} rounded-lg text-sm font-medium ${dm.textMuted} ${darkMode ? 'hover:bg-gray-700 active:bg-gray-600' : 'hover:bg-gray-100 active:bg-gray-200'} transition-colors`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 rounded-lg text-sm font-medium text-white transition-colors"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`${dm.bgCard} border ${dm.border} rounded-xl shadow-2xl max-w-sm w-full p-6 transition-colors duration-300`}>
            <div className="text-center">
              <div className={`mx-auto w-12 h-12 rounded-full ${darkMode ? 'bg-red-900/30' : 'bg-red-100'} flex items-center justify-center mb-4`}>
                <Trash2 size={24} className="text-red-500" />
              </div>
              <h3 className={`text-lg font-semibold ${dm.text} mb-2`}>Delete Mentor</h3>
              <p className={`text-sm ${dm.textMuted} mb-6`}>
                Are you sure you want to delete <span className="font-medium">{deleteConfirm.name}</span>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className={`flex-1 py-2.5 px-4 border ${dm.border} rounded-lg text-sm font-medium ${dm.textMuted} ${darkMode ? 'hover:bg-gray-700 active:bg-gray-600' : 'hover:bg-gray-100 active:bg-gray-200'} transition-colors`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg text-sm font-medium text-white transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

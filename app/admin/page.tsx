'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Mentor } from '@/types/mentor';
import { translations, Language } from '@/utils/i18n';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, Edit2, Plus, X } from 'lucide-react';

export default function AdminPage() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<Language>('ko');
  const [editingMentor, setEditingMentor] = useState<Partial<Mentor> | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form state - flattened for easier handling of dual languages
  const [formData, setFormData] = useState({
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
    languages: '',
    tags: '',
    is_active: true,
    session_time_minutes: '',
    session_price_usd: '',
  });

  const t = translations[lang];

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
    fetchMentors();
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
      languages: mentor.languages ? mentor.languages.join(', ') : '',
      tags: mentor.tags ? mentor.tags.join(', ') : '',
      is_active: mentor.is_active,
      session_time_minutes: mentor.session_time_minutes?.toString() || '',
      session_price_usd: mentor.session_price_usd?.toString() || '',
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this mentor?')) return;

    const { error } = await supabase.from('mentors').delete().eq('id', id);
    if (error) {
      alert('Error deleting mentor');
    } else {
      fetchMentors();
    }
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
    
    const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
    const languagesArray = formData.languages.split(',').map(l => l.trim()).filter(l => l !== '');
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
      is_active: formData.is_active,
      session_time_minutes: sessionTimeMinutes,
      session_price_usd: sessionPriceUsd,
    };

    if (editingMentor && editingMentor.id) {
      // Update
      const { error } = await supabase
        .from('mentors')
        .update(mentorData)
        .eq('id', editingMentor.id);
      
      if (error) alert('Error updating mentor');
    } else {
      // Create
      const { error } = await supabase
        .from('mentors')
        .insert([mentorData]);
        
      if (error) alert('Error creating mentor');
    }

    setIsFormOpen(false);
    setEditingMentor(null);
    fetchMentors();
  };

  const openNewForm = () => {
    setEditingMentor(null);
    setFormData({
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
      languages: '',
      tags: '',
      is_active: true,
      session_time_minutes: '',
      session_price_usd: '',
    });
    setIsFormOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-12">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">{t.adminTitle}</h1>
            <button
              onClick={() => setLang(lang === 'en' ? 'ko' : 'en')}
              className="text-sm text-gray-500 hover:text-gray-900"
            >
              {lang === 'en' ? '🇰🇷 한국어' : '🇺🇸 English'}
            </button>
          </div>
          <Link href="/" className="text-blue-600 hover:text-blue-500">
            {t.viewHome}
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-end mb-6 gap-4">
          <button
            onClick={openNewForm}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            <Plus size={20} />
            Add Mentor
          </button>
        </div>

        {/* List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {mentors.map((mentor) => (
              <li key={mentor.id}>
                <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 relative bg-gray-200 rounded-full overflow-hidden">
                      {mentor.picture_url ? (
                        <Image 
                          src={mentor.picture_url} 
                          alt={mentor.name_en || 'Mentor'} 
                          fill 
                          className="object-cover"
                          unoptimized={mentor.picture_url.includes('supabase.co')}
                        />
                      ) : null}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-blue-600">
                        {mentor.name_ko} / {mentor.name_en}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => toggleActive(mentor)}
                      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-md hover:shadow-lg ${
                        mentor.is_active 
                          ? 'bg-green-500 focus:ring-green-500' 
                          : 'bg-gray-400 focus:ring-gray-400'
                      }`}
                      role="switch"
                      aria-checked={mentor.is_active}
                      aria-label={mentor.is_active ? 'Deactivate mentor' : 'Activate mentor'}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${
                          mentor.is_active ? 'translate-x-8' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <button onClick={() => handleEdit(mentor)} className="text-gray-400 hover:text-gray-600">
                      <Edit2 size={20} />
                    </button>
                    <button onClick={() => handleDelete(mentor.id)} className="text-red-400 hover:text-red-600">
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
            {mentors.length === 0 && !loading && (
              <li className="px-4 py-4 text-center text-gray-500">No mentors found.</li>
            )}
          </ul>
        </div>
      </main>

      {/* Modal/Form Overlay */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">{editingMentor ? t.edit : 'Add Mentor'}</h2>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t.name} (KO)</label>
                  <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-gray-900 bg-white" value={formData.name_ko} onChange={e => setFormData({...formData, name_ko: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t.name} (EN)</label>
                  <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-gray-900 bg-white" value={formData.name_en} onChange={e => setFormData({...formData, name_en: e.target.value})} />
                </div>
              </div>

              {/* Company */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company (KO)</label>
                  <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-gray-900 bg-white" value={formData.company_ko} onChange={e => setFormData({...formData, company_ko: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company (EN)</label>
                  <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-gray-900 bg-white" value={formData.company_en} onChange={e => setFormData({...formData, company_en: e.target.value})} />
                </div>
              </div>

              {/* Positions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t.position} (KO)</label>
                  <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-gray-900 bg-white" value={formData.position_ko} onChange={e => setFormData({...formData, position_ko: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t.position} (EN)</label>
                  <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-gray-900 bg-white" value={formData.position_en} onChange={e => setFormData({...formData, position_en: e.target.value})} />
                </div>
              </div>

              {/* Descriptions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t.description} (KO)</label>
                  <textarea rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-gray-900 bg-white" value={formData.description_ko} onChange={e => setFormData({...formData, description_ko: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t.description} (EN)</label>
                  <textarea rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-gray-900 bg-white" value={formData.description_en} onChange={e => setFormData({...formData, description_en: e.target.value})} />
                </div>
              </div>

              {/* Locations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t.location} (KO)</label>
                  <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-gray-900 bg-white" value={formData.location_ko} onChange={e => setFormData({...formData, location_ko: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t.location} (EN)</label>
                  <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-gray-900 bg-white" value={formData.location_en} onChange={e => setFormData({...formData, location_en: e.target.value})} />
                </div>
              </div>

              {/* URLs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">LinkedIn URL</label>
                  <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-gray-900 bg-white" value={formData.linkedin_url} onChange={e => setFormData({...formData, linkedin_url: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Calendly URL</label>
                  <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-gray-900 bg-white" value={formData.calendly_url} onChange={e => setFormData({...formData, calendly_url: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input type="email" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-gray-900 bg-white" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Languages (comma separated)</label>
                  <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-gray-900 bg-white" value={formData.languages} onChange={e => setFormData({...formData, languages: e.target.value})} placeholder="Korean, English" />
                </div>
              </div>

              {/* Session Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Session Time (minutes)</label>
                  <input 
                    type="number" 
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-gray-900 bg-white" 
                    value={formData.session_time_minutes} 
                    onChange={e => setFormData({...formData, session_time_minutes: e.target.value})} 
                    placeholder="60"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Session Price (USD)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-gray-900 bg-white" 
                    value={formData.session_price_usd} 
                    onChange={e => setFormData({...formData, session_price_usd: e.target.value})} 
                    placeholder="30.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">{t.tags}</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-gray-900 bg-white"
                  value={formData.tags}
                  onChange={e => setFormData({...formData, tags: e.target.value})}
                  placeholder="Java, Spring, Career"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">{t.photo}</label>
                <div className="mt-1 flex items-center gap-4">
                  {formData.picture_url && (
                    <div className="relative h-16 w-16 bg-gray-200 rounded overflow-hidden">
                      <Image 
                        src={formData.picture_url} 
                        alt="Preview" 
                        fill 
                        className="object-cover"
                        unoptimized={formData.picture_url.includes('supabase.co')}
                      />
                    </div>
                  )}
                  <label className="cursor-pointer bg-white border border-gray-300 rounded-md py-2 px-3 flex items-center justify-center text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm">
                    {uploading ? t.loading : t.upload}
                    <input type="file" className="sr-only" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                  </label>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="enabled"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={formData.is_active}
                  onChange={e => setFormData({...formData, is_active: e.target.checked})}
                />
                <label htmlFor="enabled" className="ml-2 block text-sm text-gray-900">
                  {t.enabled}
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { translations, Language } from '@/utils/i18n';
import { Clock, Pencil, Calendar, CalendarDays, X, BarChart3, Link2 } from 'lucide-react';
import TopNav from '@/app/components/TopNav';
import ProfileForm, { ProfileFormData } from '@/app/components/ProfileForm';
import PolicyAcceptanceModal from '@/app/components/PolicyAcceptanceModal';
import SearchableSelect from '@/app/components/SearchableSelect';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/utils/supabase';

// Bento card type
type BentoCardId = 'profile' | 'availability' | 'calendar' | 'stats' | 'bookings';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, logout, isApproved, policyAccepted, acceptPolicy, needsMentorLink, linkMentorProfile } = useAuth();

  const [lang, setLang] = useState<Language>('ko');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<BentoCardId>('profile');
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? saved === 'true' : true;
  });

  // Profile form state
  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    name_en: '',
    name_ko: '',
    description_en: '',
    description_ko: '',
    position_en: '',
    position_ko: '',
    company_en: '',
    company_ko: '',
    location_en: '',
    location_ko: '',
    linkedin_url: '',
    calendly_url: '',
    email: '',
    languages: [],
    session_time_minutes: null,
    session_price_usd: null,
    tags: [],
    picture_url: '',
  });
  const [mentorId, setMentorId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Mentor linking state
  const [unlinkedMentors, setUnlinkedMentors] = useState<Array<{ id: string; name_en: string; name_ko: string; email: string }>>([]);
  const [selectedMentorId, setSelectedMentorId] = useState<string>('');  // 'new' = register as new mentor
  const [isSubmittingLink, setIsSubmittingLink] = useState(false);
  const [linkSubmitSuccess, setLinkSubmitSuccess] = useState(false);
  const [selectedMentorPreview, setSelectedMentorPreview] = useState<ProfileFormData | null>(null);

  // Toast/feedback state (replaces alert())
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Fetch mentor data linked to user profile
  useEffect(() => {
    const fetchMentorData = async () => {
      if (!user) return;

      // Get user's profile with linked mentor_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('mentor_id')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.mentor_id) {
        setMentorId(profile.mentor_id);

        // Fetch mentor data
        const { data: mentor } = await supabase
          .from('mentors')
          .select('*')
          .eq('id', profile.mentor_id)
          .single();

        if (mentor) {
          setProfileForm({
            name_en: mentor.name_en || '',
            name_ko: mentor.name_ko || '',
            description_en: mentor.description_en || '',
            description_ko: mentor.description_ko || '',
            position_en: mentor.position_en || '',
            position_ko: mentor.position_ko || '',
            company_en: mentor.company_en || '',
            company_ko: mentor.company_ko || '',
            location_en: mentor.location_en || '',
            location_ko: mentor.location_ko || '',
            linkedin_url: mentor.linkedin_url || '',
            calendly_url: mentor.calendly_url || '',
            email: mentor.email || '',
            languages: mentor.languages || [],
            session_time_minutes: mentor.session_time_minutes,
            session_price_usd: mentor.session_price_usd,
            tags: Array.isArray(mentor.tags) ? mentor.tags : [],
            picture_url: mentor.picture_url || '',
          });
        }
      } else {
        // No linked mentor - only pre-fill email, not name
        // (displayName might be email if user signed up with email/password)
        const isEmailAsName = user.displayName?.includes('@');
        setProfileForm(prev => ({
          ...prev,
          name_en: isEmailAsName ? '' : (user.displayName || ''),
          name_ko: isEmailAsName ? '' : (user.displayName || ''),
          email: user.email || '',
        }));
      }
    };

    fetchMentorData();
  }, [user]);

  // Fetch unlinked mentors for linking dropdown
  useEffect(() => {
    const fetchUnlinkedMentors = async () => {
      if (!needsMentorLink || !user) return;

      // Get all mentor IDs that are already linked to a profile
      const { data: linkedProfiles } = await supabase
        .from('profiles')
        .select('mentor_id')
        .not('mentor_id', 'is', null);

      const linkedMentorIds = linkedProfiles?.map(p => p.mentor_id) || [];

      // Get all mentors NOT in the linked list
      let query = supabase
        .from('mentors')
        .select('id, name_en, name_ko, email')
        .order('name_ko', { ascending: true });

      if (linkedMentorIds.length > 0) {
        query = query.not('id', 'in', `(${linkedMentorIds.join(',')})`);
      }

      const { data: mentors } = await query;
      setUnlinkedMentors(mentors || []);

      // Pre-select if user's email matches a mentor
      if (mentors && user.email) {
        const matchingMentor = mentors.find(m =>
          m.email?.toLowerCase() === user.email.toLowerCase()
        );
        if (matchingMentor) {
          setSelectedMentorId(matchingMentor.id);
        }
      }
    };

    fetchUnlinkedMentors();
  }, [needsMentorLink, user]);

  // Fetch mentor preview when selection changes
  useEffect(() => {
    const fetchMentorPreview = async () => {
      if (!selectedMentorId || selectedMentorId === 'new') {
        setSelectedMentorPreview(null);
        return;
      }

      const { data: mentor } = await supabase
        .from('mentors')
        .select('*')
        .eq('id', selectedMentorId)
        .single();

      if (mentor) {
        setSelectedMentorPreview({
          name_en: mentor.name_en || '',
          name_ko: mentor.name_ko || '',
          description_en: mentor.description_en || '',
          description_ko: mentor.description_ko || '',
          position_en: mentor.position_en || '',
          position_ko: mentor.position_ko || '',
          company_en: mentor.company_en || '',
          company_ko: mentor.company_ko || '',
          location_en: mentor.location_en || '',
          location_ko: mentor.location_ko || '',
          linkedin_url: mentor.linkedin_url || '',
          calendly_url: mentor.calendly_url || '',
          email: mentor.email || '',
          languages: mentor.languages || [],
          session_time_minutes: mentor.session_time_minutes,
          session_price_usd: mentor.session_price_usd,
          tags: Array.isArray(mentor.tags) ? mentor.tags : [],
          picture_url: mentor.picture_url || '',
        });
      }
    };

    fetchMentorPreview();
  }, [selectedMentorId]);

  // Handle mentor link submission
  const handleLinkSubmit = async () => {
    if (!selectedMentorId) return;

    const isNewMentor = selectedMentorId === 'new';
    setIsSubmittingLink(true);
    setLinkSubmitSuccess(false);
    try {
      // For new mentors, pass the profile form data
      await linkMentorProfile(
        isNewMentor ? null : selectedMentorId,
        isNewMentor,
        isNewMentor ? profileForm : undefined
      );
      // Success - show success state
      setLinkSubmitSuccess(true);
      setToast({ type: 'success', message: t.linkSubmitSuccess });

      // For existing mentor, update local state with the linked mentor's data
      if (!isNewMentor && selectedMentorPreview) {
        setMentorId(selectedMentorId);
        setProfileForm(selectedMentorPreview);
      }
    } catch (error) {
      console.error('Link error:', error);
      setToast({ type: 'error', message: t.linkError });
    } finally {
      setIsSubmittingLink(false);
    }
  };

  const handleImageUpload = useCallback(async (file: File): Promise<string | null> => {
    if (!mentorId) return null;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${mentorId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('mentor-pictures')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('mentor-pictures')
        .getPublicUrl(filePath);

      return publicUrl;
    } finally {
      setIsUploading(false);
    }
  }, [mentorId]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!mentorId) {
      setToast({ type: 'error', message: t.cannotSave });
      return;
    }

    // Save to mentors table
    const { error } = await supabase
      .from('mentors')
      .update({
        name_en: profileForm.name_en,
        name_ko: profileForm.name_ko,
        description_en: profileForm.description_en,
        description_ko: profileForm.description_ko,
        position_en: profileForm.position_en,
        position_ko: profileForm.position_ko,
        company_en: profileForm.company_en,
        company_ko: profileForm.company_ko,
        location_en: profileForm.location_en,
        location_ko: profileForm.location_ko,
        linkedin_url: profileForm.linkedin_url,
        calendly_url: profileForm.calendly_url,
        email: profileForm.email,
        languages: profileForm.languages,
        session_time_minutes: profileForm.session_time_minutes,
        session_price_usd: profileForm.session_price_usd,
        tags: profileForm.tags,
        picture_url: profileForm.picture_url,
      })
      .eq('id', mentorId);

    if (error) {
      console.error('Save error:', error);
      setToast({ type: 'error', message: t.saveError });
    } else {
      setToast({ type: 'success', message: t.saveSuccess });
      setIsProfileModalOpen(false);
    }
  };

  const toggleDarkMode = () => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    localStorage.setItem('darkMode', String(newValue));
  };

  const t = translations[lang];

  // Build options for searchable select (new mentor at top)
  const mentorOptions = [
    { value: 'new', label: `➕ ${t.registerAsNewMentor}` },
    ...unlinkedMentors.map(m => {
      const isMatch = m.email?.toLowerCase() === user?.email.toLowerCase();
      return {
        value: m.id,
        label: lang === 'ko' ? m.name_ko : m.name_en,
        tag: isMatch ? t.emailMatch : undefined,
      };
    }),
  ];

  // Dark mode classes
  const dm = {
    bg: darkMode ? 'bg-gray-900' : 'bg-gray-50',
    bgCard: darkMode ? 'bg-gray-800' : 'bg-white',
    text: darkMode ? 'text-gray-100' : 'text-gray-900',
    textMuted: darkMode ? 'text-gray-400' : 'text-gray-600',
    border: darkMode ? 'border-gray-700' : 'border-gray-200',
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Check for pending policy acceptance from signup
  useEffect(() => {
    const checkPendingPolicyAcceptance = async () => {
      if (!isAuthenticated || policyAccepted) return;

      // Check localStorage (email signup) or sessionStorage (Google OAuth)
      const pendingFromEmail = localStorage.getItem('policyAcceptedOnSignup');
      const pendingFromGoogle = sessionStorage.getItem('policyAcceptedOnSignup');

      if (pendingFromEmail === 'true' || pendingFromGoogle === 'true') {
        try {
          await acceptPolicy();
          localStorage.removeItem('policyAcceptedOnSignup');
          sessionStorage.removeItem('policyAcceptedOnSignup');
        } catch (error) {
          console.error('Failed to save policy acceptance:', error);
        }
      }
    };

    checkPendingPolicyAcceptance();
  }, [isAuthenticated, policyAccepted, acceptPolicy]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className={`min-h-screen ${dm.bg} flex items-center justify-center`}>
        <p className={dm.textMuted}>{t.loading}</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${dm.bg} transition-colors duration-300`}>
      {/* TopNav */}
      <TopNav
        variant="mentor"
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        lang={lang}
        onLangChange={setLang}
        user={user ? {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          role: user.role,
        } : undefined}
        onLogout={handleLogout}
      />

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200 ${
          toast.type === 'success'
            ? 'bg-green-600 text-white'
            : 'bg-red-600 text-white'
        }`}>
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col" style={{ minHeight: 'calc(100vh - 56px)' }}>
        <h1 className={`text-2xl font-bold ${dm.text} mb-6`}>
          {t.dashboardTitle}
        </h1>

        {/* Pending Status - Shows for unapproved mentors */}
        {!isApproved && (
          <div className={`${darkMode ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-200'} border rounded-xl p-4 mb-6`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                <Clock size={20} className="text-yellow-500" />
              </div>
              <div>
                <p className={`font-medium ${darkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>
                  {t.statusPending}
                </p>
                <p className={`text-sm ${darkMode ? 'text-yellow-500/80' : 'text-yellow-600'}`}>
                  {t.pendingApprovalMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Bento Navigation - 5 small boxes at TOP */}
        <div className="grid grid-cols-5 gap-2 sm:gap-3 mb-4">
          {/* Profile */}
          <button
            onClick={() => setSelectedCard('profile')}
            className={`${dm.bgCard} border rounded-xl p-3 sm:p-4 text-center cursor-pointer transition-all duration-200 hover:scale-[1.03] ${
              selectedCard === 'profile'
                ? `ring-2 ring-sky-500 ${darkMode ? 'bg-sky-500/10 border-sky-500/50' : 'bg-sky-50 border-sky-300'}`
                : dm.border
            }`}
          >
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg mx-auto mb-2 flex items-center justify-center ${
              selectedCard === 'profile'
                ? darkMode ? 'bg-sky-500/30' : 'bg-sky-100'
                : darkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <Pencil size={18} className={selectedCard === 'profile' ? 'text-sky-500' : dm.textMuted} />
            </div>
            <span className={`text-xs sm:text-sm font-medium ${selectedCard === 'profile' ? (darkMode ? 'text-sky-400' : 'text-sky-600') : dm.textMuted}`}>
              {t.profileCardTitle}
            </span>
          </button>

          {/* Availability */}
          <button
            onClick={() => setSelectedCard('availability')}
            className={`${dm.bgCard} border rounded-xl p-3 sm:p-4 text-center cursor-pointer transition-all duration-200 hover:scale-[1.03] ${
              selectedCard === 'availability'
                ? `ring-2 ring-amber-500 ${darkMode ? 'bg-amber-500/10 border-amber-500/50' : 'bg-amber-50 border-amber-300'}`
                : dm.border
            }`}
          >
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg mx-auto mb-2 flex items-center justify-center ${
              selectedCard === 'availability'
                ? darkMode ? 'bg-amber-500/30' : 'bg-amber-100'
                : darkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <Clock size={18} className={selectedCard === 'availability' ? 'text-amber-500' : dm.textMuted} />
            </div>
            <span className={`text-xs sm:text-sm font-medium ${selectedCard === 'availability' ? (darkMode ? 'text-amber-400' : 'text-amber-600') : dm.textMuted}`}>
              {t.availabilityCardTitle}
            </span>
          </button>

          {/* Calendar */}
          <button
            onClick={() => setSelectedCard('calendar')}
            className={`${dm.bgCard} border rounded-xl p-3 sm:p-4 text-center cursor-pointer transition-all duration-200 hover:scale-[1.03] ${
              selectedCard === 'calendar'
                ? `ring-2 ring-green-500 ${darkMode ? 'bg-green-500/10 border-green-500/50' : 'bg-green-50 border-green-300'}`
                : dm.border
            }`}
          >
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg mx-auto mb-2 flex items-center justify-center ${
              selectedCard === 'calendar'
                ? darkMode ? 'bg-green-500/30' : 'bg-green-100'
                : darkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <CalendarDays size={18} className={selectedCard === 'calendar' ? 'text-green-500' : dm.textMuted} />
            </div>
            <span className={`text-xs sm:text-sm font-medium ${selectedCard === 'calendar' ? (darkMode ? 'text-green-400' : 'text-green-600') : dm.textMuted}`}>
              {t.calendarCardTitle}
            </span>
          </button>

          {/* Stats */}
          <button
            onClick={() => setSelectedCard('stats')}
            className={`${dm.bgCard} border rounded-xl p-3 sm:p-4 text-center cursor-pointer transition-all duration-200 hover:scale-[1.03] ${
              selectedCard === 'stats'
                ? `ring-2 ring-purple-500 ${darkMode ? 'bg-purple-500/10 border-purple-500/50' : 'bg-purple-50 border-purple-300'}`
                : dm.border
            }`}
          >
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg mx-auto mb-2 flex items-center justify-center ${
              selectedCard === 'stats'
                ? darkMode ? 'bg-purple-500/30' : 'bg-purple-100'
                : darkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <BarChart3 size={18} className={selectedCard === 'stats' ? 'text-purple-500' : dm.textMuted} />
            </div>
            <span className={`text-xs sm:text-sm font-medium ${selectedCard === 'stats' ? (darkMode ? 'text-purple-400' : 'text-purple-600') : dm.textMuted}`}>
              {t.statsCardTitle}
            </span>
          </button>

          {/* Bookings */}
          <button
            onClick={() => setSelectedCard('bookings')}
            className={`${dm.bgCard} border rounded-xl p-3 sm:p-4 text-center cursor-pointer transition-all duration-200 hover:scale-[1.03] ${
              selectedCard === 'bookings'
                ? `ring-2 ring-rose-500 ${darkMode ? 'bg-rose-500/10 border-rose-500/50' : 'bg-rose-50 border-rose-300'}`
                : dm.border
            }`}
          >
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg mx-auto mb-2 flex items-center justify-center ${
              selectedCard === 'bookings'
                ? darkMode ? 'bg-rose-500/30' : 'bg-rose-100'
                : darkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <Calendar size={18} className={selectedCard === 'bookings' ? 'text-rose-500' : dm.textMuted} />
            </div>
            <span className={`text-xs sm:text-sm font-medium ${selectedCard === 'bookings' ? (darkMode ? 'text-rose-400' : 'text-rose-600') : dm.textMuted}`}>
              {t.upcomingBookings}
            </span>
          </button>
        </div>

        {/* Main Content Area - Shows selected section */}
        <div className={`${dm.bgCard} border ${dm.border} rounded-2xl flex flex-col flex-1 min-h-0`}>
          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Profile Section */}
            {selectedCard === 'profile' && (
              <>
                {/* Linking UI - when user hasn't linked yet */}
                {/* Show linking UI if: needs link OR just successfully linked existing mentor (not approved yet) */}
                {(needsMentorLink || (linkSubmitSuccess && !isApproved && selectedMentorId !== 'new')) ? (
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl ${darkMode ? 'bg-sky-500/20' : 'bg-sky-100'} flex items-center justify-center`}>
                        <Link2 size={24} className="text-sky-500" />
                      </div>
                      <div>
                        <h2 className={`text-xl font-semibold ${dm.text}`}>
                          {t.linkProfileTitle}
                        </h2>
                        <p className={`text-sm ${dm.textMuted}`}>
                          {t.linkProfileSubtitle}
                        </p>
                      </div>
                    </div>

                    {/* Searchable dropdown - disabled after successful link */}
                    <SearchableSelect
                      options={mentorOptions}
                      value={selectedMentorId}
                      onChange={setSelectedMentorId}
                      placeholder={t.selectMentorProfile}
                      noOptionsMessage={t.noResults}
                      darkMode={darkMode}
                      disabled={linkSubmitSuccess}
                    />

                    {/* For EXISTING mentor: show preview */}
                    {selectedMentorId && selectedMentorId !== 'new' && selectedMentorPreview && (
                      <div className={`border ${dm.border} rounded-xl p-4 ${darkMode ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
                        <p className={`text-xs font-medium ${dm.textMuted} uppercase tracking-wide mb-3`}>
                          {t.selectedMentorProfile}
                        </p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className={dm.textMuted}>{lang === 'ko' ? '이름' : 'Name'}:</span>
                            <span className={`ml-2 ${dm.text}`}>{lang === 'ko' ? selectedMentorPreview.name_ko : selectedMentorPreview.name_en}</span>
                          </div>
                          {(selectedMentorPreview.company_ko || selectedMentorPreview.company_en) && (
                            <div>
                              <span className={dm.textMuted}>{lang === 'ko' ? '회사' : 'Company'}:</span>
                              <span className={`ml-2 ${dm.text}`}>{lang === 'ko' ? selectedMentorPreview.company_ko : selectedMentorPreview.company_en}</span>
                            </div>
                          )}
                          {(selectedMentorPreview.position_ko || selectedMentorPreview.position_en) && (
                            <div>
                              <span className={dm.textMuted}>{lang === 'ko' ? '직무' : 'Position'}:</span>
                              <span className={`ml-2 ${dm.text}`}>{lang === 'ko' ? selectedMentorPreview.position_ko : selectedMentorPreview.position_en}</span>
                            </div>
                          )}
                          {(selectedMentorPreview.location_ko || selectedMentorPreview.location_en) && (
                            <div>
                              <span className={dm.textMuted}>{lang === 'ko' ? '위치' : 'Location'}:</span>
                              <span className={`ml-2 ${dm.text}`}>{lang === 'ko' ? selectedMentorPreview.location_ko : selectedMentorPreview.location_en}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* For NEW mentor: show full editable form */}
                    {selectedMentorId === 'new' && (
                      <div className={`border-t ${dm.border} pt-6`}>
                        <p className={`text-sm ${dm.textMuted} mb-4`}>
                          {t.fillProfileBelow}
                        </p>
                        <ProfileForm
                          formData={profileForm}
                          onChange={setProfileForm}
                          onSubmit={async (e) => {
                            e.preventDefault();
                            await handleLinkSubmit();
                          }}
                          onImageUpload={handleImageUpload}
                          darkMode={darkMode}
                          lang={lang}
                          showSubmitButton={false}
                          isUploading={isUploading}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  /* Regular profile form when already linked */
                  <ProfileForm
                    formData={profileForm}
                    onChange={setProfileForm}
                    onSubmit={handleProfileSubmit}
                    onImageUpload={handleImageUpload}
                    darkMode={darkMode}
                    lang={lang}
                    showSubmitButton={false}
                    isUploading={isUploading}
                  />
                )}
              </>
            )}

            {/* Availability Section */}
            {selectedCard === 'availability' && (
              <div className={`flex flex-col items-center justify-center h-64 ${dm.textMuted}`}>
                <Clock size={56} className="mb-4 opacity-20" />
                <p className="font-medium text-lg">{t.comingSoon}</p>
                <p className="text-sm mt-2 max-w-sm text-center">{t.availabilityCardDesc}</p>
              </div>
            )}

            {/* Calendar Section */}
            {selectedCard === 'calendar' && (
              <div className={`flex flex-col items-center justify-center h-64 ${dm.textMuted}`}>
                <CalendarDays size={56} className="mb-4 opacity-20" />
                <p className="font-medium text-lg">{t.comingSoon}</p>
                <p className="text-sm mt-2 max-w-sm text-center">{t.calendarCardDesc}</p>
              </div>
            )}

            {/* Stats Section */}
            {selectedCard === 'stats' && (
              <div className={`flex flex-col items-center justify-center h-64 ${dm.textMuted}`}>
                <BarChart3 size={56} className="mb-4 opacity-20" />
                <p className="font-medium text-lg">{t.comingSoon}</p>
                <p className="text-sm mt-2 max-w-sm text-center">{t.statsCardDesc}</p>
              </div>
            )}

            {/* Bookings Section */}
            {selectedCard === 'bookings' && (
              <div className={`flex flex-col items-center justify-center h-64 ${dm.textMuted}`}>
                <Calendar size={56} className="mb-4 opacity-20" />
                <p className="font-medium text-lg">{t.noUpcomingBookings}</p>
              </div>
            )}
          </div>

          {/* Sticky Footer - Submit Button */}
          {selectedCard === 'profile' && (
            <div className={`flex-shrink-0 border-t ${dm.border} px-6 py-4`}>
              {/* Show linking UI for: needs link OR just linked existing mentor (pending approval) */}
              {(needsMentorLink || (linkSubmitSuccess && !isApproved && selectedMentorId !== 'new')) ? (
                // Link/Register buttons
                selectedMentorId && (
                  linkSubmitSuccess ? (
                    // Success state - clearly disabled button with "waiting for approval" message
                    <button
                      disabled
                      className="w-full py-3 bg-gray-500/40 rounded-xl text-sm font-semibold text-gray-400 cursor-not-allowed"
                    >
                      {t.linkSubmitSuccess}
                    </button>
                  ) : (
                    <button
                      onClick={handleLinkSubmit}
                      disabled={isSubmittingLink}
                      className="w-full py-3 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:hover:bg-sky-600 rounded-xl text-sm font-semibold text-white transition-colors cursor-pointer disabled:cursor-not-allowed"
                    >
                      {isSubmittingLink
                        ? t.linkSubmitting
                        : selectedMentorId === 'new'
                          ? t.registerAsMentorButton
                          : t.linkProfileButton}
                    </button>
                  )
                )
              ) : (
                // Regular save button for linked users
                <button
                  onClick={handleProfileSubmit}
                  className="w-full py-3 bg-sky-600 hover:bg-sky-700 rounded-xl text-sm font-semibold text-white transition-colors cursor-pointer"
                >
                  {t.save}
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Profile Edit Modal - Kept for future use (OCP) */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`${dm.bgCard} border ${dm.border} rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col`}>
            {/* Modal Header */}
            <div className={`flex-shrink-0 ${dm.bgCard} border-b ${dm.border} px-5 py-4 flex justify-between items-center rounded-t-xl`}>
              <h2 className={`text-lg font-semibold ${dm.text}`}>
                {t.editProfile}
              </h2>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className={`p-2 ${dm.textMuted} ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded-lg transition-colors cursor-pointer`}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-5">
              <ProfileForm
                formData={profileForm}
                onChange={setProfileForm}
                onSubmit={handleProfileSubmit}
                onImageUpload={handleImageUpload}
                darkMode={darkMode}
                lang={lang}
                formId="modal-profile-form"
                isUploading={isUploading}
              />
            </div>

            {/* Modal Footer - Sticky */}
            <div className={`flex-shrink-0 ${dm.bgCard} border-t ${dm.border} px-5 py-4 flex justify-end gap-3 rounded-b-xl`}>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className={`py-2 px-4 border ${dm.border} rounded-lg text-sm font-medium ${dm.textMuted} ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors cursor-pointer`}
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                form="modal-profile-form"
                className="py-2 px-5 bg-sky-600 hover:bg-sky-700 rounded-lg text-sm font-medium text-white transition-colors cursor-pointer"
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Policy Acceptance Modal - For users who haven't accepted policy */}
      {isAuthenticated && !policyAccepted && (
        <PolicyAcceptanceModal
          darkMode={darkMode}
          lang={lang}
          onAccept={acceptPolicy}
        />
      )}
    </div>
  );
}

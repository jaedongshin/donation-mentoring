'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { translations, Language } from '@/utils/i18n';
import { Clock, Pencil, Calendar, CalendarDays, FlaskConical, X, BarChart3 } from 'lucide-react';
import TopNav from '@/app/components/TopNav';
import ProfileForm, { ProfileFormData } from '@/app/components/ProfileForm';
import { useAuth } from '@/hooks/useAuth';

// Bento card type
type BentoCardId = 'profile' | 'availability' | 'calendar' | 'stats' | 'bookings';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, isMockAuth, logout, isApproved } = useAuth();

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
    languages: [],
  });

  // Initialize profile form with user data
  useEffect(() => {
    if (user) {
      setProfileForm(prev => ({
        ...prev,
        name_en: user.displayName || '',
        name_ko: user.displayName || '',
      }));
    }
  }, [user]);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In mock mode, just show success
    alert(lang === 'ko' ? '프로필이 저장되었습니다!' : 'Profile saved!');
    setIsProfileModalOpen(false);
  };

  const toggleDarkMode = () => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    localStorage.setItem('darkMode', String(newValue));
  };

  const t = translations[lang];

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

      {/* Dev Mode Banner */}
      {isMockAuth && (
        <div className="bg-amber-500 text-amber-950 text-center py-2 px-4 text-sm font-medium flex items-center justify-center gap-2">
          <FlaskConical size={16} />
          {t.devModeBanner}
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col" style={{ minHeight: 'calc(100vh - 56px)' }}>
        <h1 className={`text-2xl font-bold ${dm.text} mb-6`}>
          {t.dashboardTitle}
        </h1>

        {/* Pending Status - Only for unapproved mentors */}
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

        {/* Main Content Area - Shows selected section, fills remaining height */}
        <div className={`${dm.bgCard} border ${dm.border} rounded-2xl p-6 flex-1 overflow-y-auto`}>
          {/* Profile Section - Shows form directly */}
          {selectedCard === 'profile' && (
            <ProfileForm
              formData={profileForm}
              onChange={setProfileForm}
              onSubmit={handleProfileSubmit}
              darkMode={darkMode}
              lang={lang}
              showSubmitButton
            />
          )}

          {/* Availability Section */}
          {selectedCard === 'availability' && (
            <div className={`flex flex-col items-center justify-center h-full ${dm.textMuted}`}>
              <Clock size={56} className="mb-4 opacity-20" />
              <p className="font-medium text-lg">{t.comingSoon}</p>
              <p className="text-sm mt-2 max-w-sm text-center">{t.availabilityCardDesc}</p>
            </div>
          )}

          {/* Calendar Section */}
          {selectedCard === 'calendar' && (
            <div className={`flex flex-col items-center justify-center h-full ${dm.textMuted}`}>
              <CalendarDays size={56} className="mb-4 opacity-20" />
              <p className="font-medium text-lg">{t.comingSoon}</p>
              <p className="text-sm mt-2 max-w-sm text-center">{t.calendarCardDesc}</p>
            </div>
          )}

          {/* Stats Section */}
          {selectedCard === 'stats' && (
            <div className={`flex flex-col items-center justify-center h-full ${dm.textMuted}`}>
              <BarChart3 size={56} className="mb-4 opacity-20" />
              <p className="font-medium text-lg">{t.comingSoon}</p>
              <p className="text-sm mt-2 max-w-sm text-center">{t.statsCardDesc}</p>
            </div>
          )}

          {/* Bookings Section */}
          {selectedCard === 'bookings' && (
            <div className={`flex flex-col items-center justify-center h-full ${dm.textMuted}`}>
              <Calendar size={56} className="mb-4 opacity-20" />
              <p className="font-medium text-lg">{t.noUpcomingBookings}</p>
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
                darkMode={darkMode}
                lang={lang}
                formId="modal-profile-form"
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
    </div>
  );
}

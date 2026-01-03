'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { translations, Language } from '@/utils/i18n';
import { Chrome, FlaskConical } from 'lucide-react';
import TopNav from '@/app/components/TopNav';
import { useAuth } from '@/hooks/useAuth';
import { MOCK_USERS } from '@/utils/mockAuth';

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading, isMockAuth, login, isAuthenticated, isAdmin } = useAuth();

  const [lang, setLang] = useState<Language>('ko');
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? saved === 'true' : true;
  });

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

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (isAdmin) {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }
  }, [isLoading, isAuthenticated, isAdmin, router]);

  const handleMockLogin = (userType: keyof typeof MOCK_USERS) => {
    login(userType);
    // Redirect based on role
    const mockUser = MOCK_USERS[userType];
    if (mockUser.role === 'admin' || mockUser.role === 'super_admin') {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
  };

  const handleGoogleLogin = () => {
    // TODO: Implement Google OAuth via Supabase
    alert('Google OAuth not yet implemented. Coming soon!');
  };

  if (isLoading) {
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
        variant="guest"
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        lang={lang}
        onLangChange={setLang}
        hideLoginLink
      />

      {/* Dev Mode Banner */}
      {isMockAuth && (
        <div className="bg-amber-500 text-amber-950 text-center py-2 px-4 text-sm font-medium flex items-center justify-center gap-2">
          <FlaskConical size={16} />
          {t.devModeBanner}
        </div>
      )}

      {/* Login content */}
      <div className="flex flex-col items-center justify-center p-4 pt-12">
        {/* Login card */}
        <div className={`${dm.bgCard} border ${dm.border} rounded-2xl shadow-xl max-w-sm w-full p-8`}>
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className={`text-xl font-bold ${dm.text} mb-2`}>
              {t.login}
            </h1>
            <p className={`text-sm ${dm.textMuted}`}>
              {t.loginSubtitle}
            </p>
          </div>

          {/* Mock Auth: Role Selector */}
          {isMockAuth ? (
            <div className="space-y-3">
              <p className={`text-xs ${dm.textMuted} text-center mb-4`}>
                {t.loginAs}
              </p>

              <button
                onClick={() => handleMockLogin('pendingMentor')}
                className={`w-full py-3 px-4 rounded-xl font-medium transition-colors cursor-pointer ${
                  darkMode
                    ? 'bg-yellow-900/30 text-yellow-400 hover:bg-yellow-900/50 border border-yellow-700'
                    : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200'
                }`}
              >
                {t.loginAsPendingMentor}
              </button>

              <button
                onClick={() => handleMockLogin('approvedMentor')}
                className={`w-full py-3 px-4 rounded-xl font-medium transition-colors cursor-pointer ${
                  darkMode
                    ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50 border border-green-700'
                    : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                }`}
              >
                {t.loginAsApprovedMentor}
              </button>

              <button
                onClick={() => handleMockLogin('admin')}
                className={`w-full py-3 px-4 rounded-xl font-medium transition-colors cursor-pointer ${
                  darkMode
                    ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 border border-blue-700'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                }`}
              >
                {t.loginAsAdmin}
              </button>

              <button
                onClick={() => handleMockLogin('superAdmin')}
                className={`w-full py-3 px-4 rounded-xl font-medium transition-colors cursor-pointer ${
                  darkMode
                    ? 'bg-purple-900/30 text-purple-400 hover:bg-purple-900/50 border border-purple-700'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                }`}
              >
                {t.loginAsSuperAdmin}
              </button>
            </div>
          ) : (
            <>
              {/* Real Auth: Google Sign In Button */}
              <button
                onClick={handleGoogleLogin}
                className={`w-full flex items-center justify-center gap-3 ${
                  darkMode
                    ? 'bg-white text-gray-900 hover:bg-gray-100'
                    : 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-300'
                } py-3 px-4 rounded-xl font-medium transition-colors cursor-pointer`}
              >
                <Chrome size={20} className="text-blue-500" />
                {t.continueWithGoogle}
              </button>

              {/* Info text */}
              <p className={`text-xs ${dm.textMuted} text-center mt-4`}>
                {t.forMentorsAndAdmins}
              </p>
            </>
          )}

          {/* Divider */}
          <div className={`border-t ${dm.border} my-6`} />

          {/* Guest link */}
          <p className={`text-sm ${dm.textMuted} text-center`}>
            {t.lookingToBook}
          </p>
          <Link
            href="/"
            className="block text-center text-sm font-medium text-sky-500 hover:text-sky-400 mt-2 transition-colors"
          >
            {t.browseMentorsNoLogin}
          </Link>
        </div>
      </div>
    </div>
  );
}

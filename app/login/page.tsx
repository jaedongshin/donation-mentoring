'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { translations, Language } from '@/utils/i18n';
import { Chrome, Mail, Eye, EyeOff } from 'lucide-react';
import TopNav from '@/app/components/TopNav';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { isLoading, loginWithGoogle, loginWithEmail, isAuthenticated, isAdmin } = useAuth();

  const [lang, setLang] = useState<Language>('ko');
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? saved === 'true' : true;
  });
  const [loginError, setLoginError] = useState<string | null>(null);

  // Email login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    input: darkMode
      ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400',
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

  const handleGoogleLogin = async () => {
    try {
      setLoginError(null);
      await loginWithGoogle();
    } catch (error) {
      console.error('Login failed:', error);
      setLoginError(t.invalidCredentials);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    setLoginError(null);

    try {
      await loginWithEmail(email, password);
      // Auth state change will trigger redirect
    } catch (error) {
      console.error('Email login failed:', error);
      setLoginError(t.invalidCredentials);
    } finally {
      setIsSubmitting(false);
    }
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

      {/* Login content */}
      <div className="flex flex-col items-center justify-center p-4 pt-12">
        {/* Sign up link - top right of card */}
        <div className="max-w-sm w-full flex justify-end mb-4">
          <div className="flex items-center gap-2">
            <span className={`text-sm ${dm.textMuted}`}>{t.dontHaveAccount}</span>
            <Link
              href="/signup"
              className={`text-sm font-medium px-4 py-1.5 rounded-lg border transition-colors ${
                darkMode
                  ? 'border-sky-500 text-sky-400 hover:bg-sky-500/10'
                  : 'border-sky-500 text-sky-600 hover:bg-sky-50'
              }`}
            >
              {t.signUp}
            </Link>
          </div>
        </div>

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

          {/* Error message */}
          {loginError && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm text-center">
              {loginError}
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleLogin}
            className={`w-full flex items-center justify-center gap-3 ${
              darkMode
                ? 'bg-white text-gray-900 hover:bg-gray-100'
                : 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-300'
            } py-3 px-4 rounded-xl font-medium transition-colors cursor-pointer`}
          >
            <Chrome size={20} className="text-blue-500" />
            {t.loginWithGoogle}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className={`flex-1 border-t ${dm.border}`} />
            <span className={`text-sm ${dm.textMuted}`}>{t.or}</span>
            <div className={`flex-1 border-t ${dm.border}`} />
          </div>

          {/* Email Login Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className={`block text-sm font-medium ${dm.textMuted} mb-1.5`}>
                {t.email}
              </label>
              <div className="relative">
                <Mail size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${dm.textMuted}`} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${dm.input} focus:outline-none focus:ring-1 focus:ring-sky-500/40 focus:border-sky-500/40 transition-all text-sm`}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className={`block text-sm font-medium ${dm.textMuted} mb-1.5`}>
                {t.password}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-4 pr-10 py-2.5 rounded-lg border ${dm.input} focus:outline-none focus:ring-1 focus:ring-sky-500/40 focus:border-sky-500/40 transition-all text-sm`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${dm.textMuted} hover:opacity-70`}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-sm text-sky-500 hover:text-sky-400 transition-colors"
              >
                {t.forgotPassword}
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !email || !password}
              className={`w-full py-3 px-4 rounded-xl font-medium transition-colors ${
                isSubmitting || !email || !password
                  ? darkMode
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-sky-600 hover:bg-sky-700 text-white cursor-pointer'
              }`}
            >
              {isSubmitting ? t.loading : t.logIn}
            </button>
          </form>

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

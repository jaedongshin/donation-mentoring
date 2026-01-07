'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { translations, Language } from '@/utils/i18n';
import { Mail, Eye, EyeOff, Check } from 'lucide-react';
import TopNav from '@/app/components/TopNav';
import { useAuth } from '@/hooks/useAuth';

type AuthMode = 'login' | 'signup';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoading, loginWithEmail, signUpWithEmail, isAuthenticated, isAdmin } = useAuth();

  const [mode, setMode] = useState<AuthMode>((searchParams.get('mode') as AuthMode) || 'login');
  const [lang, setLang] = useState<Language>('ko');
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? saved === 'true' : true;
  });

  // Login/Signup form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const t = translations[lang];

  useEffect(() => {
    const storedError = sessionStorage.getItem('loginError');
    if (storedError === 'accountNotFound') {
      setError(t.accountNotFound);
      sessionStorage.removeItem('loginError');
    }
  }, [t.accountNotFound]);

  useEffect(() => {
    const modeParam = searchParams.get('mode') as AuthMode;
    if (modeParam === 'login' || modeParam === 'signup') {
      setMode(modeParam);
    }
  }, [searchParams]);

  const toggleDarkMode = () => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    localStorage.setItem('darkMode', String(newValue));
  };

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

  useEffect(() => {
    if (!isLoading && isAuthenticated && !signupSuccess) {
      if (isAdmin) {
        router.push('/admin');
      } else {
        router.push('/profile');
      }
    }
  }, [isLoading, isAuthenticated, isAdmin, router, signupSuccess]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    setError(null);

    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else {
        if (password !== confirmPassword) {
          setError(t.passwordMismatch);
          setIsSubmitting(false);
          return;
        }
        if (password.length < 8) {
          setError(t.passwordTooShort);
          setIsSubmitting(false);
          return;
        }
        await signUpWithEmail(email, password);
        setSignupSuccess(true);
      }
    } catch (err: unknown) {
      console.error('Auth error:', err);
      if (mode === 'login') {
        setError(t.invalidCredentials);
      } else {
        const errorMessage = err instanceof Error ? err.message : '';
        if (errorMessage.includes('already registered')) {
          setError(t.emailAlreadyExists);
        } else {
          setError(t.signupFailed);
        }
      }
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
      <TopNav
        variant="guest"
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        lang={lang}
        onLangChange={setLang}
        hideLoginLink
        hideSignupLink
      />

      <div className="flex flex-col items-center justify-center p-4 pt-20">
        <div className={`${dm.bgCard} border ${dm.border} rounded-2xl shadow-xl max-w-sm w-full p-8`}>
          {signupSuccess ? (
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${darkMode ? 'bg-green-900/40' : 'bg-green-100'}`}>
                <Check size={32} className={darkMode ? 'text-green-400' : 'text-green-600'} />
              </div>
              <h2 className={`text-xl font-bold ${dm.text} mb-2`}>
                {t.signupComplete}
              </h2>
              <p className={`text-sm ${dm.textMuted} mb-6`}>
                {isAuthenticated ? t.loginSubtitle : t.signUpSuccess}
              </p>
              <button
                onClick={() => {
                  if (isAuthenticated) {
                    router.push('/profile');
                  } else {
                    setSignupSuccess(false);
                    setMode('login');
                    setPassword('');
                    setConfirmPassword('');
                  }
                }}
                className="inline-block w-full py-3 px-4 rounded-xl font-medium bg-sky-600 hover:bg-sky-700 text-white transition-colors text-center cursor-pointer"
              >
                {isAuthenticated ? (lang === 'ko' ? '프로필로 이동' : 'Go to Profile') : t.backToLogin}
              </button>

              <div className="mt-8">
                <p className={`text-sm ${dm.textMuted}`}>
                  {t.adminContact}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex p-1 mb-6 bg-gray-100 dark:bg-gray-700 rounded-xl">
                <button
                  onClick={() => { setMode('login'); setError(null); }}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                    mode === 'login'
                      ? 'bg-white dark:bg-gray-600 text-sky-600 dark:text-sky-400 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {t.logIn}
                </button>
                <button
                  onClick={() => { setMode('signup'); setError(null); }}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                    mode === 'signup'
                      ? 'bg-white dark:bg-gray-600 text-sky-600 dark:text-sky-400 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {t.signUp}
                </button>
              </div>

              <div className="text-center mb-6">
                <h1 className={`text-xl font-bold ${dm.text} mb-2`}>
                  {mode === 'login' ? t.login : t.signUp}
                </h1>
                <p className={`text-sm ${dm.textMuted}`}>
                  {mode === 'login' ? t.loginSubtitle : t.signUpSubtitle}
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleAuth} className="space-y-4">
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
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 ${dm.textMuted} hover:opacity-70`}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {mode === 'signup' && (
                    <p className={`text-xs ${dm.textMuted} mt-1`}>
                      {t.passwordMinLength}
                    </p>
                  )}
                </div>

                {mode === 'signup' && (
                  <div>
                    <label className={`block text-sm font-medium ${dm.textMuted} mb-1.5`}>
                      {t.confirmPassword}
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`w-full pl-4 pr-10 py-2.5 rounded-lg border ${dm.input} focus:outline-none focus:ring-1 focus:ring-sky-500/40 focus:border-sky-500/40 transition-all text-sm`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 ${dm.textMuted} hover:opacity-70`}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                )}

                {mode === 'login' && (
                  <div className="text-right">
                    <Link
                      href="/forgot-password"
                      className="text-sm text-sky-500 hover:text-sky-400 transition-colors"
                    >
                      {t.forgotPassword}
                    </Link>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !email || !password || (mode === 'signup' && !confirmPassword)}
                  className={`w-full py-3 px-4 rounded-xl font-medium transition-colors ${
                    isSubmitting || !email || !password || (mode === 'signup' && !confirmPassword)
                      ? darkMode
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-sky-600 hover:bg-sky-700 text-white cursor-pointer'
                  }`}
                >
                  {isSubmitting ? t.loading : mode === 'login' ? t.logIn : t.createAccount}
                </button>
              </form>

              <div className="mt-8 text-center">
                <p className={`text-sm ${dm.textMuted}`}>
                  {t.adminContact}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-900 flex items-center justify-center"><p className="text-gray-400">Loading...</p></div>}>
      <AuthContent />
    </Suspense>
  );
}

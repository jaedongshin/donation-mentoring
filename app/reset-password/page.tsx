'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { translations, Language } from '@/utils/i18n';
import { Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import TopNav from '@/app/components/TopNav';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [lang, setLang] = useState<Language>('ko');
  // Dark mode default: true. Read from localStorage if available.
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? saved === 'true' : true;
  });

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

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

  useEffect(() => {
    if (token) {
      setIsValidSession(true);
    } else {
      setIsValidSession(false);
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword || !token) return;

    // Validate password length
    if (password.length < 8) {
      setError(t.passwordTooShort);
      return;
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      setError(t.passwordMismatch);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t.resetFailed);
      }

      setSuccess(true);
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      console.error('Update password error:', err);
      const errorMessage = err instanceof Error ? err.message : t.resetFailed;
      setError(errorMessage || t.resetFailed);
      if (errorMessage === 'Invalid or expired token') {
        setIsValidSession(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state while checking session
  if (isValidSession === null) {
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

      {/* Content */}
      <div className="flex flex-col items-center justify-center p-4 pt-12">
        {/* Card */}
        <div className={`${dm.bgCard} border ${dm.border} rounded-2xl shadow-xl max-w-sm w-full p-8`}>
          {/* Invalid session */}
          {!isValidSession && (
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${darkMode ? 'bg-red-900/40' : 'bg-red-100'}`}>
                <AlertCircle size={32} className={darkMode ? 'text-red-400' : 'text-red-600'} />
              </div>
              <h2 className={`text-xl font-bold ${dm.text} mb-2`}>
                {t.invalidResetLink}
              </h2>
              <p className={`text-sm ${dm.textMuted} mb-6`}>
                {t.invalidResetLinkMessage}
              </p>
              <Link
                href="/forgot-password"
                className="inline-block w-full py-3 px-4 rounded-xl font-medium bg-sky-600 hover:bg-sky-700 text-white transition-colors text-center"
              >
                {t.sendResetLink}
              </Link>
            </div>
          )}

          {/* Success State */}
          {isValidSession && success && (
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${darkMode ? 'bg-green-900/40' : 'bg-green-100'}`}>
                <Check size={32} className={darkMode ? 'text-green-400' : 'text-green-600'} />
              </div>
              <h2 className={`text-xl font-bold ${dm.text} mb-2`}>
                {t.passwordChanged}
              </h2>
              <p className={`text-sm ${dm.textMuted} mb-6`}>
                {t.passwordResetSuccess}
              </p>
              <Link
                href="/login"
                className="inline-block w-full py-3 px-4 rounded-xl font-medium bg-sky-600 hover:bg-sky-700 text-white transition-colors text-center"
              >
                {t.backToLogin}
              </Link>
            </div>
          )}

          {/* Form State */}
          {isValidSession && !success && (
            <>
              {/* Header */}
              <div className="text-center mb-6">
                <h1 className={`text-xl font-bold ${dm.text} mb-2`}>
                  {t.resetPasswordTitle}
                </h1>
                <p className={`text-sm ${dm.textMuted}`}>
                  {t.resetPasswordSubtitle}
                </p>
              </div>

              {/* Error message */}
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm text-center">
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password */}
                <div>
                  <label className={`block text-sm font-medium ${dm.textMuted} mb-1.5`}>
                    {t.newPassword}
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
                  <p className={`text-xs ${dm.textMuted} mt-1`}>
                    {t.passwordMinLength}
                  </p>
                </div>

                {/* Confirm Password */}
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

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !password || !confirmPassword}
                  className={`w-full py-3 px-4 rounded-xl font-medium transition-colors ${
                    isSubmitting || !password || !confirmPassword
                      ? darkMode
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-sky-600 hover:bg-sky-700 text-white cursor-pointer'
                  }`}
                >
                  {isSubmitting ? t.loading : t.resetPassword}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}

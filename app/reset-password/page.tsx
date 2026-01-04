'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { translations, Language } from '@/utils/i18n';
import { Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import TopNav from '@/app/components/TopNav';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/utils/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { updatePassword } = useAuth();

  const [lang, setLang] = useState<Language>('ko');
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

  // Check for valid password recovery session
  useEffect(() => {
    const checkSession = async () => {
      // Listen for PASSWORD_RECOVERY event
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event) => {
          if (event === 'PASSWORD_RECOVERY') {
            setIsValidSession(true);
          }
        }
      );

      // Also check current session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsValidSession(true);
      } else {
        // Give it a moment for the auth event to fire
        setTimeout(() => {
          if (isValidSession === null) {
            setIsValidSession(false);
          }
        }, 2000);
      }

      return () => subscription.unsubscribe();
    };

    checkSession();
  }, [isValidSession]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) return;

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
      await updatePassword(password);
      setSuccess(true);
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      console.error('Update password error:', err);
      setError(lang === 'ko' ? '비밀번호 재설정에 실패했습니다.' : 'Failed to reset password.');
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
                {lang === 'ko' ? '잘못된 링크' : 'Invalid Link'}
              </h2>
              <p className={`text-sm ${dm.textMuted} mb-6`}>
                {lang === 'ko'
                  ? '유효하지 않거나 만료된 재설정 링크입니다. 새로 요청해주세요.'
                  : 'Invalid or expired reset link. Please request a new one.'}
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
                {lang === 'ko' ? '비밀번호 변경 완료!' : 'Password Changed!'}
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
                    {lang === 'ko' ? '최소 8자 이상' : 'Minimum 8 characters'}
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

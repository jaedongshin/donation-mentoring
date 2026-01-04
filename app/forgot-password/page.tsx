'use client';

import { useState } from 'react';
import Link from 'next/link';
import { translations, Language } from '@/utils/i18n';
import { Mail, ArrowLeft, Check } from 'lucide-react';
import TopNav from '@/app/components/TopNav';
import { useAuth } from '@/hooks/useAuth';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();

  const [lang, setLang] = useState<Language>('ko');
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? saved === 'true' : true;
  });

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err) {
      console.error('Reset password error:', err);
      setError(lang === 'ko' ? '재설정 링크 전송에 실패했습니다.' : 'Failed to send reset link.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
        {/* Back to login */}
        <div className="max-w-sm w-full mb-4">
          <Link
            href="/login"
            className={`inline-flex items-center gap-2 text-sm ${dm.textMuted} hover:opacity-70 transition-opacity`}
          >
            <ArrowLeft size={16} />
            {t.backToLogin}
          </Link>
        </div>

        {/* Card */}
        <div className={`${dm.bgCard} border ${dm.border} rounded-2xl shadow-xl max-w-sm w-full p-8`}>
          {success ? (
            /* Success State */
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${darkMode ? 'bg-green-900/40' : 'bg-green-100'}`}>
                <Check size={32} className={darkMode ? 'text-green-400' : 'text-green-600'} />
              </div>
              <h2 className={`text-xl font-bold ${dm.text} mb-2`}>
                {lang === 'ko' ? '이메일 전송 완료!' : 'Email Sent!'}
              </h2>
              <p className={`text-sm ${dm.textMuted} mb-6`}>
                {t.resetLinkSent}
              </p>
              <Link
                href="/login"
                className="inline-block w-full py-3 px-4 rounded-xl font-medium bg-sky-600 hover:bg-sky-700 text-white transition-colors text-center"
              >
                {t.backToLogin}
              </Link>
            </div>
          ) : (
            /* Form State */
            <>
              {/* Header */}
              <div className="text-center mb-6">
                <h1 className={`text-xl font-bold ${dm.text} mb-2`}>
                  {t.forgotPasswordTitle}
                </h1>
                <p className={`text-sm ${dm.textMuted}`}>
                  {t.forgotPasswordSubtitle}
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

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !email}
                  className={`w-full py-3 px-4 rounded-xl font-medium transition-colors ${
                    isSubmitting || !email
                      ? darkMode
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-sky-600 hover:bg-sky-700 text-white cursor-pointer'
                  }`}
                >
                  {isSubmitting ? t.loading : t.sendResetLink}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

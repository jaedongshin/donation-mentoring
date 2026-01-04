'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { translations, Language } from '@/utils/i18n';
import { Chrome, Mail, Eye, EyeOff, Check } from 'lucide-react';
import TopNav from '@/app/components/TopNav';
import { useAuth } from '@/hooks/useAuth';

export default function SignupPage() {
  const router = useRouter();
  const { isLoading, loginWithGoogle, signUpWithEmail, isAuthenticated, acceptPolicy } = useAuth();

  const [lang, setLang] = useState<Language>('ko');
  // Dark mode default: true. Read from localStorage if available.
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? saved === 'true' : true;
  });

  // Policy checkbox
  const [policyChecked, setPolicyChecked] = useState(false);

  // Email signup form state
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState(false);

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
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleGoogleSignup = async () => {
    if (!policyChecked) return;
    try {
      setSignupError(null);
      // Mark this as a SIGNUP attempt - useAuth will allow new users
      sessionStorage.setItem('authMode', 'signup');
      // Store that policy was accepted before Google redirect
      sessionStorage.setItem('policyAcceptedOnSignup', 'true');
      await loginWithGoogle();
    } catch (error) {
      console.error('Google signup failed:', error);
      setSignupError(t.signupFailed);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyChecked || !email || !password || !confirmPassword) return;

    // Validate password length
    if (password.length < 8) {
      setSignupError(t.passwordTooShort);
      return;
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      setSignupError(t.passwordMismatch);
      return;
    }

    setIsSubmitting(true);
    setSignupError(null);

    try {
      // Store policy acceptance for after email verification
      localStorage.setItem('policyAcceptedOnSignup', 'true');
      await signUpWithEmail(email, password);
      setSignupSuccess(true);
    } catch (error: unknown) {
      console.error('Email signup failed:', error);
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('already registered')) {
        setSignupError(t.emailAlreadyExists);
      } else {
        setSignupError(t.signupFailed);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if user came back from Google OAuth with policy accepted
  useEffect(() => {
    const policyAcceptedOnSignup = sessionStorage.getItem('policyAcceptedOnSignup');
    if (policyAcceptedOnSignup === 'true' && isAuthenticated) {
      sessionStorage.removeItem('policyAcceptedOnSignup');
      // Accept policy for the newly created user
      acceptPolicy().catch(console.error);
    }
  }, [isAuthenticated, acceptPolicy]);

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

      {/* Signup content */}
      <div className="flex flex-col items-center justify-center p-4 pt-12">
        {/* Login link - top right of card */}
        <div className="max-w-sm w-full flex justify-end mb-4">
          <div className="flex items-center gap-2">
            <span className={`text-sm ${dm.textMuted}`}>{t.alreadyHaveAccount}</span>
            <Link
              href="/login"
              className={`text-sm font-medium px-4 py-1.5 rounded-lg border transition-colors ${
                darkMode
                  ? 'border-sky-500 text-sky-400 hover:bg-sky-500/10'
                  : 'border-sky-500 text-sky-600 hover:bg-sky-50'
              }`}
            >
              {t.login}
            </Link>
          </div>
        </div>

        {/* Signup card */}
        <div className={`${dm.bgCard} border ${dm.border} rounded-2xl shadow-xl max-w-sm w-full p-8`}>
          {/* Success message */}
          {signupSuccess ? (
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${darkMode ? 'bg-green-900/40' : 'bg-green-100'}`}>
                <Check size={32} className={darkMode ? 'text-green-400' : 'text-green-600'} />
              </div>
              <h2 className={`text-xl font-bold ${dm.text} mb-2`}>
                {t.signupComplete}
              </h2>
              <p className={`text-sm ${dm.textMuted} mb-6`}>
                {t.signUpSuccess}
              </p>
              <Link
                href="/login"
                className="inline-block w-full py-3 px-4 rounded-xl font-medium bg-sky-600 hover:bg-sky-700 text-white transition-colors text-center"
              >
                {t.backToLogin}
              </Link>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="text-center mb-6">
                <h1 className={`text-xl font-bold ${dm.text} mb-2`}>
                  {t.signUpSubtitle}
                </h1>
              </div>

              {/* Error message */}
              {signupError && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm text-center">
                  {signupError}
                </div>
              )}

              {/* Policy Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer mb-6">
                <div className="relative flex-shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={policyChecked}
                    onChange={(e) => setPolicyChecked(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      policyChecked
                        ? 'bg-sky-500 border-sky-500'
                        : darkMode
                          ? 'border-gray-600 bg-gray-700'
                          : 'border-gray-300 bg-white'
                    }`}
                  >
                    {policyChecked && <Check size={14} className="text-white" />}
                  </div>
                </div>
                <span className={`text-sm ${dm.text}`}>
                  {t.acceptPolicy}
                </span>
              </label>

              {/* Policy required warning */}
              {!policyChecked && (
                <p className={`text-xs ${darkMode ? 'text-yellow-400' : 'text-yellow-600'} text-center mb-4`}>
                  {t.policyRequired}
                </p>
              )}

              {/* Google Sign Up Button */}
              <button
                onClick={handleGoogleSignup}
                disabled={!policyChecked}
                className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-medium transition-colors ${
                  policyChecked
                    ? darkMode
                      ? 'bg-white text-gray-900 hover:bg-gray-100 cursor-pointer'
                      : 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-300 cursor-pointer'
                    : darkMode
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Chrome size={20} className={policyChecked ? 'text-blue-500' : ''} />
                {t.signUpWithGoogle}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4 my-6">
                <div className={`flex-1 border-t ${dm.border}`} />
                <span className={`text-sm ${dm.textMuted}`}>{t.or}</span>
                <div className={`flex-1 border-t ${dm.border}`} />
              </div>

              {/* Email Signup Button / Form Toggle */}
              {!showEmailForm ? (
                <button
                  onClick={() => setShowEmailForm(true)}
                  disabled={!policyChecked}
                  className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-medium border transition-colors ${
                    policyChecked
                      ? darkMode
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700/50 cursor-pointer'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer'
                      : darkMode
                        ? 'border-gray-700 text-gray-500 cursor-not-allowed'
                        : 'border-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Mail size={20} />
                  {t.signUpWithEmail}
                </button>
              ) : (
                /* Email Signup Form */
                <form onSubmit={handleEmailSignup} className="space-y-4">
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
                    disabled={isSubmitting || !email || !password || !confirmPassword || !policyChecked}
                    className={`w-full py-3 px-4 rounded-xl font-medium transition-colors ${
                      isSubmitting || !email || !password || !confirmPassword || !policyChecked
                        ? darkMode
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-sky-600 hover:bg-sky-700 text-white cursor-pointer'
                    }`}
                  >
                    {isSubmitting ? t.loading : t.createAccount}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

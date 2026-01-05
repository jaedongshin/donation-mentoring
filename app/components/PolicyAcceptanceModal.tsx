'use client';

import { useState } from 'react';
import { translations, Language } from '@/utils/i18n';
import { Shield, Check } from 'lucide-react';

interface PolicyAcceptanceModalProps {
  onAccept: () => Promise<void>;
  darkMode: boolean;
  lang: Language;
}

export default function PolicyAcceptanceModal({
  onAccept,
  darkMode,
  lang,
}: PolicyAcceptanceModalProps) {
  const [checked, setChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = translations[lang];

  const dm = {
    bg: darkMode ? 'bg-gray-900' : 'bg-gray-50',
    bgCard: darkMode ? 'bg-gray-800' : 'bg-white',
    text: darkMode ? 'text-gray-100' : 'text-gray-900',
    textMuted: darkMode ? 'text-gray-400' : 'text-gray-600',
    border: darkMode ? 'border-gray-700' : 'border-gray-200',
  };

  const handleAccept = async () => {
    if (!checked) return;
    setIsSubmitting(true);
    try {
      await onAccept();
    } catch (error) {
      console.error('Error accepting policy:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className={`relative w-full max-w-md ${dm.bgCard} rounded-2xl shadow-xl border ${dm.border} p-6 animate-scale-in`}
      >
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className={`p-3 rounded-full ${darkMode ? 'bg-sky-900/40' : 'bg-sky-100'}`}>
            <Shield size={28} className={darkMode ? 'text-sky-400' : 'text-sky-600'} />
          </div>
        </div>

        {/* Header */}
        <h2 className={`text-xl font-bold ${dm.text} text-center mb-2`}>
          {t.policyAcceptanceRequired}
        </h2>
        <p className={`text-sm ${dm.textMuted} text-center mb-6`}>
          {t.policyAcceptanceMessage}
        </p>

        {/* Checkbox */}
        <label className="flex items-start gap-3 cursor-pointer mb-6">
          <div className="relative flex-shrink-0 mt-0.5">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="sr-only"
            />
            <div
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                checked
                  ? 'bg-sky-500 border-sky-500'
                  : darkMode
                    ? 'border-gray-600 bg-gray-700'
                    : 'border-gray-300 bg-white'
              }`}
            >
              {checked && <Check size={14} className="text-white" />}
            </div>
          </div>
          <span className={`text-sm ${dm.text}`}>
            {t.acceptPolicy}
          </span>
        </label>

        {/* Button */}
        <button
          onClick={handleAccept}
          disabled={!checked || isSubmitting}
          className={`w-full py-3 px-4 rounded-xl font-medium transition-colors ${
            checked && !isSubmitting
              ? 'bg-sky-600 hover:bg-sky-700 text-white cursor-pointer'
              : darkMode
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? t.processing : t.acceptAndContinue}
        </button>
      </div>
    </div>
  );
}

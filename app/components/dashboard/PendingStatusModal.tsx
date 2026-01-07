'use client';

import { Clock, X } from 'lucide-react';
import { Language, translations } from '@/utils/i18n';

interface PendingStatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    darkMode: boolean;
    lang: Language;
}

export default function PendingStatusModal({ isOpen, onClose, darkMode, lang }: PendingStatusModalProps) {
    const t = translations[lang];

    if (!isOpen) return null;

    const dm = {
        bg: darkMode ? 'bg-gray-800' : 'bg-white',
        text: darkMode ? 'text-gray-100' : 'text-gray-900',
        textMuted: darkMode ? 'text-gray-400' : 'text-gray-600',
        border: darkMode ? 'border-gray-700' : 'border-gray-200',
        overlay: 'bg-black/60 backdrop-blur-sm',
    };

    return (
        <div className={`fixed inset-0 ${dm.overlay} flex items-center justify-center p-4 z-[60] animate-fade-in`}>
            <div className={`${dm.bg} border ${dm.border} rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in`}>
                <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                        <Clock size={24} className="text-yellow-500" />
                    </div>
                    <button 
                        onClick={onClose}
                        className={`p-2 ${dm.textMuted} hover:bg-gray-700/50 rounded-lg transition-colors`}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-4">
                    <h3 className={`text-xl font-bold ${dm.text}`}>
                        {t.statusPending}
                    </h3>
                    <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {t.pendingApprovalMessage}
                    </p>
                </div>

                <div className="mt-8">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-sky-600/20"
                    >
                        {lang === 'ko' ? '확인' : 'Got it'}
                    </button>
                </div>
            </div>
        </div>
    );
}

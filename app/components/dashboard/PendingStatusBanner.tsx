'use client';

import { Clock } from 'lucide-react';
import { Language, translations } from '@/utils/i18n';

interface PendingStatusBannerProps {
    darkMode: boolean;
    lang: Language;
}

export default function PendingStatusBanner({ darkMode, lang }: PendingStatusBannerProps) {
    const t = translations[lang];

    return (
        <div className={`flex-shrink-0 ${darkMode ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-200'} border rounded-xl p-4 mb-6`}>
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
    );
}



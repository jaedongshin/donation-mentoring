'use client';

import { Language, translations } from '@/utils/i18n';

type ProfileState = 'linking' | 'waiting' | 'editing';

interface ProfileFooterProps {
    state: ProfileState;
    darkMode: boolean;
    lang: Language;
    // Linking state
    selectedMentorId?: string;
    linkSubmitSuccess?: boolean;
    isSubmittingLink?: boolean;
    onLinkSubmit?: () => void;
    // Edit state
    onSave?: (e?: React.FormEvent) => void | Promise<void>;
}

export default function ProfileFooter({
    state,
    darkMode,
    lang,
    selectedMentorId = '',
    linkSubmitSuccess = false,
    isSubmittingLink = false,
    onLinkSubmit,
    onSave,
}: ProfileFooterProps) {
    const t = translations[lang];
    const dm = {
        border: darkMode ? 'border-gray-700' : 'border-gray-200',
    };

    // No footer when waiting for approval
    if (state === 'waiting') {
        return null;
    }

    // Linking state
    if (state === 'linking') {
        if (linkSubmitSuccess) {
            return (
                <div className={`flex-shrink-0 border-t ${dm.border} px-6 py-4`}>
                    <button
                        disabled
                        className="w-full py-3 bg-gray-500/40 rounded-xl text-sm font-semibold text-gray-400 cursor-not-allowed"
                    >
                        {t.linkSubmitSuccess}
                    </button>
                </div>
            );
        }

        const buttonText = isSubmittingLink
            ? t.linkSubmitting
            : selectedMentorId === 'new'
                ? t.registerAsMentorButton
                : selectedMentorId
                    ? t.linkProfileButton
                    : t.selectMentorProfile;

        return (
            <div className={`flex-shrink-0 border-t ${dm.border} px-6 py-4`}>
                <button
                    onClick={onLinkSubmit}
                    disabled={isSubmittingLink || !selectedMentorId}
                    className="w-full py-3 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:hover:bg-sky-600 disabled:cursor-not-allowed rounded-xl text-sm font-semibold text-white transition-colors cursor-pointer"
                >
                    {buttonText}
                </button>
            </div>
        );
    }

    // Editing state - save button
    return (
        <div className={`flex-shrink-0 border-t ${dm.border} px-6 py-4`}>
            <button
                onClick={onSave}
                className="w-full py-3 bg-sky-600 hover:bg-sky-700 rounded-xl text-sm font-semibold text-white transition-colors cursor-pointer"
            >
                {t.save}
            </button>
        </div>
    );
}


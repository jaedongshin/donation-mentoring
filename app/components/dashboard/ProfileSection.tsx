'use client';

import { Link2 } from 'lucide-react';
import { Language, translations } from '@/utils/i18n';
import ProfileForm, { ProfileFormData } from '@/app/components/ProfileForm';
import SearchableSelect, { SelectOption } from '@/app/components/SearchableSelect';

type ProfileState = 'linking' | 'waiting' | 'editing';

interface ProfileSectionProps {
    state: ProfileState;
    darkMode: boolean;
    lang: Language;
    // Form data
    profileForm: ProfileFormData;
    onProfileChange: (data: ProfileFormData) => void;
    onProfileSubmit: (e: React.FormEvent) => void;
    onImageUpload?: (file: File) => Promise<string | null>;
    isUploading: boolean;
    // Linking props (only needed when state === 'linking')
    mentorOptions?: SelectOption[];
    selectedMentorId?: string;
    onMentorSelect?: (id: string) => void;
    selectedMentorPreview?: ProfileFormData | null;
    linkSubmitSuccess?: boolean;
    onLinkSubmit?: () => void;
    isSubmittingLink?: boolean;
}

export default function ProfileSection({
    state,
    darkMode,
    lang,
    profileForm,
    onProfileChange,
    onProfileSubmit,
    onImageUpload,
    isUploading,
    mentorOptions = [],
    selectedMentorId = '',
    onMentorSelect,
    selectedMentorPreview,
    linkSubmitSuccess = false,
    onLinkSubmit,
    isSubmittingLink = false,
}: ProfileSectionProps) {
    const t = translations[lang];

    const dm = {
        text: darkMode ? 'text-gray-100' : 'text-gray-900',
        textMuted: darkMode ? 'text-gray-400' : 'text-gray-600',
        border: darkMode ? 'border-gray-700' : 'border-gray-200',
    };

    // State: Linking - user needs to select/create a mentor profile
    if (state === 'linking') {
        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl ${darkMode ? 'bg-sky-500/20' : 'bg-sky-100'} flex items-center justify-center`}>
                        <Link2 size={24} className="text-sky-500" />
                    </div>
                    <div>
                        <h2 className={`text-xl font-semibold ${dm.text}`}>
                            {t.linkProfileTitle}
                        </h2>
                        <p className={`text-sm ${dm.textMuted}`}>
                            {t.linkProfileSubtitle}
                        </p>
                    </div>
                </div>

                {/* Mentor dropdown */}
                <SearchableSelect
                    options={mentorOptions}
                    value={selectedMentorId}
                    onChange={(id) => onMentorSelect?.(id)}
                    placeholder={t.selectMentorProfile}
                    noOptionsMessage={t.noResults}
                    darkMode={darkMode}
                    disabled={linkSubmitSuccess}
                />

                {/* Existing mentor preview */}
                {selectedMentorId && selectedMentorId !== 'new' && selectedMentorPreview && (
                    <MentorPreview
                        preview={selectedMentorPreview}
                        darkMode={darkMode}
                        lang={lang}
                        label={t.selectedMentorProfile}
                    />
                )}

                {/* New mentor form */}
                {selectedMentorId === 'new' && (
                    <div className={`border-t ${dm.border} pt-6`}>
                        <p className={`text-sm ${dm.textMuted} mb-4`}>
                            {t.fillProfileBelow}
                        </p>
                        <ProfileForm
                            formData={profileForm}
                            onChange={onProfileChange}
                            onSubmit={async (e) => {
                                e.preventDefault();
                                onLinkSubmit?.();
                            }}
                            onImageUpload={onImageUpload}
                            darkMode={darkMode}
                            lang={lang}
                            showSubmitButton={false}
                            isUploading={isUploading}
                        />
                    </div>
                )}
            </div>
        );
    }

    // State: Waiting for approval - show read-only form
    if (state === 'waiting') {
        return (
            <ProfileForm
                formData={profileForm}
                onChange={() => {}} // Read-only
                onSubmit={(e) => e.preventDefault()}
                darkMode={darkMode}
                lang={lang}
                showSubmitButton={false}
                isUploading={false}
            />
        );
    }

    // State: Editing - full editable form
    return (
        <ProfileForm
            formData={profileForm}
            onChange={onProfileChange}
            onSubmit={onProfileSubmit}
            onImageUpload={onImageUpload}
            darkMode={darkMode}
            lang={lang}
            showSubmitButton={false}
            isUploading={isUploading}
        />
    );
}

// Sub-component for mentor preview card
function MentorPreview({
    preview,
    darkMode,
    lang,
    label,
}: {
    preview: ProfileFormData;
    darkMode: boolean;
    lang: Language;
    label: string;
}) {
    const dm = {
        text: darkMode ? 'text-gray-100' : 'text-gray-900',
        textMuted: darkMode ? 'text-gray-400' : 'text-gray-600',
        border: darkMode ? 'border-gray-700' : 'border-gray-200',
    };

    const t = translations[lang];
    const fields = [
        { label: t.name, value: lang === 'ko' ? preview.name_ko : preview.name_en },
        { label: t.company, value: lang === 'ko' ? preview.company_ko : preview.company_en },
        { label: t.position, value: lang === 'ko' ? preview.position_ko : preview.position_en },
        { label: t.location, value: lang === 'ko' ? preview.location_ko : preview.location_en },
    ].filter(f => f.value);

    return (
        <div className={`border ${dm.border} rounded-xl p-4 ${darkMode ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
            <p className={`text-xs font-medium ${dm.textMuted} uppercase tracking-wide mb-3`}>
                {label}
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
                {fields.map(({ label, value }) => (
                    <div key={label}>
                        <span className={dm.textMuted}>{label}:</span>
                        <span className={`ml-2 ${dm.text}`}>{value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}



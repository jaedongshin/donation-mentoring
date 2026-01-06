'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { translations, Language } from '@/utils/i18n';
import { Calendar, CalendarDays, BarChart3, Clock } from 'lucide-react';
import TopNav from '@/app/components/TopNav';
import { ProfileFormData } from '@/app/components/ProfileForm';
import { BentoNav, BentoCardId, ProfileSection, ProfileFooter, PlaceholderSection, Toast, PendingStatusBanner } from '@/app/components/dashboard';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/utils/supabase';

// Initial empty profile form
const EMPTY_PROFILE: ProfileFormData = {
    name_en: '',
    name_ko: '',
    description_en: '',
    description_ko: '',
    position_en: '',
    position_ko: '',
    company_en: '',
    company_ko: '',
    location_en: '',
    location_ko: '',
    linkedin_url: '',
    calendly_url: '',
    email: '',
    languages: [],
    session_time_minutes: null,
    session_price_usd: null,
    tags: [],
    picture_url: '',
};

// Mentor data to ProfileFormData converter
function mentorToFormData(mentor: Record<string, unknown>): ProfileFormData {
    return {
        name_en: (mentor.name_en as string) || '',
        name_ko: (mentor.name_ko as string) || '',
        description_en: (mentor.description_en as string) || '',
        description_ko: (mentor.description_ko as string) || '',
        position_en: (mentor.position_en as string) || '',
        position_ko: (mentor.position_ko as string) || '',
        company_en: (mentor.company_en as string) || '',
        company_ko: (mentor.company_ko as string) || '',
        location_en: (mentor.location_en as string) || '',
        location_ko: (mentor.location_ko as string) || '',
        linkedin_url: (mentor.linkedin_url as string) || '',
        calendly_url: (mentor.calendly_url as string) || '',
        email: (mentor.email as string) || '',
        languages: (mentor.languages as string[]) || [],
        session_time_minutes: mentor.session_time_minutes as number | null,
        session_price_usd: mentor.session_price_usd as number | null,
        tags: Array.isArray(mentor.tags) ? (mentor.tags as string[]) : [],
        picture_url: (mentor.picture_url as string) || '',
    };
}

export default function DashboardPage() {
    const router = useRouter();
    const { user, isLoading, isAuthenticated, logout, needsMentorLink, linkMentorProfile } = useAuth();

    // Approved = mentor/admin/super_admin (not 'user' role)
    const isUserRole = user?.role === 'user';

    const [lang, setLang] = useState<Language>('ko');
    const [selectedCard, setSelectedCard] = useState<BentoCardId>('profile');

    // Dark mode: read from localStorage or default to true
    const [darkMode, setDarkMode] = useState(() => {
        if (typeof window === 'undefined') return true;
        const saved = localStorage.getItem('darkMode');
        return saved !== null ? saved === 'true' : true;
    });

    // Profile form state
    const [profileForm, setProfileForm] = useState<ProfileFormData>(EMPTY_PROFILE);
    const [mentorId, setMentorId] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Mentor linking state
    const [unlinkedMentors, setUnlinkedMentors] = useState<Array<{ id: string; name_en: string; name_ko: string; email: string }>>([]);
    const [selectedMentorId, setSelectedMentorId] = useState<string>('');
    const [isSubmittingLink, setIsSubmittingLink] = useState(false);
    const [linkSubmitSuccess, setLinkSubmitSuccess] = useState(false);
    const [selectedMentorPreview, setSelectedMentorPreview] = useState<ProfileFormData | null>(null);

    // Toast state
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // UI state derived from data
    const showLinkingUI = mentorId === null && !linkSubmitSuccess;
    const showWaitingApproval = isUserRole && mentorId !== null;

    // Profile state for components
    const profileState = showLinkingUI ? 'linking' : showWaitingApproval ? 'waiting' : 'editing';

    const t = translations[lang];

    // Dark mode classes
    const dm = {
        bg: darkMode ? 'bg-gray-900' : 'bg-gray-50',
        bgCard: darkMode ? 'bg-gray-800' : 'bg-white',
        text: darkMode ? 'text-gray-100' : 'text-gray-900',
        textMuted: darkMode ? 'text-gray-400' : 'text-gray-600',
        border: darkMode ? 'border-gray-700' : 'border-gray-200',
    };

    // Auto-dismiss toast
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    // Fetch mentor data linked to user profile
    useEffect(() => {
        const fetchMentorData = async () => {
            if (!user) return;

            const { data: profile } = await supabase
                .from('profiles')
                .select('mentor_id')
                .eq('id', user.id)
                .maybeSingle();

            if (profile?.mentor_id) {
                setMentorId(profile.mentor_id);

                const { data: mentor } = await supabase
                    .from('mentors')
                    .select('*')
                    .eq('id', profile.mentor_id)
                    .single();

                if (mentor) {
                    setProfileForm(mentorToFormData(mentor));
                }
                setLinkSubmitSuccess(false);
            } else {
                // Pre-fill email for new users
                const isEmailAsName = user.displayName?.includes('@');
                setProfileForm(prev => ({
                    ...prev,
                    name_en: isEmailAsName ? '' : (user.displayName || ''),
                    name_ko: isEmailAsName ? '' : (user.displayName || ''),
                    email: user.email || '',
                }));
            }
        };

        fetchMentorData();
    }, [user]);

    // Fetch unlinked mentors for dropdown
    useEffect(() => {
        const fetchUnlinkedMentors = async () => {
            if (!needsMentorLink || !user) return;

            const { data: linkedProfiles } = await supabase
                .from('profiles')
                .select('mentor_id')
                .not('mentor_id', 'is', null);

            const linkedMentorIds = linkedProfiles?.map(p => p.mentor_id) || [];

            let query = supabase
                .from('mentors')
                .select('id, name_en, name_ko, email')
                .order('name_ko', { ascending: true });

            if (linkedMentorIds.length > 0) {
                query = query.not('id', 'in', `(${linkedMentorIds.join(',')})`);
            }

            const { data: mentors } = await query;
            setUnlinkedMentors(mentors || []);

            // Pre-select if email matches
            if (mentors && user.email) {
                const match = mentors.find(m => m.email?.toLowerCase() === user.email.toLowerCase());
                if (match) setSelectedMentorId(match.id);
            }
        };

        fetchUnlinkedMentors();
    }, [needsMentorLink, user]);

    // Fetch mentor preview when selection changes
    useEffect(() => {
        const fetchPreview = async () => {
            if (!selectedMentorId || selectedMentorId === 'new') {
                setSelectedMentorPreview(null);
                return;
            }

            const { data: mentor } = await supabase
                .from('mentors')
                .select('*')
                .eq('id', selectedMentorId)
                .single();

            if (mentor) {
                setSelectedMentorPreview(mentorToFormData(mentor));
            }
        };

        fetchPreview();
    }, [selectedMentorId]);

    // Handle mentor link submission
    const handleLinkSubmit = async () => {
        if (!selectedMentorId) return;

        const isNewMentor = selectedMentorId === 'new';
        setIsSubmittingLink(true);
        setLinkSubmitSuccess(false);

        try {
            await linkMentorProfile(
                isNewMentor ? null : selectedMentorId,
                isNewMentor,
                isNewMentor ? profileForm : undefined
            );
            setLinkSubmitSuccess(true);
            setToast({ type: 'success', message: t.linkSubmitSuccess });

            if (!isNewMentor && selectedMentorPreview) {
                setMentorId(selectedMentorId);
                setProfileForm(selectedMentorPreview);
            }
        } catch (error) {
            console.error('Link error:', error);
            setToast({ type: 'error', message: t.linkError });
        } finally {
            setIsSubmittingLink(false);
        }
    };

    // Image upload handler
    const handleImageUpload = useCallback(async (file: File): Promise<string | null> => {
        if (!mentorId) return null;

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${mentorId}-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('mentor-pictures')
                .upload(fileName, file, { upsert: true });

            if (uploadError) {
                console.error('Upload error:', uploadError);
                return null;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('mentor-pictures')
                .getPublicUrl(fileName);

            return publicUrl;
        } finally {
            setIsUploading(false);
        }
    }, [mentorId]);

    // Profile save handler
    const handleProfileSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();

        if (!mentorId) {
            setToast({ type: 'error', message: t.cannotSave });
            return;
        }

        const { error } = await supabase
            .from('mentors')
            .update({
                name_en: profileForm.name_en,
                name_ko: profileForm.name_ko,
                description_en: profileForm.description_en,
                description_ko: profileForm.description_ko,
                position_en: profileForm.position_en,
                position_ko: profileForm.position_ko,
                company_en: profileForm.company_en,
                company_ko: profileForm.company_ko,
                location_en: profileForm.location_en,
                location_ko: profileForm.location_ko,
                linkedin_url: profileForm.linkedin_url,
                calendly_url: profileForm.calendly_url,
                email: profileForm.email,
                languages: profileForm.languages,
                session_time_minutes: profileForm.session_time_minutes,
                session_price_usd: profileForm.session_price_usd,
                tags: profileForm.tags,
                picture_url: profileForm.picture_url,
            })
            .eq('id', mentorId);

        if (error) {
            console.error('Save error:', error);
            setToast({ type: 'error', message: t.saveError });
        } else {
            setToast({ type: 'success', message: t.saveSuccess });
        }
    };

    const toggleDarkMode = () => {
        const newValue = !darkMode;
        setDarkMode(newValue);
        localStorage.setItem('darkMode', String(newValue));
    };

    // Build mentor options for dropdown
    const mentorOptions = [
        { value: 'new', label: `➕ ${t.registerAsNewMentor}` },
        ...unlinkedMentors.map(m => ({
            value: m.id,
            label: lang === 'ko' ? m.name_ko : m.name_en,
            tag: m.email?.toLowerCase() === user?.email.toLowerCase() ? t.emailMatch : undefined,
        })),
    ];

    // Redirect if not authenticated
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, router]);

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    if (isLoading || !isAuthenticated) {
        return (
            <div className={`min-h-screen ${dm.bg} flex items-center justify-center`}>
                <p className={dm.textMuted}>{t.loading}</p>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${dm.bg} transition-colors duration-300`}>
            <TopNav
                variant="mentor"
                darkMode={darkMode}
                onToggleDarkMode={toggleDarkMode}
                lang={lang}
                onLangChange={setLang}
                user={user ? {
                    id: user.id,
                    email: user.email,
                    displayName: user.displayName,
                    avatarUrl: user.avatarUrl,
                    role: user.role,
                } : undefined}
                onLogout={handleLogout}
            />

            {/* Toast */}
            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>
                <h1 className={`flex-shrink-0 text-2xl font-bold ${dm.text} mb-6`}>
                    {t.dashboardTitle}
                </h1>

                {/* Pending Status Banner */}
                {isUserRole && <PendingStatusBanner darkMode={darkMode} lang={lang} />}

                {/* Bento Navigation */}
                <BentoNav
                    selectedCard={selectedCard}
                    onSelectCard={setSelectedCard}
                    darkMode={darkMode}
                    lang={lang}
                />

                {/* Main Content Card */}
                <div className={`${dm.bgCard} border ${dm.border} rounded-2xl flex flex-col flex-1 min-h-0`}>
                    <div className="flex-1 overflow-y-auto p-6">
                        {selectedCard === 'profile' && (
                            <ProfileSection
                                state={profileState}
                                darkMode={darkMode}
                                lang={lang}
                                profileForm={profileForm}
                                onProfileChange={setProfileForm}
                                onProfileSubmit={handleProfileSubmit}
                                onImageUpload={handleImageUpload}
                                isUploading={isUploading}
                                mentorOptions={mentorOptions}
                                selectedMentorId={selectedMentorId}
                                onMentorSelect={setSelectedMentorId}
                                selectedMentorPreview={selectedMentorPreview}
                                linkSubmitSuccess={linkSubmitSuccess}
                                onLinkSubmit={handleLinkSubmit}
                            />
                        )}

                        {selectedCard === 'availability' && (
                            <PlaceholderSection
                                icon={Clock}
                                title={t.comingSoon}
                                description={t.availabilityCardDesc}
                                darkMode={darkMode}
                            />
                        )}

                        {selectedCard === 'calendar' && (
                            <PlaceholderSection
                                icon={CalendarDays}
                                title={t.comingSoon}
                                description={t.calendarCardDesc}
                                darkMode={darkMode}
                            />
                        )}

                        {selectedCard === 'stats' && (
                            <PlaceholderSection
                                icon={BarChart3}
                                title={t.comingSoon}
                                description={t.statsCardDesc}
                                darkMode={darkMode}
                            />
                        )}

                        {selectedCard === 'bookings' && (
                            <PlaceholderSection
                                icon={Calendar}
                                title={t.comingSoon}
                                description={t.bookingsCardDesc}
                                darkMode={darkMode}
                            />
                        )}
                    </div>

                    {/* Footer */}
                    {selectedCard === 'profile' && (
                        <ProfileFooter
                            state={profileState}
                            darkMode={darkMode}
                            lang={lang}
                            selectedMentorId={selectedMentorId}
                            linkSubmitSuccess={linkSubmitSuccess}
                            isSubmittingLink={isSubmittingLink}
                            onLinkSubmit={handleLinkSubmit}
                            onSave={handleProfileSubmit}
                        />
                    )}
                </div>
            </main>
        </div>
    );
}

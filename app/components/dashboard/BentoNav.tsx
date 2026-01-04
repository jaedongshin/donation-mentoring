'use client';

import { Clock, Pencil, Calendar, CalendarDays, BarChart3, LucideIcon } from 'lucide-react';
import { Language, translations } from '@/utils/i18n';

export type BentoCardId = 'profile' | 'availability' | 'calendar' | 'stats' | 'bookings';

interface BentoNavProps {
    selectedCard: BentoCardId;
    onSelectCard: (card: BentoCardId) => void;
    darkMode: boolean;
    lang: Language;
}

// Static color classes - Tailwind JIT cannot parse dynamic class names
const CARD_COLORS: Record<string, {
    ring: string;
    bgDark: string;
    bgLight: string;
    iconBgDark: string;
    iconBgLight: string;
    iconColor: string;
    textDark: string;
    textLight: string;
}> = {
    sky: {
        ring: 'ring-2 ring-sky-500',
        bgDark: 'bg-sky-500/10 border-sky-500/50',
        bgLight: 'bg-sky-50 border-sky-300',
        iconBgDark: 'bg-sky-500/30',
        iconBgLight: 'bg-sky-100',
        iconColor: 'text-sky-500',
        textDark: 'text-sky-400',
        textLight: 'text-sky-600',
    },
    amber: {
        ring: 'ring-2 ring-amber-500',
        bgDark: 'bg-amber-500/10 border-amber-500/50',
        bgLight: 'bg-amber-50 border-amber-300',
        iconBgDark: 'bg-amber-500/30',
        iconBgLight: 'bg-amber-100',
        iconColor: 'text-amber-500',
        textDark: 'text-amber-400',
        textLight: 'text-amber-600',
    },
    green: {
        ring: 'ring-2 ring-green-500',
        bgDark: 'bg-green-500/10 border-green-500/50',
        bgLight: 'bg-green-50 border-green-300',
        iconBgDark: 'bg-green-500/30',
        iconBgLight: 'bg-green-100',
        iconColor: 'text-green-500',
        textDark: 'text-green-400',
        textLight: 'text-green-600',
    },
    purple: {
        ring: 'ring-2 ring-purple-500',
        bgDark: 'bg-purple-500/10 border-purple-500/50',
        bgLight: 'bg-purple-50 border-purple-300',
        iconBgDark: 'bg-purple-500/30',
        iconBgLight: 'bg-purple-100',
        iconColor: 'text-purple-500',
        textDark: 'text-purple-400',
        textLight: 'text-purple-600',
    },
    rose: {
        ring: 'ring-2 ring-rose-500',
        bgDark: 'bg-rose-500/10 border-rose-500/50',
        bgLight: 'bg-rose-50 border-rose-300',
        iconBgDark: 'bg-rose-500/30',
        iconBgLight: 'bg-rose-100',
        iconColor: 'text-rose-500',
        textDark: 'text-rose-400',
        textLight: 'text-rose-600',
    },
};

const BENTO_CARDS: Array<{
    id: BentoCardId;
    icon: LucideIcon;
    color: keyof typeof CARD_COLORS;
    titleKey: 'profileCardTitle' | 'availabilityCardTitle' | 'calendarCardTitle' | 'statsCardTitle' | 'upcomingBookings';
}> = [
    { id: 'profile', icon: Pencil, color: 'sky', titleKey: 'profileCardTitle' },
    { id: 'availability', icon: Clock, color: 'amber', titleKey: 'availabilityCardTitle' },
    { id: 'calendar', icon: CalendarDays, color: 'green', titleKey: 'calendarCardTitle' },
    { id: 'stats', icon: BarChart3, color: 'purple', titleKey: 'statsCardTitle' },
    { id: 'bookings', icon: Calendar, color: 'rose', titleKey: 'upcomingBookings' },
];

export default function BentoNav({ selectedCard, onSelectCard, darkMode, lang }: BentoNavProps) {
    const t = translations[lang];

    const dm = {
        bgCard: darkMode ? 'bg-gray-800' : 'bg-white',
        textMuted: darkMode ? 'text-gray-400' : 'text-gray-600',
        border: darkMode ? 'border-gray-700' : 'border-gray-200',
    };

    return (
        <div className="flex-shrink-0 grid grid-cols-5 gap-2 sm:gap-3 mb-4">
            {BENTO_CARDS.map(({ id, icon: Icon, color, titleKey }) => {
                const isSelected = selectedCard === id;
                const colors = CARD_COLORS[color];

                return (
                    <button
                        key={id}
                        onClick={() => onSelectCard(id)}
                        className={`${dm.bgCard} border rounded-xl p-3 sm:p-4 text-center cursor-pointer transition-all duration-200 hover:scale-[1.03] ${
                            isSelected
                                ? `${colors.ring} ${darkMode ? colors.bgDark : colors.bgLight}`
                                : dm.border
                        }`}
                    >
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg mx-auto mb-2 flex items-center justify-center ${
                            isSelected
                                ? (darkMode ? colors.iconBgDark : colors.iconBgLight)
                                : (darkMode ? 'bg-gray-700' : 'bg-gray-100')
                        }`}>
                            <Icon size={18} className={isSelected ? colors.iconColor : dm.textMuted} />
                        </div>
                        <span className={`text-xs sm:text-sm font-medium ${
                            isSelected ? (darkMode ? colors.textDark : colors.textLight) : dm.textMuted
                        }`}>
                            {t[titleKey]}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

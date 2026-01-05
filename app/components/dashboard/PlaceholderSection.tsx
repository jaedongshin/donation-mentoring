'use client';

import { LucideIcon } from 'lucide-react';

interface PlaceholderSectionProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    darkMode: boolean;
}

export default function PlaceholderSection({
    icon: Icon,
    title,
    description,
    darkMode,
}: PlaceholderSectionProps) {
    const textMuted = darkMode ? 'text-gray-400' : 'text-gray-600';

    return (
        <div className={`flex flex-col items-center justify-center h-64 ${textMuted}`}>
            <Icon size={56} className="mb-4 opacity-20" />
            <p className="font-medium text-lg">{title}</p>
            {description && (
                <p className="text-sm mt-2 max-w-sm text-center">{description}</p>
            )}
        </div>
    );
}



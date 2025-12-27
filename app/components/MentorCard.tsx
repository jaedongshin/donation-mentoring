import { Mentor } from '@/types/mentor';
import { Building2, MapPin, Clock, DollarSign } from 'lucide-react';
import Image from 'next/image';
import { Language } from '@/utils/i18n';
import { useState } from 'react';

interface MentorCardProps {
  mentor: Mentor;
  lang: Language;
  onClick: (mentor: Mentor) => void;
}

export default function MentorCard({ mentor, lang, onClick }: MentorCardProps) {
  const [imageError, setImageError] = useState(false);
  const name = lang === 'en' ? mentor.name_en : mentor.name_ko;
  const position = lang === 'en' ? mentor.position_en : mentor.position_ko;
  const location = lang === 'en' ? mentor.location_en : mentor.location_ko;
  const company = lang === 'en' ? mentor.company_en : mentor.company_ko;
  const description = lang === 'en' ? mentor.description_en : mentor.description_ko;

  // Fallback if current language is empty
  const displayName = name || mentor.name_en || mentor.name_ko || 'No Name';
  const displayPosition = position || mentor.position_en || mentor.position_ko || '';
  const displayLocation = location || mentor.location_en || mentor.location_ko || '';
  const displayCompany = company || mentor.company_en || mentor.company_ko || '';
  const displayDescription = description || mentor.description_en || mentor.description_ko || '';

  return (
    <div
      onClick={() => onClick(mentor)}
      className="group cursor-pointer bg-white rounded-xl overflow-hidden border border-warm-100
        hover:border-primary-200 hover:shadow-lg transition-all duration-300 h-full flex flex-col"
    >
      {/* Image with Overlay */}
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        {mentor.picture_url && !imageError ? (
          <>
            <Image
              src={mentor.picture_url}
              alt={displayName}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              unoptimized={mentor.picture_url.includes('supabase.co')}
              onError={() => setImageError(true)}
            />
            {/* Gradient overlay - stronger for better readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

            {/* Name and Position on image */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-lg font-semibold text-white mb-0.5"
                style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                {displayName}
              </h3>
              <p className="text-sm text-white/90 line-clamp-2"
                style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                {displayPosition}
              </p>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full bg-warm-100 text-warm-400">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-warm-200 flex items-center justify-center">
                <span className="text-3xl text-warm-400">👤</span>
              </div>
              <p className="text-lg font-semibold text-warm-600">{displayName}</p>
              <p className="text-sm text-warm-500">{displayPosition}</p>
            </div>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4 space-y-3 flex-1 flex flex-col">
        {/* Company and Location */}
        <div className="flex items-center flex-wrap gap-x-1 text-sm text-warm-700">
          {displayCompany && (
            <div className="flex items-center">
              <Building2 size={14} className="mr-1 text-warm-400 flex-shrink-0" />
              <span className="truncate">{displayCompany}</span>
            </div>
          )}
          {displayCompany && displayLocation && (
            <span className="text-warm-300">·</span>
          )}
          {displayLocation && (
            <div className="flex items-center">
              <MapPin size={14} className="mr-1 text-warm-400 flex-shrink-0" />
              <span className="truncate">{displayLocation}</span>
            </div>
          )}
        </div>

        {/* Session info */}
        {(mentor.session_time_minutes || mentor.session_price_usd) && (
          <div className="flex items-center text-sm font-medium text-secondary-600">
            {mentor.session_time_minutes && (
              <div className="flex items-center">
                <Clock size={14} className="mr-1 text-secondary-500" />
                <span>{mentor.session_time_minutes}min</span>
              </div>
            )}
            {mentor.session_time_minutes && mentor.session_price_usd && (
              <span className="mx-2 text-warm-300">·</span>
            )}
            {mentor.session_price_usd && (
              <div className="flex items-center">
                <DollarSign size={14} className="mr-0.5 text-secondary-500" />
                <span>{mentor.session_price_usd.toFixed(0)}</span>
              </div>
            )}
          </div>
        )}

        {/* Description */}
        <div className="flex-1">
          {displayDescription && (
            <p className="text-sm text-warm-600 line-clamp-3 leading-relaxed">
              {displayDescription}
            </p>
          )}
        </div>

        {/* Tags (1-2 only) */}
        {mentor.tags && mentor.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1 mt-auto">
            {mentor.tags.slice(0, 2).map((tag, index) => (
              <span
                key={index}
                className="px-2.5 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-full border border-primary-100"
              >
                {tag}
              </span>
            ))}
            {mentor.tags.length > 2 && (
              <span className="px-2.5 py-1 bg-warm-100 text-warm-500 text-xs font-medium rounded-full">
                +{mentor.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

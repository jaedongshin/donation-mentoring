import { Mentor } from '@/types/mentor';
import { MapPin, Briefcase, Building2, Linkedin, Calendar, Mail } from 'lucide-react';
import Image from 'next/image';
import { Language } from '@/utils/i18n';

interface MentorCardProps {
  mentor: Mentor;
  lang: Language;
  onClick: (mentor: Mentor) => void;
}

export default function MentorCard({ mentor, lang, onClick }: MentorCardProps) {
  const name = lang === 'en' ? mentor.name_en : mentor.name_ko;
  const description = lang === 'en' ? mentor.description_en : mentor.description_ko;
  const position = lang === 'en' ? mentor.position_en : mentor.position_ko;
  const location = lang === 'en' ? mentor.location_en : mentor.location_ko;
  const company = lang === 'en' ? mentor.company_en : mentor.company_ko;

  // Fallback if current language is empty
  const displayName = name || mentor.name_en || mentor.name_ko || 'No Name';
  const displayDescription = description || mentor.description_en || mentor.description_ko || '';
  const displayPosition = position || mentor.position_en || mentor.position_ko || '';
  const displayLocation = location || mentor.location_en || mentor.location_ko || '';
  const displayCompany = company || mentor.company_en || mentor.company_ko || '';

  const ensureProtocol = (url: string) => {
    if (!url) return '';
    return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
  };

  return (
    <div 
      onClick={() => onClick(mentor)}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer flex flex-col h-full"
    >
      <div className="relative h-64 w-full bg-gray-200 flex-shrink-0">
        {mentor.picture_url ? (
          <Image
            src={mentor.picture_url}
            alt={displayName}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            No Image
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-2xl font-extrabold text-gray-900 mb-2">{displayName}</h3>
        
        <div className="flex flex-col gap-1.5 mb-3">
          <div className="flex items-center text-sm font-medium text-gray-700">
            <Briefcase size={16} className="mr-2 text-blue-600 flex-shrink-0" />
            <span>{displayPosition}</span>
          </div>
          {displayCompany && (
            <div className="flex items-center text-sm font-medium text-gray-700">
              <Building2 size={16} className="mr-2 text-blue-600 flex-shrink-0" />
              <span>{displayCompany}</span>
            </div>
          )}
          <div className="flex items-center text-sm text-gray-500">
            <MapPin size={16} className="mr-2 text-gray-400 flex-shrink-0" />
            <span>{displayLocation}</span>
          </div>
        </div>

        <p className="text-gray-600 text-sm line-clamp-3 mb-4 flex-grow">
          {displayDescription}
        </p>
        
        <div className="flex flex-wrap gap-1.5 mb-4">
          {mentor.tags && mentor.tags.map((tag, index) => (
            <span key={index} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full border border-gray-200">
              {tag}
            </span>
          ))}
        </div>

        <div className="flex gap-3 pt-3 border-t border-gray-100 mt-auto">
          {mentor.linkedin_url && (
            <a 
              href={ensureProtocol(mentor.linkedin_url)} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#0A66C2] transition-colors"
            >
              <Linkedin size={16} />
              LinkedIn
            </a>
          )}
          {mentor.calendly_url && (
            <a 
              href={ensureProtocol(mentor.calendly_url)} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-blue-600 transition-colors"
            >
              <Calendar size={16} />
              Book Session
            </a>
          )}
          {mentor.email && (
            <a 
              href={`mailto:${mentor.email}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-blue-600 transition-colors"
            >
              <Mail size={16} />
              Email
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
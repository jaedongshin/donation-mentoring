'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Moon, Sun, User, LogOut, Search, X, ChevronDown } from 'lucide-react';
import { Language, translations } from '@/utils/i18n';
import { UserRole } from '@/hooks/useAuth';

// User type for authenticated users
export interface AuthUser {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  role: UserRole;
}

export type NavVariant = 'guest' | 'mentor' | 'admin';

interface TopNavProps {
  // Shared
  darkMode: boolean;
  onToggleDarkMode: () => void;
  lang: Language;
  onLangChange: (lang: Language) => void;

  // Role variant
  variant: NavVariant;

  // For guest: scroll handlers
  onScrollToAbout?: () => void;
  onScrollToMentors?: () => void;
  onScrollToTodayMentor?: () => void;

  // For admin: search
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;

  // For authenticated users (mentor/admin)
  user?: AuthUser | null;
  onLogout?: () => void;

  // Hide login link (e.g., on login page itself)
  hideLoginLink?: boolean;
}

export default function TopNav({
  darkMode,
  onToggleDarkMode,
  lang,
  onLangChange,
  variant,
  onScrollToAbout,
  onScrollToMentors,
  onScrollToTodayMentor,
  showSearch = false,
  searchValue = '',
  onSearchChange,
  user,
  onLogout,
  hideLoginLink = false,
}: TopNavProps) {
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const t = translations[lang];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };

    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdownOpen]);

  // Dark mode classes
  const dm = {
    headerBg: darkMode ? 'bg-gray-900/95' : 'bg-white/95',
    text: darkMode ? 'text-gray-100' : 'text-gray-900',
    textMuted: darkMode ? 'text-gray-400' : 'text-gray-600',
    bgCard: darkMode ? 'bg-gray-800' : 'bg-white',
    border: darkMode ? 'border-gray-700' : 'border-gray-200',
    hoverBg: darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100',
    activeBg: darkMode ? 'active:bg-gray-700' : 'active:bg-gray-200',
  };

  const isAuthenticated = variant !== 'guest' && user;
  const canSearch = (variant === 'admin' || user?.role === 'super_admin') && showSearch;

  return (
    <header className={`${dm.headerBg} backdrop-blur-sm shadow-sm sticky top-0 z-40 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className={`text-base sm:text-lg font-bold ${dm.text} whitespace-nowrap mr-2 sm:mr-4`}>
            {variant === 'admin' ? t.adminTitle : t.title}
          </Link>

          {/* Right side controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Guest: Nav links - only on homepage when scroll handlers provided */}
            {variant === 'guest' && (onScrollToAbout || onScrollToMentors || onScrollToTodayMentor) && (
              <nav className="hidden md:flex items-center gap-1 mr-2">
                <button
                  onClick={onScrollToAbout}
                  className={`px-3 py-1.5 text-sm font-medium ${dm.textMuted} hover:${dm.text} ${dm.hoverBg} rounded-lg transition-colors whitespace-nowrap cursor-pointer`}
                >
                  {t.navAbout}
                </button>
                {onScrollToTodayMentor && (
                  <button
                    onClick={onScrollToTodayMentor}
                    className={`px-3 py-1.5 text-sm font-medium ${dm.textMuted} hover:${dm.text} ${dm.hoverBg} rounded-lg transition-colors whitespace-nowrap cursor-pointer`}
                  >
                    {t.navTodayMentor}
                  </button>
                )}
                <button
                  onClick={onScrollToMentors}
                  className={`px-3 py-1.5 text-sm font-medium ${dm.textMuted} hover:${dm.text} ${dm.hoverBg} rounded-lg transition-colors whitespace-nowrap cursor-pointer`}
                >
                  {t.navMentors}
                </button>
              </nav>
            )}

            {/* Authenticated: Nav links for admin/super_admin */}
            {user && (user.role === 'admin' || user.role === 'super_admin') && (
              <nav className="hidden md:flex items-center gap-1 mr-2">
                <Link
                  href="/dashboard"
                  className={`px-3 py-1.5 text-sm font-medium ${dm.textMuted} hover:${dm.text} ${dm.hoverBg} rounded-lg transition-colors whitespace-nowrap`}
                >
                  {t.dashboard}
                </Link>
                <Link
                  href="/mentors"
                  className={`px-3 py-1.5 text-sm font-medium ${dm.textMuted} hover:${dm.text} ${dm.hoverBg} rounded-lg transition-colors whitespace-nowrap`}
                >
                  {t.mentorManagement}
                </Link>
                {(user.role === 'admin' || user.role === 'super_admin') && (
                  <Link
                    href="/permissions"
                    className={`px-3 py-1.5 text-sm font-medium ${dm.textMuted} hover:${dm.text} ${dm.hoverBg} rounded-lg transition-colors whitespace-nowrap`}
                  >
                    {t.manageUsers}
                  </Link>
                )}
              </nav>
            )}

            {/* Admin: Search */}
            {canSearch && (
              <>
                {!searchExpanded ? (
                  <button
                    onClick={() => setSearchExpanded(true)}
                    className={`p-2 ${dm.textMuted} hover:${dm.text} ${dm.hoverBg} ${dm.activeBg} rounded-lg transition-colors`}
                    aria-label="Search"
                  >
                    <Search size={18} />
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 flex-1 max-w-xs">
                    <div className="relative flex-1">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        autoFocus
                        value={searchValue}
                        onChange={(e) => onSearchChange?.(e.target.value)}
                        placeholder={t.searchPlaceholder}
                        className={`w-full pl-9 pr-3 py-1.5 text-sm ${dm.bgCard} ${dm.text} border ${dm.border} rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500/40 focus:border-sky-500/40`}
                      />
                    </div>
                    <button
                      onClick={() => { setSearchExpanded(false); onSearchChange?.(''); }}
                      className={`p-2 ${dm.textMuted} hover:${dm.text} ${dm.hoverBg} ${dm.activeBg} rounded-lg transition-colors`}
                      aria-label="Close search"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Language selector */}
            <select
              value={lang}
              onChange={(e) => onLangChange(e.target.value as Language)}
              className={`text-sm font-medium ${dm.textMuted} ${dm.bgCard} border ${dm.border} rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 w-12 sm:w-auto`}
              aria-label="Select language"
            >
              <option value="ko">🇰🇷 KO</option>
              <option value="en">🇺🇸 EN</option>
            </select>

            {/* Dark mode toggle */}
            <button
              onClick={onToggleDarkMode}
              className={`hidden sm:block p-2 rounded-lg transition-all cursor-pointer ${
                darkMode ? 'bg-gray-700 text-amber-400' : 'bg-gray-100 text-gray-600'
              }`}
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Guest: Login link */}
            {variant === 'guest' && !hideLoginLink && (
              <Link
                href="/login"
                className={`p-2 ${dm.textMuted} hover:${dm.text} ${dm.hoverBg} rounded-lg transition-colors`}
                aria-label="Login"
              >
                <User size={18} />
              </Link>
            )}

            {/* Authenticated: Profile dropdown */}
            {isAuthenticated && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className={`flex items-center gap-1.5 p-1.5 sm:p-2 ${dm.hoverBg} rounded-lg transition-colors cursor-pointer`}
                  aria-label="Profile menu"
                >
                  {user.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt={user.displayName || user.email}
                      width={24}
                      height={24}
                      className="rounded-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className={`w-6 h-6 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} flex items-center justify-center`}>
                      <User size={14} className={dm.textMuted} />
                    </div>
                  )}
                  <ChevronDown size={14} className={`hidden sm:block ${dm.textMuted}`} />
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className={`absolute right-0 mt-2 w-56 ${dm.bgCard} border ${dm.border} rounded-xl shadow-lg z-50 py-1 overflow-hidden`}>
                    {/* User info */}
                    <div className={`px-4 py-3 border-b ${dm.border}`}>
                      <p className={`text-sm font-medium ${dm.text} truncate`}>
                        {user.displayName || user.email}
                      </p>
                      <p className={`text-xs ${dm.textMuted} truncate`}>
                        {user.email}
                      </p>
                      {/* Only show role badge if user is authenticated and has a role (not 'user' role) */}
                      {user.role && user.role !== 'user' && (
                        <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                          user.role === 'super_admin'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                            : user.role === 'admin'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        }`}>
                          {user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : 'Mentor'}
                        </span>
                      )}
                    </div>

                    {/* Logout */}
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onLogout?.();
                        }}
                        className={`w-full text-left px-4 py-2 text-sm text-red-500 hover:text-red-600 ${dm.hoverBg} transition-colors flex items-center gap-2 cursor-pointer`}
                      >
                        <LogOut size={14} />
                        {t.logout}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

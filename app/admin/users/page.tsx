'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { translations, Language } from '@/utils/i18n';
import { FlaskConical, Users, Shield, ShieldCheck, User, ChevronDown } from 'lucide-react';
import TopNav from '@/app/components/TopNav';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/utils/mockAuth';

// Mock users data for development
const MOCK_USER_LIST = [
  {
    id: 'mock-user-1',
    email: 'mentor1@example.com',
    displayName: 'Kim Mentor',
    role: 'mentor' as UserRole,
    isApproved: true,
    createdAt: '2024-01-15',
  },
  {
    id: 'mock-user-2',
    email: 'mentor2@example.com',
    displayName: 'Lee Mentor',
    role: 'mentor' as UserRole,
    isApproved: false,
    createdAt: '2024-02-20',
  },
  {
    id: 'mock-user-3',
    email: 'admin@example.com',
    displayName: 'Park Admin',
    role: 'admin' as UserRole,
    isApproved: true,
    createdAt: '2024-01-01',
  },
  {
    id: 'mock-super-admin',
    email: 'superadmin@example.com',
    displayName: 'Super Admin',
    role: 'super_admin' as UserRole,
    isApproved: true,
    createdAt: '2023-12-01',
  },
];

type MockUserData = typeof MOCK_USER_LIST[number];

export default function UserManagementPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated, isSuperAdmin, isMockAuth, logout } = useAuth();

  const [users, setUsers] = useState<MockUserData[]>(MOCK_USER_LIST);
  const [lang, setLang] = useState<Language>('ko');
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? saved === 'true' : true;
  });
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const toggleDarkMode = () => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    localStorage.setItem('darkMode', String(newValue));
  };

  const t = translations[lang];

  // Dark mode classes
  const dm = {
    bg: darkMode ? 'bg-gray-900' : 'bg-gray-50',
    bgCard: darkMode ? 'bg-gray-800' : 'bg-white',
    text: darkMode ? 'text-gray-100' : 'text-gray-900',
    textMuted: darkMode ? 'text-gray-400' : 'text-gray-600',
    textSubtle: darkMode ? 'text-gray-500' : 'text-gray-500',
    border: darkMode ? 'border-gray-700' : 'border-gray-200',
    divider: darkMode ? 'divide-gray-700' : 'divide-gray-200',
    rowHover: darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-sky-50',
  };

  // Redirect if not authenticated or not super admin
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isSuperAdmin)) {
      router.push('/admin');
    }
  }, [authLoading, isAuthenticated, isSuperAdmin, router]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    setUsers(prev =>
      prev.map(u => u.id === userId ? { ...u, role: newRole } : u)
    );
    setOpenDropdownId(null);
  };

  const getRoleBadge = (role: UserRole) => {
    const baseClasses = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium';
    switch (role) {
      case 'super_admin':
        return (
          <span className={`${baseClasses} ${darkMode ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>
            <ShieldCheck size={12} />
            {t.roleSuperAdmin}
          </span>
        );
      case 'admin':
        return (
          <span className={`${baseClasses} ${darkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
            <Shield size={12} />
            {t.roleAdmin}
          </span>
        );
      case 'mentor':
        return (
          <span className={`${baseClasses} ${darkMode ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-700'}`}>
            <User size={12} />
            {t.roleMentor}
          </span>
        );
    }
  };

  // Show loading while checking auth
  if (authLoading || !isAuthenticated || !isSuperAdmin) {
    return (
      <div className={`min-h-screen ${dm.bg} flex items-center justify-center`}>
        <p className={dm.textMuted}>{t.loading}</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${dm.bg} transition-colors duration-300`}>
      {/* TopNav */}
      <TopNav
        variant="admin"
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

      {/* Dev Mode Banner */}
      {isMockAuth && (
        <div className="bg-amber-500 text-amber-950 text-center py-2 px-4 text-sm font-medium flex items-center justify-center gap-2">
          <FlaskConical size={16} />
          {t.devModeBanner}
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Users size={24} className={dm.text} />
          <h1 className={`text-2xl font-bold ${dm.text}`}>
            {t.userManagement}
          </h1>
        </div>

        {/* User List Card */}
        <div className={`${dm.bgCard} border ${dm.border} rounded-xl overflow-hidden`}>
          <div className={`px-5 py-4 border-b ${dm.border}`}>
            <h2 className={`text-lg font-semibold ${dm.text}`}>
              {t.allUsers}
            </h2>
            <p className={`text-sm ${dm.textMuted} mt-1`}>
              {users.length} users
            </p>
          </div>

          <ul className={`divide-y ${dm.divider}`}>
            {users.map((u) => {
              const isCurrentUser = u.id === user?.id;
              const isSuperAdminUser = u.role === 'super_admin';
              const canModify = !isCurrentUser && !isSuperAdminUser;

              return (
                <li key={u.id} className={`${dm.rowHover} transition-colors`}>
                  <div className="px-5 py-4 flex items-center justify-between gap-4">
                    {/* User Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${dm.text}`}>
                          {u.displayName}
                        </span>
                        {getRoleBadge(u.role)}
                        {isCurrentUser && (
                          <span className={`text-xs ${dm.textSubtle}`}>(you)</span>
                        )}
                      </div>
                      <div className={`text-sm ${dm.textMuted} truncate`}>
                        {u.email}
                      </div>
                    </div>

                    {/* Role Dropdown */}
                    <div className="relative">
                      {canModify ? (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownId(openDropdownId === u.id ? null : u.id);
                            }}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                              darkMode
                                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                          >
                            {t.changeRole}
                            <ChevronDown size={14} />
                          </button>

                          {openDropdownId === u.id && (
                            <div
                              className={`absolute right-0 mt-1 w-40 rounded-lg shadow-lg ${dm.bgCard} border ${dm.border} z-10`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="py-1">
                                <button
                                  onClick={() => handleRoleChange(u.id, 'mentor')}
                                  className={`w-full text-left px-4 py-2 text-sm ${dm.text} ${dm.rowHover} flex items-center gap-2`}
                                >
                                  <User size={14} className="text-green-500" />
                                  {t.roleMentor}
                                </button>
                                <button
                                  onClick={() => handleRoleChange(u.id, 'admin')}
                                  className={`w-full text-left px-4 py-2 text-sm ${dm.text} ${dm.rowHover} flex items-center gap-2`}
                                >
                                  <Shield size={14} className="text-blue-500" />
                                  {t.roleAdmin}
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <span className={`text-sm ${dm.textSubtle} italic`}>
                          {t.cannotModify}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </main>
    </div>
  );
}

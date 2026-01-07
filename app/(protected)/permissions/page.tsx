'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { translations, Language } from '@/utils/i18n';
import { Users, Shield, ShieldCheck, User, ChevronDown, AlertTriangle } from 'lucide-react';
import TopNav from '@/app/components/TopNav';
import { useAuth, UserRole } from '@/hooks/useAuth';
import { supabase } from '@/utils/supabase';

interface ProfileUser {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
  created_at: string;
  mentor_id: string | null;
}

export default function UserManagementPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated, isAdmin, logout } = useAuth();

  const [users, setUsers] = useState<ProfileUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<Language>('ko');
  // Dark mode default: true. Read from localStorage if available.
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? saved === 'true' : true;
  });
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownDirection, setDropdownDirection] = useState<'up' | 'down'>('down');
  const dropdownButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

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

  // Fetch users from profiles table
  useEffect(() => {
    const fetchUsers = async () => {
      if (!isAdmin) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
      } else {
        setUsers(data || []);
      }
      setLoading(false);
    };

    if (!authLoading && isAdmin) {
      fetchUsers();
    }
  }, [authLoading, isAdmin]);

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      router.push('/admin');
    }
  }, [authLoading, isAuthenticated, isAdmin, router]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Don't close if clicking inside a role dropdown
      if (target.closest('[data-role-dropdown]')) {
        return;
      }
      setOpenDropdownId(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    // Find current user to check if role is changing
    const currentUser = users.find(u => u.id === userId);
    if (currentUser?.role === newRole) {
      setOpenDropdownId(null);
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      console.error('Error updating role:', error);
      // Parse error message for better user feedback
      let errorMessage = t.roleUpdateFailed;
      
      if (error.message.includes('Only admins can change')) {
        errorMessage = t.onlyAdminCanChangeRoles;
      }
      
      alert(errorMessage);
    } else {
      // Optimistically update UI
      setUsers(prev =>
        prev.map(u => u.id === userId ? { ...u, role: newRole } : u)
      );
    }
    setOpenDropdownId(null);
  };

  const handleApproveToMentor = async (userId: string, targetUser: ProfileUser) => {
    // Admin can only approve users to become mentors (change role from 'user' to 'mentor')
    if (targetUser.role === 'mentor') {
      // Already a mentor, nothing to do
      return;
    }

    if (targetUser.role !== 'user') {
      alert(t.onlyUserCanBeMentor);
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ role: 'mentor' })
      .eq('id', userId);

    if (error) {
      console.error('Error approving to mentor:', error);
      alert(t.mentorApprovalFailed);
    } else {
      setUsers(prev =>
        prev.map(u => u.id === userId ? { ...u, role: 'mentor' } : u)
      );
    }
  };

  const handleUnapproveFromMentor = async (userId: string, targetUser: ProfileUser) => {
    // Change role from 'mentor' back to 'user' (unapprove)
    if (targetUser.role !== 'mentor') {
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ role: 'user' })
      .eq('id', userId);

    if (error) {
      console.error('Error unapproving from mentor:', error);
      alert(t.mentorUnapprovalFailed);
    } else {
      setUsers(prev =>
        prev.map(u => u.id === userId ? { ...u, role: 'user' } : u)
      );
    }
  };

  const getRoleBadge = (role: UserRole) => {
    const baseClasses = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium';
    switch (role) {
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
      case 'user':
        return (
          <span className={`${baseClasses} ${darkMode ? 'bg-gray-700/40 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
            <User size={12} />
            {t.roleUser}
          </span>
        );
    }
  };

  // Show loading while checking auth
  if (authLoading || loading || !isAuthenticated || !isAdmin) {
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
              const isAdminUser = u.role === 'admin';
              const isMentorUser = u.role === 'mentor';
              
              // Only admins can change roles, and cannot modify themselves
              const canChangeRole = isAdmin && !isCurrentUser;
              
              const isUserRole = u.role === 'user';
              
              // Admin can approve users to become mentors (user → mentor)
              // Admin can unapprove mentors (mentor → user)
              const canApproveToMentor = !isCurrentUser && isAdmin && isUserRole;
              const canUnapproveFromMentor = !isCurrentUser && isAdmin && isMentorUser;

              return (
                <li key={u.id} className={`${dm.rowHover} transition-colors`}>
                  <div className="px-5 py-4 flex items-center justify-between gap-4">
                    {/* User Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${dm.text}`}>
                          {u.display_name || u.email}
                        </span>
                        {getRoleBadge(u.role)}
                        {isCurrentUser && (
                          <span className={`text-xs ${dm.textSubtle}`}>(you)</span>
                        )}
                      </div>
                      <p className={`text-sm ${dm.textMuted} truncate`}>
                        {u.email}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`text-xs ${dm.textSubtle}`}>
                          {new Date(u.created_at).toLocaleDateString()}
                        </span>
                        {u.mentor_id && (
                          <span className={`text-xs ${darkMode ? 'text-sky-400' : 'text-sky-600'}`}>
                            Linked to mentor
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      {/* Approve to Mentor - Change user → mentor */}
                      {canApproveToMentor && (
                        <button
                          onClick={() => handleApproveToMentor(u.id, u)}
                          className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                            darkMode
                              ? 'bg-green-900/40 text-green-300 hover:bg-green-900/60'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {t.approveAsMentor}
                        </button>
                      )}

                      {/* Unapprove from Mentor - Change mentor → user */}
                      {canUnapproveFromMentor && (
                        <button
                          onClick={() => handleUnapproveFromMentor(u.id, u)}
                          className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                            darkMode
                              ? 'bg-yellow-900/40 text-yellow-300 hover:bg-yellow-900/60'
                              : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          }`}
                        >
                          {t.unapproveFromMentor}
                        </button>
                      )}

                      {/* Role Dropdown - Only admin can change roles, and cannot change themselves */}
                      {canChangeRole && (
                        <div className="relative" data-role-dropdown>
                          <button
                            ref={(el) => {
                              if (el) dropdownButtonRefs.current.set(u.id, el);
                              else dropdownButtonRefs.current.delete(u.id);
                            }}
                            onClick={() => {
                              if (openDropdownId === u.id) {
                                setOpenDropdownId(null);
                              } else {
                                // Calculate if dropdown should open up or down
                                const button = dropdownButtonRefs.current.get(u.id);
                                if (button) {
                                  const rect = button.getBoundingClientRect();
                                  const spaceBelow = window.innerHeight - rect.bottom;
                                  // Dropdown is ~80px tall (2 items × ~40px each)
                                  setDropdownDirection(spaceBelow < 100 ? 'up' : 'down');
                                }
                                setOpenDropdownId(u.id);
                              }
                            }}
                            className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                              darkMode
                                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {t.changeRole}
                            <ChevronDown size={12} className={`transition-transform ${openDropdownId === u.id && dropdownDirection === 'up' ? 'rotate-180' : ''}`} />
                          </button>

                          {openDropdownId === u.id && (
                            <div
                              className={`absolute right-0 w-40 rounded-lg shadow-lg ${dm.bgCard} border ${dm.border} z-10 overflow-hidden ${
                                dropdownDirection === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'
                              }`}
                            >
                              {/* User (no permissions) */}
                              <button
                                type="button"
                                onClick={() => handleRoleChange(u.id, 'user')}
                                className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between cursor-pointer ${
                                  u.role === 'user'
                                    ? darkMode ? 'bg-sky-600/20 text-sky-300' : 'bg-sky-100 text-sky-700'
                                    : `${dm.text} ${dm.rowHover}`
                                }`}
                              >
                                {t.roleUser}
                                {u.role === 'user' && <span className="text-xs">✓</span>}
                              </button>
                              {/* Mentor */}
                              <button
                                type="button"
                                onClick={() => handleRoleChange(u.id, 'mentor')}
                                className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between cursor-pointer ${
                                  u.role === 'mentor'
                                    ? darkMode ? 'bg-sky-600/20 text-sky-300' : 'bg-sky-100 text-sky-700'
                                    : `${dm.text} ${dm.rowHover}`
                                }`}
                              >
                                {t.roleMentor}
                                {u.role === 'mentor' && <span className="text-xs">✓</span>}
                              </button>
                              {/* Admin */}
                              <button
                                type="button"
                                onClick={() => handleRoleChange(u.id, 'admin')}
                                className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between cursor-pointer ${
                                  u.role === 'admin'
                                    ? darkMode ? 'bg-sky-600/20 text-sky-300' : 'bg-sky-100 text-sky-700'
                                    : `${dm.text} ${dm.rowHover}`
                                }`}
                              >
                                {t.roleAdmin}
                                {u.role === 'admin' && <span className="text-xs">✓</span>}
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {!canChangeRole && !canApproveToMentor && !canUnapproveFromMentor && (
                        <span className={`text-xs ${dm.textSubtle}`}>
                          {isCurrentUser 
                            ? t.cannotModifySelf
                            : isAdminUser
                            ? t.cannotModifyAdmin
                            : t.cannotModify
                          }
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

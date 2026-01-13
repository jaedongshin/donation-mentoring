'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { translations, Language } from '@/utils/i18n';
import { Mail, Send, X, Eye, History, Users, AlertTriangle } from 'lucide-react';
import TopNav from '@/app/components/TopNav';
import { useAuth } from '@/hooks/useAuth';
import Select, { MultiValue, StylesConfig } from 'react-select';
import type { EmailLog, EmailRecipient, RecipientFilter } from '@/types/email';

// Reusable styles (DRY)
const getInputClass = (dark: boolean) =>
  `block w-full rounded-lg ${dark ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} border p-2.5 focus:outline-none focus:ring-1 focus:ring-sky-500/40 focus:border-sky-500/40 transition-all text-sm`;

const getLabelClass = (dark: boolean) =>
  `block text-sm font-medium ${dark ? 'text-gray-300' : 'text-gray-700'} mb-1.5`;

// React-select option type
interface RecipientOption {
  value: string;
  label: string;
  email: string;
  isSubscribed: boolean;
}

export default function EmailsPage() {
  const router = useRouter();
  const { isLoading: authLoading, isAuthenticated, isAdmin, user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  // UI State
  const [lang, setLang] = useState<Language>('ko');
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? saved === 'true' : true;
  });
  const [activeTab, setActiveTab] = useState<'compose' | 'history' | 'subscriptions'>('compose');

  // Compose state
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipientFilter, setRecipientFilter] = useState<RecipientFilter>('mentors');
  const [allRecipients, setAllRecipients] = useState<EmailRecipient[]>([]);
  const [customSelected, setCustomSelected] = useState<MultiValue<RecipientOption>>([]);
  const [sending, setSending] = useState(false);

  // History state
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Modal state
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showAllRecipients, setShowAllRecipients] = useState(false);

  const _t = translations[lang]; // Available for future use

  const toggleDarkMode = () => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    localStorage.setItem('darkMode', String(newValue));
  };

  // Dark mode styles object (DRY)
  const dm = {
    bg: darkMode ? 'bg-gray-900' : 'bg-gray-50',
    bgCard: darkMode ? 'bg-gray-800' : 'bg-white',
    text: darkMode ? 'text-gray-100' : 'text-gray-900',
    textMuted: darkMode ? 'text-gray-400' : 'text-gray-600',
    border: darkMode ? 'border-gray-700' : 'border-gray-200',
    divider: darkMode ? 'divide-gray-700' : 'divide-gray-200',
  };

  // React-select dark mode styles
  const selectStyles: StylesConfig<RecipientOption, true> = {
    control: (base) => ({
      ...base,
      backgroundColor: darkMode ? '#1f2937' : '#ffffff',
      borderColor: darkMode ? '#374151' : '#d1d5db',
      '&:hover': { borderColor: darkMode ? '#4b5563' : '#9ca3af' },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: darkMode ? '#1f2937' : '#ffffff',
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused
        ? (darkMode ? '#374151' : '#f3f4f6')
        : (darkMode ? '#1f2937' : '#ffffff'),
      color: darkMode ? '#f3f4f6' : '#111827',
      '&:active': { backgroundColor: darkMode ? '#4b5563' : '#e5e7eb' },
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: darkMode ? '#374151' : '#e5e7eb',
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: darkMode ? '#f3f4f6' : '#111827',
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: darkMode ? '#9ca3af' : '#6b7280',
      '&:hover': {
        backgroundColor: darkMode ? '#4b5563' : '#d1d5db',
        color: darkMode ? '#f3f4f6' : '#111827',
      },
    }),
    input: (base) => ({
      ...base,
      color: darkMode ? '#f3f4f6' : '#111827',
    }),
    placeholder: (base) => ({
      ...base,
      color: darkMode ? '#6b7280' : '#9ca3af',
    }),
  };

  // Auth redirect
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, isAdmin, router]);

  // Fetch ALL recipients once on mount (for counts and custom selection)
  useEffect(() => {
    const fetchAllRecipients = async () => {
      try {
        const res = await fetch('/api/email/recipients?filter=all&includeUnsubscribed=true', {
          credentials: 'omit',
          cache: 'no-store',
        });
        const data = await res.json();
        setAllRecipients(data.recipients || []);
      } catch (_error) {
        console.error('Error fetching recipients:', _error);
      }
    };
    fetchAllRecipients();
  }, []);

  // Fetch email logs
  useEffect(() => {
    if (activeTab === 'history' || activeTab === 'compose') {
      const fetchLogs = async () => {
        setLogsLoading(true);
        try {
          const res = await fetch('/api/email/logs?limit=50', {
            credentials: 'omit',
            cache: 'no-store',
          });
          const data = await res.json();
          setEmailLogs(data.logs || []);
        } catch (error) {
          console.error('Error fetching logs:', error);
        } finally {
          setLogsLoading(false);
        }
      };
      fetchLogs();
    }
  }, [activeTab]);

  // Calculate counts for each filter (memoized)
  const counts = useMemo(() => {
    const subscribed = allRecipients.filter(r => r.email_subscribed);
    return {
      all: subscribed.length,
      admins: subscribed.filter(r => r.role === 'admin').length,
      mentors: subscribed.length, // Mentors = all (admins are subset of mentors)
    };
  }, [allRecipients]);

  // Unsubscribed counts
  const unsubscribedCounts = useMemo(() => {
    const unsubscribed = allRecipients.filter(r => !r.email_subscribed);
    return {
      all: unsubscribed.length,
      admins: unsubscribed.filter(r => r.role === 'admin').length,
      mentors: unsubscribed.length,
    };
  }, [allRecipients]);

  // Get recipients based on current filter
  const filteredRecipients = useMemo(() => {
    if (recipientFilter === 'custom') {
      return customSelected.map(opt =>
        allRecipients.find(r => r.id === opt.value)!
      ).filter(Boolean);
    }
    if (recipientFilter === 'admins') {
      return allRecipients.filter(r => r.role === 'admin');
    }
    // 'all' and 'mentors' return all
    return allRecipients;
  }, [recipientFilter, allRecipients, customSelected]);

  const subscribedRecipients = filteredRecipients.filter(r => r.email_subscribed);
  const unsubscribedRecipients = filteredRecipients.filter(r => !r.email_subscribed);

  // Convert recipients to react-select options
  const recipientOptions: RecipientOption[] = useMemo(() => {
    return allRecipients
      .filter(r => r.email_subscribed) // Only show subscribed in dropdown
      .map(r => ({
        value: r.id,
        label: `${r.name_ko || r.name_en || 'Unknown'} (${r.email})`,
        email: r.email,
        isSubscribed: r.email_subscribed,
      }));
  }, [allRecipients]);

  const handleSend = async (testMode = false) => {
    if (!subject.trim() || !body.trim()) {
      alert('Please fill in subject and message');
      return;
    }

    if (recipientFilter === 'custom' && customSelected.length === 0) {
      alert(lang === 'ko' ? '수신자를 선택해주세요' : 'Please select recipients');
      return;
    }

    setSending(true);
    try {
      const customRecipients = recipientFilter === 'custom'
        ? customSelected.map(opt => opt.email)
        : undefined;

      const res = await fetch('/api/email/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          body,
          recipientFilter,
          customRecipients,
          testMode,
          testEmail: testMode ? user?.email : undefined, // Send to logged-in user
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert(testMode
          ? `${lang === 'ko' ? '테스트 이메일이' : 'Test email sent to'} ${user?.email}${lang === 'ko' ? '로 발송되었습니다!' : '!'}`
          : `Email sent to ${data.recipientCount} recipients!`
        );
        if (!testMode) {
          setSubject('');
          setBody('');
          setShowConfirm(false);
          setShowAllRecipients(false);
        }
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (_error) {
      alert('Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(lang === 'ko' ? 'ko-KR' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (authLoading) {
    return (
      <div className={`min-h-screen ${dm.bg} flex items-center justify-center`}>
        <div className={dm.text}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${dm.bg}`}>
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Mail className={`w-8 h-8 ${dm.text}`} />
          <h1 className={`text-2xl font-bold ${dm.text}`}>
            {lang === 'ko' ? '공지사항' : 'Announcements'}
          </h1>
        </div>

        {/* Tabs */}
        <div className={`flex gap-2 mb-6 border-b ${dm.border} pb-2`}>
          {[
            { id: 'compose', label: lang === 'ko' ? '작성' : 'Compose', icon: Send },
            { id: 'history', label: lang === 'ko' ? '발송 내역' : 'History', icon: History },
            { id: 'subscriptions', label: lang === 'ko' ? '구독 관리' : 'Subscriptions', icon: Users },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? `${dm.bgCard} ${dm.text} border-b-2 border-sky-500`
                  : `${dm.textMuted} hover:${dm.text}`
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Compose Tab */}
        {activeTab === 'compose' && (
          <div className={`${dm.bgCard} border ${dm.border} rounded-xl p-6`}>
              <h2 className={`text-lg font-semibold ${dm.text} mb-4`}>
                {lang === 'ko' ? '새 이메일 작성' : 'Compose New Email'}
              </h2>

              {/* Subject */}
              <div className="mb-4">
                <label className={getLabelClass(darkMode)}>
                  {lang === 'ko' ? '제목' : 'Subject'}
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className={getInputClass(darkMode)}
                  placeholder={lang === 'ko' ? '이메일 제목...' : 'Email subject...'}
                />
              </div>

              {/* Recipients */}
              <div className="mb-4">
                <label className={getLabelClass(darkMode)}>
                  {lang === 'ko' ? '수신자' : 'Recipients'}
                </label>
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  {[
                    { value: 'all', label: lang === 'ko' ? '전체' : 'All', count: counts.all },
                    { value: 'admins', label: lang === 'ko' ? '관리자' : 'Admins', count: counts.admins },
                    { value: 'mentors', label: lang === 'ko' ? '멘토' : 'Mentors', count: counts.mentors },
                    { value: 'custom', label: lang === 'ko' ? '직접 선택' : 'Custom', count: null },
                  ].map(option => (
                    <label key={option.value} className={`flex items-center gap-2 ${dm.text} cursor-pointer`}>
                      <input
                        type="radio"
                        name="recipientFilter"
                        value={option.value}
                        checked={recipientFilter === option.value}
                        onChange={e => setRecipientFilter(e.target.value as RecipientFilter)}
                        className="w-4 h-4"
                      />
                      <span>{option.label}</span>
                      {option.count !== null && (
                        <span className={dm.textMuted}>({option.count})</span>
                      )}
                    </label>
                  ))}
                </div>

                {/* Custom Selection Dropdown */}
                {recipientFilter === 'custom' && (
                  <div className="mt-2">
                    <Select<RecipientOption, true>
                      isMulti
                      options={recipientOptions}
                      value={customSelected}
                      onChange={setCustomSelected}
                      styles={selectStyles}
                      placeholder={lang === 'ko' ? '수신자 검색...' : 'Search recipients...'}
                      noOptionsMessage={() => lang === 'ko' ? '결과 없음' : 'No results'}
                      className="text-sm"
                    />
                    {customSelected.length > 0 && (
                      <p className={`text-sm mt-2 ${dm.textMuted}`}>
                        {customSelected.length} {lang === 'ko' ? '명 선택됨' : 'selected'}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="mb-4">
                <label className={getLabelClass(darkMode)}>
                  {lang === 'ko' ? '내용' : 'Message'}
                </label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  rows={10}
                  className={getInputClass(darkMode)}
                  placeholder={lang === 'ko'
                    ? '이메일 내용을 입력하세요...\n\n영어와 한국어를 함께 작성하세요.'
                    : 'Enter your email message...\n\nWrite in both English and Korean.'
                  }
                />
              </div>

              {/* Actions */}
              <div className="flex justify-between">
                <button
                  onClick={() => setShowPreview(true)}
                  disabled={!subject || !body}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${dm.border} ${dm.text} hover:bg-gray-700/50 disabled:opacity-50 transition-colors`}
                >
                  <Eye className="w-4 h-4" />
                  {lang === 'ko' ? '미리보기' : 'Preview'}
                </button>
                <button
                  onClick={() => setShowConfirm(true)}
                  disabled={!subject || !body || sending || (recipientFilter === 'custom' && customSelected.length === 0)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-500 disabled:opacity-50 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  {lang === 'ko' ? '발송' : 'Send'}
                </button>
              </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className={`${dm.bgCard} border ${dm.border} rounded-xl p-6`}>
            <h2 className={`text-lg font-semibold ${dm.text} mb-4`}>
              {lang === 'ko' ? '발송 내역' : 'Email History'}
            </h2>
            {logsLoading ? (
              <div className={dm.textMuted}>{lang === 'ko' ? '로딩 중...' : 'Loading...'}</div>
            ) : (
              <div className={`space-y-4 divide-y ${dm.divider}`}>
                {emailLogs.map(log => (
                  <div key={log.id} className="pt-4 first:pt-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className={`font-medium ${dm.text}`}>{log.subject}</div>
                        <div className={`text-sm ${dm.textMuted}`}>
                          {formatDate(log.sent_at)}
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        log.status === 'delivered' ? 'bg-green-500/20 text-green-400' :
                        log.status === 'bounced' ? 'bg-red-500/20 text-red-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                    <div className={`text-sm ${dm.textMuted} mt-2`}>
                      {lang === 'ko' ? '수신자' : 'Recipients'}: {log.recipient_count} ·
                      {lang === 'ko' ? ' 오픈' : ' Opens'}: {log.opens} ({log.recipient_count > 0 ? Math.round(log.opens / log.recipient_count * 100) : 0}%) ·
                      {lang === 'ko' ? ' 클릭' : ' Clicks'}: {log.clicks}
                    </div>
                    {log.body_preview && (
                      <div className={`text-sm ${dm.textMuted} mt-1 truncate`}>
                        {log.body_preview}
                      </div>
                    )}
                  </div>
                ))}
                {emailLogs.length === 0 && (
                  <div className={dm.textMuted}>
                    {lang === 'ko' ? '발송 내역이 없습니다' : 'No emails sent yet'}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Subscriptions Tab */}
        {activeTab === 'subscriptions' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Subscribed List */}
            <div className={`${dm.bgCard} border ${dm.border} rounded-xl p-6`}>
              <div className="flex items-center gap-2 mb-4">
                <h2 className={`text-lg font-semibold ${dm.text}`}>
                  {lang === 'ko' ? '구독 중' : 'Subscribed'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-sm font-medium bg-green-500/20 text-green-400">
                  {counts.all}
                </span>
              </div>
              <div className={`space-y-1 max-h-96 overflow-y-auto`}>
                {allRecipients.filter(r => r.email_subscribed).map(r => (
                  <div key={r.id} className={`flex items-center justify-between py-2 px-3 rounded-lg ${dm.bg}`}>
                    <div className="min-w-0">
                      <div className={`${dm.text} text-sm truncate`}>{r.name_ko || r.name_en || r.email}</div>
                      <div className={`text-xs ${dm.textMuted} truncate`}>{r.email}</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${r.role === 'admin' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      {r.role === 'admin' ? 'Admin' : 'Mentor'}
                    </span>
                  </div>
                ))}
                {counts.all === 0 && (
                  <div className={dm.textMuted}>
                    {lang === 'ko' ? '구독자가 없습니다' : 'No subscribers'}
                  </div>
                )}
              </div>
            </div>

            {/* Unsubscribed List */}
            <div className={`${dm.bgCard} border ${dm.border} rounded-xl p-6`}>
              <div className="flex items-center gap-2 mb-4">
                <h2 className={`text-lg font-semibold ${dm.text}`}>
                  {lang === 'ko' ? '수신거부' : 'Unsubscribed'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-sm font-medium bg-amber-500/20 text-amber-400">
                  {unsubscribedCounts.all}
                </span>
              </div>
              <div className={`space-y-1 max-h-96 overflow-y-auto`}>
                {allRecipients.filter(r => !r.email_subscribed).map(r => (
                  <div key={r.id} className={`flex items-center justify-between py-2 px-3 rounded-lg ${dm.bg}`}>
                    <div className="min-w-0">
                      <div className={`${dm.text} text-sm truncate`}>{r.name_ko || r.name_en || r.email}</div>
                      <div className={`text-xs ${dm.textMuted} truncate`}>{r.email}</div>
                      {r.unsubscribed_at && (
                        <div className={`text-xs ${dm.textMuted}`}>
                          {formatDate(r.unsubscribed_at)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {unsubscribedCounts.all === 0 && (
                  <div className={dm.textMuted}>
                    {lang === 'ko' ? '수신거부한 사용자가 없습니다' : 'No unsubscribed users'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className={`${dm.bgCard} border ${dm.border} rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
              <div className="flex justify-between items-center p-4 border-b border-gray-700">
                <h3 className={`font-bold text-lg ${dm.text}`}>
                  {lang === 'ko' ? '이메일 미리보기' : 'Email Preview'}
                </h3>
                <button onClick={() => setShowPreview(false)} className="p-1 hover:bg-gray-700 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <span className={dm.textMuted}>{lang === 'ko' ? '제목:' : 'Subject:'}</span>
                  <p className={`font-medium text-lg ${dm.text}`}>{subject}</p>
                </div>
                <div>
                  <span className={dm.textMuted}>{lang === 'ko' ? '수신자:' : 'Recipients:'}</span>
                  <p className={dm.text}>
                    {recipientFilter === 'custom'
                      ? `${customSelected.length} ${lang === 'ko' ? '명 (직접 선택)' : 'users (custom)'}`
                      : `${subscribedRecipients.length} ${lang === 'ko' ? '명' : 'users'}`
                    }
                  </p>
                </div>
                <div>
                  <span className={dm.textMuted}>{lang === 'ko' ? '내용:' : 'Message:'}</span>
                  <div className={`${dm.bg} p-4 rounded-lg mt-2 whitespace-pre-wrap ${dm.text}`}>
                    {body}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 p-4 border-t border-gray-700">
                <button
                  onClick={() => setShowPreview(false)}
                  className={`px-4 py-2 rounded-lg ${dm.bgCard} ${dm.text}`}
                >
                  {lang === 'ko' ? '닫기' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Send Confirmation Modal */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className={`${dm.bgCard} border ${dm.border} rounded-xl shadow-2xl max-w-md w-full`}>
              <div className="flex justify-between items-center p-4 border-b border-gray-700">
                <h3 className={`font-bold text-lg ${dm.text}`}>
                  {lang === 'ko' ? '발송 확인' : 'Confirm Send'}
                </h3>
                <button onClick={() => { setShowConfirm(false); setShowAllRecipients(false); }} className="p-1 hover:bg-gray-700 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className={dm.text}>
                  <strong>{subject}</strong>
                </p>
                <div>
                  <p className={`${dm.text} mb-2`}>
                    {lang === 'ko' ? '수신자:' : 'Recipients:'}{' '}
                    {recipientFilter === 'custom'
                      ? `${customSelected.length} ${lang === 'ko' ? '명' : 'users'}`
                      : `${subscribedRecipients.length} ${lang === 'ko' ? '명' : 'users'}`
                    }
                  </p>
                  {(() => {
                    const recipients = recipientFilter === 'custom'
                      ? customSelected.map(opt => allRecipients.find(r => r.id === opt.value)!).filter(Boolean)
                      : subscribedRecipients;
                    const displayLimit = 5;
                    const displayRecipients = showAllRecipients ? recipients : recipients.slice(0, displayLimit);
                    const hasMore = recipients.length > displayLimit;

                    return (
                      <div className="space-y-1">
                        <div className={`${showAllRecipients && hasMore ? 'max-h-48 overflow-y-auto' : ''} space-y-1`}>
                          {displayRecipients.map(r => (
                            <div key={r.id} className={`text-sm ${dm.textMuted} flex items-center gap-2`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 flex-shrink-0" />
                              <span className="truncate">
                                {(lang === 'ko' ? r.name_ko : r.name_en) || r.email}
                                {(r.name_ko || r.name_en) && (
                                  <span className="text-gray-500 ml-1">({r.email})</span>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                        {hasMore && !showAllRecipients && (
                          <button
                            onClick={() => setShowAllRecipients(true)}
                            className="text-sm text-sky-400 hover:text-sky-300 mt-2"
                          >
                            {lang === 'ko'
                              ? `+${recipients.length - displayLimit}명 더 보기`
                              : `See all ${recipients.length} recipients`}
                          </button>
                        )}
                        {showAllRecipients && hasMore && (
                          <button
                            onClick={() => setShowAllRecipients(false)}
                            className="text-sm text-sky-400 hover:text-sky-300 mt-2"
                          >
                            {lang === 'ko' ? '접기' : 'Show less'}
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>
                {recipientFilter !== 'custom' && unsubscribedRecipients.length > 0 && (
                  <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-amber-500 text-sm">
                      {unsubscribedRecipients.length} {lang === 'ko' ? '명은 수신거부로 이메일을 받지 않습니다.' : 'users will not receive this email (unsubscribed).'}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 p-4 border-t border-gray-700">
                <button
                  onClick={() => { setShowConfirm(false); setShowAllRecipients(false); }}
                  className={`px-4 py-2 rounded-lg ${dm.bgCard} border ${dm.border} ${dm.text}`}
                >
                  {lang === 'ko' ? '취소' : 'Cancel'}
                </button>
                <button
                  onClick={() => handleSend(false)}
                  disabled={sending}
                  className="px-4 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-500 disabled:opacity-50"
                >
                  {sending
                    ? (lang === 'ko' ? '발송 중...' : 'Sending...')
                    : (lang === 'ko'
                        ? `${recipientFilter === 'custom' ? customSelected.length : subscribedRecipients.length}명에게 발송`
                        : `Send to ${recipientFilter === 'custom' ? customSelected.length : subscribedRecipients.length} users`)
                  }
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

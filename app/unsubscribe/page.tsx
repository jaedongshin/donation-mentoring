'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, CheckCircle, XCircle, Loader2 } from 'lucide-react';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'success' | 'error'>('loading');
  const [mentor, setMentor] = useState<{ name: string; email: string; alreadyUnsubscribed: boolean } | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      return;
    }

    // Verify token
    const verifyToken = async () => {
      try {
        const res = await fetch(`/api/email/unsubscribe?token=${token}`);
        const data = await res.json();

        if (data.valid) {
          setMentor(data.mentor);
          setStatus(data.mentor.alreadyUnsubscribed ? 'success' : 'valid');
        } else {
          setStatus('invalid');
        }
      } catch {
        setStatus('invalid');
      }
    };

    verifyToken();
  }, [token]);

  const handleUnsubscribe = async () => {
    setProcessing(true);
    try {
      const res = await fetch('/api/email/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (data.success) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      {/* Loading */}
      {status === 'loading' && (
        <>
          <Loader2 className="w-12 h-12 text-sky-500 mx-auto mb-4 animate-spin" />
          <h1 className="text-xl font-bold text-gray-100 mb-2">
            Verifying...
          </h1>
          <p className="text-gray-400">
            확인 중입니다...
          </p>
        </>
      )}

      {/* Invalid Token */}
      {status === 'invalid' && (
        <>
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-100 mb-2">
            Invalid or Expired Link
          </h1>
          <p className="text-gray-400 mb-4">
            This unsubscribe link is invalid or has expired.
            <br />
            이 수신거부 링크가 유효하지 않거나 만료되었습니다.
          </p>
          <Link
            href="/"
            className="inline-block px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-500 transition-colors"
          >
            Go to Homepage
          </Link>
        </>
      )}

      {/* Valid - Show Unsubscribe Form */}
      {status === 'valid' && mentor && (
        <>
          <Mail className="w-12 h-12 text-sky-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-100 mb-2">
            Unsubscribe from Emails
          </h1>
          <p className="text-gray-400 mb-6">
            You are unsubscribing: <strong className="text-gray-200">{mentor.email}</strong>
            <br />
            <span className="text-sm">수신거부 대상: {mentor.email}</span>
          </p>
          <button
            onClick={handleUnsubscribe}
            disabled={processing}
            className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-500 disabled:opacity-50 transition-colors"
          >
            {processing ? 'Processing... / 처리 중...' : 'Unsubscribe / 수신거부'}
          </button>
          <p className="text-gray-500 text-xs mt-4">
            You can resubscribe anytime by contacting us.
            <br />
            언제든지 연락하시면 다시 구독하실 수 있습니다.
          </p>
        </>
      )}

      {/* Success */}
      {status === 'success' && (
        <>
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-100 mb-2">
            Successfully Unsubscribed
          </h1>
          <p className="text-gray-400 mb-6">
            You have been unsubscribed from our emails.
            <br />
            이메일 수신이 거부되었습니다.
          </p>
          <Link
            href="/"
            className="inline-block px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-500 transition-colors"
          >
            Go to Homepage / 홈으로
          </Link>
        </>
      )}

      {/* Error */}
      {status === 'error' && (
        <>
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-100 mb-2">
            Something Went Wrong
          </h1>
          <p className="text-gray-400 mb-6">
            We could not process your request. Please try again later.
            <br />
            요청을 처리할 수 없습니다. 나중에 다시 시도해 주세요.
          </p>
          <button
            onClick={() => setStatus('valid')}
            className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-500 transition-colors"
          >
            Try Again / 다시 시도
          </button>
        </>
      )}
    </>
  );
}

function LoadingFallback() {
  return (
    <>
      <Loader2 className="w-12 h-12 text-sky-500 mx-auto mb-4 animate-spin" />
      <h1 className="text-xl font-bold text-gray-100 mb-2">
        Loading...
      </h1>
      <p className="text-gray-400">
        로딩 중...
      </p>
    </>
  );
}

export default function UnsubscribePage() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-xl border border-gray-700 p-8 text-center">
        <Suspense fallback={<LoadingFallback />}>
          <UnsubscribeContent />
        </Suspense>
      </div>
    </div>
  );
}

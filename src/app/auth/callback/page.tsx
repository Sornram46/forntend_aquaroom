"use client";

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function b64urlToJson(b64url: string) {
  try {
    const pad = (s: string) => s + '==='.slice((s.length + 3) % 4);
    const b64 = pad(b64url.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(typeof atob === 'function' ? atob(b64) : Buffer.from(b64, 'base64').toString('utf8'));
  } catch { return null; }
}

function AuthCallbackInner() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    const next = sp.get('next') || '/';
    const t = sp.get('t') || sp.get('token') || '';
    const u = sp.get('u') || sp.get('user') || '';

    try {
      if (t) {
        // make token visible to client flows
        try { localStorage.setItem('auth_token', t); } catch {}
        try { localStorage.setItem('token', t); } catch {}
        try { localStorage.setItem('authToken', t); } catch {}
        try { localStorage.setItem('accessToken', t); } catch {}
        try { localStorage.setItem('ar_token', t); } catch {}
        document.cookie = `ar_token=${encodeURIComponent(t)}; path=/; max-age=${60 * 60 * 24 * 7}`;
      }

      const user = u ? (u.includes('%7B') || u.includes('%22') ? JSON.parse(decodeURIComponent(u)) : b64urlToJson(u)) : null;
      if (user) {
        try { localStorage.setItem('user', JSON.stringify(user)); } catch {}
        try { localStorage.setItem('ar_user', JSON.stringify(user)); } catch {}
        document.cookie = `ar_user=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=${60 * 60 * 24 * 7}`;
      }
    } catch (e) {
      // ignore
    }

    router.replace(next);
  }, [router, sp]);

  return null;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <AuthCallbackInner />
    </Suspense>
  );
}
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function resolveBase() {
  const raw =
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.ADMIN_API_URL ||
    process.env.BACKEND_URL ||
    (process.env.NODE_ENV === 'development'
      ? 'http://localhost:5000'
      : 'https://backend-aquaroom.vercel.app');
  if (!raw) return 'https://backend-aquaroom.vercel.app';
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^(localhost|127\.0\.0\.1)/i.test(raw)) return `http://${raw}`;
  return `https://${raw}`;
}
const BASE = resolveBase();

async function tryFetch(url: string, init?: RequestInit) {
  try {
    const res = await fetch(url, { ...init, cache: 'no-store' });
    const text = await res.text();
    let data: any; try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
    return { ok: res.ok, status: res.status, data };
  } catch (e: any) {
    return { ok: false, status: 502, data: { success: false, error: e?.message || 'fetch error' } };
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🎫 Coupon validation API called');
    const body = await request.json().catch(() => ({}));
    const code = (body?.code ?? '').toString().trim();
    const payload = { code, items: body?.items ?? [], subtotal: body?.subtotal ?? 0, userId: body?.userId ?? null };

    if (!code) {
      return NextResponse.json({ success: false, error: 'missing code' }, { status: 400 });
    }

    // ลองหลาย endpoint ของ backend
    const candidates = [
      { url: `${BASE}/api/coupons/validate`, method: 'POST', body: JSON.stringify(payload) },
      { url: `${BASE}/api/coupon/validate?code=${encodeURIComponent(code)}`, method: 'GET' },
      { url: `${BASE}/api/coupons/check?code=${encodeURIComponent(code)}`, method: 'GET' },
      { url: `${BASE}/api/coupons?code=${encodeURIComponent(code)}`, method: 'GET' },
    ];

    for (const c of candidates) {
      const res = await tryFetch(c.url, {
        method: c.method as any,
        headers: { 'Content-Type': 'application/json' },
        body: c.body,
      });
      if (res.ok) {
        return NextResponse.json(
          { ...res.data, via: 'proxy', backend: c.url },
          { status: 200 }
        );
      }
      // ถ้า 404 ให้ลองตัวถัดไป, ถ้า 400 จาก backend ให้ส่งต่อทันที
      if (res.status === 400) {
        return NextResponse.json(res.data, { status: 400 });
      }
    }

    return NextResponse.json({ success: false, error: 'coupon endpoint not found on backend' }, { status: 502 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'unexpected error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ success: false, message: 'Use POST { code, items?, subtotal? }' }, { status: 405 });
}
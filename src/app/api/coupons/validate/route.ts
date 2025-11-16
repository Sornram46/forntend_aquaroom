import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ตอบ preflight/OPTIONS
export async function OPTIONS() {
  return NextResponse.json({}, { status: 204 });
}

// HEAD (บาง proxy จะยิง) -> ตอบ 200 เปล่าๆ
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}

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
    const subtotal = Number(body?.subtotal ?? body?.order_total ?? body?.orderTotal ?? 0);
    const payload = {
      code,
      items: body?.items ?? [],
      subtotal, // backend expects 'subtotal'
      user_id: body?.user_id ?? body?.userId ?? null,
      email: body?.email ?? null,
      // keep aliases for alternative backends if any
      order_total: subtotal,
      order_amount: subtotal,
    } as any;

    if (!code) {
      return NextResponse.json({ success: false, error: 'missing code' }, { status: 400 });
    }

    // ลองหลาย endpoint ของ backend
    const q = `code=${encodeURIComponent(code)}&order_total=${encodeURIComponent(String(subtotal))}&order_amount=${encodeURIComponent(String(subtotal))}&subtotal=${encodeURIComponent(String(subtotal))}`;
    const candidates = [
      { url: `${BASE}/api/coupons/validate`, method: 'POST', body: JSON.stringify(payload) },
      // Older GET endpoints may require order_total/order_amount/subtotal in query
      { url: `${BASE}/api/coupon/validate?${q}`, method: 'GET' },
      { url: `${BASE}/api/coupons/check?${q}`, method: 'GET' },
      { url: `${BASE}/api/coupons?${q}`, method: 'GET' },
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
        // normalize error shape for frontend
        const err = res.data || {};
        const normalized = {
          success: false,
          error: err.error || err.message || 'invalid_coupon',
          message: err.message || err.error || 'invalid_coupon',
          code: err.code,
          ...err,
        };
        return NextResponse.json(normalized, { status: 400 });
      }
    }

    return NextResponse.json({ success: false, error: 'coupon endpoint not found on backend' }, { status: 502 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'unexpected error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const code = (req.nextUrl.searchParams.get('code') || '').trim();
  const subtotal = Number(
    req.nextUrl.searchParams.get('subtotal') ||
    req.nextUrl.searchParams.get('order_total') ||
    req.nextUrl.searchParams.get('orderTotal') || 0
  );
  const userId = req.nextUrl.searchParams.get('userId');
  if (!code) {
    return NextResponse.json({ success: false, error: 'missing code' }, { status: 400 });
  }
  const payload = { code, items: [], subtotal, userId };

  const q = `code=${encodeURIComponent(code)}&order_total=${encodeURIComponent(String(subtotal))}&order_amount=${encodeURIComponent(String(subtotal))}&subtotal=${encodeURIComponent(String(subtotal))}`;
  const candidates = [
    { url: `${BASE}/api/coupons/validate`, method: 'POST', body: JSON.stringify(payload) },
    { url: `${BASE}/api/coupon/validate?${q}`, method: 'GET' },
    { url: `${BASE}/api/coupons/check?${q}`, method: 'GET' },
    { url: `${BASE}/api/coupons?${q}`, method: 'GET' },
  ];

  for (const c of candidates) {
    const res = await tryFetch(c.url, {
      method: c.method as any,
      headers: { 'Content-Type': 'application/json' },
      body: c.body,
    });
    if (res.ok) return NextResponse.json({ ...res.data, via: 'proxy', backend: c.url }, { status: 200 });
    if (res.status === 400) return NextResponse.json(res.data, { status: 400 });
  }
  return NextResponse.json({ success: false, error: 'coupon endpoint not found on backend' }, { status: 502 });
}
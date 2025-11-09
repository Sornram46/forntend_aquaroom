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

const normalizeBase = (u: string) => u.replace(/\/+$/, '');
const sameHost = (base: string, host: string) => {
  try { return new URL(base).host.toLowerCase() === host.toLowerCase(); } catch { return false; }
};

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const { slug } = params;
  const base = normalizeBase(resolveBase());
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
  if (sameHost(base, host)) {
    return NextResponse.json(
      { success: false, message: 'API base URL misconfigured (points to frontend)' },
      { status: 500 }
    );
  }

  const url = `${base}/api/categories/${encodeURIComponent(slug)}/products`;
  const started = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    console.log(`Proxy -> ${url}`);
    const res = await fetch(url, {
      headers: { accept: 'application/json' },
      cache: 'no-store',
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));
    console.log(`Proxy <- ${res.status} ${Date.now() - started}ms ${url}`);

    const text = await res.text();
    let data: any;
    try { data = text ? JSON.parse(text) : {}; } catch { data = { success: false, raw: text }; }

    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('Proxy error products:', e);
    return NextResponse.json({ success: false, message: 'proxy error' }, { status: 502 });
  }
}
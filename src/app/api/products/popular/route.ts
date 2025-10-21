import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

function resolveBase() {
  const raw =
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.ADMIN_API_URL ||
    process.env.BACKEND_URL ||
    (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : 'https://backend-aquaroom.vercel.app');
  const s = (raw || '').trim();
  const lower = s.toLowerCase();
  if (!s || lower.startsWith('postgres://') || lower.startsWith('postgresql://') || lower.includes(':5432')) {
    return 'https://backend-aquaroom.vercel.app';
  }
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  if (s.startsWith('localhost') || s.startsWith('127.0.0.1')) return `http://${s}`;
  return `https://${s}`;
}
const BASE = resolveBase();

export async function GET() {
  try {
    const rid = (() => { try { // @ts-ignore
      return (globalThis.crypto?.randomUUID?.() as string) || Math.random().toString(36).slice(2); } catch { return Math.random().toString(36).slice(2); } })();
    const started = Date.now();
    const url = `${BASE}/api/products/popular`;
    console.log(`[${rid}] GET /api/products/popular -> ${url}`);
    if (!BASE) throw new Error('BACKEND URL is missing');
    const res = await fetch(url, { cache: 'no-store' });
    console.log(`[${rid}] GET /api/products/popular <- ${res.status} in ${Date.now() - started}ms`);
    return new Response(await res.text(), {
      status: res.status,
      headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
    });
  } catch (e) {
    console.error('Proxy /api/products/popular failed:', e);
    return Response.json({ error: 'Upstream error' }, { status: 502 });
  }
}
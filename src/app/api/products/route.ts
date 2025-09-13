import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const raw =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.ADMIN_API_URL ||
  process.env.BACKEND_URL ||
  '';
const BASE = raw && raw.startsWith('http') ? raw : raw ? `https://${raw}` : '';

export async function GET(req: Request) {
  try {
    if (!BASE) throw new Error('BACKEND URL is missing');
    const search = new URL(req.url).search || '';
    const res = await fetch(`${BASE}/api/products${search}`, { cache: 'no-store' });
    return new Response(await res.text(), {
      status: res.status,
      headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
    });
  } catch (e) {
    console.error('Proxy /api/products failed:', e);
    return Response.json({ error: 'Upstream error' }, { status: 502 });
  }
}
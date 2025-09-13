import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const raw =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.ADMIN_API_URL ||
  process.env.BACKEND_URL ||
  '';
const BASE = raw && raw.startsWith('http') ? raw : raw ? `https://${raw}` : '';

export async function GET(request: NextRequest) {
  try {
    if (!BASE) throw new Error('BACKEND URL is missing');
    const res = await fetch(`${BASE}/api/user/addresses`, {
      headers: { authorization: request.headers.get('authorization') || '' },
      cache: 'no-store',
    });
    return new Response(await res.text(), {
      status: res.status,
      headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
    });
  } catch (error) {
    console.error('Proxy GET /api/user/addresses failed:', error);
    return NextResponse.json({ success: false, message: 'Upstream error' }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!BASE) throw new Error('BACKEND URL is missing');
    const res = await fetch(`${BASE}/api/user/addresses`, {
      method: 'POST',
      headers: {
        authorization: request.headers.get('authorization') || '',
        'content-type': request.headers.get('content-type') || 'application/json',
      },
      body: await request.text(),
    });
    return new Response(await res.text(), {
      status: res.status,
      headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
    });
  } catch (error) {
    console.error('Proxy POST /api/user/addresses failed:', error);
    return NextResponse.json({ success: false, message: 'Upstream error' }, { status: 502 });
  }
}
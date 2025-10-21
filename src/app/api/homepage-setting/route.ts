import { NextRequest, NextResponse } from 'next/server';

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
  // Guard against accidentally passing a Postgres connection string or DB port
  if (!s || lower.startsWith('postgres://') || lower.startsWith('postgresql://') || lower.includes(':5432')) {
    return 'https://backend-aquaroom.vercel.app';
  }
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  if (s.startsWith('localhost') || s.startsWith('127.0.0.1')) return `http://${s}`;
  return `https://${s}`;
}
const BASE = resolveBase();

// GET - ดึงข้อมูลการตั้งค่าหน้าแรก รวม Logo
export async function GET() {
  try {
    if (!BASE) throw new Error('BACKEND URL is missing');
    const res = await fetch(`${BASE}/api/homepage-setting`, { cache: 'no-store' });
    return new Response(await res.text(), {
      status: res.status,
      headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
    });
  } catch (e) {
    console.error('Proxy /api/homepage-setting failed:', e);
    return Response.json({ error: 'Upstream error' }, { status: 502 });
  }
}


// PATCH - อัปเดตเฉพาะ Logo
// Pass-through to backend for PATCH as well (frontend should not touch DB directly)
export async function PATCH(request: NextRequest) {
  try {
    if (!BASE) throw new Error('BACKEND URL is missing');
    const res = await fetch(`${BASE}/api/homepage-setting`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: await request.text(),
    });
    return new Response(await res.text(), {
      status: res.status,
      headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
    });
  } catch (e) {
    console.error('Proxy PATCH /api/homepage-setting failed:', e);
    return Response.json({ error: 'Upstream error' }, { status: 502 });
  }
}

// POST - บันทึกหรืออัปเดตการตั้งค่าหน้าแรก รวม Logo  
// Pass-through to backend for POST as well
export async function POST(request: NextRequest) {
  try {
    if (!BASE) throw new Error('BACKEND URL is missing');
    const res = await fetch(`${BASE}/api/homepage-setting`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: await request.text(),
    });
    return new Response(await res.text(), {
      status: res.status,
      headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
    });
  } catch (e) {
    console.error('Proxy POST /api/homepage-setting failed:', e);
    return Response.json({ error: 'Upstream error' }, { status: 502 });
  }
}

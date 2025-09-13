import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const raw =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.ADMIN_API_URL ||
  process.env.BACKEND_URL ||
  '';
const BASE = raw && raw.startsWith('http') ? raw : raw ? `https://${raw}` : '';

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

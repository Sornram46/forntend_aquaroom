import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

const raw =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.ADMIN_API_URL ||
  process.env.BACKEND_URL ||
  '';
const BASE = raw && raw.startsWith('http') ? raw : raw ? `https://${raw}` : '';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    if (!BASE) throw new Error('BACKEND URL is missing');
    const { id } = context.params;
    const res = await fetch(`${BASE}/api/products/${encodeURIComponent(id)}`, { cache: 'no-store' });
    return new Response(await res.text(), {
      status: res.status,
      headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
    });
  } catch (e) {
    console.error('Proxy GET /api/products/[id] failed:', e);
    return Response.json({ error: 'Upstream error' }, { status: 502 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    if (!BASE) throw new Error('BACKEND URL is missing');
    const { id } = context.params;
    const res = await fetch(`${BASE}/api/products/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: {
        'content-type': request.headers.get('content-type') || 'application/json',
        authorization: request.headers.get('authorization') || '',
      },
      body: await request.text(),
    });
    return new Response(await res.text(), {
      status: res.status,
      headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
    });
  } catch (e) {
    console.error('Proxy PUT /api/products/[id] failed:', e);
    return Response.json({ error: 'Upstream error' }, { status: 502 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    if (!BASE) throw new Error('BACKEND URL is missing');
    const { id } = context.params;
    const res = await fetch(`${BASE}/api/products/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { authorization: request.headers.get('authorization') || '' },
    });
    return new Response(await res.text(), {
      status: res.status,
      headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
    });
  } catch (e) {
    console.error('Proxy DELETE /api/products/[id] failed:', e);
    return Response.json({ error: 'Upstream error' }, { status: 502 });
  }
}
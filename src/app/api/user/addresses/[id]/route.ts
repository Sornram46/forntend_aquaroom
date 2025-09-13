import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const raw =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.ADMIN_API_URL ||
  process.env.BACKEND_URL ||
  '';
const BASE = raw && raw.startsWith('http') ? raw : raw ? `https://${raw}` : '';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    if (!BASE) throw new Error('BACKEND URL is missing');
    const res = await fetch(`${BASE}/api/user/addresses/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: {
        authorization: (request as any).headers?.get('authorization') || '',
        'content-type': (request as any).headers?.get('content-type') || 'application/json',
      },
      body: await (request as any).text(),
    });
    return new Response(await res.text(), {
      status: res.status,
      headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
    });
  } catch (error) {
    console.error('Proxy PUT /api/user/addresses/[id] failed:', error);
    return NextResponse.json({ success: false, message: 'Upstream error' }, { status: 502 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    if (!BASE) throw new Error('BACKEND URL is missing');
    const res = await fetch(`${BASE}/api/user/addresses/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { authorization: request.headers.get('authorization') || '' },
    });
    return new Response(await res.text(), {
      status: res.status,
      headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
    });
  } catch (error) {
    console.error('Proxy DELETE /api/user/addresses/[id] failed:', error);
    return NextResponse.json({ success: false, message: 'Upstream error' }, { status: 502 });
  }
}
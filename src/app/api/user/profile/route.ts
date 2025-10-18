import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const raw =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.ADMIN_API_URL ||
  process.env.BACKEND_URL ||
  '';
const BASE = raw && raw.startsWith('http') ? raw : raw ? `https://${raw}` : '';

// Proxy: ดึงข้อมูลผู้ใช้จาก Backend
export async function GET(request: NextRequest) {
  try {
    if (!BASE) throw new Error('BACKEND URL is missing');
    const res = await fetch(`${BASE}/api/user/profile`, {
      headers: { authorization: request.headers.get('authorization') || '' },
      cache: 'no-store',
    });

    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      return new Response(await res.text(), {
        status: res.status,
        headers: { 'content-type': ct || 'application/json' },
      });
    }

    const upstream = await res.json().catch(() => ({} as any));

    const user = upstream.user ?? upstream.data?.user ?? upstream.profile ?? null;
    const s = upstream.stats ?? upstream.data?.stats ?? null;

    const stats = {
      totalOrders: Number(s?.totalOrders ?? upstream.ordersCount ?? upstream.total_orders ?? 0),
      pendingOrders: Number(s?.pendingOrders ?? upstream.pendingOrders ?? upstream.pending_orders ?? 0),
      completedOrders: Number(s?.completedOrders ?? upstream.completedOrders ?? upstream.completed_orders ?? 0),
      totalSpent: Number(s?.totalSpent ?? upstream.totalSpent ?? upstream.total_spent ?? 0),
    };

    const normalized = {
      success: upstream.success ?? true,
      user,
      stats,
    };

    return NextResponse.json(normalized, { status: res.status });
  } catch (error) {
    console.error('Proxy GET /api/user/profile failed:', error);
    return NextResponse.json({ success: false, message: 'Upstream error' }, { status: 502 });
  }
}

// Proxy: อัปเดตข้อมูลผู้ใช้ไปที่ Backend (รองรับ form-data)
export async function PUT(request: NextRequest) {
  try {
    if (!BASE) throw new Error('BACKEND URL is missing');
    const contentType = request.headers.get('content-type') || '';
    const res = await fetch(`${BASE}/api/user/profile`, {
      method: 'PUT',
      headers: { authorization: request.headers.get('authorization') || '', 'content-type': contentType },
      body: await request.arrayBuffer(),
    });
    return new Response(await res.text(), {
      status: res.status,
      headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
    });
  } catch (error) {
    console.error('Proxy PUT /api/user/profile failed:', error);
    return NextResponse.json({ success: false, message: 'Upstream error' }, { status: 502 });
  }
}
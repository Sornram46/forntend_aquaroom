import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/db';

// Back-compat shim: delegate to backend /api/auth/refresh to avoid DB in frontend
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'ไม่พบ token' }, { status: 401 });
    }
    const url = `${API_BASE_URL.replace(/\/$/, '')}/api/auth/refresh`;
    const res = await fetch(url, { method: 'POST', headers: { Authorization: authHeader } });
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
    });
  } catch (error) {
    console.error('Proxy /api/refresh error:', error);
    return NextResponse.json({ success: false, message: 'เกิดข้อผิดพลาดในการรีเฟรช token' }, { status: 500 });
  }
}
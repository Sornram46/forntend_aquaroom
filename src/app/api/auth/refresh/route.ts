import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_BASE_URL } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'ไม่พบ token' }, { status: 401 });
    }

    const backendUrl = `${API_BASE_URL.replace(/\/$/, '')}/api/auth/refresh`;
    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: { Authorization: authHeader },
    });

    const data = await backendResponse
      .json()
      .catch(() => ({ success: false, message: 'ไม่สามารถอ่านข้อมูลจากเซิร์ฟเวอร์ได้' }));

    if (!backendResponse.ok || data?.success === false) {
      return NextResponse.json(
        {
          success: false,
          message: data?.message || 'รีเฟรช token ไม่สำเร็จ',
        },
        { status: backendResponse.status || 401 }
      );
    }

    const token = data.token || data.accessToken;
    const user = data.user || data.data?.user;

    if (token && user) {
      const cookieJar = await cookies();
      await cookieJar.set({
        name: 'auth_token',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });
      await cookieJar.set({
        name: 'ar_session',
        value: token,
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });
      await cookieJar.set({
        name: 'ar_user',
        value: encodeURIComponent(
          JSON.stringify({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar ?? null,
          })
        ),
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });
    }

    return NextResponse.json(data, { status: backendResponse.status || 200 });
  } catch (error) {
    console.error('/api/auth/refresh proxy error:', error);
    return NextResponse.json({ success: false, message: 'เกิดข้อผิดพลาดในการรีเฟรช token' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}

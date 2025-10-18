import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_BASE_URL } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => null);

    const email = payload?.email?.trim();
    const password = payload?.password;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกอีเมลและรหัสผ่าน' },
        { status: 400 }
      );
    }

    const backendUrl = `${API_BASE_URL.replace(/\/$/, '')}/api/auth/login`;
    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await backendResponse
      .json()
      .catch(() => ({ success: false, message: 'ไม่สามารถอ่านข้อมูลจากเซิร์ฟเวอร์ได้' }));

    if (!backendResponse.ok || data?.success === false) {
      return NextResponse.json(
        {
          success: false,
          message: data?.message || 'ไม่สามารถเข้าสู่ระบบได้',
        },
        { status: backendResponse.status || 502 }
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

    return NextResponse.json(
      {
        success: true,
        message: data?.message || 'เข้าสู่ระบบสำเร็จ',
        user: user || null,
        token: token || null,
      },
      { status: backendResponse.status || 200 }
    );
  } catch (error) {
    console.error('Login proxy error:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' },
      { status: 500 }
    );
  }
}
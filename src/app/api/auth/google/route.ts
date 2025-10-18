import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { jwtDecode } from 'jwt-decode';
import { API_BASE_URL } from '@/lib/db';
import { cookies } from 'next/headers';

// Support GET to start OAuth redirect flow (client calls /api/auth/google?next=...)
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const next = url.searchParams.get('next') || '/';
    // Allow overriding the OAuth base specifically for Google to support local dev backends
    const rawBase =
      process.env.GOOGLE_OAUTH_BASE_URL ||
      process.env.NEXT_PUBLIC_GOOGLE_OAUTH_BASE_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      process.env.BACKEND_URL ||
      '';

    const base =
      rawBase.startsWith('http://') || rawBase.startsWith('https://')
        ? rawBase
        : rawBase
        ? `https://${rawBase}`
        : '';

    const target = base ? `${base.replace(/\/$/, '')}/api/auth/google` : '';

    if (!target) {
      return Response.json(
        { success: false, message: 'No OAuth base URL configured' },
        { status: 500 }
      );
    }

    const res = await fetch(`${target}?next=${encodeURIComponent(next)}`, { method: 'HEAD' });
    if (res.ok || res.status === 302) {
      return Response.redirect(`${target}?next=${encodeURIComponent(next)}`, 302);
    }

    return Response.json(
      { success: false, message: 'Backend OAuth endpoint not found', target: `${target}?next=${encodeURIComponent(next)}` },
      { status: 502 }
    );
  } catch (e) {
    console.error('GET /api/auth/google error', e);
    return NextResponse.json({ success: false, message: 'Failed to start OAuth flow' }, { status: 500 });
  }
}

interface GoogleUserData {
  sub: string;
  name: string;
  email: string;
  picture: string;
  email_verified: boolean;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const credential = body?.credential;
    const nextParam = body?.next;
    
    if (!credential) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบข้อมูลการยืนยันตัวตน' },
        { status: 400 }
      );
    }
    
    // ถอดรหัส token จาก Google
    const decodedUser = jwtDecode<GoogleUserData>(credential);
    
    // ตรวจสอบว่า Google ได้ยืนยันอีเมลแล้วหรือไม่
    if (!decodedUser.email_verified) {
      return NextResponse.json(
        { success: false, message: 'อีเมลยังไม่ได้รับการยืนยัน' },
        { status: 400 }
      );
    }
    
    // ตรวจสอบว่าผู้ใช้นี้มีอยู่แล้วหรือไม่
    const backendUrl = `${API_BASE_URL.replace(/\/$/, '')}/api/auth/google`;

    const payload = {
      credential,
      id_token: credential,
      token: credential,
      provider: 'google',
      next: nextParam || '/cart',
    };

    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const backendData = await backendResponse
      .json()
      .catch(() => ({ success: false, message: 'ไม่สามารถอ่านข้อมูลจากเซิร์ฟเวอร์ได้' }));

    if (!backendResponse.ok || backendData.success === false) {
      console.error('Backend Google auth error', backendResponse.status, backendData);
      const message =
        backendData?.message || 'เซิร์ฟเวอร์ไม่สามารถตรวจสอบสิทธิ์ด้วย Google ได้';
      return NextResponse.json(
        { success: false, message },
        { status: backendResponse.status || 502 }
      );
    }

    const token = backendData.token || backendData.accessToken;
    const user =
      backendData.user || backendData.data?.user || {
        id: decodedUser.sub,
        name: decodedUser.name,
        email: decodedUser.email,
        role: 'customer',
        avatar: decodedUser.picture,
      };

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบ token จากเซิร์ฟเวอร์' },
        { status: 502 }
      );
    }

    // ตั้งค่า HTTP-only cookie สำหรับ token
    await (await cookies()).set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 วัน
      path: '/',
    });
    // ตั้งค่า cookie สำหรับ client-side (non-httpOnly) เพื่อให้ AuthContext บูทได้
    await (await cookies()).set({
      name: 'ar_session',
      value: token,
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    await (await cookies()).set({
      name: 'ar_user',
      value: encodeURIComponent(
        JSON.stringify({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        })
      ),
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return NextResponse.json(
      {
        success: true,
        message: backendData.message || 'เข้าสู่ระบบด้วย Google สำเร็จ',
        user,
        token,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Google auth error:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google' },
      { status: 500 }
    );
  }
}
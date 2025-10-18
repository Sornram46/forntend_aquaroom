import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบ token' },
        { status: 401 }
      );
    }

    const backendUrl = `${API_BASE_URL.replace(/\/$/, '')}/api/auth/verify`;
    const backendResponse = await fetch(backendUrl, {
      method: 'GET',
      headers: { Authorization: authHeader },
    });

    const data = await backendResponse
      .json()
      .catch(() => ({ success: false, message: 'ไม่สามารถอ่านข้อมูลจากเซิร์ฟเวอร์ได้' }));

    if (!backendResponse.ok || data?.success === false) {
      return NextResponse.json(
        {
          success: false,
          message: data?.message || 'Token ไม่ถูกต้องหรือหมดอายุ',
        },
        { status: backendResponse.status || 401 }
      );
    }

    return NextResponse.json(data, { status: backendResponse.status || 200 });
  } catch (error) {
    console.error('Verify proxy error:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการตรวจสอบ token' },
      { status: 500 }
    );
  }
}
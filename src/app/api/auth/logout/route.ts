import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json(
    { success: true, message: 'ออกจากระบบสำเร็จ' },
    { status: 200 }
  );
  // ลบ cookie บน response
  res.cookies.delete('auth_token'); // หรือ: res.cookies.set('auth_token', '', { path: '/', maxAge: 0 })
  return res;
}
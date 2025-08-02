import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    // ลบ cookie ที่เกี่ยวข้องกับการยืนยันตัวตน
     cookies().delete('auth_token');
    
    return NextResponse.json(
      { success: true, message: 'ออกจากระบบสำเร็จ' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการออกจากระบบ' },
      { status: 500 }
    );
  }
}
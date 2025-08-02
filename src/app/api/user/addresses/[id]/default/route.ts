import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    const id = params.id;
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบ token การยืนยันตัวตน' },
        { status: 401 }
      );
    }
    
    // ตรวจสอบ token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as {
      userId: string;
    };
    
    // ตรวจสอบว่าที่อยู่นี้เป็นของผู้ใช้ที่ร้องขอหรือไม่
    const checkOwnerQuery = 'SELECT * FROM user_addresses WHERE id = $1 AND user_id = $2';
    const checkResult = await query(checkOwnerQuery, [id, decoded.userId]);
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบที่อยู่หรือไม่มีสิทธิ์แก้ไข' },
        { status: 404 }
      );
    }
    
    // ล้างค่าเริ่มต้นเดิมทั้งหมดก่อน
    await query(
      'UPDATE user_addresses SET is_default = FALSE WHERE user_id = $1',
      [decoded.userId]
    );
    
    // ตั้งค่าที่อยู่นี้เป็นค่าเริ่มต้น
    await query(
      'UPDATE user_addresses SET is_default = TRUE WHERE id = $1 AND user_id = $2',
      [id, decoded.userId]
    );
    
    return NextResponse.json({
      success: true,
      message: 'ตั้งค่าที่อยู่เริ่มต้นสำเร็จ'
    });
  } catch (error) {
    console.error('Error setting default address:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    );
  }
}
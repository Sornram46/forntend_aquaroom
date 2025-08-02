import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    
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
    
    // ตรวจสอบว่ามีที่อยู่ในระบบหรือไม่
    const addressCountQuery = 'SELECT COUNT(*) as count FROM user_addresses WHERE user_id = $1';
    const result = await query(addressCountQuery, [decoded.userId]);
    
    const addressCount = parseInt(result.rows[0].count);
    const hasAddress = addressCount > 0;
    
    // ตรวจสอบว่ามีที่อยู่เริ่มต้นหรือไม่
    let hasDefaultAddress = false;
    if (hasAddress) {
      const defaultAddressQuery = 'SELECT COUNT(*) as count FROM user_addresses WHERE user_id = $1 AND is_default = TRUE';
      const defaultResult = await query(defaultAddressQuery, [decoded.userId]);
      hasDefaultAddress = parseInt(defaultResult.rows[0].count) > 0;
    }
    
    return NextResponse.json({
      success: true,
      hasAddress,
      hasDefaultAddress,
      addressCount
    });
  } catch (error) {
    console.error('Error checking addresses:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการตรวจสอบที่อยู่' },
      { status: 500 }
    );
  }
}
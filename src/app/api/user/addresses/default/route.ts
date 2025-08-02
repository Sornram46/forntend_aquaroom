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
    
    // ดึงข้อมูลที่อยู่เริ่มต้น
    const defaultAddressQuery = `
      SELECT * FROM user_addresses 
      WHERE user_id = $1 AND is_default = TRUE
      LIMIT 1
    `;
    
    const result = await query(defaultAddressQuery, [decoded.userId]);
    
    // ถ้าไม่มีที่อยู่เริ่มต้น ให้ดึงที่อยู่แรก
    if (result.rows.length === 0) {
      const firstAddressQuery = `
        SELECT * FROM user_addresses 
        WHERE user_id = $1
        ORDER BY id ASC
        LIMIT 1
      `;
      
      const firstResult = await query(firstAddressQuery, [decoded.userId]);
      
      return NextResponse.json({
        success: true,
        address: firstResult.rows.length > 0 ? firstResult.rows[0] : null
      });
    }
    
    return NextResponse.json({
      success: true,
      address: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching default address:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลที่อยู่' },
      { status: 500 }
    );
  }
}
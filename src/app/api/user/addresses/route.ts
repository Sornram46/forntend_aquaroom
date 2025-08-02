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
    
    // ดึงข้อมูลที่อยู่ของผู้ใช้
    const addressesQuery = `
      SELECT * FROM user_addresses 
      WHERE user_id = $1
      ORDER BY is_default DESC, id ASC
    `;
    
    const result = await query(addressesQuery, [decoded.userId]);
    
    return NextResponse.json({
      success: true,
      addresses: result.rows
    });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    
    const data = await request.json();
    const { name, phone, address_line1, address_line2, district, city, province, postal_code, is_default } = data;
    
    // ถ้าตั้งเป็นที่อยู่เริ่มต้น ต้องยกเลิกที่อยู่เริ่มต้นเดิมก่อน
    if (is_default) {
      await query(
        'UPDATE user_addresses SET is_default = FALSE WHERE user_id = $1',
        [decoded.userId]
      );
    }
    
    // เพิ่มที่อยู่ใหม่
    const insertQuery = `
      INSERT INTO user_addresses (
        user_id, name, phone, address_line1, address_line2, district, city, province, postal_code, is_default
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const result = await query(insertQuery, [
      decoded.userId, name, phone, address_line1, address_line2 || null, district, city, province, postal_code, is_default
    ]);
    
    return NextResponse.json({
      success: true,
      address: result.rows[0]
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating address:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    );
  }
}
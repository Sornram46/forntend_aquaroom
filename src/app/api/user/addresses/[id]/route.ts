import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';

// อัพเดทที่อยู่
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
    
    const data = await request.json();
    const { name, phone, address_line1, address_line2, district, city, province, postal_code, is_default } = data;
    
    // ตรวจสอบว่าที่อยู่นี้เป็นของผู้ใช้ที่ร้องขอหรือไม่
    const checkOwnerQuery = 'SELECT * FROM user_addresses WHERE id = $1 AND user_id = $2';
    const checkResult = await query(checkOwnerQuery, [id, decoded.userId]);
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบที่อยู่หรือไม่มีสิทธิ์แก้ไข' },
        { status: 404 }
      );
    }
    
    // ถ้าตั้งเป็นที่อยู่เริ่มต้น ต้องยกเลิกที่อยู่เริ่มต้นเดิมก่อน
    if (is_default) {
      await query(
        'UPDATE user_addresses SET is_default = FALSE WHERE user_id = $1',
        [decoded.userId]
      );
    }
    
    // อัพเดทข้อมูลที่อยู่
    const updateQuery = `
      UPDATE user_addresses
      SET name = $1, phone = $2, address_line1 = $3, address_line2 = $4, 
          district = $5, city = $6, province = $7, postal_code = $8, is_default = $9, 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $10 AND user_id = $11
      RETURNING *
    `;
    
    const result = await query(updateQuery, [
      name, phone, address_line1, address_line2 || null, district, city, province, postal_code, is_default,
      id, decoded.userId
    ]);
    
    return NextResponse.json({
      success: true,
      address: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating address:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    );
  }
}

// ลบที่อยู่
export async function DELETE(
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
        { success: false, message: 'ไม่พบที่อยู่หรือไม่มีสิทธิ์ลบ' },
        { status: 404 }
      );
    }
    
    // ลบที่อยู่
    await query('DELETE FROM user_addresses WHERE id = $1 AND user_id = $2', [id, decoded.userId]);
    
    return NextResponse.json({
      success: true,
      message: 'ลบที่อยู่สำเร็จ'
    });
  } catch (error) {
    console.error('Error deleting address:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    );
  }
}
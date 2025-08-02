import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get('orderNumber');
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบ token การยืนยันตัวตน' },
        { status: 401 }
      );
    }
    
    if (!orderNumber) {
      return NextResponse.json(
        { success: false, message: 'กรุณาระบุหมายเลขคำสั่งซื้อ' },
        { status: 400 }
      );
    }
    
    // ตรวจสอบ token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as {
      userId: string;
    };
    
    // ตรวจสอบว่ามีคำสั่งซื้อนี้อยู่ในระบบหรือไม่ (เฉพาะของผู้ใช้นี้)
    const checkOrderQuery = `
      SELECT COUNT(*) as count
      FROM orders
      WHERE order_number = $1 AND user_id = $2
    `;
    
    const result = await query(checkOrderQuery, [orderNumber, decoded.userId]);
    const exists = parseInt(result.rows[0].count) > 0;
    
    if (!exists) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบคำสั่งซื้อที่ระบุ' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      exists
    });
    
  } catch (error) {
    console.error('Error checking order:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการตรวจสอบคำสั่งซื้อ' },
      { status: 500 }
    );
  }
}
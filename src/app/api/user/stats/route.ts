import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';

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
    
    // คำสั่ง SQL สำหรับดึงข้อมูลสถิติ
    const statsQuery = `
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN order_status IN ('processing', 'confirmed') THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN order_status IN ('shipped', 'delivered') THEN 1 ELSE 0 END) as completed_orders,
        COALESCE(SUM(total_amount), 0) as total_spent
      FROM orders
      WHERE user_id = $1
    `;
    
    const result = await query(statsQuery, [decoded.userId]);
    
    return NextResponse.json({
      success: true,
      stats: {
        totalOrders: parseInt(result.rows[0].total_orders) || 0,
        pendingOrders: parseInt(result.rows[0].pending_orders) || 0,
        completedOrders: parseInt(result.rows[0].completed_orders) || 0,
        totalSpent: parseFloat(result.rows[0].total_spent) || 0
      }
    });
    
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการโหลดข้อมูลสถิติผู้ใช้' },
      { status: 500 }
    );
  }
}
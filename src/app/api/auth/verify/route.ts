import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบ token' },
        { status: 401 }
      );
    }
    
    const token = authHeader.split(' ')[1];
    
    // ตรวจสอบ token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as {
      userId: string;
      email: string;
    };
    
    // ค้นหาผู้ใช้จากฐานข้อมูล
    const findUserQuery = 'SELECT id, name, email, role, avatar FROM users WHERE id = $1';
    const result = await query(findUserQuery, [decoded.userId]);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบข้อมูลผู้ใช้' },
        { status: 404 }
      );
    }
    
    const user = result.rows[0];
    
    return NextResponse.json(
      { success: true, user },
      { status: 200 }
    );
  } catch (error) {
    console.error('Token verification error:', error);
    
    return NextResponse.json(
      { success: false, message: 'Token ไม่ถูกต้องหรือหมดอายุ' },
      { status: 401 }
    );
  }
}
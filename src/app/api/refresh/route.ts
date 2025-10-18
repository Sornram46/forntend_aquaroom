// สร้างไฟล์ src/app/api/auth/refresh/route.ts

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบ token' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    let decoded;

    try {
      // ลองตรวจสอบ token (ถึงแม้จะหมดอายุก็ตาม)
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret', {
        ignoreExpiration: true // ไม่สนใจว่าหมดอายุหรือไม่
      }) as {
        userId: string;
        email: string;
        role: string;
        iat?: number;
        exp?: number;
      };
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Token ไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    // ตรวจสอบว่า token หมดอายุไปนานเกินไปหรือไม่ (เกิน 7 วัน)
    if (decoded.exp && Date.now() >= (decoded.exp + (7 * 24 * 60 * 60)) * 1000) {
      return NextResponse.json(
        { success: false, message: 'Token หมดอายุเกินกำหนด' },
        { status: 401 }
      );
    }

    // ตรวจสอบว่าผู้ใช้ยังมีอยู่ในระบบ
    const findUserQuery = 'SELECT id, name, email, role, avatar, is_active FROM users WHERE id = $1';
    const result = await query(findUserQuery, [decoded.userId]);
    
    if (result.rows.length === 0 || !result.rows[0].is_active) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบข้อมูลผู้ใช้หรือบัญชีถูกปิดใช้งาน' },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    // สร้าง token ใหม่
    const newToken = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role 
      }, 
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    // อัพเดตเวลา login ล่าสุด
    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar || null
    };

    return NextResponse.json({
      success: true,
      message: 'รีเฟรช token สำเร็จ',
      token: newToken,
      user: userData
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการรีเฟรช token' },
      { status: 500 }
    );
  }
}